// ─── /api/ab-analyze — A/B Comparative UX Analysis ───────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { runABAnalysis } from '../../../lib/ab-analysis';
import { processUploadedImage, bufferToBase64, base64ToDataUrl } from '../../../lib/image-utils';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

interface ProcessedImg {
  base64: string;
  dataUrl: string;
  mimeType: string;
}

async function processFileInput(file: File): Promise<ProcessedImg> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const processed = await processUploadedImage(buffer);
    return {
      base64: bufferToBase64(processed.analysis),
      dataUrl: base64ToDataUrl(bufferToBase64(processed.preview), 'image/webp'),
      mimeType: 'image/png',
    };
  } catch {
    const b64 = bufferToBase64(buffer);
    return { base64: b64, dataUrl: base64ToDataUrl(b64, file.type), mimeType: file.type };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fileA = formData.get('screenshotA') as File | null;
    const fileB = formData.get('screenshotB') as File | null;
    const preBase64A = formData.get('screenshotBase64A') as string | null;
    const preBase64B = formData.get('screenshotBase64B') as string | null;
    const preDataUrlA = formData.get('screenshotDataUrlA') as string | null;
    const preDataUrlB = formData.get('screenshotDataUrlB') as string | null;
    const pageContext = (formData.get('pageContext') as string) || undefined;

    if (!fileA && !preBase64A) {
      return NextResponse.json({ error: 'Version A image or screenshot data is required' }, { status: 400 });
    }
    if (!fileB && !preBase64B) {
      return NextResponse.json({ error: 'Version B image or screenshot data is required' }, { status: 400 });
    }

    // Process both images in parallel
    const [imgA, imgB] = await Promise.all([
      fileA
        ? processFileInput(fileA)
        : Promise.resolve({ base64: preBase64A!, dataUrl: preDataUrlA!, mimeType: 'image/png' }),
      fileB
        ? processFileInput(fileB)
        : Promise.resolve({ base64: preBase64B!, dataUrl: preDataUrlB!, mimeType: 'image/png' }),
    ]);

    const analysis = await runABAnalysis(
      imgA.base64, imgA.mimeType,
      imgB.base64, imgB.mimeType,
      pageContext,
    );

    const id = `ab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const report = {
      id,
      timestamp: new Date().toISOString(),
      pageContext,
      screenshotUrlA: imgA.dataUrl,
      screenshotUrlB: imgB.dataUrl,
      ...analysis,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error('AB analyze error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
