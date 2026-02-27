// ─── AI Analysis via OpenAI ───────────────────────────────────────────────

import OpenAI from 'openai';
import type { AuditIssue } from './types';

const ANALYSIS_PROMPT = `You are an expert UX auditor. Analyze the provided screenshot of a web page and return a structured UX audit.

Your analysis must cover:

1. **Baymard-style UX best practices**: process consistency, homepage browsing clarity, simplicity, form design, navigation paths, filters/listing UX, checkout streamlining (if applicable).

2. **Laws of UX violations**: Hick's Law (too many choices), Jakob's Law (non-standard patterns), Fitts's Law (target sizes/distances), Cognitive Load, Miller's Law (chunking), Aesthetic-Usability Effect, Von Restorff Effect (distinctiveness), Zeigarnik Effect.

3. **Visual design issues**: visual hierarchy, alignment, spacing harmony, color usage, typography quality, whitespace balance.

4. **General UX problems**: unclear CTAs, confusing layouts, missing feedback states, poor information architecture.

For each issue found, return a JSON object with EXACTLY these fields:
- id: unique string identifier (e.g., "ai-hicks-law-nav")
- title: short descriptive title
- category: one of "accessibility", "readability", "layout", "mobile", "navigation", "contrast", "ux-heuristic"
- severity: one of "critical", "major", "minor"
- description: detailed explanation of the problem
- evidence: what specifically you see that indicates this issue
- impact: how this affects users
- recommendation: specific, actionable fix
- principle: the UX law/principle being violated (e.g., "Hick's Law", "Fitts's Law")
- region: optional bounding box as {x, y, width, height} in PERCENTAGES (0-100) of the screenshot dimensions

Return ONLY a valid JSON array of issues. No markdown, no code fences, no explanation text.
Return at least 3 and at most 12 issues. Focus on the most impactful problems.`;

export async function runAIAnalysis(
    screenshotBase64: string,
    mimeType: string = 'image/png',
    domSummary?: string,
): Promise<{ issues: AuditIssue[]; summary: string }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Return placeholder analysis if no API key
        return {
            issues: getPlaceholderIssues(),
            summary: 'AI analysis was not available (no API key configured). The results below are from programmatic checks only. Set OPENAI_API_KEY in .env.local for AI-powered UX analysis.',
        };
    }

    try {
        const openai = new OpenAI({ apiKey });

        const prompt = domSummary
            ? `${ANALYSIS_PROMPT}\n\nAdditional page context (DOM summary):\n${domSummary}`
            : ANALYSIS_PROMPT;

        const dataUrl = `data:${mimeType};base64,${screenshotBase64}`;

        // Run UX audit analysis
        const result = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
                    ],
                },
            ],
        });

        const text = result.choices[0]?.message?.content || '[]';

        // Parse JSON from response — handle potential markdown wrapping
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const issues: AuditIssue[] = JSON.parse(jsonStr);

        // Generate executive summary
        const summaryResult = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 300,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Based on the UX audit issues you found, write a 2-3 sentence executive summary of the overall UX quality of this page. Be professional and constructive. Issues found: ${JSON.stringify(issues.map(i => i.title))}`,
                        },
                        { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
                    ],
                },
            ],
        });

        return {
            issues: issues.map((i) => ({ ...i, id: i.id || `ai-${Math.random().toString(36).slice(2, 8)}` })),
            summary: summaryResult.choices[0]?.message?.content?.trim() || 'Analysis complete.',
        };
    } catch (err) {
        console.error('AI analysis failed:', err);
        return {
            issues: getPlaceholderIssues(),
            summary: `AI analysis encountered an error. Showing programmatic audit results only. Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
    }
}

function getPlaceholderIssues(): AuditIssue[] {
    return [
        {
            id: 'ai-placeholder-hierarchy',
            title: 'Visual hierarchy could be improved',
            category: 'ux-heuristic',
            severity: 'minor',
            description: 'The page may benefit from a clearer visual hierarchy to guide user attention to primary actions and content.',
            evidence: 'AI analysis was not available to inspect visual hierarchy in detail.',
            impact: 'Users may take longer to identify key content and actions.',
            recommendation: 'Ensure primary CTAs are visually prominent. Use size, color, and spacing to differentiate content importance levels.',
            principle: 'Visual Hierarchy',
        },
    ];
}
