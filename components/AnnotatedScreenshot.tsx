'use client';

import { useRef, useState, useCallback } from 'react';
import styles from './AnnotatedScreenshot.module.css';
import type { AuditIssue } from '../lib/types';

interface AnnotatedScreenshotProps {
    screenshotUrl: string;
    issues: AuditIssue[];
    activeIssueId?: string | null;
    onIssueClick?: (issue: AuditIssue) => void;
}

export default function AnnotatedScreenshot({
    screenshotUrl,
    issues,
    activeIssueId,
    onIssueClick,
}: AnnotatedScreenshotProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const issuesWithRegions = issues.filter((i) => i.region);

    const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
    const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
    const handleReset = useCallback(() => setZoom(1), []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'rgba(239, 68, 68, 0.6)';
            case 'major': return 'rgba(245, 158, 11, 0.6)';
            default: return 'rgba(59, 130, 246, 0.6)';
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <span className={styles.toolbarLabel}>Screenshot Preview</span>
                <div className={styles.zoomControls}>
                    <button onClick={handleZoomOut} className={styles.zoomBtn} aria-label="Zoom out">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                    <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className={styles.zoomBtn} aria-label="Zoom in">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button onClick={handleReset} className={styles.zoomBtn} aria-label="Reset zoom">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.viewport} ref={containerRef}>
                <div
                    className={styles.canvas}
                    style={{ transform: `scale(${zoom})` }}
                >
                    <img
                        src={screenshotUrl}
                        alt="Analyzed webpage screenshot"
                        className={styles.screenshot}
                        draggable={false}
                    />

                    {issuesWithRegions.map((issue) => (
                        <div
                            key={issue.id}
                            className={`${styles.overlay} ${activeIssueId === issue.id ? styles.overlayActive : ''}`}
                            style={{
                                left: `${issue.region!.x}%`,
                                top: `${issue.region!.y}%`,
                                width: `${issue.region!.width}%`,
                                height: `${issue.region!.height}%`,
                                borderColor: getSeverityColor(issue.severity),
                                background: activeIssueId === issue.id || hoveredId === issue.id
                                    ? getSeverityColor(issue.severity).replace('0.6', '0.15')
                                    : 'transparent',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onIssueClick?.(issue);
                            }}
                            onMouseEnter={() => setHoveredId(issue.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Issue: ${issue.title}`}
                        >
                            {(hoveredId === issue.id || activeIssueId === issue.id) && (
                                <div className={styles.tooltip}>
                                    <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                                    {issue.title}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
