// ─── Image Utilities ──────────────────────────────────────────────────────

import sharp from 'sharp';

interface ProcessedImage {
    original: Buffer;
    preview: Buffer;       // WebP, max 1400px wide
    analysis: Buffer;      // PNG, max 800px wide for AI analysis
    mimeType: string;
    width: number;
    height: number;
}

export async function processUploadedImage(buffer: Buffer): Promise<ProcessedImage> {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1400;
    const height = metadata.height || 800;

    // Generate preview (WebP, max 1400px width)
    const preview = await sharp(buffer)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

    // Generate analysis copy (PNG, max 800px for AI analysis)
    const analysis = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .png()
        .toBuffer();

    return {
        original: buffer,
        preview,
        analysis,
        mimeType: `image/${metadata.format || 'png'}`,
        width,
        height,
    };
}

export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

export function base64ToDataUrl(base64: string, mimeType: string = 'image/png'): string {
    return `data:${mimeType};base64,${base64}`;
}
