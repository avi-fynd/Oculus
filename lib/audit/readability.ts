// ─── Readability Checker ──────────────────────────────────────────────────

import type { AuditIssue } from '../types';

interface TextElement {
    element: string;
    fontSize: number;       // in px
    lineHeight: number;     // ratio (e.g. 1.5)
    lineLength?: number;    // chars per line (approx)
    fontFamily?: string;
}

export function checkReadability(elements: TextElement[]): AuditIssue[] {
    const issues: AuditIssue[] = [];

    elements.forEach((el, i) => {
        // Font size check — body text should be at least 16px
        if (el.fontSize < 16 && !el.element.toLowerCase().includes('caption') && !el.element.toLowerCase().includes('label')) {
            issues.push({
                id: `readability-fontsize-${i}`,
                title: `Small font size on ${el.element}`,
                category: 'readability',
                severity: el.fontSize < 12 ? 'critical' : 'major',
                description: `Text in "${el.element}" is ${el.fontSize}px. Body text should be at least 16px for comfortable reading.`,
                evidence: `Font size: ${el.fontSize}px`,
                impact: 'Small text increases cognitive load and is difficult to read on mobile devices.',
                recommendation: 'Increase the font size to at least 16px for body text. Use relative units (rem) for scalability.',
                principle: 'Readability Best Practice',
            });
        }

        // Line height check — should be at least 1.4 for body text
        if (el.lineHeight < 1.4 && el.fontSize >= 14) {
            issues.push({
                id: `readability-lineheight-${i}`,
                title: `Tight line spacing on ${el.element}`,
                category: 'readability',
                severity: el.lineHeight < 1.2 ? 'major' : 'minor',
                description: `Line height of ${el.lineHeight} on "${el.element}" is below the recommended 1.4–1.6 range.`,
                evidence: `Line height: ${el.lineHeight}, Font size: ${el.fontSize}px`,
                impact: 'Tight line spacing makes blocks of text harder to read, especially for users with dyslexia or low vision.',
                recommendation: 'Set line-height to 1.5 or higher for body text. WCAG recommends at least 1.5× the font size.',
                principle: 'WCAG 1.4.12 Text Spacing',
            });
        }

        // Line length check — optimal is 45–75 characters
        if (el.lineLength) {
            if (el.lineLength > 80) {
                issues.push({
                    id: `readability-linelength-long-${i}`,
                    title: `Wide text lines on ${el.element}`,
                    category: 'readability',
                    severity: el.lineLength > 100 ? 'major' : 'minor',
                    description: `Text lines in "${el.element}" are approximately ${el.lineLength} characters wide. Optimal reading length is 45–75 characters.`,
                    evidence: `Estimated line length: ~${el.lineLength} characters`,
                    impact: 'Long lines make it difficult for the eye to track back to the start of the next line.',
                    recommendation: 'Limit the text container width to achieve 45–75 characters per line. Use max-width on text containers.',
                    principle: 'Readability Best Practice',
                });
            } else if (el.lineLength < 30) {
                issues.push({
                    id: `readability-linelength-short-${i}`,
                    title: `Narrow text lines on ${el.element}`,
                    category: 'readability',
                    severity: 'minor',
                    description: `Text lines in "${el.element}" are approximately ${el.lineLength} characters wide, which is too narrow for comfortable reading.`,
                    evidence: `Estimated line length: ~${el.lineLength} characters`,
                    impact: 'Very short lines create an uneven reading rhythm with too many line breaks.',
                    recommendation: 'Widen the text container to achieve at least 45 characters per line.',
                    principle: 'Readability Best Practice',
                });
            }
        }
    });

    return issues;
}
