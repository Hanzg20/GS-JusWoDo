-- ==========================================
-- 修复缺失的 user_profiles 记录
-- ==========================================

-- 1. 查找所有缺少 user_profiles 的用户
SELECT
    u.id,
    u.email,
    u.created_at,
    '❌ 缺少 user_profiles 记录' as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
WHERE up.id IS NULL;

-- 2. 为所有缺少 user_profiles 的用户创建记录
INSERT INTO public.user_profiles (
    id,
    email,
    name,
    node_id,
    beans_balance,
    verification_level,
    created_at
)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'Neighbor') as name,
    COALESCE(u.raw_user_meta_data->>'nodeId', 'NODE_LEES') as node_id,
    0 as beans_balance,
    1 as verification_level,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. 验证修复结果
SELECT
    u.id,
    u.email,
    up.name,
    CASE
        WHEN up.id IS NULL THEN '❌ 仍然缺失'
        ELSE '✅ 已修复'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
ORDER BY u.created_at DESC;

-- 4. 特别检查：查找通过 provider_profiles 关联的用户
SELECT
    pp.id as provider_id,
    pp.user_id,
    u.email as user_email,
    up.name as user_name,
    CASE
        WHEN u.id IS NULL THEN '❌ auth.users 中不存在'
        WHEN up.id IS NULL THEN '❌ user_profiles 中不存在'
        ELSE '✅ 数据完整'
    END as status
FROM provider_profiles pp
LEFT JOIN auth.users u ON u.id = pp.user_id
LEFT JOIN user_profiles up ON up.id = pp.user_id
ORDER BY pp.created_at DESC;
