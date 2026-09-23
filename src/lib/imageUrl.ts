// Feed cards were loading full-size originals — phone photos/screenshots of
// 3–6 MB each, ~55 MB for one 邻里圈 page, ~20s to open in the Mini
// Program. thumbUrl() asks the image host for a resized copy instead.
//
// Supabase Storage: /object/public/... → /render/image/public/...?width=
// (image transformations; serves WebP automatically to browsers that accept
// it — a 4 MB PNG comes back as ~44 KB at 480px).
// Unsplash: its own w/q/auto=format query params.
// Anything else is returned unchanged.

const SUPABASE_OBJECT = '/storage/v1/object/public/';
const SUPABASE_RENDER = '/storage/v1/render/image/public/';

export const thumbUrl = (url: string, width: number, quality = 70): string => {
    if (!url) return url;
    try {
        if (url.includes(SUPABASE_OBJECT)) {
            const u = new URL(url.replace(SUPABASE_OBJECT, SUPABASE_RENDER));
            u.searchParams.set('width', String(width));
            u.searchParams.set('quality', String(quality));
            return u.toString();
        }
        if (url.includes('images.unsplash.com')) {
            const u = new URL(url);
            u.searchParams.set('w', String(width));
            u.searchParams.set('q', String(quality));
            u.searchParams.set('auto', 'format');
            return u.toString();
        }
    } catch {
        // Malformed URL — fall through and use it as-is.
    }
    return url;
};
