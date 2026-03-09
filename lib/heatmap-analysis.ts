// ─── Heatmap Attention Analysis via OpenAI ────────────────────────────────────

import OpenAI from 'openai';
import type {
  AttentionHotspot, GazeFixation, AttentionConflict,
  RegionOfInterestReport, HeatmapReport,
} from './types';

function buildPrompt(pageContext?: string, regionsOfInterest?: string[]): string {
  const ctx = pageContext ? `\nPage Type: "${pageContext}" — apply context-specific attention weights for this page type.` : '';
  const roiNote = regionsOfInterest?.length
    ? `\nRegions of Interest to evaluate: ${regionsOfInterest.map((r, i) => `${i + 1}. "${r}"`).join(', ')}. For each, estimate attention percentage, gaze rank, dwell time, and whether it passes or fails its intended role.`
    : '';

  return `You are an expert UX researcher and attention scientist with deep expertise in eye-tracking research, visual saliency modeling, and UX heuristic evaluation. You have analyzed thousands of eye-tracking sessions and understand exactly how human vision responds to contrast, motion cues, faces, text hierarchies, color, and spatial positioning.${ctx}${roiNote}

Analyze the provided UI screenshot and predict where human attention will land, in what order, and for how long — as if you are running an eye-tracking study on this interface. Apply the principles of visual saliency, contrast gradients, Gestalt psychology, and known eye-tracking patterns (F-pattern, Z-pattern, Golden Triangle).

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "clarityScore": number (0-100, how focused and intentional the attention distribution is),
  "clarityVerdict": "One sentence interpretation of this clarity score for this specific design",
  "hotspots": [
    {
      "x": number (0-100 percent from left edge of image),
      "y": number (0-100 percent from top edge of image),
      "intensity": number (0-100 attention weight, 90+=critical hotspot),
      "elementDescription": "What UI element is here",
      "inFirstFiveSeconds": boolean (true if in top 20% of predicted attention)
    }
  ],
  "gazeFixations": [
    {
      "order": number (1-based sequence),
      "x": number (0-100 percent from left),
      "y": number (0-100 percent from top),
      "dwellTime": number (0.2-3.0 seconds, proportional to predicted fixation duration),
      "elementDescription": "What element receives this fixation"
    }
  ],
  "aiAnalysis": "A detailed 350-500 word UX attention diagnosis. Identify every instance where a high-priority element receives insufficient attention, where low-priority elements steal attention from important ones, where the attention path breaks the intended user flow, and what specific design changes would improve attention distribution. Use precise design language and reference specific UX principles (F-pattern, Fitts's Law, figure-ground, visual weight, etc.). Include specific, measurable recommendations.",
  "attentionConflicts": [
    {
      "severity": "critical" | "high" | "medium",
      "element": "Specific UI element name",
      "problem": "What the attention mismatch is — where attention goes vs where it should go",
      "principle": "UX principle violated (e.g. Fitts's Law, F-pattern reading, visual weight hierarchy)",
      "recommendation": "Precise, implementable design change with specific measurements where possible"
    }
  ],
  "regionReports": [
    {
      "label": "exact label as provided",
      "attentionPercentage": number (0-100, share of total predicted attention),
      "gazeRank": number | null (rank in gaze sequence, null if not captured),
      "dwellEstimate": number (0.0-3.0 seconds),
      "verdict": "pass" | "fail",
      "analysis": "2-3 sentence specific analysis of this element's attention performance and what it means for its role on the page"
    }
  ]
}

Rules:
- Generate 8-15 hotspots covering all regions that would attract attention
- Generate 6-12 gaze fixation points in predicted viewing order
- inFirstFiveSeconds: true for the top 20% highest intensity hotspots only
- Clarity score: 80-100 = tightly focused hierarchy, 50-79 = moderate with competing elements, 0-49 = scattered/chaotic
- attentionConflicts: 2-5 findings, ordered critical → high → medium
- regionReports: only include if regions of interest were specified
- x,y coordinates must be precise — reference actual visible UI elements in the screenshot`;
}

function placeholderReport(): Omit<HeatmapReport, 'id' | 'timestamp' | 'screenshotUrl'> {
  return {
    clarityScore: 68,
    clarityVerdict: 'Attention is moderately distributed with two competing focal points reducing CTA prominence. (Set OPENAI_API_KEY for real AI analysis.)',
    hotspots: [
      { x: 50, y: 18, intensity: 92, elementDescription: 'Page headline', inFirstFiveSeconds: true },
      { x: 50, y: 45, intensity: 78, elementDescription: 'Hero image or main content', inFirstFiveSeconds: true },
      { x: 50, y: 65, intensity: 71, elementDescription: 'Primary CTA area', inFirstFiveSeconds: true },
      { x: 20, y: 8, intensity: 55, elementDescription: 'Logo / navigation brand', inFirstFiveSeconds: false },
      { x: 75, y: 8, intensity: 42, elementDescription: 'Navigation links', inFirstFiveSeconds: false },
      { x: 30, y: 75, intensity: 38, elementDescription: 'Supporting copy', inFirstFiveSeconds: false },
      { x: 70, y: 75, intensity: 31, elementDescription: 'Secondary element', inFirstFiveSeconds: false },
      { x: 50, y: 88, intensity: 18, elementDescription: 'Footer region', inFirstFiveSeconds: false },
    ],
    gazeFixations: [
      { order: 1, x: 50, y: 18, dwellTime: 1.4, elementDescription: 'Headline' },
      { order: 2, x: 20, y: 8, dwellTime: 0.5, elementDescription: 'Logo' },
      { order: 3, x: 50, y: 45, dwellTime: 1.1, elementDescription: 'Hero image' },
      { order: 4, x: 75, y: 8, dwellTime: 0.4, elementDescription: 'Navigation' },
      { order: 5, x: 50, y: 65, dwellTime: 0.9, elementDescription: 'Primary CTA' },
      { order: 6, x: 30, y: 75, dwellTime: 0.6, elementDescription: 'Supporting copy' },
    ],
    aiAnalysis: 'AI analysis requires OPENAI_API_KEY to be configured in .env.local. The placeholder heatmap above shows a typical attention distribution pattern. In a real analysis, this section would contain a 400-word UX diagnosis identifying attention conflicts, reading path issues, and specific design recommendations with measurements.',
    attentionConflicts: [
      {
        severity: 'high',
        element: 'Primary CTA button',
        problem: 'CTA falls below the top three fixation points, receiving attention only after the user has already scanned the headline, logo, and hero image.',
        principle: "Fitts's Law — target acquisition time increases with distance from the natural gaze entry point",
        recommendation: 'Move the primary CTA to within 40% of the viewport height from the top, directly adjacent to the headline. Increase button width to span at least 35% of the content column.',
      },
    ],
    regionReports: [],
  };
}

export async function runHeatmapAnalysis(
  screenshotBase64: string,
  mimeType: string,
  pageContext?: string,
  regionsOfInterest?: string[],
): Promise<Omit<HeatmapReport, 'id' | 'timestamp' | 'screenshotUrl'>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return placeholderReport();

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
              image_url: { url: `data:${mimeType};base64,${screenshotBase64}`, detail: 'high' },
            },
            { type: 'text', text: buildPrompt(pageContext, regionsOfInterest) },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw); } catch { return placeholderReport(); }

    return {
      clarityScore: (parsed.clarityScore as number) || 50,
      clarityVerdict: (parsed.clarityVerdict as string) || 'Analysis complete.',
      hotspots: (parsed.hotspots as AttentionHotspot[]) || [],
      gazeFixations: (parsed.gazeFixations as GazeFixation[]) || [],
      aiAnalysis: (parsed.aiAnalysis as string) || '',
      attentionConflicts: (parsed.attentionConflicts as AttentionConflict[]) || [],
      regionReports: (parsed.regionReports as RegionOfInterestReport[]) || [],
    };
  } catch (err) {
    console.error('Heatmap analysis error:', err);
    return placeholderReport();
  }
}
