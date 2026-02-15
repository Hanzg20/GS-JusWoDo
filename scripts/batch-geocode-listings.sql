-- ==========================================
-- 批量地理编码 SQL 脚本
-- ==========================================
--
-- 此脚本用于查找和手动添加地理坐标到listings
-- 由于SQL无法直接调用外部API，需要配合TypeScript脚本使用
--
-- 使用步骤：
-- 1. 运行查询1找出需要地理编码的listings
-- 2. 运行 TypeScript 脚本 batch-geocode-listings.ts 进行批量编码
-- 3. 运行查询3验证结果
--
-- ==========================================

-- 查询1: 找出所有缺少地理坐标的listings
SELECT
    id,
    title_zh,
    location_address,
    latitude,
    longitude,
    CASE
        WHEN latitude IS NULL OR longitude IS NULL THEN '❌ 缺少坐标'
        ELSE '✅ 已有坐标'
    END as status
FROM listing_masters
WHERE (latitude IS NULL OR longitude IS NULL)
  AND location_address IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;

-- 查询2: 统计地理坐标覆盖率
SELECT
    COUNT(*) as total_listings,
    COUNT(latitude) as listings_with_coords,
    COUNT(*) - COUNT(latitude) as listings_without_coords,
    ROUND((COUNT(latitude)::numeric / COUNT(*)::numeric) * 100, 2) as coverage_percentage
FROM listing_masters;

-- 查询3: 验证地理编码结果
SELECT
    id,
    title_zh,
    location_address,
    latitude,
    longitude,
    ST_AsText(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) as coordinates_text,
    location->>'fullAddress' as full_address
FROM listing_masters
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- 查询4: 手动更新单个listing的地理坐标 (示例)
-- 替换 'YOUR_LISTING_ID', LAT, LNG 为实际值
/*
UPDATE listing_masters
SET
    latitude = 45.4215,
    longitude = -75.6972,
    location = jsonb_set(
        COALESCE(location, '{}'::jsonb),
        '{coordinates}',
        jsonb_build_object('lat', 45.4215, 'lng', -75.6972)
    ),
    location_coords = ST_SetSRID(ST_MakePoint(-75.6972, 45.4215), 4326)::geography
WHERE id = 'YOUR_LISTING_ID';
*/

-- 查询5: 批量为Ottawa地区的listings设置默认坐标 (慎用！)
-- 仅在测试环境使用
/*
UPDATE listing_masters
SET
    latitude = 45.4215,
    longitude = -75.6972,
    location = jsonb_set(
        COALESCE(location, '{}'::jsonb),
        '{coordinates}',
        jsonb_build_object('lat', 45.4215, 'lng', -75.6972)
    )
WHERE (latitude IS NULL OR longitude IS NULL)
  AND (location_address ILIKE '%Ottawa%' OR location_address ILIKE '%Kanata%');
*/

-- 查询6: 使用PostGIS生成地理类型字段
-- 如果已有latitude和longitude，但缺少location_coords
UPDATE listing_masters
SET location_coords = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_coords IS NULL;

-- 查询7: 查找特定半径内的listings (示例：距离Ottawa市中心10km内)
SELECT
    id,
    title_zh,
    location_address,
    ROUND(
        ST_Distance(
            location_coords,
            ST_SetSRID(ST_MakePoint(-75.6972, 45.4215), 4326)::geography
        )::numeric / 1000,
        2
    ) as distance_km
FROM listing_masters
WHERE location_coords IS NOT NULL
  AND ST_DWithin(
        location_coords,
        ST_SetSRID(ST_MakePoint(-75.6972, 45.4215), 4326)::geography,
        10000  -- 10km in meters
    )
ORDER BY distance_km ASC;
