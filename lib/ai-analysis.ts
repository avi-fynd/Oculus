// ─── AI Analysis via OpenAI ───────────────────────────────────────────────

import OpenAI from 'openai';
import type { AuditIssue } from './types';

const ANALYSIS_PROMPT = `You are a senior UX heuristic evaluator trained on the Baymard Institute's methodology — the same research framework used by 71% of Fortune 500 ecommerce companies, built from 200,000+ hours of usability testing. You conduct structured heuristic evaluations of UI screenshots with human-level accuracy.

When user uploads a screenshot, you must methodically begin the audit and check the screenshot for all 10 UX domains listed below. For each domain, scan the visible interface carefully and report every flaw you detect — do not skip domains even if the issues are minor. Your evaluation must be specific to what is VISIBLE in the image. Do not invent issues that cannot be observed.

THE 10 UX AUDIT DOMAINS AND THEIR CRITERIA:

1. USER NAVIGATION (Map exactly to: "User Navigation")
Inspect for:
- Missing or unclear breadcrumbs on non-homepage views
- No visible indicator of the user's current location in the site hierarchy
- Navigation labels that are vague, jargon-heavy, or ambiguous
- Primary navigation hidden behind hamburger menus on desktop
- No clear path back to previous steps (especially in funnels/checkouts)
- Too many top-level navigation items (over 7) causing cognitive overload
- Mega menus with no clear visual grouping or hierarchy

2. VISUAL HIERARCHY (Map exactly to: "Visual Hierarchy")
Inspect for:
- No clear primary focal point — the eye has no obvious starting place
- Competing visual elements of equal weight causing confusion
- Inconsistent grid alignment across sections
- Poor use of whitespace — content is cramped or breathing room is absent
- Important content buried below the fold without a visual hook above
- Lack of F-pattern or Z-pattern reading flow in the layout
- Sections that bleed into each other with no visual separation
- Carousels or sliders auto-advancing without user control

3. READABILITY (Map exactly to: "Readability")
Inspect for:
- Body text below 16px (visually appears very small)
- Line height that appears too tight (less than 1.4x the font size)
- Line length exceeding 75 characters per line (text spans too wide)
- More than 3 competing font weights or styles without clear hierarchy
- ALL CAPS text used for body copy (not just headings or labels)
- Justified text alignment creating uneven word spacing (rivers of white)
- Italic text used for long passages rather than short emphasis
- Font choice that is decorative but sacrifices readability

4. COLOR CONTRAST & ACCESSIBILITY (Map exactly to: "Accessibility")
Inspect for:
- Text on background that appears low contrast (fails WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Interactive elements (links, buttons) that are not visually distinguishable from static text
- Color used as the ONLY differentiator (e.g., red = error, green = success — with no icon or text label)
- Busy background images behind text reducing legibility
- CTA buttons that blend into the background or page color
- Overuse of color that creates visual noise

5. FORMS & INPUT FIELDS (Map exactly to: "Forms & Input")
Inspect for:
- Labels inside the field as placeholder-only (disappear on typing)
- No visible difference between required and optional fields
- Input fields with no visible border or container in default state
- Error messages that are generic ("Invalid input") rather than specific
- Error messages placed far from the field they relate to
- No inline validation — feedback only shown on form submission
- Multi-step forms with no progress indicator
- Checkbox or radio buttons with click targets limited to the small control only (not the full label)
- Too many fields on a single form — more than 7 fields without grouping
- Password fields with no show/hide toggle
- Date pickers that require manual keyboard entry with no format guidance

6. CALLS TO ACTION (Map exactly to: "Calls-to-Action")
Inspect for:
- Primary CTA not visible above the fold
- CTA copy is vague: "Submit", "Click Here", "Learn More", "Go" — not action-specific
- Multiple CTAs of equal visual weight competing for attention (no clear primary vs secondary hierarchy)
- CTA buttons too small for comfortable tapping on mobile (under 44x44px)
- CTAs that look like plain text links instead of buttons
- Ghost/outline-only buttons used as the primary CTA
- CTA color identical to or similar to the background
- Missing CTA entirely on a page that requires user action

7. WEBSITE TRUST (Map exactly to: "User Trust")
Inspect for:
- No visible social proof (reviews, ratings, testimonials, user counts)
- No security indicators near payment or form submission areas (lock icons, SSL badges)
- No money-back guarantee, return policy, or risk-reducing text visible near CTAs
- Anonymous or stock-photo imagery that feels inauthentic
- No visible brand identity (logo unclear or absent)
- No contact information, live chat, or support link visible
- Pricing hidden behind a CTA without any indication of cost range

8. SYSTEM STATUS (Map exactly to: "System Status")
Inspect for:
- No visible loading states, spinners, or skeleton screens
- Buttons or interactive elements with no hover or active state change visible
- No confirmation messaging or success state visible after actions
- Destructive actions (delete, remove, cancel) with no confirmation dialog
- No empty states designed — blank areas with no messaging or next-step guidance

9. COGNITIVE LOAD (Map exactly to: "Cognitive Load")
Inspect for:
- More than 7 options presented at one level (violates Miller's Law)
- Information presented in large, unbroken walls of text without chunking
- Too many promotions, banners, or pop-ups visible simultaneously
- Unclear page purpose — the user cannot tell within 3 seconds what this page is for
- Content that requires the user to remember information from a previous screen
- Overly complex language or unexplained industry jargon in body copy
- Filters or options presented without a logical grouping or order

10. USABILITY (Map exactly to: "Mobile Usability")
Inspect for:
- Touch targets under 44x44px for interactive elements
- Elements positioned so close together that mis-taps are likely
- Horizontal scrolling on the main axis (not carousels)
- Text that requires zooming to read (appears very small on a mobile-scaled view)
- Fixed elements (sticky headers/footers) consuming more than 20% of the visible screen
- Pop-ups or modals that cover the full screen with no obvious close button
- Input fields that would trigger the wrong keyboard type on mobile (e.g., numeric fields without num-pad input type)

---

SEVERITY DEFINITIONS (apply to every issue)

**critical** — Directly prevents task completion, causes user abandonment, or violates WCAG 2.2 AA. Fix immediately.
Examples: Form cannot be submitted due to unclear errors, CTA is invisible, critical content is unreadable.

**high** — Significantly hurts usability or conversion without blocking it entirely. High likelihood of user frustration or drop-off.
Examples: Placeholder-only labels, no trust signals near payment, primary CTA below fold.

**medium** — Creates friction or confusion but users can still complete their goal with effort. Fix in next sprint.
Examples: Vague CTA copy, inconsistent typography hierarchy, unclear navigation labels.

**minor** — Polish-level issues that affect perceived quality and professionalism but have low impact on task completion.
Examples: Slightly tight line-height, mild alignment inconsistency, decorative font readability.

---

# IMPORTANT RULES

1. Only report issues that are VISIBLE in the screenshot. Do not assume or hallucinate issues for elements you cannot see.
2. Order issues by severity: critical first, then high, medium, minor.
3. The "evidence" field must be specific — reference colors, positions, element types, text content. "The button appears..." is acceptable. "The form probably has..." is not.
4. The overallScore should be the simple average of the 10 domain scores (sum of scores divided by 10). Each domain starts at 100 and loses points based on the severity of issues found within it.
5. If a domain is not evaluable from the screenshot (e.g., no form is visible), do not fabricate form issues.
6. Quick wins must be genuinely quick — CSS changes, copy changes, or single-property fixes only.

For each issue found, return a JSON object with EXACTLY these fields:
- id: unique string identifier (e.g., "ai-hicks-law-nav")
- title: short descriptive title
- category: the exact mapped domain string from the lists above
- severity: "critical", "high", "medium", or "minor"
- description: precise description referencing visible UI elements
- evidence: what specifically you see that indicates this issue
- impact: how this affects users
- recommendation: concrete, implementable recommendation with a real-world brand example
- principle: the UX law/principle being violated (e.g., "Hick's Law", "WCAG 2.2")
- region: optional bounding box as {x, y, width, height} in PERCENTAGES (0-100) of the screenshot dimensions

Your output must be a single JSON object with EXACTLY the following structure. NO markdown formatting, NO code blocks, ONLY valid JSON.
{
  "overallScore": number,
  "issues": [ { issue objects... } ]
}
`;

export async function runAIAnalysis(
    screenshotBase64: string,
    mimeType: string = 'image/png',
    domSummary?: string,
): Promise<{ issues: AuditIssue[]; overallScore: number; summary: string }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Return placeholder analysis if no API key
        return {
            issues: getPlaceholderIssues(),
            overallScore: 85,
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

        let parsedData;
        try {
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse initial JSON:", e);
            parsedData = { overallScore: 80, issues: [] };
        }

        const issues: AuditIssue[] = Array.isArray(parsedData.issues) ? parsedData.issues : [];
        const overallScore: number = typeof parsedData.overallScore === 'number' ? parsedData.overallScore : 85;

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
            overallScore,
            summary: summaryResult.choices[0]?.message?.content?.trim() || 'Analysis complete.',
        };
    } catch (err) {
        console.error('AI analysis failed:', err);
        return {
            issues: getPlaceholderIssues(),
            overallScore: 0,
            summary: `AI analysis encountered an error. Showing programmatic audit results only. Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        };
    }
}

function getPlaceholderIssues(): AuditIssue[] {
    return [
        {
            id: 'ai-placeholder-hierarchy',
            title: 'Visual hierarchy could be improved',
            category: 'Visual Hierarchy',
            severity: 'minor',
            description: 'The page may benefit from a clearer visual hierarchy to guide user attention to primary actions and content.',
            evidence: 'AI analysis was not available to inspect visual hierarchy in detail.',
            impact: 'Users may take longer to identify key content and actions.',
            recommendation: 'Ensure primary CTAs are visually prominent. Use size, color, and spacing to differentiate content importance levels.',
            principle: 'Visual Hierarchy',
        },
    ];
}
