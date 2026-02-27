'use client';

import styles from './ExportBar.module.css';
import type { AuditResult } from '../lib/types';

interface ExportBarProps {
    result: AuditResult;
}

export default function ExportBar({ result }: ExportBarProps) {
    const handleDownloadJSON = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oculus-audit-${result.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyLink = async () => {
        const data = btoa(JSON.stringify({ id: result.id, score: result.overallScore, grade: result.grade }));
        const url = `${window.location.origin}/results?data=${data}`;
        try {
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        } catch {
            prompt('Copy this link:', url);
        }
    };

    return (
        <div className={styles.bar}>
            <button onClick={handleDownloadJSON} className="btn btn-secondary btn-sm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 10V13H13V10M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Export JSON
            </button>
            <button onClick={handleCopyLink} className="btn btn-secondary btn-sm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.5 9.5L9.5 6.5M7 11L5 13C4 14 2 14 1.5 13.5C1 13 1 11 2 10L4 8M9 5L11 3C12 2 14 2 14.5 2.5C15 3 15 5 14 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Copy Link
            </button>
        </div>
    );
}
