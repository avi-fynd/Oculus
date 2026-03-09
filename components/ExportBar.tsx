'use client';

import styles from './ExportBar.module.css';
import type { AuditResult } from '../lib/types';

interface ExportBarProps {
    result: AuditResult;
    mode?: 'card' | 'inline';
}

export default function ExportBar({ result, mode = 'card' }: ExportBarProps) {
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

    const handleDownloadPDF = async () => {
        // We will wrap the ResultsSection in a div with id="audit-report-container" inside page.tsx
        const { generatePDF } = await import('../lib/pdf-export');
        await generatePDF('audit-report-container', `oculus-ux-audit-${result.id}.pdf`);
    };

    const btnBase: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '6px', border: '1px solid var(--bg-border)',
        fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer',
        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
    };

    const buttons = (
        <>
            <button onClick={handleDownloadPDF} style={{ ...btnBase, background: 'var(--brand-primary)', color: '#fff', border: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 11v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="8" y1="11" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download PDF
            </button>
            <button onClick={handleDownloadJSON} style={btnBase}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 10V13H13V10M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Export JSON
            </button>
            <button onClick={handleCopyLink} style={btnBase}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6.5 9.5L9.5 6.5M7 11L5 13C4 14 2 14 1.5 13.5C1 13 1 11 2 10L4 8M9 5L11 3C12 2 14 2 14.5 2.5C15 3 15 5 14 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Copy Link
            </button>
        </>
    );

    if (mode === 'inline') {
        return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {buttons}
            </div>
        );
    }

    return (
        <div className={styles.bar}>
            {buttons}
        </div>
    );
}
