# WeChat JS-SDK 中转服务

微信的 access_token 接口要求请求来自公众号后台"IP白名单"里的固定 IP。Supabase Edge Function
没有固定出口 IP，所以不能直接调用微信。这个小服务运行在有固定 IP、已经在白名单里的服务器上
（101.200.62.54），替 Edge Function 完成"跟微信换 token/ticket/签名"这一步。

## 部署步骤（在这台腾讯云服务器的远程桌面里操作）

### 1. 确认已安装 Node.js

打开命令提示符（cmd）或 PowerShell，输入：

```
node -v
```

如果显示版本号（比如 `v18.x.x`），跳到第 2 步。如果提示找不到命令，去
https://nodejs.org 下载 LTS 版本安装（一路下一步即可），装完重新打开命令行再试一次
`node -v`。

### 2. 把这个 wechat-relay 文件夹复制到服务器上

整个 `wechat-relay` 文件夹（`relay-server.js` + `config.example.json` + 这个 README）
复制到服务器上任意位置，比如 `C:\wechat-relay\`。

### 3. 创建配置文件

在 `C:\wechat-relay\` 里，把 `config.example.json` 复制一份改名成 `config.json`，
用记事本打开，填入真实值：

```json
{
    "appId": "微信公众号的 AppID",
    "appSecret": "微信公众号的 AppSecret",
    "sharedSecret": "自己随便打一长串随机字符（比如 32 位），只要够长够随机就行",
    "port": 8787
}
```

`sharedSecret` 不是微信给的，是你自己编的一个"暗号"——一会儿 Supabase 那边要填同一个值，
两边对上了才允许中转，防止别人白嫖你的接口。

### 4. 开放端口

腾讯云控制台 → 这台服务器 → 安全组 → 添加入站规则：TCP，端口 `8787`，来源建议限制成
Supabase 的出口 IP 范围（如果限制不了就先开放给所有来源，反正接口本身有 `sharedSecret`
校验）。

### 5. 启动服务

在 `C:\wechat-relay\` 目录下运行：

```
node relay-server.js
```

看到 `WeChat JS-SDK relay listening on port 8787` 就说明跑起来了。**这个命令行窗口关掉
服务就停了**，先用这种方式测试通过，稳定后再按第 6 步设置成开机自启、后台常驻。

### 6.（测试通过后）设置开机自启 + 崩溃自动重启

用 Windows 任务计划程序（Task Scheduler）：

1. 搜索"任务计划程序"打开
2. 创建任务 → 名称随意，比如 "WeChat Relay"
3. 触发器：新建 → "计算机启动时"
4. 操作：新建 → 程序或脚本填 `node`，参数填 `relay-server.js`，起始于填
   `C:\wechat-relay`（改成你实际放置的路径）
5. 常规页勾选"不管用户是否登录都要运行"
6. 设置页可以勾"如果任务失败，重新启动间隔"，选个 1 分钟，方便进程意外退出后自动拉起

### 7. 验证

在任意能上网的电脑上（不需要在服务器上）运行：

```
curl -X POST http://101.200.62.54:8787/signature -H "Content-Type: application/json" -d "{\"url\":\"https://justwedo.com/\",\"secret\":\"你在 config.json 里填的 sharedSecret\"}"
```

返回类似 `{"appId":"...","timestamp":...,"nonceStr":"...","signature":"..."}` 就说明成功了。
如果报 WeChat token/ticket error，说明 appId/appSecret 填错了，或者这台服务器的出口 IP
其实不是 101.200.62.54（比如走了别的网卡/NAT），需要重新核实微信后台里配置的白名单 IP。

## 之后 Claude 这边要做的（不需要你操作）

拿到测试成功的确认后，把 `WECHAT_RELAY_URL`（`http://101.200.62.54:8787/signature`）和
`WECHAT_RELAY_SECRET`（跟 config.json 里的 sharedSecret 一致）设进 Supabase secrets，
Edge Function 会改成调用这个中转服务，而不是直连微信。
