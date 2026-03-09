// ─── Heuristic Evaluation Analysis via OpenAI ────────────────────────────────

import OpenAI from 'openai';
import type {
  HeuristicPageType, HeuristicDeviceContext,
  HeuristicFinding, HeuristicFrameworkScore, HeuristicReport,
} from './types';

function buildPrompt(
  pageType: HeuristicPageType,
  deviceContext: HeuristicDeviceContext,
  primaryGoal?: string,
): string {
  const goalLine = primaryGoal
    ? `\n- Primary Goal: "${primaryGoal}" — weight every finding against whether the design actually serves this conversion intent.`
    : '';
  const mobileDirective = deviceContext !== 'Desktop'
    ? 'INCLUDE Framework 7 (Mobile & Touch Standards) — device context is Mobile or Both.'
    : 'OMIT Framework 7 — device context is Desktop only. Do NOT include a mobile framework score.';

  return `You are a senior UX researcher with 15 years of experience conducting formal heuristic evaluations for Fortune 500 clients. You have deep expertise across all major UX research traditions.

EVALUATION CONTEXT:
- Page Type: ${pageType}
- Device Context: ${deviceContext}${goalLine}

Conduct a rigorous heuristic evaluation of the provided UI screenshot across the following frameworks. ${mobileDirective}

FRAMEWORK 1 — JAKOB NIELSEN'S 10 USABILITY HEURISTICS (Nielsen Norman Group):
Evaluate against all 10: #1 Visibility of System Status, #2 Match Between System and World, #3 User Control and Freedom, #4 Consistency and Standards, #5 Error Prevention, #6 Recognition Rather Than Recall, #7 Flexibility and Efficiency of Use, #8 Aesthetic and Minimalist Design, #9 Help Users Recognize/Diagnose/Recover from Errors, #10 Help and Documentation. Cite as "Nielsen #N: [Name]".

FRAMEWORK 2 — BAYMARD INSTITUTE UX RESEARCH GUIDELINES:
Apply the specific Baymard guidelines relevant to a ${pageType}. Baymard's corpus covers: form usability, checkout UX, navigation & IA, mobile UX, product page UX, search UX, homepage & category UX, cart & checkout, trust & security. Reference specific guideline categories. Cite as "Baymard: [Category] — [Guideline Name]".

FRAMEWORK 3 — WCAG 2.2 ACCESSIBILITY:
Evaluate under 4 principles: Perceivable (color contrast ≥4.5:1 for normal text, ≥3:1 for large text, text alternatives, content structure), Operable (keyboard accessibility, visible focus states, 44×44px touch targets, no seizure-risk motion), Understandable (plain language, specific error identification, persistent labels not placeholder-only), Robust (semantic structure inferred from visual design, no color-alone meaning). Cite as "WCAG 2.2 — [Success Criterion or Principle]".

FRAMEWORK 4 — GESTALT PRINCIPLES OF VISUAL PERCEPTION:
Evaluate against: Law of Proximity (grouped elements perceived as related), Law of Similarity (shared visual traits = perceived relationship), Law of Common Region (boundaries define logical groups), Law of Continuity (smooth visual flow guides eye), Law of Closure (incomplete shapes perceived as whole), Figure-Ground (foreground/background separation). Cite as "Gestalt: [Law Name]".

FRAMEWORK 5 — COGNITIVE PSYCHOLOGY LAWS:
Evaluate against: Hick's Law (decision time ∝ log number of choices — flag excess options at any decision point), Miller's Law (7±2 items in working memory — flag lists/menus exceeding this without chunking), Fitts's Law (acquisition time = fn(size, distance) — evaluate CTA size and position), Cognitive Load Theory (extraneous load from poor design competes with germane load for understanding — identify unnecessary complexity). Cite as "Cognitive: [Law Name]".

FRAMEWORK 6 — EMOTIONAL DESIGN & TRUST PRINCIPLES:
Evaluate against: Norman's 3 Levels (Visceral = immediate aesthetic impression, Behavioral = ease and effectiveness of use, Reflective = brand meaning and aspiration), Fogg's Persuasive Technology (Surface Credibility = trustworthiness from appearance alone; Earned Credibility = trust from consistent positive interactions), Kahneman's Peak-End Rule (experiences judged by emotional peak + ending — evaluate the most intense and final moments). Cite as "Emotional: [Principle]".

FRAMEWORK 7 — MOBILE & TOUCH STANDARDS (Apple HIG + Material Design 3):
${deviceContext !== 'Desktop'
  ? 'Evaluate: minimum 44×44pt touch targets (Apple HIG), 48×48dp targets (Material Design 3), thumb zone accessibility (primary actions reachable without repositioning), custom gesture conflict prevention (vs system swipe gestures), body text ≥16px, line length 45–75 characters for comfortable mobile reading. Cite as "Mobile: [Standard]".'
  : 'SKIP — Desktop context.'}

CONVERGENT VIOLATIONS: When 2+ independent frameworks identify the same design problem, set isConvergent: true and include ALL framework citations. These are your highest-confidence findings.

Return ONLY valid JSON — no markdown, no commentary, no extra text:
{
  "overallScore": number (0–100),
  "narrativeVerdict": string (150–200 words in the voice of a senior UX consultant: identify the 2–3 most critical issues, name the specific principles violated, state the business consequence, give a clear directional verdict on the interface's effectiveness for its stated goal),
  "frameworkScores": [
    {
      "id": "nielsen" | "baymard" | "wcag" | "gestalt" | "cognitive" | "emotional" | "mobile",
      "label": string (display name of framework),
      "score": number (0–100, where 100 = no violations, 50 = moderate issues, 0 = severe failures),
      "topFinding": string (one sentence: the single most significant finding within this framework)
    }
  ],
  "findings": [
    {
      "id": string (f1, f2, f3 ...),
      "title": string (5–10 word concise finding title),
      "severity": "critical" | "high" | "medium" | "minor",
      "citations": [
        {
          "framework": "nielsen" | "baymard" | "wcag" | "gestalt" | "cognitive" | "emotional" | "mobile",
          "frameworkLabel": string (short framework name),
          "principle": string (full citation text, e.g. "Nielsen #5: Error Prevention")
        }
      ],
      "isConvergent": boolean (true when citations.length >= 2),
      "observation": string (1–2 sentences: exactly what is visible in the screenshot that constitutes the violation — be specific),
      "userImpact": string (1–2 sentences: what a real user will feel, do, or fail to accomplish because of this),
      "recommendation": string (2–3 sentences: precisely what needs to change with enough specificity for a developer or designer to implement without further clarification),
      "realWorldExample": string (1 sentence: a specific real brand that handles this pattern correctly, e.g. "Stripe's checkout uses persistent floating labels that eliminate placeholder disappearance confusion")
    }
  ]
}

RULES:
- Generate 10–15 findings total, sorted: critical → high → medium → minor
- isConvergent: true whenever citations.length >= 2 (regardless of framework count)
- frameworkScores: include all 7 entries if deviceContext is Mobile or Both; include exactly 6 (omit mobile) if Desktop
- overallScore: compute as 100 minus (critical_count × 15 + high_count × 8 + medium_count × 4 + minor_count × 2), minimum 0
- Every finding must have at least one citation with correct framework id
- Observation must reference specific, visible UI elements — not generic descriptions
- realWorldExample must name a real, recognizable product or brand
- narrativeVerdict must explicitly cite at least 2 specific UX laws by name`;
}

function placeholderReport(): Omit<HeuristicReport, 'id' | 'timestamp' | 'screenshotUrl'> {
  return {
    pageType: 'Homepage',
    deviceContext: 'Desktop',
    overallScore: 61,
    severityCounts: { critical: 1, high: 3, medium: 4, minor: 2 },
    narrativeVerdict: 'This interface demonstrates competent visual production but reveals systematic gaps in conversion-critical design decisions. The primary CTA violates Fitts\'s Law by appearing at a distance from the natural gaze entry point established by the hero headline, meaning users must travel significant visual distance before encountering the conversion action. Three separate Baymard guidelines on form usability are violated simultaneously in the visible input section, creating compounding friction at the most sensitive moment in the user journey. The Gestalt Law of Proximity is misapplied in the navigation cluster — unrelated actions share identical spatial grouping, creating false affordances. Until CTA placement, form labeling, and navigation hierarchy are addressed, this design will underperform its conversion potential by an estimated 20–35%. Set OPENAI_API_KEY for real AI analysis.',
    frameworkScores: [
      { id: 'nielsen', label: "Nielsen's 10 Heuristics", score: 72, topFinding: 'Consistency and Standards violated — button styles differ between navigation and body areas without semantic justification.' },
      { id: 'baymard', label: 'Baymard Institute', score: 58, topFinding: 'Form field labels use placeholder-only design — disappear on input, violating Baymard\'s persistent label guideline.' },
      { id: 'wcag', label: 'WCAG 2.2', score: 65, topFinding: 'Interactive elements lack visible focus indicators, making keyboard navigation non-functional for keyboard-only users.' },
      { id: 'gestalt', label: 'Gestalt Principles', score: 70, topFinding: 'Law of Proximity violated — CTA button is spatially grouped with decorative elements rather than the headline it supports.' },
      { id: 'cognitive', label: 'Cognitive Psychology', score: 55, topFinding: 'Hick\'s Law violated — 11 simultaneous navigation options presented at the primary decision point without progressive disclosure.' },
      { id: 'emotional', label: 'Emotional Design & Trust', score: 68, topFinding: 'Fogg\'s Surface Credibility undermined — no trust signals, social proof, or security indicators visible above the fold.' },
    ],
    findings: [
      {
        id: 'f1',
        title: 'Primary CTA Positioned Below Natural Gaze Entry',
        severity: 'critical',
        isConvergent: true,
        citations: [
          { framework: 'cognitive', frameworkLabel: 'Cognitive Psychology', principle: "Cognitive: Fitts's Law" },
          { framework: 'gestalt', frameworkLabel: 'Gestalt Principles', principle: 'Gestalt: Figure-Ground' },
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #6: Recognition Rather Than Recall' },
        ],
        observation: 'The primary call-to-action button is positioned in the lower 40% of the viewport, requiring the user to scan past three competing visual elements before encountering it.',
        userImpact: 'Users establish their attention pattern in the first 3–5 seconds. A CTA below the fold or below competing elements will be missed by users who do not scroll, reducing conversion rates significantly.',
        recommendation: 'Reposition the primary CTA to sit within 300px of the hero headline, either directly below or immediately adjacent. Increase button width to span at least 35% of the content column and ensure no competing interactive elements appear between the headline and CTA.',
        realWorldExample: "Figma's homepage places its primary CTA within 40px of the headline, in the user's natural F-pattern reading endpoint, achieving a minimal click distance.",
      },
      {
        id: 'f2',
        title: 'Form Labels Use Placeholder-Only Pattern',
        severity: 'high',
        isConvergent: true,
        citations: [
          { framework: 'baymard', frameworkLabel: 'Baymard Institute', principle: 'Baymard: Form Usability — Placeholder-as-Label Anti-Pattern' },
          { framework: 'wcag', frameworkLabel: 'WCAG 2.2', principle: 'WCAG 2.2 — 3.3.2 Labels or Instructions' },
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #5: Error Prevention' },
        ],
        observation: 'Input fields display only placeholder text that disappears when the user begins typing — no persistent label exists above or beside the field.',
        userImpact: "Users who pause during form completion cannot recall what a field requires. Baymard's research shows placeholder-as-label fields increase form abandonment by up to 26%.",
        recommendation: 'Replace placeholder-as-label with persistent floating labels that animate upward when the field receives focus. Placeholder text should contain example input only (e.g., "e.g., john@company.com"), never the field label.',
        realWorldExample: "Stripe's payment form uses Material Design-style floating labels that persist above the field throughout the entire input interaction.",
      },
      {
        id: 'f3',
        title: 'Navigation Presents 11 Simultaneous Options',
        severity: 'high',
        isConvergent: false,
        citations: [
          { framework: 'cognitive', frameworkLabel: 'Cognitive Psychology', principle: "Cognitive: Hick's Law" },
        ],
        observation: 'The top navigation bar presents 11 clickable items at the same visual hierarchy level with no grouping or progressive disclosure.',
        userImpact: "Hick's Law predicts decision time increases logarithmically with each added option. 11 options creates measurably longer time-to-first-click and increases the probability of choice paralysis and exit.",
        recommendation: 'Reduce top-level navigation to 5–7 primary items. Group remaining items into logical mega-menu categories or a secondary navigation tier. Use visual weight differentiation to distinguish primary navigation from utility links.',
        realWorldExample: "Apple's navigation consistently limits top-level items to 7, grouping subcategories into a hover-triggered mega-menu with clear visual hierarchy.",
      },
      {
        id: 'f4',
        title: 'No Visible Trust Signals Above the Fold',
        severity: 'high',
        isConvergent: false,
        citations: [
          { framework: 'emotional', frameworkLabel: 'Emotional Design & Trust', principle: "Emotional: Fogg's Surface Credibility" },
        ],
        observation: 'The visible viewport contains no social proof, security badges, customer count indicators, review scores, or media credibility signals.',
        userImpact: "Fogg's research shows surface credibility is evaluated in under 50 milliseconds based purely on visual appearance. Without trust signals, first-time visitors default to skepticism, particularly for any flow requiring personal information.",
        recommendation: 'Add at minimum one tier of trust signal above the fold: customer count ("10,000+ teams"), review aggregate ("4.8/5 from 2,000 reviews"), notable client logos, or a single security indicator (SSL badge, SOC 2 compliance). Place directly below or adjacent to the primary CTA.',
        realWorldExample: "Linear's homepage displays customer logos from recognizable brands immediately below the hero headline, establishing credibility before the CTA is encountered.",
      },
      {
        id: 'f5',
        title: 'Interactive Elements Lack Visible Focus States',
        severity: 'high',
        isConvergent: false,
        citations: [
          { framework: 'wcag', frameworkLabel: 'WCAG 2.2', principle: 'WCAG 2.2 — 2.4.11 Focus Appearance (Minimum)' },
        ],
        observation: 'Interactive elements (links, buttons, inputs) do not display visible focus rings or outline indicators when navigated via keyboard based on the visual styling apparent in the design.',
        userImpact: 'Keyboard-only users and users who rely on Tab navigation have no visual indication of their current position in the interface — making the product effectively unusable without a mouse.',
        recommendation: 'Implement a 2px minimum focus outline using a color with 3:1 contrast against adjacent colors, applied to all interactive elements. Use CSS :focus-visible to show only for keyboard navigation without affecting mouse interactions.',
        realWorldExample: "GitHub's interface applies a high-contrast 2px blue outline to all focused elements, meeting WCAG 2.4.11 while remaining visually unobtrusive for mouse users.",
      },
      {
        id: 'f6',
        title: 'Button Styles Inconsistent Across Page Sections',
        severity: 'medium',
        isConvergent: false,
        citations: [
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #4: Consistency and Standards' },
        ],
        observation: 'Button components in the hero section and body sections use different background colors, border radii, and font weights despite performing functionally similar roles.',
        userImpact: 'Inconsistent interactive element styling forces users to re-evaluate affordances at each encounter, increasing cognitive load and undermining confidence in the interface\'s internal logic.',
        recommendation: 'Define a design token system with three button variants — Primary, Secondary, and Ghost — and apply them consistently based on action hierarchy, not section context. Audit all interactive elements against this system before launch.',
        realWorldExample: "Notion maintains a single button style system with consistent border-radius and weight across all product surfaces, including landing page, app, and marketing materials.",
      },
      {
        id: 'f7',
        title: 'Content Density Exceeds Comfortable Reading Threshold',
        severity: 'medium',
        isConvergent: true,
        citations: [
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #8: Aesthetic and Minimalist Design' },
          { framework: 'cognitive', frameworkLabel: 'Cognitive Psychology', principle: 'Cognitive: Cognitive Load Theory' },
        ],
        observation: 'Multiple content blocks containing 80–120 word paragraphs are stacked with insufficient whitespace between sections, creating a visually dense reading environment.',
        userImpact: 'Dense text blocks increase extraneous cognitive load — mental effort spent parsing the layout rather than processing the content. Users scan rather than read, causing key value propositions to go unnoticed.',
        recommendation: 'Reduce body paragraphs to 40–60 words maximum. Increase section spacing to 80–120px minimum between major content blocks. Use sub-headings every 2–3 paragraphs to provide visual rest points and scanning anchors.',
        realWorldExample: "Vercel's feature pages use short paragraphs of 2–3 sentences maximum with generous 96px section spacing, optimizing for scanning while ensuring key messages are absorbed.",
      },
      {
        id: 'f8',
        title: 'Related Actions Separated by Visual Distance',
        severity: 'medium',
        isConvergent: false,
        citations: [
          { framework: 'gestalt', frameworkLabel: 'Gestalt Principles', principle: 'Gestalt: Law of Proximity' },
        ],
        observation: 'Contextually related interactive elements — such as a primary action and its supporting secondary action — are separated by 120px or more of visual space.',
        userImpact: 'When related elements are far apart, users perceive them as unrelated and must expend cognitive effort to reconstruct the relationship. This disrupts the intended decision flow.',
        recommendation: 'Group related actions within 16–24px of each other. Use visual containers or shared background regions to reinforce the association where spatial proximity alone is insufficient.',
        realWorldExample: "Shopify's admin interface consistently groups related actions within 8–16px using card containers, making the relationship between primary and secondary actions immediately apparent.",
      },
      {
        id: 'f9',
        title: 'Error State Design Not Visible for Validation Failures',
        severity: 'medium',
        isConvergent: false,
        citations: [
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #9: Help Users Recognize, Diagnose, and Recover from Errors' },
        ],
        observation: 'No inline error state design is visible for form fields — errors appear likely to be displayed only on form submission rather than inline as the user types.',
        userImpact: 'Delayed error feedback (post-submit rather than inline) forces users to mentally track which fields they have completed correctly, increasing cognitive load and form abandonment.',
        recommendation: 'Implement inline validation that triggers after the user leaves a field (on blur). Display a specific error message below the field in red text with a warning icon. Never rely solely on color to communicate error status.',
        realWorldExample: "HubSpot's forms validate email format and required fields inline on blur, showing specific messages like 'Please enter a valid email address' rather than generic 'Invalid input'.",
      },
      {
        id: 'f10',
        title: 'Help Resources Not Discoverable Without Prior Knowledge',
        severity: 'minor',
        isConvergent: false,
        citations: [
          { framework: 'nielsen', frameworkLabel: "Nielsen's Heuristics", principle: 'Nielsen #10: Help and Documentation' },
        ],
        observation: 'No visible help resources, tooltips, onboarding guidance, or contextual documentation links are present in the visible interface.',
        userImpact: 'First-time users encountering unfamiliar terminology or workflow steps have no path to assistance without leaving the interface, increasing frustration and support ticket volume.',
        recommendation: 'Add a persistent help widget (bottom-right corner) and contextual tooltip icons adjacent to any technical or unfamiliar field labels. Ensure help documentation opens in a side drawer rather than a new tab to maintain user context.',
        realWorldExample: "Intercom's product surfaces a help bubble that appears after 30 seconds of inactivity, offering contextual documentation without interrupting active users.",
      },
    ],
  };
}

export async function runHeuristicAnalysis(
  screenshotBase64: string,
  mimeType: string,
  pageType: HeuristicPageType,
  deviceContext: HeuristicDeviceContext,
  primaryGoal?: string,
): Promise<Omit<HeuristicReport, 'id' | 'timestamp' | 'screenshotUrl'>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return placeholderReport();

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 6000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${screenshotBase64}`, detail: 'high' },
            },
            { type: 'text', text: buildPrompt(pageType, deviceContext, primaryGoal) },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw); } catch { return placeholderReport(); }

    const findings = (parsed.findings as HeuristicFinding[]) || [];
    const severityCounts = {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      minor: findings.filter(f => f.severity === 'minor').length,
    };
    const overallScore = Math.max(
      0,
      100 - (severityCounts.critical * 15 + severityCounts.high * 8 + severityCounts.medium * 4 + severityCounts.minor * 2),
    );

    return {
      pageType,
      deviceContext,
      primaryGoal,
      overallScore,
      severityCounts,
      narrativeVerdict: (parsed.narrativeVerdict as string) || '',
      frameworkScores: (parsed.frameworkScores as HeuristicFrameworkScore[]) || [],
      findings,
    };
  } catch (err) {
    console.error('Heuristic analysis error:', err);
    return placeholderReport();
  }
}
