import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const TARGET_FORMATS = ['.jpg', '.jpeg', '.png'];

async function optimizeImages(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await optimizeImages(fullPath);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();

            if (TARGET_FORMATS.includes(ext)) {
                console.log(`Processing: ${entry.name}`);

                // 1. Create WebP version
                const webpPath = fullPath.replace(ext, '.webp');
                try {
                    await sharp(fullPath)
                        .webp({ quality: 80 })
                        .toFile(webpPath);
                    console.log(`  ✅ Generated WebP: ${path.basename(webpPath)}`);
                } catch (e) {
                    console.error(`  ❌ Failed to create WebP for ${entry.name}:`, e.message);
                }
            }
        }
    }
}

console.log('🖼️  Starting Image Optimization...');
optimizeImages(PUBLIC_DIR)
    .then(() => console.log('✨ Image conversion complete!'))
    .catch(err => console.error('Fatal error:', err));
