// ─── A/B Comparative UX Analysis via OpenAI ───────────────────────────────

import OpenAI from 'openai';
import type { ABDomainScore, ABKeyWin, ABRegression, ABAnnotation, ABReport } from './types';

const UX_DOMAINS = [
  'Navigation and Wayfinding',
  'Visual Hierarchy and Layout',
  'Typography and Readability',
  'Color and Contrast',
  'Forms and Input Fields',
  'Calls to Action',
  'Trust and Credibility Signals',
  'Feedback and System Status',
  'Cognitive Load and Information Architecture',
  'Mobile Usability',
] as const;

function buildPrompt(pageContext?: string): string {
  const contextNote = pageContext
    ? `\nPage Type: "${pageContext}" — apply the most relevant UX evaluation criteria for this specific page type.`
    : '';

  return `You are a senior UX researcher at a top product design consultancy conducting a rigorous A/B test comparative analysis.

You are analyzing TWO UI designs provided as images:
- FIRST IMAGE = Version A (the current / baseline design)
- SECOND IMAGE = Version B (the redesign or variant)${contextNote}

Evaluate both designs across these 10 UX domains using Baymard Institute research, Nielsen Norman Group heuristics, and WCAG 2.2 standards:
${UX_DOMAINS.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Scoring: 0=broken, 50=acceptable, 70=good, 85=great, 95+=exceptional.
Be precise. Score each domain for each version independently based only on what is visible.

Return ONLY valid JSON with this exact structure (no markdown, no text outside JSON):
{
  "winner": "A" | "B" | "tie",
  "winnerVerdict": "One definitive sentence for a product manager: name the winner, primary reason, and key caveat if any",
  "overallScoreA": number,
  "overallScoreB": number,
  "domainScores": [
    {
      "domain": "exact domain name",
      "scoreA": number,
      "scoreB": number,
      "delta": number,
      "winner": "A" | "B" | "tie",
      "comparisonSummary": "1-2 sentences on the key difference between versions in this domain",
      "whatADid": "Specific description of Version A's approach in this domain",
      "whatBChanged": "What Version B changed and whether it improved or regressed",
      "recommendation": "Actionable fix or next step"
    }
  ],
  "keyWins": [
    {
      "domain": "domain name",
      "change": "Specific UI change observed in Version B",
      "principle": "UX law or standard this satisfies (e.g. Fitts's Law, WCAG 1.4.3, Hick's Law)",
      "impact": "Concrete impact on real users"
    }
  ],
  "regressions": [
    {
      "domain": "domain name",
      "change": "What got worse in Version B vs A",
      "principle": "UX principle or guideline violated",
      "impact": "How this hurts users",
      "recommendation": "Specific fix that preserves Version B's improvements"
    }
  ],
  "annotations": [
    {
      "id": number,
      "x": number (0-100 percent from left of image),
      "y": number (0-100 percent from top of image),
      "version": "A" | "B",
      "note": "Brief annotation about this UI element",
      "outcome": "improvement" | "regression" | "neutral"
    }
  ]
}

Rules:
- Include ALL 10 domains in domainScores (even if tied)
- keyWins: only include domains where B genuinely improved (delta >= +5)
- regressions: only include domains where B regressed (delta <= -5)
- annotations: 3-4 per version, pointing to notable UI elements
- delta must equal scoreB minus scoreA exactly
- winner field in each domain must match the sign of delta`;
}

function computeShipConfidence(overallScoreB: number, domainScores: ABDomainScore[]): number {
  let penalty = 0;
  for (const d of domainScores) {
    if (d.delta < -20) penalty += 12;
    else if (d.delta < -10) penalty += 6;
    else if (d.delta < -5) penalty += 3;
  }
  return Math.max(0, Math.min(100, Math.round(overallScoreB - penalty)));
}

function getPlaceholderResult(screenshotUrlA: string, screenshotUrlB: string): Omit<ABReport, 'id' | 'timestamp' | 'screenshotUrlA' | 'screenshotUrlB'> {
  return {
    winner: 'B',
    winnerVerdict: 'Version B shows measurable improvements in visual hierarchy and CTA prominence, though accessibility should be verified before shipping.',
    overallScoreA: 62,
    overallScoreB: 74,
    shipConfidenceScore: 71,
    domainScores: UX_DOMAINS.map((domain, i) => ({
      domain,
      scoreA: 55 + i * 2,
      scoreB: 65 + i * 2,
      delta: 10,
      winner: 'B' as const,
      comparisonSummary: 'Version B shows improvements in this area. (AI key not configured — showing placeholder data.)',
      whatADid: 'Version A has a standard implementation of this domain.',
      whatBChanged: 'Version B makes improvements that enhance usability.',
      recommendation: 'Set OPENAI_API_KEY in .env.local for real AI analysis.',
    })),
    keyWins: [
      { domain: 'Visual Hierarchy and Layout', change: 'Clearer content hierarchy', principle: 'Visual Hierarchy', impact: 'Users find key info faster' },
      { domain: 'Calls to Action', change: 'More prominent CTA button', principle: "Fitts's Law", impact: 'Higher click-through rate' },
    ],
    regressions: [],
    annotationsA: [{ id: 1, x: 50, y: 30, version: 'A', note: 'Current design baseline', outcome: 'neutral' }],
    annotationsB: [{ id: 2, x: 50, y: 30, version: 'B', note: 'Improved redesign', outcome: 'improvement' }],
  };
}

export async function runABAnalysis(
  screenshotBase64A: string,
  mimeTypeA: string,
  screenshotBase64B: string,
  mimeTypeB: string,
  pageContext?: string,
): Promise<Omit<ABReport, 'id' | 'timestamp' | 'screenshotUrlA' | 'screenshotUrlB'>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getPlaceholderResult('', '');
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeTypeA};base64,${screenshotBase64A}`, detail: 'high' },
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeTypeB};base64,${screenshotBase64B}`, detail: 'high' },
            },
            { type: 'text', text: buildPrompt(pageContext) },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('Failed to parse AB AI response');
      return getPlaceholderResult('', '');
    }

    const domainScores: ABDomainScore[] = (parsed.domainScores as ABDomainScore[]) || [];
    const allAnnotations: ABAnnotation[] = (parsed.annotations as ABAnnotation[]) || [];
    const overallScoreB = (parsed.overallScoreB as number) || 50;

    return {
      winner: (parsed.winner as 'A' | 'B' | 'tie') || 'tie',
      winnerVerdict: (parsed.winnerVerdict as string) || 'Analysis complete.',
      overallScoreA: (parsed.overallScoreA as number) || 50,
      overallScoreB,
      shipConfidenceScore: computeShipConfidence(overallScoreB, domainScores),
      domainScores,
      keyWins: (parsed.keyWins as ABKeyWin[]) || [],
      regressions: (parsed.regressions as ABRegression[]) || [],
      annotationsA: allAnnotations.filter(a => a.version === 'A'),
      annotationsB: allAnnotations.filter(a => a.version === 'B'),
    };
  } catch (err) {
    console.error('AB analysis error:', err);
    return getPlaceholderResult('', '');
  }
}
