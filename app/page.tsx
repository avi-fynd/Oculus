'use client';

import { useState, useCallback } from 'react';
import UploadZone from '../components/UploadZone';
import UrlInput from '../components/UrlInput';
import ProgressStepper from '../components/ProgressStepper';
import ResultsSummary from '../components/ResultsSummary';
import IssueList from '../components/IssueList';
import AnnotatedScreenshot from '../components/AnnotatedScreenshot';
import ExportBar from '../components/ExportBar';
import type { AuditResult, AuditIssue } from '../lib/types';
import styles from './page.module.css';

type InputMode = 'upload' | 'url';
type AppState = 'input' | 'analyzing' | 'results' | 'error';

interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

const INITIAL_STEPS: ProgressStep[] = [
  { label: 'Capturing page', status: 'pending' },
  { label: 'Extracting structure', status: 'pending' },
  { label: 'Checking accessibility', status: 'pending' },
  { label: 'Running UX heuristics', status: 'pending' },
  { label: 'Generating recommendations', status: 'pending' },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [appState, setAppState] = useState<AppState>('input');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [steps, setSteps] = useState<ProgressStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze =
    (inputMode === 'upload' && file !== null) ||
    (inputMode === 'url' && url.length > 0 && (() => { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } })());

  const advanceStep = useCallback((stepIndex: number, totalSteps: ProgressStep[]) => {
    setSteps(totalSteps.map((s, i) => ({
      ...s,
      status: i < stepIndex ? 'complete' : i === stepIndex ? 'active' : 'pending',
    })));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setAppState('analyzing');
    setError(null);
    const currentSteps = [...INITIAL_STEPS];

    try {
      // Step 1: Capturing
      advanceStep(0, currentSteps);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Extracting
      advanceStep(1, currentSteps);

      const formData = new FormData();
      if (inputMode === 'upload' && file) {
        formData.append('screenshot', file);
        formData.append('inputType', 'screenshot');
      } else if (inputMode === 'url') {
        formData.append('url', url);
        formData.append('inputType', 'url');
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData.error || 'Analysis failed');
      }

      // Step 3: Checking accessibility
      advanceStep(2, currentSteps);
      await new Promise((r) => setTimeout(r, 400));

      // Step 4: Running UX heuristics
      advanceStep(3, currentSteps);
      await new Promise((r) => setTimeout(r, 400));

      const data: AuditResult = await response.json();

      // Step 5: Generating recommendations (complete)
      advanceStep(4, currentSteps);
      await new Promise((r) => setTimeout(r, 300));

      setSteps(currentSteps.map((s) => ({ ...s, status: 'complete' as const })));
      await new Promise((r) => setTimeout(r, 500));

      setResult(data);
      setAppState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setSteps(currentSteps.map((s, i) => ({
        ...s,
        status: s.status === 'active' ? 'error' : s.status,
      })));
      setAppState('error');
    }
  }, [inputMode, file, url, advanceStep]);

  const handleIssueClick = useCallback((issue: AuditIssue) => {
    setActiveIssueId((prev) => (prev === issue.id ? null : issue.id));
  }, []);

  const handleReset = useCallback(() => {
    setAppState('input');
    setFile(null);
    setUrl('');
    setSteps(INITIAL_STEPS);
    setResult(null);
    setActiveIssueId(null);
    setError(null);
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero / Landing */}
      {appState === 'input' && (
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="7" cy="7" r="2.5" fill="currentColor" />
              </svg>
              AI-Powered UX Analysis
            </div>
            <h1 className={styles.heroTitle}>
              Spot every UX flaw.<br />
              <span className={styles.heroGradient}>Instantly.</span>
            </h1>
            <p className={styles.heroSub}>
              Upload a screenshot or paste a URL. Get an instant UX audit with
              evidence-backed issues and actionable fixes.
            </p>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.tabBar} role="tablist">
              <button
                role="tab"
                aria-selected={inputMode === 'upload'}
                className={`${styles.tab} ${inputMode === 'upload' ? styles.tabActive : ''}`}
                onClick={() => setInputMode('upload')}
                id="tab-upload"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M2 13L6 9L8 11L12 7L16 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload Screenshot
              </button>
              <button
                role="tab"
                aria-selected={inputMode === 'url'}
                className={`${styles.tab} ${inputMode === 'url' ? styles.tabActive : ''}`}
                onClick={() => setInputMode('url')}
                id="tab-url"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 9H16M9 2C11 4 12 6.5 12 9C12 11.5 11 14 9 16M9 2C7 4 6 6.5 6 9C6 11.5 7 14 9 16" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Enter URL
              </button>
            </div>

            <div className={styles.inputPanel} role="tabpanel">
              {inputMode === 'upload' ? (
                <UploadZone
                  onFileSelect={setFile}
                  selectedFile={file}
                  onClear={() => setFile(null)}
                />
              ) : (
                <UrlInput
                  onUrlSubmit={() => canAnalyze && handleAnalyze()}
                  url={url}
                  onUrlChange={setUrl}
                />
              )}
            </div>

            <button
              className={`btn btn-primary btn-lg ${styles.analyzeBtn}`}
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              id="analyze-button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Analyze UX
            </button>
          </div>

          {/* Floating orbs animation */}
          <div className={styles.orb1} aria-hidden="true" />
          <div className={styles.orb2} aria-hidden="true" />
          <div className={styles.orb3} aria-hidden="true" />
        </section>
      )}

      {/* Analysis Progress */}
      {appState === 'analyzing' && (
        <section className={styles.progressSection}>
          <div className={styles.progressContent}>
            <h2 className={styles.progressTitle}>Analyzing your design…</h2>
            <p className={styles.progressSub}>
              Our AI is inspecting accessibility, readability, layout, and UX best practices.
            </p>
            <ProgressStepper steps={steps} />
          </div>
        </section>
      )}

      {/* Error */}
      {appState === 'error' && (
        <section className={styles.errorSection}>
          <div className={styles.errorContent}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="var(--color-error)" strokeWidth="2" />
              <path d="M24 16V28M24 32V33" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h2>Analysis Failed</h2>
            <p className={styles.errorMsg}>{error}</p>
            <ProgressStepper steps={steps} />
            <button className="btn btn-primary" onClick={handleReset}>
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* Results */}
      {appState === 'results' && result && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Audit
            </button>
            <h1 className={styles.resultsTitle}>UX Audit Results</h1>
            {result.url && (
              <a href={result.url} target="_blank" rel="noopener noreferrer" className={styles.resultsUrl}>
                {result.url}
              </a>
            )}
          </div>

          <div className={styles.resultsGrid}>
            <div className={styles.resultsLeft}>
              <ResultsSummary result={result} />
              <ExportBar result={result} />
            </div>
            <div className={styles.resultsRight}>
              <AnnotatedScreenshot
                screenshotUrl={result.screenshotUrl}
                issues={result.issues}
                activeIssueId={activeIssueId}
                onIssueClick={handleIssueClick}
              />
            </div>
          </div>

          <IssueList
            issues={result.issues}
            onIssueClick={handleIssueClick}
            activeIssueId={activeIssueId}
          />
        </section>
      )}
    </div>
  );
}
