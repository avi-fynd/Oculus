'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import UrlInput from '@/components/UrlInput'
import ProgressStepper from '@/components/ProgressStepper'
import ScanningPreview from '@/components/ScanningPreview'
import ResultsSummary from '@/components/ResultsSummary'
import IssueList from '@/components/IssueList'
import AnnotatedScreenshot from '@/components/AnnotatedScreenshot'
import ExportBar from '@/components/ExportBar'
import type { AuditResult, AuditIssue } from '@/lib/types'
import { saveAuditToLocalHistory } from '@/lib/local-history'

type AppState = 'input' | 'analyzing' | 'results' | 'error'

type StepStatus = 'pending' | 'active' | 'complete' | 'error'
interface Step { label: string; status: StepStatus }

const INITIAL_STEPS: Step[] = [
  { label: 'Capturing page', status: 'pending' },
  { label: 'Extracting structure', status: 'pending' },
  { label: 'Checking accessibility', status: 'pending' },
  { label: 'Running UX heuristics', status: 'pending' },
  { label: 'Generating recommendations', status: 'pending' },
]

export default function WebsiteAuditPage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [capturedImgUrl, setCapturedImgUrl] = useState('')

  const setStep = (idx: number, status: 'pending' | 'active' | 'complete' | 'error') => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))
  }

  const handleAnalyze = async (targetUrl: string) => {
    setAppState('analyzing')
    setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })))

    try {
      // Step 1+2: Capture page
      const captureForm = new FormData()
      captureForm.append('url', targetUrl)

      const captureRes = await fetch('/api/capture', { method: 'POST', body: captureForm })

      if (!captureRes.ok) {
        const err = await captureRes.json()
        throw new Error(err.error || 'Failed to capture URL')
      }

      const captureData = await captureRes.json()
      setCapturedImgUrl(captureData.screenshotDataUrl || '')

      setStep(0, 'complete')
      setStep(1, 'active')
      await new Promise(r => setTimeout(r, 200))
      setStep(1, 'complete')
      setStep(2, 'active')

      // Step 3+4+5: Run AI analysis with captured data
      const analyzeForm = new FormData()
      analyzeForm.append('inputType', 'url')
      analyzeForm.append('url', targetUrl)
      analyzeForm.append('screenshotBase64', captureData.screenshotBase64)
      analyzeForm.append('screenshotDataUrl', captureData.screenshotDataUrl)
      if (captureData.domSummary) analyzeForm.append('domSummary', captureData.domSummary)
      if (captureData.programmaticIssues) {
        analyzeForm.append('programmaticIssues', JSON.stringify(captureData.programmaticIssues))
      }

      const analyzeRes = await fetch('/api/analyze', { method: 'POST', body: analyzeForm })

      setStep(2, 'complete')
      setStep(3, 'active')
      await new Promise(r => setTimeout(r, 300))
      setStep(3, 'complete')
      setStep(4, 'active')

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: AuditResult = await analyzeRes.json()
      setStep(4, 'complete')
      setResult(data)
      setAppState('results')

      // Save to local history + Supabase (best-effort)
      const historyRecord = {
        audit_type: 'website_audit',
        title: targetUrl,
        url: targetUrl,
        overall_score: data.overallScore,
        total_issues: data.issues.length,
        critical_count: data.issues.filter(i => i.severity === 'critical').length,
        high_count: data.issues.filter(i => i.severity === 'high').length,
        medium_count: data.issues.filter(i => i.severity === 'medium').length,
        minor_count: data.issues.filter(i => i.severity === 'minor').length,
        status: 'completed' as const,
        report_data: data,
      }
      saveAuditToLocalHistory(historyRecord)
      fetch('/api/audit-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyRecord),
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setAppState('error')
    }
  }

  const handleReset = () => {
    setAppState('input')
    setUrl('')
    setResult(null)
    setError('')
    setActiveIssueId(null)
    setSteps(INITIAL_STEPS)
  }

  return (
    <div style={{ padding: '32px', paddingBottom: '64px' }}>
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          textDecoration: 'none',
          marginBottom: '28px',
        }}
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '28px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          Website Audit
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)' }}>
          Enter any URL and Oculus captures a full-page screenshot for a complete 10-domain UX evaluation.
        </p>
      </div>

      {/* ── INPUT STATE ── */}
      {appState === 'input' && (
        <div style={{ maxWidth: '640px' }}>
          <UrlInput
            url={url}
            onUrlChange={setUrl}
            onUrlSubmit={handleAnalyze}
          />
          <button
            onClick={() => handleAnalyze(url)}
            disabled={!url || !/^https?:\/\/.+/.test(url)}
            style={{
              marginTop: '20px',
              width: '100%',
              height: '52px',
              background: (url && /^https?:\/\/.+/.test(url))
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                : 'var(--bg-elevated)',
              color: (url && /^https?:\/\/.+/.test(url)) ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: (url && /^https?:\/\/.+/.test(url)) ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            Analyze Website
          </button>
          <p style={{
            marginTop: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}>
            Analysis may take up to 60 seconds for complex sites.
          </p>
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {appState === 'analyzing' && (
        <div style={{
          display: 'flex',
          gap: '40px',
          alignItems: 'flex-start',
          maxWidth: '1100px',
          margin: '64px auto',
          padding: '0 16px',
          flexWrap: 'wrap',
        }}>
          {/* Left: steps */}
          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <p style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              Analyzing your website...
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '28px',
              wordBreak: 'break-all',
            }}>
              {url}
            </p>
            <ProgressStepper steps={steps} />
          </div>
          {/* Right: scanning preview — appears after URL is captured */}
          {capturedImgUrl && (
            <div style={{ flex: '0 0 650px', minWidth: '300px' }}>
              <ScanningPreview imageUrl={capturedImgUrl} isFullPage height={350} />
            </div>
          )}
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {appState === 'error' && (
        <div style={{
          maxWidth: '480px',
          margin: '64px auto',
          textAlign: 'center',
          padding: '32px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Analysis Failed
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 24px',
              background: 'var(--brand-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── RESULTS STATE ── */}
      {appState === 'results' && result && (
        <div id="audit-report-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
                {result.url}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Analyzed {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <ExportBar result={result} mode="inline" />
              <button
                onClick={handleReset}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                New Audit
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            <div>
              <ResultsSummary result={result} />
            </div>
            <div>
              <AnnotatedScreenshot
                screenshotUrl={result.screenshotUrl}
                issues={result.issues}
                activeIssueId={activeIssueId}
                onIssueClick={(issue: AuditIssue) => setActiveIssueId(issue.id === activeIssueId ? null : issue.id)}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <IssueList
              issues={result.issues}
              activeIssueId={activeIssueId}
              onIssueClick={(issue: AuditIssue) => setActiveIssueId(issue.id === activeIssueId ? null : issue.id)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
