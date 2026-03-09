'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
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
  { label: 'Processing image', status: 'pending' },
  { label: 'Checking accessibility', status: 'pending' },
  { label: 'Running UX heuristics', status: 'pending' },
  { label: 'Generating recommendations', status: 'pending' },
]

export default function ScreenshotAuditPage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [filePreviewUrl, setFilePreviewUrl] = useState('')

  const setStep = (idx: number, status: 'pending' | 'active' | 'complete' | 'error') => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setAppState('analyzing')
    setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })))

    try {
      const formData = new FormData()
      formData.append('inputType', 'screenshot')
      formData.append('screenshot', selectedFile)

      setStep(0, 'complete')
      setStep(1, 'active')

      const res = await fetch('/api/analyze', { method: 'POST', body: formData })

      setStep(1, 'complete')
      setStep(2, 'active')
      await new Promise(r => setTimeout(r, 300))
      setStep(2, 'complete')
      setStep(3, 'active')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: AuditResult = await res.json()
      setStep(3, 'complete')
      setResult(data)
      setAppState('results')

      // Save to local history + Supabase (best-effort)
      const historyRecord = {
        audit_type: 'screenshot_audit',
        title: selectedFile.name,
        url: null,
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
    setSelectedFile(null)
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
          Screenshot Audit
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)' }}>
          Upload any UI screenshot for an instant AI-powered UX analysis.
        </p>
      </div>

      {/* ── INPUT STATE ── */}
      {appState === 'input' && (
        <div style={{ maxWidth: '640px' }}>
          <UploadZone
            onFileSelect={(f) => { setSelectedFile(f); setFilePreviewUrl(URL.createObjectURL(f)) }}
            selectedFile={selectedFile}
            onClear={() => { setSelectedFile(null); setFilePreviewUrl('') }}
          />
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile}
            style={{
              marginTop: '20px',
              width: '100%',
              height: '52px',
              background: selectedFile
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                : 'var(--bg-elevated)',
              color: selectedFile ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: selectedFile ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            Analyze Screenshot
          </button>
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
              Analyzing your UI...
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Running AI-powered heuristic analysis
            </p>
            <ProgressStepper steps={steps} />
          </div>
          {/* Right: scanning preview */}
          {filePreviewUrl && (
            <div style={{ flex: '0 0 650px', minWidth: '300px' }}>
              <ScanningPreview imageUrl={filePreviewUrl} isFullPage={false} height={350} />
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
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Analyzed {new Date(result.timestamp).toLocaleString()}
            </p>
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
