// Minimal, dependency-free Node.js relay for WeChat JS-SDK signatures.
//
// WeChat's access_token API only accepts requests from IPs listed in the
// official account's IP白名单 (微信公众平台 → 设置与开发 → 基本配置). Supabase
// Edge Functions have no fixed outbound IP, so they can't call WeChat
// directly. This relay runs on a server whose IP IS whitelisted and does
// the actual weixin.qq.com calls; the Edge Function (see
// supabase/functions/wechat-jsapi-signature and wechat-oauth-login) just
// forwards to this relay and passes the result straight through.
//
// Setup:
//   1. Copy config.example.json to config.json next to this file and fill
//      in appId / appSecret (from 微信公众平台) and a random sharedSecret
//      (any long random string — only this relay and the Supabase function
//      need to agree on it; it stops randoms on the internet from using
//      your relay to mint WeChat signatures).
//   2. node relay-server.js
//   3. Open the configured port (default 8787) inbound in this server's
//      firewall AND Tencent Cloud security group (both layers, see
//      README.md).
//   4. See README.md for keeping this running across reboots.
//
// Logging: everything also goes to relay.log next to this file (rotated
// to relay.log.old past ~5MB), not just the console — a console window
// left open for days has limited scrollback, and this needs to keep
// logging even once it's running headless under Task Scheduler with no
// visible window at all.

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { appId, appSecret, sharedSecret, port } = config;

const startedAt = Date.now();

// ---------------------------------------------------------------------
// Logging — plain text, timestamped, to both console and a rotated file.
// No dependency pulled in for this on purpose (matches the rest of the
// file's zero-dependency design).
// ---------------------------------------------------------------------

const LOG_FILE = path.join(__dirname, 'relay.log');
const LOG_MAX_BYTES = 5 * 1024 * 1024; // 5MB

function rotateLogIfNeeded() {
    try {
        const stat = fs.statSync(LOG_FILE);
        if (stat.size > LOG_MAX_BYTES) {
            fs.renameSync(LOG_FILE, `${LOG_FILE}.old`);
        }
    } catch (err) {
        // ENOENT (no log file yet) is expected on first run — anything
        // else is worth knowing about, but must not stop logging.
        if (err.code !== 'ENOENT') console.error('Log rotation check failed:', err);
    }
}

function log(level, message) {
    const line = `[${new Date().toISOString()}] [${level}] ${message}`;
    if (level === 'ERROR') console.error(line); else console.log(line);
    try {
        rotateLogIfNeeded();
        fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (err) {
        // Logging itself must never take the server down — if the disk is
        // full or the file is locked, fall back to console-only and move on.
        console.error('Failed to write to log file:', err);
    }
}

// A stuck request used to be able to hang this process indefinitely (no
// timeout anywhere) — found 2026-09-08 when the relay went fully
// unreachable for hours; a plain restart fixed it instantly, which only
// makes sense if the process itself was wedged, not the network. Every
// outbound WeChat call now has a hard timeout, and uses keepAlive:false so
// a long-lived process can't accumulate a stale/broken socket from an
// earlier request and reuse it into another hang.
const HTTPS_TIMEOUT_MS = 10000;
const noKeepAliveAgent = new https.Agent({ keepAlive: false });

function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { agent: noKeepAliveAgent, timeout: HTTPS_TIMEOUT_MS }, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(new Error(`Non-JSON response from ${url}: ${err.message}`));
                }
            });
        });
        req.on('timeout', () => req.destroy(new Error(`Request to ${url} timed out after ${HTTPS_TIMEOUT_MS}ms`)));
        req.on('error', reject);
    });
}

let cachedTicket = null; // { value, expiresAt }
let cachedAccessToken = null; // { value, expiresAt } — separate cache from
// the ticket's, since /send-template-message needs a plain access_token
// directly (no ticket involved) and would otherwise force a fresh
// cgi-bin/token call on every single chat message sent.

async function fetchAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const data = await httpsGetJson(url);
    if (!data.access_token) throw new Error(`WeChat token error: ${JSON.stringify(data)}`);
    return data.access_token;
}

async function getAccessToken() {
    const now = Date.now();
    if (cachedAccessToken && cachedAccessToken.expiresAt > now) return cachedAccessToken.value;
    const accessToken = await fetchAccessToken();
    // Refresh a few minutes early so we never serve a token WeChat has already expired.
    cachedAccessToken = { value: accessToken, expiresAt: now + 7000 * 1000 };
    return accessToken;
}

async function fetchJsApiTicket(accessToken) {
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
    const data = await httpsGetJson(url);
    if (data.errcode !== 0) throw new Error(`WeChat ticket error: ${JSON.stringify(data)}`);
    return data.ticket;
}

async function getJsApiTicket() {
    const now = Date.now();
    if (cachedTicket && cachedTicket.expiresAt > now) return cachedTicket.value;
    log('INFO', 'jsapi_ticket cache miss/expired — fetching fresh access_token + ticket');
    const accessToken = await getAccessToken();
    const ticket = await fetchJsApiTicket(accessToken);
    // Refresh a few minutes early so we never serve a ticket WeChat has already expired.
    cachedTicket = { value: ticket, expiresAt: now + 7000 * 1000 };
    log('INFO', 'jsapi_ticket refreshed, valid ~117 more minutes');
    return ticket;
}

// Offline chat notification: sends a WeChat template message (服务号-only
// API) to a user who has a wechat_openid on file, so a merchant/customer
// who's away from the app still finds out they got a message. Templates
// are configured per-account in 公众号后台 → 模板消息 → 模板库 — the
// caller (notify-offline-message Edge Function) supplies the templateId and
// the exact `data` field names/values that template expects.
async function sendTemplateMessage(openid, templateId, data, url) {
    const accessToken = await getAccessToken();
    const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    const body = JSON.stringify({ touser: openid, template_id: templateId, url, data });

    return new Promise((resolve, reject) => {
        const req = https.request(apiUrl, {
            method: 'POST',
            agent: noKeepAliveAgent,
            timeout: HTTPS_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (res) => {
            let respBody = '';
            res.on('data', (chunk) => (respBody += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(respBody));
                } catch (err) {
                    reject(new Error(`Non-JSON response from template send: ${err.message}`));
                }
            });
        });
        req.on('timeout', () => req.destroy(new Error(`Request to ${apiUrl} timed out after ${HTTPS_TIMEOUT_MS}ms`)));
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// WeChat login (公众号网页授权): exchanges the one-time `code` the browser
// got redirected back with for a user-specific access_token + openid, then
// fetches that user's nickname/avatar. This is a *different* access_token
// than the global one above (scoped to one user, obtained via a
// user-granted code rather than just knowing appid+secret) — routed
// through this relay anyway rather than calling it straight from the
// Supabase Edge Function, since we already got burned once assuming a
// weixin.qq.com endpoint wasn't IP-restricted.
async function fetchOAuthUserInfo(code) {
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    const tokenData = await httpsGetJson(tokenUrl);
    if (!tokenData.access_token || !tokenData.openid) {
        throw new Error(`WeChat OAuth token error: ${JSON.stringify(tokenData)}`);
    }

    // snsapi_base scope (silent, no consent screen) only returns openid —
    // skip the userinfo call in that case rather than erroring.
    if (tokenData.scope === 'snsapi_base') {
        return { openid: tokenData.openid, nickname: null, headimgurl: null };
    }

    const userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
    const userData = await httpsGetJson(userUrl);
    if (userData.errcode) {
        // Consent-screen scope but userinfo still failed — fall back to
        // just the openid rather than failing the whole login.
        return { openid: tokenData.openid, nickname: null, headimgurl: null };
    }

    return { openid: userData.openid, nickname: userData.nickname || null, headimgurl: userData.headimgurl || null };
}

function randomNonceStr(len = 16) {
    return crypto.randomBytes(len).toString('hex').slice(0, len);
}

function sha1Hex(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (err) {
                reject(err);
            }
        });
    });
}

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const requestStart = Date.now();
    const requestId = crypto.randomBytes(4).toString('hex');
    log('INFO', `[${requestId}] ${req.method} ${req.url} from ${req.socket.remoteAddress}`);

    const finish = (status) => {
        log('INFO', `[${requestId}] -> ${status} (${Date.now() - requestStart}ms)`);
    };

    // No auth required — reveals nothing sensitive, just proves the
    // process is alive and reports how stale the cached ticket is. Useful
    // for a quick manual check, and for a future Task Scheduler health
    // check without needing the shared secret.
    if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, {
            ok: true,
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            ticketCached: !!cachedTicket,
            ticketExpiresInSeconds: cachedTicket ? Math.floor((cachedTicket.expiresAt - Date.now()) / 1000) : null,
        });
        finish(200);
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(404);
        res.end();
        finish(404);
        return;
    }

    let parsedBody;
    try {
        parsedBody = await readJsonBody(req);
    } catch (err) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        finish(400);
        return;
    }

    if (parsedBody.secret !== sharedSecret) {
        log('WARN', `[${requestId}] rejected: bad shared secret`);
        sendJson(res, 401, { error: 'Unauthorized' });
        finish(401);
        return;
    }

    if (req.url === '/signature') {
        try {
            const { url } = parsedBody;
            if (!url) {
                sendJson(res, 400, { error: "Missing 'url'" });
                finish(400);
                return;
            }

            const ticket = await getJsApiTicket();
            const timestamp = Math.floor(Date.now() / 1000);
            const nonceStr = randomNonceStr();
            const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
            const signature = sha1Hex(raw);

            sendJson(res, 200, { appId, timestamp, nonceStr, signature });
            finish(200);
        } catch (err) {
            log('ERROR', `[${requestId}] /signature failed: ${err.stack || err}`);
            sendJson(res, 500, { error: String(err.message || err) });
            finish(500);
        }
        return;
    }

    if (req.url === '/oauth-userinfo') {
        try {
            const { code } = parsedBody;
            if (!code) {
                sendJson(res, 400, { error: "Missing 'code'" });
                finish(400);
                return;
            }

            const userInfo = await fetchOAuthUserInfo(code);
            sendJson(res, 200, userInfo);
            finish(200);
        } catch (err) {
            log('ERROR', `[${requestId}] /oauth-userinfo failed: ${err.stack || err}`);
            sendJson(res, 500, { error: String(err.message || err) });
            finish(500);
        }
        return;
    }

    if (req.url === '/send-template-message') {
        try {
            const { openid, templateId, data, url } = parsedBody;
            if (!openid || !templateId || !data) {
                sendJson(res, 400, { error: "Missing 'openid', 'templateId', or 'data'" });
                finish(400);
                return;
            }

            const result = await sendTemplateMessage(openid, templateId, data, url);
            if (result.errcode && result.errcode !== 0) {
                log('WARN', `[${requestId}] /send-template-message WeChat error: ${JSON.stringify(result)}`);
            }
            sendJson(res, 200, result);
            finish(200);
        } catch (err) {
            log('ERROR', `[${requestId}] /send-template-message failed: ${err.stack || err}`);
            sendJson(res, 500, { error: String(err.message || err) });
            finish(500);
        }
        return;
    }

    res.writeHead(404);
    res.end();
    finish(404);
});

// Belt-and-suspenders: log anything that slips past the per-request
// try/catch blocks above instead of letting it disappear silently or
// leave the process in a half-broken state indefinitely. An uncaught
// exception means Node's own state guarantees are void, so this logs and
// exits rather than trying to soldier on — once Task Scheduler's
// restart-on-failure is set up (see README.md), that exit becomes a clean
// self-healing restart instead of hours of silent downtime.
process.on('uncaughtException', (err) => {
    log('ERROR', `uncaughtException — exiting so the process can be restarted: ${err.stack || err}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    log('ERROR', `unhandledRejection (not fatal, but shouldn't happen — every async path here has its own try/catch): ${reason && reason.stack || reason}`);
});

server.listen(port, () => {
    log('INFO', `WeChat relay listening on port ${port} (pid ${process.pid})`);
});
