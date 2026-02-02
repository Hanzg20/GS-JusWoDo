# 📱 手机号验证码登录配置指南

## 🎯 概述
实现手机号+验证码（SMS OTP）登录，适合华人用户习惯。

---

## 📋 前置要求

1. **Supabase 项目**（已有）
2. **短信服务商账号**（选择以下之一）：
   - **Twilio** ✅ 推荐（稳定，支持加拿大）
   - MessageBird（备选）
   - Vonage（备选）

---

## 🔧 步骤 1: 注册 Twilio 账号

### 1.1 注册
访问: https://www.twilio.com/try-twilio

- 免费试用账号提供 **$15 美元额度**
- 可发送约 **300-500 条短信**（$0.0075/条）

### 1.2 获取凭证
登录后，进入 Console Dashboard:
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Phone Number**: 购买一个加拿大号码（+1-xxx-xxx-xxxx）约 $1/月

### 1.3 购买加拿大电话号码
1. 进入 **Phone Numbers** → **Buy a Number**
2. 选择国家: **Canada (+1)**
3. 勾选 **SMS** 功能
4. 购买号码（约 $1/月）

---

## 🔧 步骤 2: 配置 Supabase

### 2.1 进入 Supabase Dashboard
https://supabase.com/dashboard/project/YOUR_PROJECT_ID

### 2.2 配置 SMS 提供商
1. 进入 **Authentication** → **Providers**
2. 找到 **Phone** 部分
3. 启用 **Enable Phone Sign-up**
4. 选择提供商: **Twilio**
5. 填写凭证:
   ```
   Twilio Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Twilio Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Twilio Phone Number: +1XXXXXXXXXX (购买的号码)
   ```
6. 点击 **Save**

### 2.3 配置 OTP 设置（可选）
在同一页面下方:
```
OTP expiry duration: 60 seconds (验证码有效期)
OTP length: 6 digits (验证码长度)
```

---

## 🔧 步骤 3: 测试 Twilio 集成

### 3.1 使用 Supabase 测试工具
在 **Authentication** → **Phone** 页面，点击 **Send Test SMS**

输入你的手机号（加拿大格式）:
```
+16135551234
```

如果成功，你会收到短信:
```
Your verification code is: 123456
```

### 3.2 检查 Twilio 日志
访问 Twilio Console → **Monitor** → **Logs** → **SMS Logs**

查看发送状态:
- ✅ `delivered` - 成功
- ❌ `failed` - 失败（检查号码格式）
- ⏳ `queued` - 排队中

---

## 💰 费用估算

### Twilio 定价（加拿大）
| 项目 | 价格 |
|------|------|
| 电话号码租用 | $1.00/月 |
| 发送短信（加拿大境内） | $0.0075/条 |
| 接收短信 | $0.0075/条 |

**月费用估算**（假设 1000 个活跃用户）:
- 号码租用: $1
- 短信费用: 1000 用户 × 2次登录/月 × $0.0075 = $15
- **总计**: ~$16/月

### 免费额度
- Twilio 试用账号: **$15 免费额度**
- 约可发送 **2000 条短信**
- 足够测试和早期用户使用

---

## 🔒 安全配置

### 防止滥用（Rate Limiting）

在 Supabase Dashboard → **Authentication** → **Rate Limits**:
```yaml
# 短信发送频率限制
SMS OTP:
  - 60 秒内最多 1 次
  - 每小时最多 5 次
  - 每天最多 10 次

# IP 限制
Per IP Address:
  - 每小时最多 100 次 OTP 请求
```

### 验证码配置
```yaml
OTP Length: 6 digits
OTP Expiry: 60 seconds
Max Attempts: 3 次错误后锁定 15 分钟
```

---

## 🧪 测试手机号格式

### 支持的格式
```typescript
// ✅ 正确格式
+16135551234        // 国际格式（推荐）
+1 (613) 555-1234   // 带括号和短横线
+1-613-555-1234     // 带短横线

// ❌ 错误格式
6135551234          // 缺少国家代码
1-613-555-1234      // 缺少 +
(613) 555-1234      // 缺少国家代码
```

### 手机号验证正则
```typescript
const phoneRegex = /^\+1[2-9]\d{9}$/;
// 说明:
// ^\+1      - 必须以 +1 开头
// [2-9]     - 区号首位不能是 0 或 1
// \d{9}     - 后面 9 位数字
```

---

## 📱 前端实现

### 基本用法
```typescript
import { supabase } from '@/lib/supabase';

// 发送验证码
const { data, error } = await supabase.auth.signInWithOtp({
    phone: '+16135551234',
    options: {
        channel: 'sms', // 或 'whatsapp'（如果 Twilio 配置了 WhatsApp）
    }
});

// 验证验证码
const { data, error } = await supabase.auth.verifyOtp({
    phone: '+16135551234',
    token: '123456',
    type: 'sms'
});
```

### 错误处理
```typescript
try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
} catch (err: any) {
    if (err.message.includes('rate_limit')) {
        toast.error('发送太频繁，请稍后再试');
    } else if (err.message.includes('Invalid phone')) {
        toast.error('手机号格式不正确');
    } else {
        toast.error('发送失败，请检查手机号');
    }
}
```

---

## 🐛 常见问题

### 问题 1: "Invalid phone number"
**原因**: 手机号格式不正确
**解决**: 确保使用 `+1` 开头的国际格式

### 问题 2: "SMS could not be sent"
**原因**: Twilio 凭证配置错误或余额不足
**解决**: 检查 Twilio Console 的余额和凭证

### 问题 3: 收不到短信
**原因**:
- Twilio 试用账号只能发送到验证过的号码
- 号码在黑名单中
**解决**:
1. 在 Twilio Console 添加 **Verified Caller IDs**
2. 检查号码是否在 Twilio 黑名单

### 问题 4: "Rate limit exceeded"
**原因**: 发送太频繁
**解决**: 等待冷却时间（60秒）

---

## 🚀 生产环境检查清单

- [ ] Twilio 账号升级为付费账号（移除试用限制）
- [ ] 购买专用电话号码
- [ ] 配置 Rate Limiting
- [ ] 设置短信模板（符合各国法规）
- [ ] 启用短信发送日志监控
- [ ] 配置余额不足告警（Twilio Alert）
- [ ] 测试所有目标地区的号码

---

## 📊 监控和分析

### Twilio 控制台
- **SMS Logs**: 查看发送状态
- **Usage**: 查看费用统计
- **Alerts**: 设置余额告警

### Supabase 控制台
- **Authentication** → **Users**: 查看手机号登录用户
- **Logs**: 查看认证日志

---

## 🔗 相关资源

- [Twilio 文档](https://www.twilio.com/docs/sms)
- [Supabase Phone Auth 文档](https://supabase.com/docs/guides/auth/phone-login)
- [加拿大手机号格式](https://en.wikipedia.org/wiki/North_American_Numbering_Plan)

---

**创建日期**: 2026-02-01
**版本**: v1.0
**测试状态**: 待配置
