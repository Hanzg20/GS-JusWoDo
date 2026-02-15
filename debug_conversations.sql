-- 调试对话列表问题
-- 请在 Supabase SQL Editor 中运行此查询

-- 1. 查看所有对话记录
SELECT
    c.id,
    c.participant_a,
    c.participant_b,
    c.order_id,
    c.last_message_at,
    c.created_at,
    -- 参与者A的信息
    pa.name as participant_a_name,
    pa.avatar as participant_a_avatar,
    -- 参与者B的信息
    pb.name as participant_b_name,
    pb.avatar as participant_b_avatar
FROM conversations c
LEFT JOIN user_profiles pa ON pa.id = c.participant_a
LEFT JOIN user_profiles pb ON pb.id = c.participant_b
ORDER BY c.last_message_at DESC;

-- 2. 查看特定用户的对话（请替换 'YOUR_USER_ID' 为实际的用户ID）
-- 可以从 auth.users 表中找到用户ID，或者从图1中Mr. Wang的个人资料中获取
SELECT
    c.id,
    c.participant_a,
    c.participant_b,
    c.order_id,
    c.last_message_at,
    CASE
        WHEN c.participant_a = 'YOUR_USER_ID' THEN c.participant_b
        ELSE c.participant_a
    END as other_user_id,
    CASE
        WHEN c.participant_a = 'YOUR_USER_ID' THEN pb.name
        ELSE pa.name
    END as other_user_name,
    CASE
        WHEN c.participant_a = 'YOUR_USER_ID' THEN pb.avatar
        ELSE pa.avatar
    END as other_user_avatar
FROM conversations c
LEFT JOIN user_profiles pa ON pa.id = c.participant_a
LEFT JOIN user_profiles pb ON pb.id = c.participant_b
WHERE c.participant_a = 'YOUR_USER_ID'
   OR c.participant_b = 'YOUR_USER_ID'
ORDER BY c.last_message_at DESC;

-- 3. 检查user_profiles表是否有缺失的数据
SELECT
    u.id,
    u.email,
    up.name,
    up.avatar,
    CASE
        WHEN up.id IS NULL THEN '❌ 缺少user_profiles记录'
        WHEN up.name IS NULL THEN '⚠️ 名字为空'
        ELSE '✅ 数据完整'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
ORDER BY u.created_at DESC;

-- 4. 统计每个用户的对话数量
SELECT
    user_id,
    up.name,
    up.email,
    conversation_count
FROM (
    SELECT participant_a as user_id, COUNT(*) as conversation_count
    FROM conversations
    GROUP BY participant_a
    UNION ALL
    SELECT participant_b as user_id, COUNT(*) as conversation_count
    FROM conversations
    GROUP BY participant_b
) conv_counts
LEFT JOIN user_profiles up ON up.id = conv_counts.user_id
ORDER BY conversation_count DESC;
