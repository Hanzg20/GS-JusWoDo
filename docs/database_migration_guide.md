# Supabase 数据库架构迁移指南

> **目标**: 将测试环境的完整数据库架构（表、视图、函数、触发器等）复制到生产环境，**不包含数据**

---

## 📋 迁移范围

此指南将复制以下数据库对象：

- ✅ 表结构（Tables）
- ✅ 视图（Views）
- ✅ 函数（Functions）
- ✅ 触发器（Triggers）
- ✅ 索引（Indexes）
- ✅ 主键和外键约束（Constraints）
- ✅ 自定义类型和枚举（Types & Enums）
- ✅ 行级安全策略（RLS Policies）
- ✅ PostgreSQL 扩展（Extensions，如 PostGIS）

❌ **不包含**: 实际数据记录

---

## 🎯 方法对比

| 方法 | 难度 | 推荐度 | 适用场景 |
|------|------|--------|---------|
| **方法 1: pg_dump** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 完整、可靠，适合生产环境 |
| **方法 2: Supabase CLI** | ⭐ | ⭐⭐⭐⭐ | 简单快捷，适合已有 CLI 项目 |
| **方法 3: SQL Editor** | ⭐⭐⭐ | ⭐⭐ | 适合小型项目或部分迁移 |

---

## 方法 1: 使用 pg_dump（推荐）

### 前置要求

1. **安装 PostgreSQL 客户端工具**

**Windows**:
```powershell
# 方式 1: 使用 Chocolatey
choco install postgresql

# 方式 2: 下载官方安装包
# https://www.postgresql.org/download/windows/
# 只需勾选 "Command Line Tools"
```

**验证安装**:
```bash
pg_dump --version
# 应该显示: pg_dump (PostgreSQL) 15.x 或更高
```

2. **获取数据库连接字符串**

**测试环境**:
- Supabase Dashboard → Settings → Database → Connection string
- 格式: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- 记为: `TEST_DB_URL`

**生产环境**:
- 同样步骤获取
- 记为: `PROD_DB_URL`

---

### 步骤 1: 导出测试环境架构

打开命令行（PowerShell 或 CMD），运行：

```bash
pg_dump "postgresql://postgres:[TEST_PASSWORD]@db.[TEST_REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  --schema=storage \
  --exclude-schema=auth \
  --exclude-schema=extensions \
  --exclude-schema=realtime \
  --exclude-schema=graphql_public \
  -f complete_schema.sql
```

**参数说明**:
- `--schema-only` - 只导出结构，不包含数据
- `--no-owner` - 不导出对象所有者信息（避免权限问题）
- `--no-acl` - 不导出访问控制列表
- `--schema=public` - 包含 public schema（您的表）
- `--schema=storage` - 包含 storage schema（如果使用了 Supabase Storage）
- `--exclude-schema=auth` - 排除 Supabase 内部 auth schema

执行完成后，会生成 `complete_schema.sql` 文件。

---

### 步骤 2: 检查导出文件（可选但推荐）

用文本编辑器打开 `complete_schema.sql`，确认：

```sql
-- 应该能看到类似这样的 SQL 语句：
CREATE TABLE public.user_profiles (...);
CREATE TABLE public.listings (...);
CREATE FUNCTION public.handle_new_oauth_user() ...;
CREATE TRIGGER on_auth_user_created ...;
-- 等等
```

> ⚠️ **检查要点**：
> - 确保没有 `INSERT INTO` 语句（如果有，说明包含了数据）
> - 确保没有 `auth.users` 等 Supabase 内部表

---

### 步骤 3: 导入到生产环境

```bash
psql "postgresql://postgres:[PROD_PASSWORD]@db.[PROD_REF].supabase.co:5432/postgres" \
  -f complete_schema.sql
```

**预期输出**:
```
CREATE TABLE
CREATE TABLE
CREATE FUNCTION
CREATE TRIGGER
...
```

如果看到错误，参考下方**故障排查**部分。

---

### 步骤 4: 验证迁移成功

在**生产环境** Supabase Dashboard:

1. **Table Editor** → 确认所有表都已创建
2. **SQL Editor** → 运行验证查询：

```sql
-- 检查表数量
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 检查函数数量
SELECT COUNT(*) as function_count 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- 检查触发器
SELECT COUNT(*) as trigger_count 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

对比测试环境的数量是否一致。

---

## 方法 2: 使用 Supabase CLI（最简单）

### 前置要求

1. **安装 Supabase CLI**

```bash
npm install -g supabase
```

2. **登录 Supabase**

```bash
supabase login
```

---

### 步骤 1: 链接到测试项目

```bash
cd d:\My Project\ts\hangs\gig-neighbor

supabase link --project-ref [TEST_PROJECT_REF]
```

**获取 PROJECT_REF**:
- Supabase Dashboard → Settings → General → Reference ID

---

### 步骤 2: 导出架构

```bash
supabase db dump --schema public --schema storage -f production_schema.sql
```

---

### 步骤 3: 切换到生产项目并导入

```bash
# 链接到生产项目
supabase link --project-ref [PROD_PROJECT_REF]

# 应用 schema
supabase db push --include-all
```

---

## 方法 3: 使用 SQL Editor（手动方式）

适合**小型项目**或**部分迁移**。

### 步骤 1: 导出表结构

在**测试环境** SQL Editor 运行：

```sql
-- 导出所有 CREATE TABLE 语句
SELECT 
  'CREATE TABLE IF NOT EXISTS ' || table_schema || '.' || table_name || E'\n' ||
  '(' || E'\n' ||
  string_agg(
    '  ' || column_name || ' ' || 
    CASE 
      WHEN data_type = 'USER-DEFINED' THEN udt_name
      WHEN data_type = 'ARRAY' THEN udt_name || '[]'
      ELSE data_type 
    END ||
    CASE 
      WHEN character_maximum_length IS NOT NULL 
        THEN '(' || character_maximum_length || ')' 
      WHEN numeric_precision IS NOT NULL 
        THEN '(' || numeric_precision || COALESCE(',' || numeric_scale, '') || ')'
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    E',\n'
    ORDER BY ordinal_position
  ) || E'\n' ||
  ');' || E'\n' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
GROUP BY table_schema, table_name
ORDER BY table_name;
```

复制结果并在**生产环境**运行。

---

### 步骤 2: 导出函数和触发器

```sql
-- 导出函数
SELECT 
  pg_get_functiondef(p.oid) || ';' as function_ddl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

```sql
-- 导出触发器
SELECT 
  'CREATE TRIGGER ' || trigger_name ||
  ' ' || action_timing || ' ' || event_manipulation ||
  ' ON ' || event_object_schema || '.' || event_object_table ||
  ' FOR EACH ' || action_orientation ||
  ' EXECUTE FUNCTION ' || action_statement || ';' as trigger_ddl
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

依次复制并在生产环境运行。

---

## 🔧 故障排查

### 错误 1: "relation already exists"

**原因**: 生产环境已有同名表

**解决方案**:
```sql
-- 选项 1: 删除现有表（危险！确保备份）
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 选项 2: 在导入前清空 public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

### 错误 2: "permission denied for schema"

**原因**: 权限不足

**解决方案**:
- 确保使用 `postgres` 用户连接
- 在连接字符串中使用正确的密码

---

### 错误 3: "extension does not exist"

**原因**: 生产环境缺少必要的 PostgreSQL 扩展

**解决方案**:
```sql
-- 在生产环境 SQL Editor 中先安装扩展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## ✅ 最佳实践

1. **在非高峰期执行迁移**
2. **先在新的测试项目验证流程**
3. **备份生产环境**（如果已有数据）
4. **使用版本控制管理 migration SQL 文件**
5. **迁移后立即验证关键功能**

---

## 📝 迁移检查清单

- [ ] 备份生产环境数据（如果存在）
- [ ] 获取测试和生产环境的数据库连接字符串
- [ ] 使用 `pg_dump` 导出测试环境架构
- [ ] 检查导出的 SQL 文件（确保无数据）
- [ ] 在生产环境执行导入
- [ ] 验证表数量、函数、触发器
- [ ] 测试应用连接生产数据库
- [ ] 验证 RLS 策略生效
- [ ] 记录迁移时间和结果

---

## 🆘 需要帮助？

如果遇到问题：

1. 检查 Supabase Dashboard → Logs
2. 查看导入时的错误信息
3. 确认数据库连接字符串正确
4. 联系 Supabase 支持（对于复杂问题）

---

**最后更新**: 2026-02-01
