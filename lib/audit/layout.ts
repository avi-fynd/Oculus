// ─── Layout Analysis ──────────────────────────────────────────────────────

import type { AuditIssue } from '../types';

interface LayoutInfo {
    hasConsistentSpacing: boolean;
    spacingVariance: number; // 0–1, where 0 = perfect consistency
    contentDensity: number;  // elements per 1000px²
    hasVisualHierarchy: boolean;
    alignmentIssues: string[];
    zIndexLayers: number;
}

export function checkLayout(layout: LayoutInfo): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (layout.spacingVariance > 0.4) {
        issues.push({
            id: 'layout-inconsistent-spacing',
            title: 'Inconsistent spacing throughout the page',
            category: 'Visual Hierarchy',
            severity: layout.spacingVariance > 0.6 ? 'high' : 'minor',
            description: `Spacing between elements varies significantly (variance: ${(layout.spacingVariance * 100).toFixed(0)}%). Consistent spacing creates visual rhythm and improves scanability.`,
            evidence: `Spacing variance score: ${(layout.spacingVariance * 100).toFixed(0)}%`,
            impact: 'Inconsistent spacing makes the layout feel unpolished and harder to scan.',
            recommendation: 'Use a consistent spacing scale (e.g., 4px, 8px, 16px, 24px, 32px) throughout the design. Define spacing tokens and apply them consistently.',
            principle: 'Gestalt Principle of Proximity',
        });
    }

    if (layout.contentDensity > 8) {
        issues.push({
            id: 'layout-high-density',
            title: 'Content is too densely packed',
            category: 'Visual Hierarchy',
            severity: layout.contentDensity > 12 ? 'high' : 'minor',
            description: `The page has a high content density (${layout.contentDensity.toFixed(1)} elements per 1000px²). This can overwhelm users.`,
            evidence: `Content density: ${layout.contentDensity.toFixed(1)} elements/1000px²`,
            impact: 'High density increases cognitive load and makes it difficult for users to focus on important content.',
            recommendation: 'Increase whitespace between sections. Consider progressive disclosure or collapsible sections to reduce visible complexity.',
            principle: "Hick's Law — Cognitive Load",
        });
    }

    if (!layout.hasVisualHierarchy) {
        issues.push({
            id: 'layout-no-hierarchy',
            title: 'Weak visual hierarchy',
            category: 'Visual Hierarchy',
            severity: 'high',
            description: 'The page lacks clear visual hierarchy. Elements appear to have similar visual weight, making it hard to identify what is most important.',
            evidence: 'No clear size/color/weight differentiation between primary and secondary content.',
            impact: 'Users cannot quickly identify the most important content or calls to action.',
            recommendation: 'Use size, color, weight, and spacing to create clear visual hierarchy. Make primary CTAs visually prominent. Use larger headings and distinct section styles.',
            principle: 'Visual Hierarchy',
        });
    }

    layout.alignmentIssues.forEach((issue, i) => {
        issues.push({
            id: `layout-alignment-${i}`,
            title: `Alignment issue: ${issue}`,
            category: 'Visual Hierarchy',
            severity: 'minor',
            description: `Elements appear misaligned: ${issue}`,
            evidence: issue,
            impact: 'Misalignment creates a sense of disorder and reduces perceived quality.',
            recommendation: 'Use a grid system or consistent alignment anchors. Ensure elements within the same section share alignment edges.',
            principle: 'Gestalt Principle of Alignment',
        });
    });

    return issues;
}
