// Phone photos and screenshots were being stored as 3–6 MB originals, which
// is what made 邻里圈/chat/detail pages slow to open (see thumbUrl() in
// imageUrl.ts for the display side). Every upload goes through this first:
// downscale to maxDim on the long edge and re-encode as JPEG.
//
// Never throws and never makes things worse: GIF/SVG (animation/vector),
// anything the browser can't decode (e.g. HEIC on Chrome), and any result
// that isn't actually smaller all fall back to the original file.

export const compressImage = async (
    file: File,
    { maxDim = 1600, quality = 0.82 }: { maxDim?: number; quality?: number } = {}
): Promise<File> => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return file;
    }

    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
        });

        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        // JPEG has no alpha — paint white first so transparent PNGs don't turn black.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob || blob.size >= file.size) return file;

        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(url);
    }
};
