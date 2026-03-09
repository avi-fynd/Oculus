// ─── Accessibility Checker ────────────────────────────────────────────────

import type { AuditIssue } from '../types';

interface DOMInfo {
    html: string;
    imagesWithoutAlt: number;
    inputsWithoutLabels: number;
    headingLevels: number[];
    hasSkipLink: boolean;
    hasMainLandmark: boolean;
    hasNavLandmark: boolean;
    formCount: number;
    buttonCount: number;
    linkCount: number;
    ariaLabelsCount: number;
}

export function checkAccessibility(dom: DOMInfo): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Missing alt text
    if (dom.imagesWithoutAlt > 0) {
        issues.push({
            id: 'a11y-missing-alt',
            title: `${dom.imagesWithoutAlt} image(s) missing alt text`,
            category: 'Accessibility',
            severity: dom.imagesWithoutAlt > 3 ? 'high' : 'medium',
            description: `Found ${dom.imagesWithoutAlt} images without alt attributes. Screen readers cannot describe these images to users.`,
            evidence: `${dom.imagesWithoutAlt} <img> elements missing alt attribute`,
            impact: 'Screen reader users will not understand the content or purpose of these images.',
            recommendation: 'Add descriptive alt text to all meaningful images. Use alt="" for decorative images.',
            principle: 'WCAG 1.1.1 Non-text Content',
        });
    }

    // Missing form labels
    if (dom.inputsWithoutLabels > 0) {
        issues.push({
            id: 'a11y-missing-labels',
            title: `${dom.inputsWithoutLabels} form input(s) missing labels`,
            category: 'Accessibility',
            severity: 'critical',
            description: `Found ${dom.inputsWithoutLabels} form inputs without associated labels.`,
            evidence: `${dom.inputsWithoutLabels} <input>/<select>/<textarea> elements without <label>`,
            impact: 'Users relying on assistive technology cannot identify what information is required.',
            recommendation: 'Associate each form input with a <label> element using the "for" attribute, or use aria-label.',
            principle: 'WCAG 1.3.1 Info and Relationships',
        });
    }

    // Heading hierarchy
    if (dom.headingLevels.length > 0) {
        const sorted = [...dom.headingLevels].sort((a, b) => a - b);
        // Check for missing h1
        if (!dom.headingLevels.includes(1)) {
            issues.push({
                id: 'a11y-no-h1',
                title: 'Page is missing an H1 heading',
                category: 'Accessibility',
                severity: 'high',
                description: 'No <h1> element was found. Each page should have exactly one <h1> heading.',
                evidence: `Heading levels found: ${[...new Set(dom.headingLevels)].sort().map(h => `h${h}`).join(', ')}`,
                impact: 'Screen reader users and search engines rely on <h1> to understand the main topic.',
                recommendation: 'Add a single <h1> that describes the main content of the page.',
                principle: 'WCAG 1.3.1 Info and Relationships',
            });
        }

        // Check for skipped levels
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i - 1] > 1) {
                issues.push({
                    id: `a11y-heading-skip-${i}`,
                    title: 'Heading levels are skipped',
                    category: 'Accessibility',
                    severity: 'minor',
                    description: `Heading hierarchy jumps from h${sorted[i - 1]} to h${sorted[i]}, skipping levels.`,
                    evidence: `Heading sequence: ${sorted.map(h => `h${h}`).join(' → ')}`,
                    impact: 'Screen reader users navigating by headings may miss content sections.',
                    recommendation: 'Ensure headings follow a logical order without skipping levels.',
                    principle: 'WCAG 1.3.1 Info and Relationships',
                });
                break;
            }
        }
    }

    // Missing skip link
    if (!dom.hasSkipLink) {
        issues.push({
            id: 'a11y-no-skip-link',
            title: 'No skip navigation link found',
            category: 'Accessibility',
            severity: 'minor',
            description: 'The page does not have a "skip to main content" link.',
            evidence: 'No anchor link targeting #main-content or similar found at the top of the page.',
            impact: 'Keyboard users must tab through all navigation items to reach main content.',
            recommendation: 'Add a visually hidden "Skip to main content" link as the first focusable element.',
            principle: 'WCAG 2.4.1 Bypass Blocks',
        });
    }

    // Missing landmarks
    if (!dom.hasMainLandmark) {
        issues.push({
            id: 'a11y-no-main-landmark',
            title: 'Missing <main> landmark',
            category: 'Accessibility',
            severity: 'high',
            description: 'No <main> element or role="main" was found.',
            evidence: 'Document structure is missing a main landmark region.',
            impact: 'Screen reader users cannot quickly navigate to the primary content.',
            recommendation: 'Wrap the primary page content in a <main> element.',
            principle: 'WCAG 1.3.1 Info and Relationships',
        });
    }

    if (!dom.hasNavLandmark && dom.linkCount > 5) {
        issues.push({
            id: 'a11y-no-nav-landmark',
            title: 'Missing <nav> landmark',
            category: 'Accessibility',
            severity: 'minor',
            description: 'The page has multiple links but no <nav> landmark to identify the navigation area.',
            evidence: `${dom.linkCount} links found but no <nav> element`,
            impact: 'Screen reader users cannot quickly identify and jump to site navigation.',
            recommendation: 'Wrap the main navigation links in a <nav> element.',
            principle: 'WCAG 1.3.1 Info and Relationships',
        });
    }

    return issues;
}
