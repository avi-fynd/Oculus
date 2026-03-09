import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '../../../lib/audit/index';
import { base64ToDataUrl } from '../../../lib/image-utils';
import { captureUrl } from '../../../lib/capture';

export const maxDuration = 120; // Allow up to 2 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const url = formData.get('url') as string;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const capture = await captureUrl(url);

        const screenshotBase64 = capture.screenshotBase64;
        const screenshotDataUrl = base64ToDataUrl(screenshotBase64, 'image/png');
        const domSummary = capture.domSummary;

        // Run programmatic audit with real DOM data
        const programmaticIssues = runAudit(capture.domAnalysis);

        return NextResponse.json({
            screenshotBase64,
            screenshotDataUrl,
            domSummary,
            programmaticIssues,
            url
        });
    } catch (captureError) {
        console.error('Capture failed:', captureError);
        const errorMessage = captureError instanceof Error && captureError.message === 'ACCESS_DENIED'
            ? 'Due to access denial, the audit could not be performed.'
            : 'Failed to capture the URL. The site may be blocking automated access. Try uploading a screenshot instead.';
        const statusCode = captureError instanceof Error && captureError.message === 'ACCESS_DENIED' ? 403 : 422;

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
