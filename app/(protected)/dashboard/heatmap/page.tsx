'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Upload, Link2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import ProgressStepper from '@/components/ProgressStepper'
import ScanningPreview from '@/components/ScanningPreview'
import type { HeatmapReport, AttentionHotspot, GazeFixation, AttentionConflict, RegionOfInterestReport } from '@/lib/types'
import { saveAuditToLocalHistory } from '@/lib/local-history'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'input' | 'analyzing' | 'results' | 'error'
type InputMode = 'file' | 'url'
type VisualTab = 'heatmap' | 'gaze' | 'first5'
type StepStatus = 'pending' | 'active' | 'complete' | 'error'
interface Step { label: string; status: StepStatus; description: string }

const INITIAL_STEPS: Step[] = [
  { label: 'Preprocessing image', status: 'pending', description: 'Normalizing dimensions, contrast, and color space' },
  { label: 'Running attention model', status: 'pending', description: 'Applying visual saliency and eye-tracking neural modeling' },
  { label: 'Generating UX insights', status: 'pending', description: 'Cross-referencing attention data with heuristic evaluation' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function intensityToColor(intensity: number): string {
  if (intensity >= 85) return '#FF1500'
  if (intensity >= 70) return '#FF6B00'
  if (intensity >= 55) return '#FFB800'
  if (intensity >= 40) return '#E8FF00'
  if (intensity >= 25) return '#44FF44'
  return '#00C8FF'
}

function severityColor(s: string) {
  if (s === 'critical') return '#FF4D4D'
  if (s === 'high') return '#FF8C42'
  return '#FFD166'
}

// ─── Visual Outputs ───────────────────────────────────────────────────────────

function ClassicHeatmap({ screenshotUrl, hotspots, opacity }: {
  screenshotUrl: string; hotspots: AttentionHotspot[]; opacity: number
}) {
  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <img src={screenshotUrl} alt="Design screenshot" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: opacity / 100, borderRadius: '8px', overflow: 'hidden' }}>
        {hotspots.map((spot, i) => {
          const color = intensityToColor(spot.intensity)
          const size = (spot.intensity / 100) * 180 + 60
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${spot.x}%`, top: `${spot.y}%`,
              width: `${size}px`, height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}AA 0%, ${color}55 35%, transparent 70%)`,
            }} />
          )
        })}
      </div>
    </div>
  )
}

function GazePathView({ screenshotUrl, gazeFixations }: {
  screenshotUrl: string; gazeFixations: GazeFixation[]
}) {
  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <img src={screenshotUrl} alt="Design screenshot" style={{ width: '100%', display: 'block', borderRadius: '8px', filter: 'brightness(0.7)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Connection lines */}
        {gazeFixations.map((f, i) => {
          if (i === 0) return null
          const prev = gazeFixations[i - 1]
          const x1 = prev.x, y1 = prev.y, x2 = f.x, y2 = f.y
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
          return (
            <path key={`line-${i}`}
              d={`M ${x1}% ${y1}% Q ${mx + (y2 - y1) * 0.15}% ${my - (x2 - x1) * 0.15}% ${x2}% ${y2}%`}
              fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="6 3"
            />
          )
        })}
        {/* Fixation circles */}
        {gazeFixations.map(f => {
          const r = Math.max(12, f.dwellTime * 12 + 8)
          const alpha = Math.max(0.4, 1 - f.order * 0.06)
          return (
            <g key={`fix-${f.order}`}>
              <circle cx={`${f.x}%`} cy={`${f.y}%`} r={r}
                fill={`rgba(139,92,246,${alpha * 0.35})`} stroke={`rgba(139,92,246,${alpha})`} strokeWidth="2" />
              <text x={`${f.x}%`} y={`${f.y}%`} dominantBaseline="middle" textAnchor="middle"
                fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">
                {f.order}
              </text>
              {/* Tooltip on hover would need JS; omitted for simplicity */}
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.75)', borderRadius: '8px', padding: '8px 12px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Gaze sequence — first 5 seconds</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(139,92,246,0.8)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Large circle = longer dwell · Numbers = gaze order</span>
        </div>
      </div>
    </div>
  )
}

function FirstFiveSecondsView({ screenshotUrl, hotspots }: {
  screenshotUrl: string; hotspots: AttentionHotspot[]
}) {
  const topSpots = hotspots.filter(h => h.inFirstFiveSeconds)
  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <img src={screenshotUrl} alt="Design screenshot" style={{ width: '100%', display: 'block', borderRadius: '8px' }} />
      {/* Dark overlay with SVG spotlight mask */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '8px' }}>
        <defs>
          <mask id="f5s-mask">
            {/* White = overlay visible (dark); Black ellipses = overlay removed (reveals screenshot) */}
            <rect width="100%" height="100%" fill="white" />
            {topSpots.map((spot, i) => {
              const rx = (spot.intensity / 100) * 14 + 8
              const ry = (spot.intensity / 100) * 10 + 5
              return (
                <ellipse key={i} cx={`${spot.x}%`} cy={`${spot.y}%`}
                  rx={`${rx}%`} ry={`${ry}%`} fill="black" />
              )
            })}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#f5s-mask)" />
        {/* Soft glow halos around spotlight areas */}
        {topSpots.map((spot, i) => (
          <ellipse key={`halo-${i}`} cx={`${spot.x}%`} cy={`${spot.y}%`}
            rx={`${(spot.intensity / 100) * 14 + 8}%`} ry={`${(spot.intensity / 100) * 10 + 5}%`}
            fill="none" stroke="rgba(255,200,50,0.35)" strokeWidth="2" />
        ))}
      </svg>
      {/* Count badge */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', borderRadius: '8px', padding: '6px 12px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          {topSpots.length} elements visible in first 5 seconds
        </p>
      </div>
    </div>
  )
}

// ─── Clarity Score Ring ───────────────────────────────────────────────────────

function ClarityRing({ score, verdict }: { score: number; verdict: string }) {
  const r = 58
  const circ = 2 * Math.PI * r
  const color = score >= 80 ? '#06D6A0' : score >= 50 ? '#FFD166' : '#FF4D9D'
  const label = score >= 80 ? 'Highly focused' : score >= 50 ? 'Moderately focused' : 'Scattered'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
        <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="68" cy="68" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Clarity Score</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color, background: `color-mix(in srgb, ${color} 12%, transparent)`, padding: '3px 10px', borderRadius: '50px', fontWeight: 600 }}>{label}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '440px' }}>{verdict}</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[{ r: '80–100', l: 'Tightly focused hierarchy', c: '#06D6A0' }, { r: '50–79', l: 'Competing focal points', c: '#FFD166' }, { r: '0–49', l: 'Scattered attention', c: '#FF4D9D' }].map(({ r, l, c }) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}><strong style={{ color: c }}>{r}</strong> — {l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Attention Conflicts ──────────────────────────────────────────────────────

function ConflictsSection({ conflicts }: { conflicts: AttentionConflict[] }) {
  if (!conflicts.length) return null
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Attention–Audit Cross-Reference
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>Mismatches between predicted attention and UX intent</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {conflicts.map((c, i) => (
          <div key={i} style={{
            background: `color-mix(in srgb, ${severityColor(c.severity)} 5%, var(--bg-surface))`,
            border: `1px solid color-mix(in srgb, ${severityColor(c.severity)} 30%, transparent)`,
            borderRadius: '12px', padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
                    color: severityColor(c.severity), background: `color-mix(in srgb, ${severityColor(c.severity)} 15%, transparent)`,
                    padding: '3px 10px', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{c.severity}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.element}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '6px' }}>{c.problem}</p>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-secondary)', background: 'rgba(108,99,255,0.1)', padding: '3px 8px', borderRadius: '50px' }}>{c.principle}</span>
              </div>
              <div style={{ minWidth: '200px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '8px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-secondary)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Fix</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Region of Interest Reports ───────────────────────────────────────────────

function RegionReports({ reports }: { reports: RegionOfInterestReport[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!reports.length) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Regions of Interest Focus Report
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {reports.map((r) => (
          <div key={r.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div onClick={() => setExpanded(expanded === r.label ? null : r.label)}
              style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700,
                color: r.verdict === 'pass' ? '#06D6A0' : '#FF4D9D',
                background: r.verdict === 'pass' ? 'rgba(6,214,160,0.1)' : 'rgba(255,77,157,0.1)',
                padding: '3px 10px', borderRadius: '50px', flexShrink: 0,
              }}>{r.verdict === 'pass' ? '✓ PASS' : '✗ FAIL'}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{r.label}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>{r.attentionPercentage}% attention</span>
              {r.gazeRank && <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>Rank #{r.gazeRank}</span>}
              {expanded === r.label ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </div>
            {expanded === r.label && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '12px 0' }}>
                  {[
                    { label: 'Attention Share', value: `${r.attentionPercentage}%` },
                    { label: 'Gaze Rank', value: r.gazeRank ? `#${r.gazeRank}` : 'Not captured' },
                    { label: 'Dwell Estimate', value: `${r.dwellEstimate.toFixed(1)}s` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.analysis}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [inputMode, setInputMode] = useState<InputMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [pageContext, setPageContext] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [regionInput, setRegionInput] = useState('')
  const [report, setReport] = useState<HeatmapReport | null>(null)
  const [error, setError] = useState('')
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [activeTab, setActiveTab] = useState<VisualTab>('heatmap')
  const [heatmapOpacity, setHeatmapOpacity] = useState(70)
  const [capturedUrlImgUrl, setCapturedUrlImgUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const setStep = (idx: number, status: StepStatus) =>
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))

  const validateFile = useCallback((f: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return
    if (f.size > 10 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = e => setFilePreview(e.target?.result as string)
    reader.readAsDataURL(f)
    setFile(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) validateFile(f)
  }, [validateFile])

  const addRegion = () => {
    const trimmed = regionInput.trim()
    if (trimmed && regions.length < 5 && !regions.includes(trimmed)) {
      setRegions(r => [...r, trimmed])
      setRegionInput('')
    }
  }

  const isReady = inputMode === 'file' ? !!file : /^https?:\/\/.+/.test(url)

  const handleGenerate = async () => {
    if (!isReady) return
    setAppState('analyzing')
    setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })))

    try {
      const form = new FormData()

      if (inputMode === 'url') {
        // Capture URL first
        const captureForm = new FormData()
        captureForm.append('url', url)
        const captureRes = await fetch('/api/capture', { method: 'POST', body: captureForm })
        if (!captureRes.ok) throw new Error('Failed to capture URL')
        const captured = await captureRes.json()
        setCapturedUrlImgUrl(captured.screenshotDataUrl || '')
        form.append('screenshotBase64', captured.screenshotBase64)
        form.append('screenshotDataUrl', captured.screenshotDataUrl)
      } else if (file) {
        form.append('screenshot', file)
      }

      if (pageContext.trim()) form.append('pageContext', pageContext.trim())
      if (regions.length) form.append('regionsOfInterest', JSON.stringify(regions))

      setStep(0, 'complete'); setStep(1, 'active')

      const res = await fetch('/api/heatmap', { method: 'POST', body: form })

      setStep(1, 'complete'); setStep(2, 'active')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: HeatmapReport = await res.json()
      setStep(2, 'complete')
      setReport(data)
      setAppState('results')

      // Save to local history + Supabase (best-effort)
      const historyRecord = {
        audit_type: 'heatmap_attention',
        title: inputMode === 'url' ? url : (file?.name ?? 'Heatmap'),
        url: inputMode === 'url' ? url : null,
        overall_score: data.clarityScore,
        total_issues: data.attentionConflicts.length,
        critical_count: data.attentionConflicts.filter(c => c.severity === 'critical').length,
        high_count: data.attentionConflicts.filter(c => c.severity === 'high').length,
        medium_count: data.attentionConflicts.filter(c => c.severity === 'medium').length,
        minor_count: 0,
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
    setAppState('input'); setFile(null); setFilePreview(null); setUrl('')
    setReport(null); setError(''); setSteps(INITIAL_STEPS)
    setActiveTab('heatmap'); setHeatmapOpacity(70)
  }

  const tabs: { id: VisualTab; label: string }[] = [
    { id: 'heatmap', label: 'Classic Heatmap' },
    { id: 'gaze', label: 'Gaze Path' },
    { id: 'first5', label: 'First 5 Seconds' },
  ]

  return (
    <div style={{ padding: '32px', paddingBottom: '80px' }}>
      {/* Back link */}
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none', marginBottom: '28px' }}>
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Heatmap Attention</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)' }}>
          See your interface through the eyes of your users — predict exactly where attention lands, in what order, and for how long.
        </p>
      </div>

      {/* ── INPUT STATE ── */}
      {appState === 'input' && (
        <div style={{ maxWidth: '680px' }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '4px', marginBottom: '16px', width: 'fit-content' }}>
            {(['file', 'url'] as InputMode[]).map(m => (
              <button key={m} onClick={() => setInputMode(m)} style={{
                padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: inputMode === m ? 'var(--bg-surface)' : 'transparent',
                color: inputMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: inputMode === m ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
              }}>
                {m === 'file' ? <Upload size={14} /> : <Link2 size={14} />}
                {m === 'file' ? 'Upload Screenshot' : 'Enter URL'}
              </button>
            ))}
          </div>

          {/* File upload */}
          {inputMode === 'file' && (
            file && filePreview ? (
              <div style={{ position: 'relative', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--bg-border)' }}>
                <img src={filePreview} alt="Preview" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '8px' }}>
                  <span style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '4px 10px', fontFamily: 'var(--font-body)', fontSize: '12px', color: '#fff' }}>{file.name}</span>
                  <button onClick={() => { setFile(null); setFilePreview(null) }} style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: '200px', border: `2px dashed ${dragging ? 'var(--brand-primary)' : 'var(--bg-border)'}`,
                  borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px',
                  background: dragging ? 'rgba(108,99,255,0.05)' : 'transparent', transition: 'all 0.15s',
                }}>
                <Upload size={32} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Drop your screenshot here or click to browse</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG, WebP · Max 10MB</p>
                </div>
              </div>
            )
          )}

          {/* URL input */}
          {inputMode === 'url' && (
            <div style={{ marginBottom: '16px' }}>
              <input type="url" placeholder="https://your-site.com/page"
                value={url} onChange={e => setUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-elevated)', border: `1px solid ${/^https?:\/\/.+/.test(url) ? 'var(--brand-primary)' : 'var(--bg-border)'}`, borderRadius: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Oculus will silently capture a full-page screenshot of this URL.
              </p>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) validateFile(f) }} />

          {/* Page context */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Page type <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input type="text" placeholder="e.g. E-commerce homepage, SaaS pricing page, Mobile checkout..."
              value={pageContext} onChange={e => setPageContext(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Regions of Interest */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Regions of Interest <span style={{ color: 'var(--text-muted)' }}>(optional · max 5 elements to track)</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" placeholder="e.g. Primary CTA button"
                value={regionInput} onChange={e => setRegionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRegion()}
                disabled={regions.length >= 5}
                style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', outline: 'none' }} />
              <button onClick={addRegion} disabled={!regionInput.trim() || regions.length >= 5}
                style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add
              </button>
            </div>
            {regions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {regions.map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '50px', padding: '4px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-secondary)' }}>{r}</span>
                    <button onClick={() => setRegions(prev => prev.filter(x => x !== r))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={!isReady}
            style={{
              height: '52px', padding: '0 32px',
              background: isReady ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'var(--bg-elevated)',
              color: isReady ? '#fff' : 'var(--text-muted)', border: 'none',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px',
              fontWeight: 600, cursor: isReady ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: isReady ? '0 0 24px rgba(139,92,246,0.3)' : 'none',
            }}>
            <Sparkles size={16} />
            Generate Heatmap
          </button>
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {appState === 'analyzing' && (
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', maxWidth: '1100px', margin: '64px auto', padding: '0 16px', flexWrap: 'wrap' }}>
          {/* Left: steps */}
          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Generating attention heatmap...
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              AI is modeling how the human visual system responds to your interface.
            </p>
            <div style={{ textAlign: 'left' }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--bg-border)' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.status === 'active' ? 'var(--brand-primary)' : s.status === 'complete' ? 'rgba(6,214,160,0.15)' : 'var(--bg-elevated)', border: s.status === 'complete' ? '1px solid rgba(6,214,160,0.3)' : '1px solid var(--bg-border)' }}>
                    {s.status === 'complete' ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : s.status === 'active' ? (
                      <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{i + 1}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: s.status === 'active' ? 600 : 400, color: s.status === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '2px' }}>{s.label}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
          {/* Right: scanning preview */}
          {(filePreview || capturedUrlImgUrl) && (
            <div style={{ flex: '0 0 650px', minWidth: '300px' }}>
              <ScanningPreview
                imageUrl={filePreview || capturedUrlImgUrl}
                isFullPage={inputMode === 'url'}
                height={350}
              />
            </div>
          )}
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {appState === 'error' && (
        <div style={{ maxWidth: '480px', margin: '64px auto', textAlign: 'center', padding: '32px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '12px' }}>Analysis Failed</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>{error}</p>
          <button onClick={handleReset} style={{ padding: '10px 24px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Try Again</button>
        </div>
      )}

      {/* ── RESULTS STATE ── */}
      {appState === 'results' && report && (
        <div id="heatmap-report-container">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Generated {new Date(report.timestamp).toLocaleString()}
              {report.pageContext && <span> · {report.pageContext}</span>}
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  const { generatePDF } = await import('@/lib/pdf-export')
                  await generatePDF('heatmap-report-container', `oculus-heatmap-${report.id}.pdf`)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: 'none', background: 'var(--brand-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 11v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="8" y1="11" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Download PDF
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `oculus-heatmap-${report.id}.json`; a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 10V13H13V10M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Export JSON
              </button>
              <button
                onClick={async () => {
                  const data = btoa(JSON.stringify({ id: report.id, score: report.clarityScore }))
                  const url = `${window.location.origin}/results?data=${data}`
                  try { await navigator.clipboard.writeText(url); alert('Link copied!') } catch { prompt('Copy this link:', url) }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5L9.5 6.5M7 11L5 13C4 14 2 14 1.5 13.5C1 13 1 11 2 10L4 8M9 5L11 3C12 2 14 2 14.5 2.5C15 3 15 5 14 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Copy Link
              </button>
              <button onClick={handleReset} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                New Heatmap
              </button>
            </div>
          </div>

          {/* Clarity Score */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: '28px' }}>
            <ClarityRing score={report.clarityScore} verdict={report.clarityVerdict} />
          </div>

          {/* Visual outputs with tabs */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '28px' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)', background: 'var(--bg-elevated)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '12px 20px', border: 'none', cursor: 'pointer',
                  background: activeTab === t.id ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: activeTab === t.id ? 600 : 400,
                  borderBottom: activeTab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}

              {/* Opacity slider (only for heatmap tab) */}
              {activeTab === 'heatmap' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>Intensity</span>
                  <input type="range" min="20" max="100" value={heatmapOpacity}
                    onChange={e => setHeatmapOpacity(Number(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--brand-primary)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', minWidth: '28px' }}>{heatmapOpacity}%</span>
                </div>
              )}
            </div>

            {/* Visual output */}
            <div style={{ padding: '20px' }}>
              {activeTab === 'heatmap' && (
                <ClassicHeatmap screenshotUrl={report.screenshotUrl} hotspots={report.hotspots} opacity={heatmapOpacity} />
              )}
              {activeTab === 'gaze' && (
                <GazePathView screenshotUrl={report.screenshotUrl} gazeFixations={report.gazeFixations} />
              )}
              {activeTab === 'first5' && (
                <FirstFiveSecondsView screenshotUrl={report.screenshotUrl} hotspots={report.hotspots} />
              )}
            </div>
          </div>

          {/* Hotspot legend */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>Attention intensity:</span>
            {[{ l: 'Critical', c: '#FF1500' }, { l: 'High', c: '#FF6B00' }, { l: 'Medium', c: '#FFB800' }, { l: 'Low', c: '#44FF44' }, { l: 'Minimal', c: '#00C8FF' }].map(({ l, c }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {report.aiAnalysis && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                AI UX Attention Analysis
              </h3>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {report.aiAnalysis}
              </div>
            </div>
          )}

          <ConflictsSection conflicts={report.attentionConflicts} />
          <RegionReports reports={report.regionReports} />
        </div>
      )}
    </div>
  )
}
