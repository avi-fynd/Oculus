// ─── /api/heatmap — Attention Heatmap Analysis ────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { runHeatmapAnalysis } from '../../../lib/heatmap-analysis';
import { processUploadedImage, bufferToBase64, base64ToDataUrl } from '../../../lib/image-utils';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('screenshot') as File | null;
    const preBase64 = formData.get('screenshotBase64') as string | null;
    const preDataUrl = formData.get('screenshotDataUrl') as string | null;
    const pageContext = (formData.get('pageContext') as string) || undefined;
    const roiRaw = formData.get('regionsOfInterest') as string | null;
    const regionsOfInterest: string[] = roiRaw ? JSON.parse(roiRaw) : [];

    if (!file && !preBase64) {
      return NextResponse.json({ error: 'A screenshot or screenshot data is required' }, { status: 400 });
    }

    let base64: string;
    let dataUrl: string;
    let mimeType: string;

    if (preBase64 && preDataUrl) {
      base64 = preBase64;
      dataUrl = preDataUrl;
      mimeType = 'image/png';
    } else if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Please upload PNG, JPG, or WebP.' }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const processed = await processUploadedImage(buffer);
        base64 = bufferToBase64(processed.analysis);
        dataUrl = base64ToDataUrl(bufferToBase64(processed.preview), 'image/webp');
        mimeType = 'image/png';
      } catch {
        base64 = bufferToBase64(buffer);
        dataUrl = base64ToDataUrl(base64, file.type);
        mimeType = file.type;
      }
    } else {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const analysis = await runHeatmapAnalysis(base64, mimeType, pageContext, regionsOfInterest);

    const id = `hm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      id,
      timestamp: new Date().toISOString(),
      pageContext,
      screenshotUrl: dataUrl,
      ...analysis,
    });
  } catch (err) {
    console.error('Heatmap route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
