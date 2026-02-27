// ─── Mobile UX Checker ────────────────────────────────────────────────────

import type { AuditIssue } from '../types';

interface MobileInfo {
    hasViewportMeta: boolean;
    viewportContent?: string;
    smallTouchTargets: number;     // elements < 44x44px that are interactive
    horizontalOverflow: boolean;
    textNotScalable: boolean;      // user-scalable=no or max-scale=1
    totalInteractiveElements: number;
}

export function checkMobile(info: MobileInfo): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (!info.hasViewportMeta) {
        issues.push({
            id: 'mobile-no-viewport',
            title: 'Missing viewport meta tag',
            category: 'mobile',
            severity: 'critical',
            description: 'No <meta name="viewport"> tag found. The page will not render correctly on mobile devices.',
            evidence: 'No viewport meta tag in <head>',
            impact: 'Mobile browsers will render the page at desktop width and scale it down, making text unreadable.',
            recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.',
            principle: 'Mobile-First Design',
        });
    }

    if (info.textNotScalable) {
        issues.push({
            id: 'mobile-no-zoom',
            title: 'Text zoom is disabled',
            category: 'mobile',
            severity: 'critical',
            description: 'The viewport meta tag prevents users from zooming (user-scalable=no or maximum-scale=1).',
            evidence: `Viewport content: ${info.viewportContent}`,
            impact: 'Users with low vision cannot zoom in to read small text, a WCAG failure.',
            recommendation: 'Remove user-scalable=no and maximum-scale=1 from the viewport meta tag.',
            principle: 'WCAG 1.4.4 Resize Text',
        });
    }

    if (info.smallTouchTargets > 0) {
        const pct = info.totalInteractiveElements > 0
            ? Math.round((info.smallTouchTargets / info.totalInteractiveElements) * 100)
            : 0;
        issues.push({
            id: 'mobile-small-targets',
            title: `${info.smallTouchTargets} touch target(s) are too small`,
            category: 'mobile',
            severity: info.smallTouchTargets > 5 ? 'critical' : 'major',
            description: `${info.smallTouchTargets} interactive elements (${pct}%) are smaller than the recommended 44×44px minimum.`,
            evidence: `${info.smallTouchTargets} of ${info.totalInteractiveElements} interactive elements are below 44×44px`,
            impact: 'Small touch targets are difficult to tap accurately, especially for users with motor impairments.',
            recommendation: 'Ensure all interactive elements (buttons, links, inputs) are at least 44×44px. Use padding to increase the tap area.',
            principle: "Fitts's Law",
        });
    }

    if (info.horizontalOverflow) {
        issues.push({
            id: 'mobile-horizontal-scroll',
            title: 'Page has horizontal overflow on mobile',
            category: 'mobile',
            severity: 'major',
            description: 'Content extends beyond the viewport width, causing horizontal scrolling on mobile.',
            evidence: 'Document width exceeds viewport width',
            impact: 'Horizontal scrolling on mobile is disorienting and makes content hard to access.',
            recommendation: 'Check for fixed-width elements, wide images, or content that does not respect viewport boundaries. Use max-width: 100% on images and overflow: hidden on containers.',
            principle: 'WCAG 1.4.10 Reflow',
        });
    }

    return issues;
}
