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
            // ─── URL Analysis (Pre-captured) ────────────────────────────────
            const url = formData.get('url') as string;
            if (!url) {
                return NextResponse.json({ error: 'URL is required' }, { status: 400 });
            }

            analysisUrl = url;

            // For URLs, the client now hits /api/capture first and passes the results here
            screenshotBase64 = formData.get('screenshotBase64') as string;
            screenshotDataUrl = formData.get('screenshotDataUrl') as string;
            domSummary = formData.get('domSummary') as string || undefined;

            const rawIssues = formData.get('programmaticIssues') as string;
            if (rawIssues) {
                try {
                    programmaticIssues = JSON.parse(rawIssues);
                } catch {
                    console.warn("Failed to parse programmatic issues from payload");
                }
            }

            if (!screenshotBase64) {
                return NextResponse.json({ error: 'Missing pre-captured screenshot data' }, { status: 400 });
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
            aiResult.overallScore, // Use AI score if available
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
