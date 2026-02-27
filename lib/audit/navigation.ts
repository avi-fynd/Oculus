// ─── Navigation Checker ───────────────────────────────────────────────────

import type { AuditIssue } from '../types';

interface NavigationInfo {
    hasNav: boolean;
    navLinkCount: number;
    hasBreadcrumbs: boolean;
    hasSearch: boolean;
    totalLinks: number;
    hasFooterNav: boolean;
    hasSitemap: boolean;
    logoLinksHome: boolean;
}

export function checkNavigation(info: NavigationInfo): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Hick's Law — too many navigation items
    if (info.navLinkCount > 7) {
        issues.push({
            id: 'nav-too-many-items',
            title: `Navigation has ${info.navLinkCount} items (too many)`,
            category: 'navigation',
            severity: info.navLinkCount > 10 ? 'major' : 'minor',
            description: `The main navigation has ${info.navLinkCount} items. Research shows that 5–7 items is optimal for decision-making.`,
            evidence: `${info.navLinkCount} links in the primary navigation`,
            impact: "Too many navigation choices increase decision time (Hick's Law) and cognitive load.",
            recommendation: "Reduce navigation items to 5–7. Use dropdown menus or mega-menus for subcategories. Consider card sorting to optimize information architecture.",
            principle: "Hick's Law",
        });
    }

    if (!info.hasNav) {
        issues.push({
            id: 'nav-missing',
            title: 'No clear navigation structure found',
            category: 'navigation',
            severity: 'critical',
            description: 'No identifiable navigation area was detected on the page.',
            evidence: 'No <nav> element or navigation pattern detected',
            impact: 'Users cannot find their way around the site, leading to high bounce rates.',
            recommendation: 'Add a clear, prominent navigation bar with links to key sections.',
            principle: "Jakob's Law",
        });
    }

    if (!info.hasBreadcrumbs && info.totalLinks > 20) {
        issues.push({
            id: 'nav-no-breadcrumbs',
            title: 'No breadcrumb navigation on a complex page',
            category: 'navigation',
            severity: 'minor',
            description: 'The page has many links but no breadcrumb trail to help users understand their location.',
            evidence: `${info.totalLinks} links found with no breadcrumb pattern`,
            impact: 'Users may feel lost within a deep site structure.',
            recommendation: 'Add breadcrumb navigation for pages deeper than the homepage.',
            principle: 'Cognitive Load Reduction',
        });
    }

    if (!info.hasSearch && info.totalLinks > 30) {
        issues.push({
            id: 'nav-no-search',
            title: 'No search functionality on a content-heavy page',
            category: 'navigation',
            severity: 'minor',
            description: 'The page has extensive content but no visible search feature.',
            evidence: `${info.totalLinks} links found with no search input detected`,
            impact: 'Users who know what they are looking for cannot quickly find it.',
            recommendation: 'Add a prominent search field to help users find content quickly.',
            principle: 'Recognition over Recall',
        });
    }

    return issues;
}
