'use client';

import styles from './ResultsSummary.module.css';
import type { AuditResult, CategoryScore } from '../lib/types';

interface ResultsSummaryProps {
    result: AuditResult;
}

function getGradeColor(grade: string): string {
    switch (grade) {
        case 'A': return 'var(--color-success)';
        case 'B': return '#22d3ee';
        case 'C': return 'var(--color-warning)';
        case 'D': return '#fb923c';
        default: return 'var(--color-error)';
    }
}

function getCategoryColor(score: number): string {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 80) return '#fb923c'; // Orange
    if (score >= 70) return '#facc15'; // Yellow
    return '#ef4444'; // Red
}

function getCategoryLabel(cat: string): string {
    return cat;
}

export default function ResultsSummary({ result }: ResultsSummaryProps) {
    const topIssues = result.issues
        .filter((i) => i.severity === 'critical')
        .slice(0, 3);

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (result.overallScore / 100) * circumference;

    return (
        <section className={styles.summary} aria-labelledby="audit-summary">
            <h2 id="audit-summary" className="sr-only">Audit Summary</h2>

            <div className={styles.scoreSection}>
                <div className={styles.scoreRing}>
                    <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                        <circle
                            cx="60" cy="60" r="54"
                            fill="none"
                            stroke={getGradeColor(result.grade)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={styles.scoreArc}
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className={styles.scoreValue}>
                        <span className={styles.scoreNum}>{result.overallScore}</span>
                        <span className={styles.scoreLabel}>/ 100</span>
                    </div>
                </div>
                <div
                    className={styles.gradeBadge}
                    style={{ background: getGradeColor(result.grade) }}
                >
                    Grade {result.grade}
                </div>
            </div>

            <div className={styles.breakdown}>
                <h3 className={styles.breakdownTitle}>Category Scores</h3>
                <div className={styles.bars}>
                    {result.categoryScores.map((cs: CategoryScore) => (
                        <div key={cs.category} className={styles.barRow}>
                            <div className={styles.barLabel}>
                                <span
                                    className={styles.barDot}
                                    style={{ background: getCategoryColor(cs.score) }}
                                />
                                <span>{getCategoryLabel(cs.category)}</span>
                                <span className={styles.barIssueCount}>
                                    {cs.issueCount} issue{cs.issueCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className={styles.barTrack}>
                                <div
                                    className={styles.barFill}
                                    style={{
                                        width: `${cs.score}%`,
                                        background: getCategoryColor(cs.score),
                                    }}
                                />
                            </div>
                            <span className={styles.barScore}>{cs.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            {topIssues.length > 0 && (
                <div className={styles.topIssues}>
                    <h3 className={styles.topIssuesTitle}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 2L16 15H2L9 2Z" stroke="var(--color-critical)" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M9 7V10M9 12.5V13" stroke="var(--color-critical)" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Top Critical Issues
                    </h3>
                    {topIssues.map((issue) => (
                        <div key={issue.id} className={styles.topIssueCard}>
                            <span className={`badge badge-${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                            <div>
                                <p className={styles.topIssueTitle}>{issue.title}</p>
                                <p className={styles.topIssueDesc}>{issue.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className={styles.summaryText}>{result.summary}</p>
        </section>
    );
}
