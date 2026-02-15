/**
 * Supabase 配置文件示例
 *
 * 使用步骤：
 * 1. 复制此文件为 supabase-config.ts
 * 2. 填入您的实际Supabase信息
 * 3. supabase-config.ts 会被自动忽略，不会提交到Git
 */

export const supabaseConfig = {
    // 在Supabase Dashboard中获取这些信息：
    // 项目设置 → API → Project URL & API Keys

    url: 'https://YOUR_PROJECT_ID.supabase.co',  // 您的Supabase项目URL
    anonKey: 'YOUR_ANON_KEY_HERE',  // 您的Anon/Public key
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
