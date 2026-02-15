# GigBridge 部署指南 | Deployment Guide

本文档提供 GigBridge 扫码购卡系统的完整部署步骤。

---

## 📋 前置条件 | Prerequisites

1. ✅ Supabase 项目已创建并配置
2. ✅ Stripe 账户（测试模式）
3. ✅ AWS SNS 账户（用于SMS通知）
4. ✅ Supabase CLI 已安装：`npm install -g supabase`

---

## 🗄️ 数据库设置 | Database Setup

### 1. 部署数据库Schema

在 **Supabase SQL Editor** 中执行以下文件：

```bash
docs/supabase_schema.sql
```

**包含内容：**
- ✅ `listing_masters` - 商品主表
- ✅ `listing_items` - 商品SKU/规格表
- ✅ `listing_inventory` - 库存序列号表
- ✅ `orders` - 订单表
- ✅ `allocate_inventory_item()` - 原子库存分配函数（SELECT FOR UPDATE SKIP LOCKED）

### 2. 导入种子数据

在 **Supabase SQL Editor** 中执行：

```bash
docs/seed_data/SEED_EAGLESON_WASH.sql
```

**创建内容：**
- ✅ Provider: Eagleson Coin Wash
- ✅ Listing Master: 洗车充值卡
- ✅ 3个 Listing Items（$20, $50, $100）
- ✅ 15个库存序列号

### 3. 创建匿名买家用户（Demo用途）

```sql
-- 创建匿名买家用户配置文件
INSERT INTO public.user_profiles (
    id, email, display_name, phone, created_at, updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'anonymous@demo.justwedo.com',
    'Anonymous Buyer (Demo)',
    '+1-000-000-0000',
    NOW(), NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 创建Demo订单（用于测试）
INSERT INTO public.orders (
    id, buyer_id, provider_id, status, payment_status,
    amount_base, amount_total, currency, snapshot, actual_transaction_model
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    (SELECT id FROM provider_profiles WHERE business_name_en = 'Eagleson Coin Wash'),
    'PENDING_PAYMENT', 'UNPAID', 0, 0, 'CAD', '{}'::JSONB, 'DEMO'
)
ON CONFLICT (id) DO NOTHING;
```

### 4. 配置 RLS（Row Level Security）

**临时禁用 RLS（开发环境）：**
```sql
ALTER TABLE listing_inventory DISABLE ROW LEVEL SECURITY;
```

**⚠️ 生产环境配置（TODO）：**
```sql
-- 重新启用 RLS
ALTER TABLE listing_inventory ENABLE ROW LEVEL SECURITY;

-- Provider只能查看自己的库存
CREATE POLICY "Providers can view own inventory"
ON listing_inventory FOR SELECT
USING (provider_id = auth.uid());

-- Provider可以插入自己的库存
CREATE POLICY "Providers can insert own inventory"
ON listing_inventory FOR INSERT
WITH CHECK (provider_id = auth.uid());

-- 系统可以更新库存状态（通过Service Role Key）
CREATE POLICY "Service role can update inventory"
ON listing_inventory FOR UPDATE
USING (true); -- 限制为Service Role Key调用
```

---

## 🚀 Edge Functions 部署 | Deploy Edge Functions

### 1. 登录 Supabase CLI

```bash
supabase login
```

### 2. 链接项目

```bash
supabase link --project-ref <your-project-ref>
```

获取 project-ref: [Supabase Dashboard] → Settings → General → Reference ID

### 3. 部署 Edge Functions

```bash
# 部署 Stripe Checkout Session 创建函数
supabase functions deploy create-checkout-session

# 部署 Stripe Webhook 处理函数
supabase functions deploy stripe-webhook

# （可选）部署 AI Embedding 函数
supabase functions deploy generate-embedding
```

### 4. 配置环境变量（Secrets）

```bash
# Stripe 配置
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# AWS SNS 配置（SMS通知）
supabase secrets set AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
supabase secrets set AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# （可选）OpenAI 配置（AI搜索）
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

**获取密钥方法：**

**Stripe:**
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. Developers → API Keys
3. 复制 "Secret key" (sk_test_...)
4. Webhook Secret 在配置webhook后获取（见下一步）

**AWS SNS:**
1. 登录 [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. 创建用户 → 附加策略：`AmazonSNSFullAccess`
3. 创建访问密钥 → 复制 Access Key ID 和 Secret Access Key

### 5. 验证部署

```bash
# 查看已部署的函数
supabase functions list

# 查看函数日志
supabase functions logs create-checkout-session --tail
supabase functions logs stripe-webhook --tail
```

---

## 💳 Stripe 配置 | Stripe Setup

### 1. 配置 Webhook

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 点击 **Add endpoint**
3. 输入 Endpoint URL:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
   ```
4. 选择监听事件：
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.payment_failed` (可选)
5. 点击 **Add endpoint**
6. 复制 **Signing secret** (whsec_...)
7. 运行:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 2. 测试 Webhook

```bash
# 使用 Stripe CLI 测试本地webhook
stripe listen --forward-to https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook

# 触发测试事件
stripe trigger checkout.session.completed
```

---

## 📱 前端配置 | Frontend Setup

### 1. 更新环境变量

编辑 `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 功能开关
VITE_USE_MOCK_DATA=false
VITE_ENABLE_AI_SEARCH=false  # 部署AI后设为true

# 调试
VITE_DEBUG_MODE=true  # 生产环境设为false
```

### 2. 本地测试

```bash
npm run dev
```

访问:
```
http://localhost:8080/scan/<master-id>?preselect=<item-id>
```

示例（Eagleson Coin Wash - $50卡）:
```
http://localhost:8080/scan/<master-uuid>?preselect=<item-uuid>
```

**获取UUID方法：**
```sql
-- 获取 Master ID
SELECT id, title_en FROM listing_masters;

-- 获取 Item ID（$50卡）
SELECT id, name_en FROM listing_items WHERE name_en LIKE '%50%';
```

### 3. 构建生产版本

```bash
npm run build
```

---

## 🧪 端到端测试 | E2E Testing

### 测试流程：

1. **打印二维码**
   - 登录 Provider Dashboard
   - 进入 Inventory 页面
   - 点击 "Print All QR Codes" 或 单张打印
   - 验证QR码指向正确的URL

2. **扫码购买流程**
   - 扫描QR码（或直接访问URL）
   - 选择规格（或Quick Buy自动预选）
   - 输入手机号：`+1-613-xxx-xxxx`
   - 点击 "去支付"
   - 重定向到 Stripe Checkout
   - 使用测试卡号：`4242 4242 4242 4242`
   - 任意未来日期和CVC
   - 完成支付

3. **验证结果**
   - ✅ 重定向到 `/payment-success`
   - ✅ 显示卡号（序列号）
   - ✅ 检查手机是否收到SMS（如果配置了AWS SNS）
   - ✅ 数据库验证：
     ```sql
     -- 检查订单状态
     SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;

     -- 检查库存状态
     SELECT * FROM listing_inventory WHERE status = 'sold' ORDER BY updated_at DESC LIMIT 1;
     ```

---

## 🐛 故障排查 | Troubleshooting

### 问题 1: "No inventory data found"

**原因：** RLS阻止数据访问

**解决：**
```sql
ALTER TABLE listing_inventory DISABLE ROW LEVEL SECURITY;
```

### 问题 2: Stripe Webhook签名验证失败

**原因：** Edge Function运行时环境限制

**当前方案：** 已跳过签名验证（临时）

**生产方案：** 使用IP白名单或API密钥验证

### 问题 3: SMS发送失败

**检查步骤：**
1. 验证AWS凭证是否正确设置
2. 检查手机号是否在AWS SNS Sandbox验证列表中
3. 查看Edge Function日志：
   ```bash
   supabase functions logs stripe-webhook --tail
   ```

### 问题 4: "crypto.randomUUID is not a function"

**原因：** 浏览器兼容性问题

**已修复：** 实现自定义UUID生成器（QuickScanCheckout.tsx:17-22）

### 问题 5: Foreign Key约束错误

**原因：** 缺少buyer_id或order_id引用

**解决：** 确保已创建Demo用户和订单（见"数据库设置"第3步）

---

## 📊 监控与日志 | Monitoring & Logs

### 查看实时日志

```bash
# Edge Function日志
supabase functions logs stripe-webhook --tail
supabase functions logs create-checkout-session --tail

# Postgres日志
supabase logs postgres --tail
```

### 关键日志标记

- `[🔵 Stripe]` - Stripe操作
- `[✅]` - 成功操作
- `[❌]` - 错误
- `[⚠️]` - 警告
- `[📦 Inventory]` - 库存操作
- `[📱 SMS]` - SMS通知

---

## 🔒 生产环境清单 | Production Checklist

- [ ] **数据库**
  - [ ] 启用 RLS 策略
  - [ ] 移除 Demo 用户和订单
  - [ ] 配置备份策略

- [ ] **Stripe**
  - [ ] 切换到生产密钥（sk_live_...）
  - [ ] 启用Webhook签名验证
  - [ ] 配置生产Webhook URL

- [ ] **Edge Functions**
  - [ ] 更新所有生产环境secrets
  - [ ] 启用错误监控（Sentry等）
  - [ ] 配置速率限制

- [ ] **前端**
  - [ ] `VITE_DEBUG_MODE=false`
  - [ ] 移除调试日志
  - [ ] 启用HTTPS

- [ ] **AWS SNS**
  - [ ] 从Sandbox模式迁移到生产
  - [ ] 移除手机号验证限制
  - [ ] 配置SMS发送限额

---

## 📞 支持 | Support

**技术文档：**
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [AWS SNS API](https://docs.aws.amazon.com/sns/latest/api/)

**问题报告：**
请在项目GitHub仓库提交Issue，并附上日志和错误信息。

---

## 🎉 完成！| Done!

GigBridge系统已成功部署。您现在可以：

1. ✅ 管理库存（Provider Dashboard）
2. ✅ 打印QR码（Universal + Preselect）
3. ✅ 扫码购买（Stripe Checkout）
4. ✅ 自动库存分配（Atomic）
5. ✅ SMS通知（AWS SNS）

**下一步：**
- 配置真实的Provider账户
- 添加实际库存数据
- 测试完整购买流程
- 监控系统性能

---

**最后更新：** 2026-01-13
**版本：** v0.0.3
