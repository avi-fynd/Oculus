// ─── Audit Orchestrator ───────────────────────────────────────────────────

import type { AuditIssue, AuditResult, CategoryScore, IssueCategory } from '../types';
import { checkContrast } from './contrast';
import { checkReadability } from './readability';
import { checkAccessibility } from './accessibility';
import { checkLayout } from './layout';
import { checkMobile } from './mobile';
import { checkNavigation } from './navigation';

function computeScore(issues: AuditIssue[]): number {
    let deductions = 0;
    issues.forEach((issue) => {
        switch (issue.severity) {
            case 'critical': deductions += 15; break;
            case 'major': deductions += 8; break;
            case 'minor': deductions += 3; break;
        }
    });
    return Math.max(0, Math.min(100, 100 - deductions));
}

function scoreToGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

function getCategoryScores(issues: AuditIssue[]): CategoryScore[] {
    const categories: IssueCategory[] = [
        'accessibility', 'readability', 'layout', 'mobile', 'navigation', 'contrast', 'ux-heuristic'
    ];

    const labels: Record<IssueCategory, string> = {
        accessibility: 'Accessibility',
        readability: 'Readability',
        layout: 'Layout',
        mobile: 'Mobile UX',
        navigation: 'Navigation',
        contrast: 'Contrast',
        'ux-heuristic': 'UX Heuristics',
    };

    return categories.map((cat) => {
        const catIssues = issues.filter((i) => i.category === cat);
        return {
            category: cat,
            label: labels[cat],
            score: computeScore(catIssues),
            issueCount: catIssues.length,
        };
    });
}

export interface DOMAnalysisData {
    html: string;
    // Extracted data for individual checkers
    colorPairs?: Array<{
        foreground: string;
        background: string;
        element: string;
        fontSize?: number;
        isBold?: boolean;
    }>;
    textElements?: Array<{
        element: string;
        fontSize: number;
        lineHeight: number;
        lineLength?: number;
    }>;
    domInfo?: {
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
    };
    layoutInfo?: {
        hasConsistentSpacing: boolean;
        spacingVariance: number;
        contentDensity: number;
        hasVisualHierarchy: boolean;
        alignmentIssues: string[];
        zIndexLayers: number;
    };
    mobileInfo?: {
        hasViewportMeta: boolean;
        viewportContent?: string;
        smallTouchTargets: number;
        horizontalOverflow: boolean;
        textNotScalable: boolean;
        totalInteractiveElements: number;
    };
    navInfo?: {
        hasNav: boolean;
        navLinkCount: number;
        hasBreadcrumbs: boolean;
        hasSearch: boolean;
        totalLinks: number;
        hasFooterNav: boolean;
        hasSitemap: boolean;
        logoLinksHome: boolean;
    };
}

export function runAudit(data: DOMAnalysisData): { issues: AuditIssue[]; score: number; grade: string; categoryScores: CategoryScore[] } {
    const allIssues: AuditIssue[] = [];

    if (data.colorPairs) {
        allIssues.push(...checkContrast(data.colorPairs));
    }

    if (data.textElements) {
        allIssues.push(...checkReadability(data.textElements));
    }

    if (data.domInfo) {
        allIssues.push(...checkAccessibility(data.domInfo));
    }

    if (data.layoutInfo) {
        allIssues.push(...checkLayout(data.layoutInfo));
    }

    if (data.mobileInfo) {
        allIssues.push(...checkMobile(data.mobileInfo));
    }

    if (data.navInfo) {
        allIssues.push(...checkNavigation(data.navInfo));
    }

    const score = computeScore(allIssues);
    const grade = scoreToGrade(score);
    const categoryScores = getCategoryScores(allIssues);

    return { issues: allIssues, score, grade, categoryScores };
}

export function buildResult(
    id: string,
    inputType: 'screenshot' | 'url',
    screenshotUrl: string,
    issues: AuditIssue[],
    aiIssues: AuditIssue[],
    summary: string,
    url?: string,
): AuditResult {
    const allIssues = [...issues, ...aiIssues];
    const score = computeScore(allIssues);
    const grade = scoreToGrade(score);
    const categoryScores = getCategoryScores(allIssues);

    return {
        id,
        timestamp: new Date().toISOString(),
        inputType,
        url,
        overallScore: score,
        grade,
        categoryScores,
        issues: allIssues,
        screenshotUrl,
        summary,
    };
}
