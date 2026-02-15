/**
 * 快速配置脚本
 *
 * 从.env文件读取Supabase配置并生成scripts/supabase-config.ts
 *
 * 使用方法：
 * npx tsx scripts/setup-config.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = path.join(process.cwd(), '.env');
const ENV_LOCAL_FILE = path.join(process.cwd(), '.env.local');
const CONFIG_FILE = path.join(process.cwd(), 'scripts', 'supabase-config.ts');

// 读取.env文件
function readEnvFile(filePath: string): Record<string, string> {
    const config: Record<string, string> = {};

    if (!fs.existsSync(filePath)) {
        return config;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        // 跳过注释和空行
        if (!trimmed || trimmed.startsWith('#')) continue;

        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            config[key.trim()] = value.replace(/^["']|["']$/g, ''); // 移除引号
        }
    }

    return config;
}

// 主函数
function main() {
    console.log('🔧 开始配置 Supabase...\n');

    // 尝试从.env.local或.env读取
    let config: Record<string, string> = {};

    if (fs.existsSync(ENV_LOCAL_FILE)) {
        console.log('📄 读取 .env.local 文件...');
        config = readEnvFile(ENV_LOCAL_FILE);
    } else if (fs.existsSync(ENV_FILE)) {
        console.log('📄 读取 .env 文件...');
        config = readEnvFile(ENV_FILE);
    } else {
        console.log('⚠️  未找到 .env 或 .env.local 文件');
        console.log('');
        console.log('请选择以下方式之一：');
        console.log('');
        console.log('方式1：创建 .env 文件并添加以下内容：');
        console.log('  VITE_SUPABASE_URL=https://your-project.supabase.co');
        console.log('  VITE_SUPABASE_ANON_KEY=your_anon_key');
        console.log('');
        console.log('方式2：手动编辑 scripts/supabase-config.ts');
        console.log('  参考 scripts/supabase-config.example.ts');
        console.log('');
        process.exit(1);
    }

    // 提取Supabase配置
    const url = config['VITE_SUPABASE_URL'] || '';
    const anonKey = config['VITE_SUPABASE_ANON_KEY'] || '';

    if (!url || !anonKey) {
        console.error('❌ 未找到完整的Supabase配置');
        console.error('');
        console.error('请确保.env文件包含：');
        console.error('  VITE_SUPABASE_URL');
        console.error('  VITE_SUPABASE_ANON_KEY');
        console.error('');
        process.exit(1);
    }

    // 生成配置文件
    const configContent = `/**
 * Supabase 配置文件
 *
 * 此文件由 setup-config.ts 自动生成
 * 手动修改后不会被覆盖
 */

export const supabaseConfig = {
    url: '${url}',
    anonKey: '${anonKey}',
};

// 验证配置
export function validateConfig() {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
        console.error('❌ Supabase配置不完整！');
        console.error('请在 scripts/supabase-config.ts 中配置：');
        console.error('  - url: 您的Supabase项目URL');
        console.error('  - anonKey: 您的Supabase匿名密钥');
        console.error('');
        console.error('您可以在Supabase Dashboard中找到这些信息：');
        console.error('  项目设置 → API → Project URL & anon/public key');
        return false;
    }

    // 验证URL格式
    if (!supabaseConfig.url.startsWith('https://')) {
        console.error('❌ Supabase URL格式错误，应该以 https:// 开头');
        return false;
    }

    // 验证Key格式（支持JWT token或新版sb_格式）
    const isJWT = supabaseConfig.anonKey.startsWith('eyJ');
    const isNewFormat = supabaseConfig.anonKey.startsWith('sb_');

    if (!isJWT && !isNewFormat) {
        console.error('❌ Anon Key格式错误');
        console.error('应该是以下格式之一：');
        console.error('  - JWT token格式（以 eyJ 开头）');
        console.error('  - 新版密钥格式（以 sb_ 开头）');
        return false;
    }

    return true;
}
`;

    // 写入文件
    fs.writeFileSync(CONFIG_FILE, configContent, 'utf-8');

    console.log('✅ 配置文件已生成！');
    console.log('');
    console.log(`📁 位置: ${CONFIG_FILE}`);
    console.log('');
    console.log('🎯 现在可以运行批量地理编码脚本了：');
    console.log('  npx tsx scripts/batch-geocode-listings.ts');
    console.log('');
}

// 运行
main();
