'use client';

import { useState, useMemo } from 'react';
import styles from './IssueList.module.css';
import type { AuditIssue, IssueCategory, Severity } from '../lib/types';

interface IssueListProps {
    issues: AuditIssue[];
    onIssueClick?: (issue: AuditIssue) => void;
    activeIssueId?: string | null;
}

const CATEGORY_LABELS: Record<IssueCategory, string> = {
    accessibility: 'Accessibility',
    readability: 'Readability',
    layout: 'Layout',
    mobile: 'Mobile',
    navigation: 'Navigation',
    contrast: 'Contrast',
    'ux-heuristic': 'UX Heuristics',
};

const SEVERITY_ORDER: Record<Severity, number> = {
    critical: 0,
    major: 1,
    minor: 2,
};

export default function IssueList({ issues, onIssueClick, activeIssueId }: IssueListProps) {
    const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');
    const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredIssues = useMemo(() => {
        return issues
            .filter((i) => categoryFilter === 'all' || i.category === categoryFilter)
            .filter((i) => severityFilter === 'all' || i.severity === severityFilter)
            .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    }, [issues, categoryFilter, severityFilter]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        issues.forEach((i) => {
            counts[i.category] = (counts[i.category] || 0) + 1;
        });
        return counts;
    }, [issues]);

    return (
        <section className={styles.issueList} aria-labelledby="issues-heading">
            <div className={styles.header}>
                <h2 id="issues-heading" className={styles.title}>
                    Issues Found
                    <span className={styles.count}>{filteredIssues.length}</span>
                </h2>
            </div>

            <div className={styles.filters} role="toolbar" aria-label="Filter issues">
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Category</label>
                    <div className={styles.filterChips}>
                        <button
                            className={`${styles.chip} ${categoryFilter === 'all' ? styles.chipActive : ''}`}
                            onClick={() => setCategoryFilter('all')}
                        >All</button>
                        {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((cat) => (
                            categoryCounts[cat] ? (
                                <button
                                    key={cat}
                                    className={`${styles.chip} ${categoryFilter === cat ? styles.chipActive : ''}`}
                                    onClick={() => setCategoryFilter(cat)}
                                >
                                    {CATEGORY_LABELS[cat]}
                                    <span className={styles.chipCount}>{categoryCounts[cat]}</span>
                                </button>
                            ) : null
                        ))}
                    </div>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Severity</label>
                    <div className={styles.filterChips}>
                        <button
                            className={`${styles.chip} ${severityFilter === 'all' ? styles.chipActive : ''}`}
                            onClick={() => setSeverityFilter('all')}
                        >All</button>
                        {(['critical', 'major', 'minor'] as Severity[]).map((sev) => (
                            <button
                                key={sev}
                                className={`${styles.chip} ${styles[`chip_${sev}`]} ${severityFilter === sev ? styles.chipActive : ''}`}
                                onClick={() => setSeverityFilter(sev)}
                            >{sev}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.list}>
                {filteredIssues.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No issues match the current filters.</p>
                    </div>
                ) : (
                    filteredIssues.map((issue) => (
                        <article
                            key={issue.id}
                            className={`${styles.issueCard} ${activeIssueId === issue.id ? styles.active : ''} ${expandedId === issue.id ? styles.expanded : ''}`}
                            onClick={() => {
                                onIssueClick?.(issue);
                                setExpandedId(expandedId === issue.id ? null : issue.id);
                            }}
                            role="button"
                            tabIndex={0}
                            aria-expanded={expandedId === issue.id}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onIssueClick?.(issue);
                                    setExpandedId(expandedId === issue.id ? null : issue.id);
                                }
                            }}
                        >
                            <div className={styles.issueHeader}>
                                <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                                <h3 className={styles.issueTitle}>{issue.title}</h3>
                                <span className={styles.issueCat}>{CATEGORY_LABELS[issue.category]}</span>
                                <svg
                                    className={`${styles.chevron} ${expandedId === issue.id ? styles.chevronOpen : ''}`}
                                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                                >
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {expandedId === issue.id && (
                                <div className={styles.issueBody}>
                                    <p className={styles.issueDesc}>{issue.description}</p>

                                    <div className={styles.issueDetail}>
                                        <h4>Evidence</h4>
                                        <p>{issue.evidence}</p>
                                    </div>

                                    <div className={styles.issueDetail}>
                                        <h4>Impact</h4>
                                        <p>{issue.impact}</p>
                                    </div>

                                    <div className={styles.issueDetail}>
                                        <h4>Recommendation</h4>
                                        <p>{issue.recommendation}</p>
                                    </div>

                                    {issue.principle && (
                                        <div className={styles.principle}>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                            </svg>
                                            {issue.principle}
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}
