/**
 * 批量地理编码工具 - Batch Geocoding Tool
 *
 * 为现有的listings批量添加地理坐标
 * 使用 OpenStreetMap Nominatim API 进行地理编码
 *
 * 使用方法：
 * 1. 在 scripts/supabase-config.ts 中配置您的Supabase信息
 * 2. 运行: npx tsx scripts/batch-geocode-listings.ts
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, validateConfig } from './supabase-config';

// 验证配置
if (!validateConfig()) {
    process.exit(1);
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

interface Listing {
    id: string;
    location_address: string | null;
    latitude: number | null;
    longitude: number | null;
    location: any;
}

// 延迟函数 - 避免API速率限制
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 地理编码函数
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    'User-Agent': 'GigNeighbor/1.0'
                }
            }
        );

        if (!response.ok) {
            console.error(`❌ API请求失败: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }

        return null;
    } catch (error) {
        console.error(`❌ 地理编码失败: ${error}`);
        return null;
    }
}

// 主函数
async function main() {
    console.log('🚀 开始批量地理编码...\n');

    // 1. 查询所有缺少地理坐标的listings
    const { data: listings, error } = await supabase
        .from('listing_masters')
        .select('id, location_address, latitude, longitude, location')
        .or('latitude.is.null,longitude.is.null')
        .not('location_address', 'is', null)
        .limit(100); // 限制每次处理100条

    if (error) {
        console.error('❌ 查询失败:', error);
        return;
    }

    if (!listings || listings.length === 0) {
        console.log('✅ 所有listings都已有地理坐标，无需处理');
        return;
    }

    console.log(`📍 找到 ${listings.length} 条需要地理编码的记录\n`);

    let successCount = 0;
    let failCount = 0;

    // 2. 逐条处理
    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i] as Listing;
        const progress = `[${i + 1}/${listings.length}]`;

        console.log(`${progress} 处理: ${listing.location_address}`);

        // 如果location_address为空，跳过
        if (!listing.location_address || listing.location_address.trim() === '') {
            console.log(`⚠️  ${progress} 跳过：地址为空`);
            failCount++;
            continue;
        }

        // 进行地理编码
        const coords = await geocodeAddress(listing.location_address);

        if (coords) {
            // 更新数据库
            const { error: updateError } = await supabase
                .from('listing_masters')
                .update({
                    latitude: coords.lat,
                    longitude: coords.lng,
                    location: {
                        ...(listing.location || {}),
                        coordinates: { lat: coords.lat, lng: coords.lng },
                        fullAddress: listing.location_address
                    }
                })
                .eq('id', listing.id);

            if (updateError) {
                console.log(`❌ ${progress} 更新失败: ${updateError.message}`);
                failCount++;
            } else {
                console.log(`✅ ${progress} 成功: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
                successCount++;
            }
        } else {
            console.log(`❌ ${progress} 地理编码失败`);
            failCount++;
        }

        // 延迟1秒以遵守Nominatim的使用政策（每秒最多1个请求）
        if (i < listings.length - 1) {
            await delay(1000);
        }
    }

    // 3. 输出统计
    console.log('\n' + '='.repeat(50));
    console.log('📊 批量地理编码完成！');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${failCount} 条`);
    console.log(`📈 成功率: ${((successCount / listings.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));
}

// 运行脚本
main().catch(console.error);
