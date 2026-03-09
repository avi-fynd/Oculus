// ─── Contrast Ratio Checker (WCAG) ────────────────────────────────────────

import type { AuditIssue } from '../types';

interface ColorPair {
    foreground: string;
    background: string;
    element: string;
    fontSize?: number;
    isBold?: boolean;
}

function hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function parseColor(color: string): [number, number, number] | null {
    // Handle hex
    if (color.startsWith('#')) return hexToRgb(color);

    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];

    return null;
}

function relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(color1: string, color2: string): number | null {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    if (!rgb1 || !rgb2) return null;

    const l1 = relativeLuminance(...rgb1);
    const l2 = relativeLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(colorPairs: ColorPair[]): AuditIssue[] {
    const issues: AuditIssue[] = [];

    colorPairs.forEach((pair, i) => {
        const ratio = contrastRatio(pair.foreground, pair.background);
        if (ratio === null) return;

        const isLargeText = (pair.fontSize && pair.fontSize >= 18) ||
            (pair.fontSize && pair.fontSize >= 14 && pair.isBold);
        const aaThreshold = isLargeText ? 3 : 4.5;
        const aaaThreshold = isLargeText ? 4.5 : 7;

        if (ratio < aaThreshold) {
            issues.push({
                id: `contrast-fail-aa-${i}`,
                title: `Low contrast ratio on ${pair.element}`,
                category: 'Readability',
                severity: ratio < 2 ? 'critical' : 'high',
                description: `The text on "${pair.element}" has a contrast ratio of ${ratio.toFixed(2)}:1, which fails WCAG AA (minimum ${aaThreshold}:1).`,
                evidence: `Foreground: ${pair.foreground}, Background: ${pair.background}, Ratio: ${ratio.toFixed(2)}:1`,
                impact: 'Users with low vision or color blindness may not be able to read this content.',
                recommendation: `Increase the contrast ratio to at least ${aaThreshold}:1 for WCAG AA compliance. Consider using a darker text color or lighter background.`,
                principle: 'WCAG 1.4.3 Contrast (Minimum)',
            });
        } else if (ratio < aaaThreshold) {
            issues.push({
                id: `contrast-fail-aaa-${i}`,
                title: `Suboptimal contrast on ${pair.element}`,
                category: 'Readability',
                severity: 'minor',
                description: `The contrast ratio of ${ratio.toFixed(2)}:1 passes WCAG AA but fails AAA (${aaaThreshold}:1).`,
                evidence: `Foreground: ${pair.foreground}, Background: ${pair.background}, Ratio: ${ratio.toFixed(2)}:1`,
                impact: 'Some users may still find this text difficult to read in certain lighting conditions.',
                recommendation: `For enhanced accessibility, increase contrast to ${aaaThreshold}:1 (WCAG AAA).`,
                principle: 'WCAG 1.4.6 Contrast (Enhanced)',
            });
        }
    });

    return issues;
}
