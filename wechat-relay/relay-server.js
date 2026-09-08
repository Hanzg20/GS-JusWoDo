// Minimal, dependency-free Node.js relay for WeChat JS-SDK signatures.
//
// WeChat's access_token API only accepts requests from IPs listed in the
// official account's IP白名单 (微信公众平台 → 设置与开发 → 基本配置). Supabase
// Edge Functions have no fixed outbound IP, so they can't call WeChat
// directly. This relay runs on a server whose IP IS whitelisted and does
// the actual weixin.qq.com calls; the Edge Function (see
// supabase/functions/wechat-jsapi-signature) just forwards to this relay
// and passes the result straight through to the browser.
//
// Setup:
//   1. Copy config.example.json to config.json next to this file and fill
//      in appId / appSecret (from 微信公众平台) and a random sharedSecret
//      (any long random string — only this relay and the Supabase function
//      need to agree on it; it stops randoms on the internet from using
//      your relay to mint WeChat signatures).
//   2. node relay-server.js
//   3. Open the configured port (default 8787) inbound in this server's
//      firewall / Tencent Cloud security group.
//   4. See README.md for keeping this running across reboots.

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { appId, appSecret, sharedSecret, port } = config;

let cachedTicket = null; // { value, expiresAt }

function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

async function fetchAccessToken() {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const data = await httpsGetJson(url);
    if (!data.access_token) throw new Error(`WeChat token error: ${JSON.stringify(data)}`);
    return data.access_token;
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
    const accessToken = await fetchAccessToken();
    const ticket = await fetchJsApiTicket(accessToken);
    // Refresh a few minutes early so we never serve a ticket WeChat has already expired.
    cachedTicket = { value: ticket, expiresAt: now + 7000 * 1000 };
    return ticket;
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
    if (req.method !== 'POST') {
        res.writeHead(404);
        res.end();
        return;
    }

    let parsedBody;
    try {
        parsedBody = await readJsonBody(req);
    } catch (err) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return;
    }

    if (parsedBody.secret !== sharedSecret) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
    }

    if (req.url === '/signature') {
        try {
            const { url } = parsedBody;
            if (!url) {
                sendJson(res, 400, { error: "Missing 'url'" });
                return;
            }

            const ticket = await getJsApiTicket();
            const timestamp = Math.floor(Date.now() / 1000);
            const nonceStr = randomNonceStr();
            const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
            const signature = sha1Hex(raw);

            sendJson(res, 200, { appId, timestamp, nonceStr, signature });
        } catch (err) {
            console.error('Relay error (/signature):', err);
            sendJson(res, 500, { error: String(err.message || err) });
        }
        return;
    }

    if (req.url === '/oauth-userinfo') {
        try {
            const { code } = parsedBody;
            if (!code) {
                sendJson(res, 400, { error: "Missing 'code'" });
                return;
            }

            const userInfo = await fetchOAuthUserInfo(code);
            sendJson(res, 200, userInfo);
        } catch (err) {
            console.error('Relay error (/oauth-userinfo):', err);
            sendJson(res, 500, { error: String(err.message || err) });
        }
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(port, () => {
    console.log(`WeChat JS-SDK relay listening on port ${port}`);
});
