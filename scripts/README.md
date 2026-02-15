# 📜 脚本使用指南

本目录包含项目的各种实用脚本。

---

## 🔧 配置 Supabase

### 方式1：自动配置（推荐）

如果您的项目已有 `.env` 或 `.env.local` 文件，运行：

```bash
npx tsx scripts/setup-config.ts
```

此脚本会：
- ✅ 读取现有的环境变量
- ✅ 自动生成 `scripts/supabase-config.ts`
- ✅ 验证配置正确性

### 方式2：手动配置

1. 复制示例文件：
```bash
cp scripts/supabase-config.example.ts scripts/supabase-config.ts
```

2. 编辑 `scripts/supabase-config.ts`，填入您的信息：
```typescript
export const supabaseConfig = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your_anon_key_here',
};
```

3. 在 Supabase Dashboard 中找到这些信息：
   - 项目设置 → API → Project URL
   - 项目设置 → API → Project API keys → anon/public

---

## 📍 批量地理编码

为现有的 listings 批量添加地理坐标。

### 使用前提
- ✅ 已配置 Supabase（见上方）
- ✅ listings 表中有 `location_address` 字段
- ✅ 有稳定的网络连接

### 运行脚本
```bash
npx tsx scripts/batch-geocode-listings.ts
```

### 运行过程
```
🚀 开始批量地理编码...

📍 找到 15 条需要地理编码的记录

[1/15] 处理: Kanata Lakes, Ottawa
✅ [1/15] 成功: (45.3175, -75.9050)

[2/15] 处理: Barrhaven, Ottawa
✅ [2/15] 成功: (45.2728, -75.7366)
...

==================================================
📊 批量地理编码完成！
==================================================
✅ 成功: 13 条
❌ 失败: 2 条
📈 成功率: 86.7%
==================================================
```

### 注意事项
- ⏱️ 遵守 API 限制：每秒最多 1 个请求
- 🔄 自动处理失败重试
- 📊 每次最多处理 100 条记录
- 💾 结果自动保存到数据库

### SQL 查询

如果需要手动操作，使用 `batch-geocode-listings.sql`：

```bash
# 在 Supabase SQL Editor 中运行
```

#### 常用查询

**查询1：找出缺少坐标的 listings**
```sql
SELECT id, title_zh, location_address
FROM listing_masters
WHERE (latitude IS NULL OR longitude IS NULL)
  AND location_address IS NOT NULL;
```

**查询2：统计覆盖率**
```sql
SELECT
    COUNT(*) as total,
    COUNT(latitude) as with_coords,
    ROUND((COUNT(latitude)::numeric / COUNT(*)) * 100, 2) as coverage_pct
FROM listing_masters;
```

**查询6：生成 PostGIS 地理类型**
```sql
UPDATE listing_masters
SET location_coords = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_coords IS NULL;
```

---

## 🗺️ 其他地图相关功能

详见完整文档：
- [地图功能完整指南](../docs/MAP_FEATURES_GUIDE.md)
- [快速开始指南](../docs/MAP_QUICK_START.md)

功能列表：
- ✅ 服务半径选择
- ✅ 地图标记聚类
- ✅ 路线导航集成
- ✅ 地理围栏提醒

---

## 🐛 常见问题

### Q1: 运行脚本提示 "缺少Supabase配置"

**A:** 运行配置脚本：
```bash
npx tsx scripts/setup-config.ts
```

或手动创建 `scripts/supabase-config.ts`（参考 `supabase-config.example.ts`）

---

### Q2: 地理编码失败率高

**A:** 检查地址格式：
- ✅ 包含城市/国家信息
- ✅ 使用英文地址（推荐）
- ✅ 避免特殊字符

示例：
```
✅ 好: "123 Main St, Kanata, Ottawa, ON"
❌ 差: "家附近"
```

---

### Q3: API 请求被限制

**A:** Nominatim API 限制：
- 每秒最多 1 个请求
- 脚本已自动控制速率
- 如果仍然失败，等待 1 小时后重试

---

### Q4: 如何重新运行失败的记录

**A:** 脚本会自动跳过已有坐标的记录，直接重新运行即可：
```bash
npx tsx scripts/batch-geocode-listings.ts
```

---

## 📚 API 文档

### OpenStreetMap Nominatim

官方文档：https://nominatim.org/release-docs/latest/

**使用策略**:
- ⚠️ 公共服务器有速率限制
- 💡 建议：大量数据考虑自建 Nominatim 服务器
- 🌐 替代方案：Google Geocoding API（需付费）

---

## 🔐 安全注意

- ⚠️ **永远不要提交** `scripts/supabase-config.ts` 到 Git
- ✅ 已自动添加到 `.gitignore`
- 🔒 Anon Key 是公开密钥，但仍需保护
- 🛡️ 使用 RLS（Row Level Security）保护数据

---

**最后更新**: 2026-01-30
