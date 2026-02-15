#!/usr/bin/env node

/**
 * PWA 图标生成脚本
 *
 * 生成所需的所有 PWA 图标尺寸，包括：
 * - PWA 图标（72x72 到 512x512）
 * - Apple Touch 图标
 * - Favicon
 * - 启动屏幕图片
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_IMAGE = path.join(__dirname, '../public/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/pwa-icons');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// PWA 图标尺寸
const PWA_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Apple Touch 图标尺寸
const APPLE_SIZES = [
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
];

// Favicon 尺寸
const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
];

// 启动屏幕尺寸（iPhone 和 iPad）
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' }, // iPhone SE
  { width: 750, height: 1334, name: 'splash-750x1334.png' }, // iPhone 8
  { width: 828, height: 1792, name: 'splash-828x1792.png' }, // iPhone 11
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' }, // iPhone X
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' }, // iPhone 12 Pro
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' }, // iPhone 11 Pro Max
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' }, // iPad
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' }, // iPad Pro 12.9"
];

/**
 * 生成标准图标（正方形）
 */
async function generateIcon(size, name) {
  try {
    await sharp(INPUT_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, name));

    console.log(`✅ Generated: ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating ${name}:`, error.message);
  }
}

/**
 * 生成启动屏幕图片
 */
async function generateSplash(width, height, name) {
  try {
    // 加载原始图片
    const image = sharp(INPUT_IMAGE);
    const metadata = await image.metadata();

    // 计算图标在启动屏幕中的大小（占屏幕宽度的 40%）
    const iconSize = Math.floor(width * 0.4);

    // 创建带背景色的启动屏幕
    await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 139, g: 92, b: 246, alpha: 1 } // primary color #8B5CF6
      }
    })
    .composite([{
      input: await sharp(INPUT_IMAGE)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(OUTPUT_DIR, name));

    console.log(`✅ Generated splash: ${name} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Error generating splash ${name}:`, error.message);
  }
}

/**
 * 生成 maskable 图标（带安全区域）
 */
async function generateMaskableIcon(size, name) {
  try {
    const padding = Math.floor(size * 0.1); // 10% padding
    const iconSize = size - (padding * 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 139, g: 92, b: 246, alpha: 1 } // primary color
      }
    })
    .composite([{
      input: await sharp(INPUT_IMAGE)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(OUTPUT_DIR, name));

    console.log(`✅ Generated maskable: ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating maskable ${name}:`, error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Starting PWA icon generation...\n');
  console.log(`📂 Input: ${INPUT_IMAGE}`);
  console.log(`📂 Output: ${OUTPUT_DIR}\n`);

  // 检查输入文件是否存在
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('❌ Input image not found:', INPUT_IMAGE);
    process.exit(1);
  }

  console.log('📱 Generating PWA icons...');
  for (const { size, name } of PWA_SIZES) {
    await generateIcon(size, name);
  }

  console.log('\n🍎 Generating Apple Touch icons...');
  for (const { size, name } of APPLE_SIZES) {
    await generateIcon(size, name);
  }

  console.log('\n🔖 Generating Favicons...');
  for (const { size, name } of FAVICON_SIZES) {
    await generateIcon(size, name);
  }

  console.log('\n🎭 Generating maskable icons...');
  await generateMaskableIcon(192, 'icon-192x192-maskable.png');
  await generateMaskableIcon(512, 'icon-512x512-maskable.png');

  console.log('\n🖼️  Generating splash screens...');
  for (const { width, height, name } of SPLASH_SIZES) {
    await generateSplash(width, height, name);
  }

  console.log('\n✨ Done! All icons generated successfully!');
  console.log(`\n📂 Icons saved to: ${OUTPUT_DIR}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Check the generated icons in public/pwa-icons/');
  console.log('   2. Update vite.config.ts with new icon paths');
  console.log('   3. Update index.html with favicon links');
  console.log('   4. Run "npm run build:pwa" to test');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
