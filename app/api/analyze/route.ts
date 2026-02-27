// ─── /api/analyze — UX Audit API Route ────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { runAudit, buildResult } from '../../../lib/audit/index';
import { runAIAnalysis } from '../../../lib/ai-analysis';
import { processUploadedImage, bufferToBase64, base64ToDataUrl } from '../../../lib/image-utils';

export const maxDuration = 120; // Allow up to 2 minutes for analysis
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const inputType = formData.get('inputType') as string;

        let screenshotBase64: string;
        let screenshotDataUrl: string;
        let mimeType = 'image/png';
        let domSummary: string | undefined;
        let programmaticIssues: ReturnType<typeof runAudit> = { issues: [], score: 100, grade: 'A', categoryScores: [] };
        let analysisUrl: string | undefined;

        if (inputType === 'url') {
            // ─── URL Analysis ───────────────────────────────────────────────
            const url = formData.get('url') as string;
            if (!url) {
                return NextResponse.json({ error: 'URL is required' }, { status: 400 });
            }

            // Validate URL
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
                }
            } catch {
                return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
            }

            analysisUrl = url;

            try {
                const { captureUrl } = await import('../../../lib/capture');
                const capture = await captureUrl(url);

                screenshotBase64 = capture.screenshotBase64;
                screenshotDataUrl = base64ToDataUrl(screenshotBase64, 'image/png');
                domSummary = capture.domSummary;

                // Run programmatic audit with real DOM data
                programmaticIssues = runAudit(capture.domAnalysis);
            } catch (captureError) {
                console.error('Puppeteer capture failed:', captureError);
                // Fall back: return error suggesting to try screenshot upload instead
                return NextResponse.json(
                    { error: 'Failed to capture the URL. The site may be blocking automated access. Try uploading a screenshot instead.' },
                    { status: 422 }
                );
            }
        } else {
            // ─── Screenshot Analysis ────────────────────────────────────────
            const screenshotFile = formData.get('screenshot') as File | null;
            if (!screenshotFile) {
                return NextResponse.json({ error: 'Screenshot file is required' }, { status: 400 });
            }

            // Validate file type
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(screenshotFile.type)) {
                return NextResponse.json({ error: 'Invalid file type. Please upload PNG, JPG, or WebP.' }, { status: 400 });
            }

            // Validate file size (10MB limit)
            if (screenshotFile.size > 10 * 1024 * 1024) {
                return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
            }

            const buffer = Buffer.from(await screenshotFile.arrayBuffer());

            try {
                const processed = await processUploadedImage(buffer);
                screenshotBase64 = bufferToBase64(processed.analysis);
                screenshotDataUrl = base64ToDataUrl(bufferToBase64(processed.preview), 'image/webp');
                mimeType = processed.mimeType;
            } catch {
                // If sharp fails, use raw buffer
                screenshotBase64 = bufferToBase64(buffer);
                screenshotDataUrl = base64ToDataUrl(screenshotBase64, screenshotFile.type);
                mimeType = screenshotFile.type;
            }
        }

        // ─── AI Analysis ────────────────────────────────────────────────────
        const aiResult = await runAIAnalysis(screenshotBase64, mimeType, domSummary);

        // ─── Build Final Result ─────────────────────────────────────────────
        const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const result = buildResult(
            id,
            inputType as 'screenshot' | 'url',
            screenshotDataUrl,
            programmaticIssues.issues,
            aiResult.issues,
            aiResult.summary || 'Analysis complete.',
            analysisUrl,
        );

        return NextResponse.json(result);
    } catch (err) {
        console.error('Analysis error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'An unexpected error occurred during analysis.' },
            { status: 500 }
        );
    }
}
