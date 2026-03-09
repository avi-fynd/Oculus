'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Upload, Link2, X, ChevronDown, ChevronUp } from 'lucide-react'
import ProgressStepper from '@/components/ProgressStepper'
import ScanningPreview from '@/components/ScanningPreview'
import type { ABReport, ABDomainScore } from '@/lib/types'
import { saveAuditToLocalHistory } from '@/lib/local-history'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'input' | 'analyzing' | 'results' | 'error'
type InputMode = 'file' | 'url'
type StepStatus = 'pending' | 'active' | 'complete' | 'error'
interface Step { label: string; status: StepStatus }

interface VersionState {
  mode: InputMode
  file: File | null
  filePreview: string | null
  url: string
  capturedBase64: string | null
  capturedDataUrl: string | null
}

const emptyVersion = (): VersionState => ({
  mode: 'file', file: null, filePreview: null, url: '',
  capturedBase64: null, capturedDataUrl: null,
})

const INITIAL_STEPS: Step[] = [
  { label: 'Capturing screenshots', status: 'pending' },
  { label: 'Analysing Version A', status: 'pending' },
  { label: 'Analysing Version B', status: 'pending' },
  { label: 'Running comparative reasoning', status: 'pending' },
  { label: 'Generating final report', status: 'pending' },
]

// ─── Version Upload Panel ─────────────────────────────────────────────────────

function VersionPanel({
  label, accent, version,
  onFileSelect, onFileRemove, onUrlChange, onModeChange,
}: {
  label: string; accent: string; version: VersionState
  onFileSelect: (f: File, preview: string) => void
  onFileRemove: () => void
  onUrlChange: (url: string) => void
  onModeChange: (mode: InputMode) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const validate = useCallback((file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = e => onFileSelect(file, e.target?.result as string)
    reader.readAsDataURL(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) validate(f)
  }, [validate])

  const isReady = version.mode === 'file' ? !!version.file : /^https?:\/\/.+/.test(version.url)

  return (
    <div style={{
      flex: 1, background: 'var(--bg-surface)', border: `1px solid ${accent}40`,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '16px 20px', background: `color-mix(in srgb, ${accent} 8%, transparent)`,
        borderBottom: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: `color-mix(in srgb, ${accent} 20%, transparent)`,
          color: accent, display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, fontSize: '13px',
        }}>
          {label.split(' ')[1]}
        </span>
        <div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {label}
          </p>
          {isReady && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: accent, marginTop: '2px' }}>
              ✓ Ready
            </p>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)' }}>
        {(['file', 'url'] as InputMode[]).map(m => (
          <button key={m} onClick={() => onModeChange(m)} style={{
            flex: 1, padding: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', background: version.mode === m
              ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'transparent',
            border: 'none', borderBottom: version.mode === m ? `2px solid ${accent}` : '2px solid transparent',
            color: version.mode === m ? accent : 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {m === 'file' ? <Upload size={13} /> : <Link2 size={13} />}
            {m === 'file' ? 'Upload Image' : 'Enter URL'}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding: '16px', flex: 1 }}>
        {version.mode === 'file' ? (
          version.file && version.filePreview ? (
            <div style={{ position: 'relative' }}>
              <img src={version.filePreview} alt="Preview" style={{
                width: '100%', height: '180px', objectFit: 'cover',
                borderRadius: '8px', border: '1px solid var(--bg-border)',
              }} />
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px', right: '8px',
                background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
                padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {version.file.name}
                </span>
                <button onClick={onFileRemove} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                height: '180px', border: `2px dashed ${dragging ? accent : 'var(--bg-border)'}`,
                borderRadius: '8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer', transition: 'border-color 0.15s',
                background: dragging ? `color-mix(in srgb, ${accent} 5%, transparent)` : 'transparent',
              }}
            >
              <Upload size={28} color="var(--text-muted)" />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Drop screenshot here<br />
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>PNG, JPG, WebP · max 10MB</span>
              </p>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="url"
              placeholder="https://example.com/page"
              value={version.url}
              onChange={e => onUrlChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)',
                border: `1px solid ${/^https?:\/\/.+/.test(version.url) ? accent : 'var(--bg-border)'}`,
                borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>
              Oculus will auto-capture a full-page screenshot of this URL.
            </p>
          </div>
        )}
        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp"
          style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) validate(f) }} />
      </div>
    </div>
  )
}

// ─── Winner Banner ────────────────────────────────────────────────────────────

function WinnerBanner({ report }: { report: ABReport }) {
  const isB = report.winner === 'B'
  const isTie = report.winner === 'tie'
  const accent = isTie ? '#FFD166' : isB ? '#06D6A0' : '#FF4D9D'
  const winnerLabel = isTie ? 'It\'s a Tie' : `Version ${report.winner} Wins`

  return (
    <div style={{
      background: `color-mix(in srgb, ${accent} 8%, var(--bg-surface))`,
      border: `1px solid ${accent}40`, borderRadius: 'var(--radius-lg)', padding: '28px 32px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>{isTie ? '⚖️' : '🏆'}</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: accent }}>
              {winnerLabel}
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
            {report.winnerVerdict}
          </p>
          {report.pageContext && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Page context: <span style={{ color: 'var(--text-secondary)' }}>{report.pageContext}</span>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {(['A', 'B'] as const).map(v => {
            const score = v === 'A' ? report.overallScoreA : report.overallScoreB
            const isWinner = report.winner === v
            const color = score >= 80 ? '#06D6A0' : score >= 60 ? '#FFD166' : '#FF4D9D'
            return (
              <div key={v} style={{
                textAlign: 'center', padding: '16px 20px',
                background: isWinner ? `color-mix(in srgb, ${accent} 15%, var(--bg-elevated))` : 'var(--bg-elevated)',
                border: `1px solid ${isWinner ? accent + '60' : 'var(--bg-border)'}`,
                borderRadius: '12px', minWidth: '90px',
              }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Version {v}
                </p>
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, color, lineHeight: 1 }}>
                  {score}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>/100</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Domain Scorecard ─────────────────────────────────────────────────────────

function DomainScorecard({ domains }: { domains: ABDomainScore[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const deltaColor = (d: number) => d > 5 ? '#06D6A0' : d < -5 ? '#FF4D9D' : 'var(--text-muted)'
  const deltaLabel = (d: number) => d > 0 ? `+${d}` : `${d}`
  const scoreBar = (score: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '60px', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: score >= 80 ? '#06D6A0' : score >= 60 ? '#FFD166' : '#FF4D9D', borderRadius: '3px' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '28px' }}>{score}</span>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Head-to-Head Scorecard
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>Click a row to expand</p>
      </div>

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 80px 60px', gap: '12px', padding: '12px 24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)' }}>
        {['Domain', 'Version A', 'Version B', 'Delta', 'Winner'].map(h => (
          <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</span>
        ))}
      </div>

      {domains.map((d, i) => (
        <div key={d.domain}>
          <div
            onClick={() => setExpanded(expanded === d.domain ? null : d.domain)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 140px 80px 60px', gap: '12px',
              padding: '14px 24px', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center',
              borderBottom: i < domains.length - 1 && expanded !== d.domain ? '1px solid var(--bg-border)' : '1px solid transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {expanded === d.domain ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{d.domain}</span>
            </div>
            {scoreBar(d.scoreA)}
            {scoreBar(d.scoreB)}
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: deltaColor(d.delta) }}>
              {deltaLabel(d.delta)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: d.winner === 'A' ? '#FF8C42' : d.winner === 'B' ? '#06D6A0' : 'var(--text-muted)' }}>
              {d.winner === 'tie' ? '—' : `Ver. ${d.winner}`}
            </span>
          </div>

          {expanded === d.domain && (
            <div style={{ padding: '16px 24px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,140,66,0.06)', border: '1px solid rgba(255,140,66,0.2)', borderRadius: '8px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', textTransform: 'uppercase', color: '#FF8C42', fontWeight: 600, marginBottom: '6px' }}>Version A</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.whatADid}</p>
                </div>
                <div style={{ padding: '12px', background: `rgba(6,214,160,${d.delta >= 0 ? '0.06' : '0.02'})`, border: `1px solid rgba(6,214,160,${d.delta >= 0 ? '0.2' : '0.1'})`, borderRadius: '8px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', textTransform: 'uppercase', color: '#06D6A0', fontWeight: 600, marginBottom: '6px' }}>Version B</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.whatBChanged}</p>
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '8px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--brand-secondary)', fontWeight: 600, marginRight: '8px' }}>Recommendation:</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>{d.recommendation}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Key Wins & Regressions ───────────────────────────────────────────────────

function KeyWinsSection({ wins }: { wins: ABReport['keyWins'] }) {
  if (!wins.length) return null
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06D6A0', display: 'inline-block' }} />
        Key Wins in Version B
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {wins.map((w, i) => (
          <div key={i} style={{ background: 'rgba(6,214,160,0.05)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#06D6A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{w.domain}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{w.change}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>{w.impact}</p>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#06D6A0', background: 'rgba(6,214,160,0.1)', padding: '3px 8px', borderRadius: '50px' }}>{w.principle}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegressionsSection({ regressions }: { regressions: ABReport['regressions'] }) {
  if (!regressions.length) return null
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4D9D', display: 'inline-block' }} />
        Regressions to Fix Before Shipping
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {regressions.map((r, i) => (
          <div key={i} style={{ background: 'rgba(255,77,157,0.04)', border: '1px solid rgba(255,77,157,0.25)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#FF4D9D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.domain}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '50px' }}>{r.principle}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{r.change}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.impact}</p>
              </div>
              <div style={{ minWidth: '220px', padding: '12px', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '8px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--brand-secondary)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fix</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Annotated Comparison ─────────────────────────────────────────────────────

function AnnotatedComparison({ report }: { report: ABReport }) {
  const [activePin, setActivePin] = useState<number | null>(null)

  const pinColor = (outcome: string) =>
    outcome === 'improvement' ? '#06D6A0' : outcome === 'regression' ? '#FF4D9D' : '#FFD166'

  const renderPin = (ann: typeof report.annotationsA[0]) => (
    <div
      key={ann.id}
      onClick={() => setActivePin(activePin === ann.id ? null : ann.id)}
      style={{
        position: 'absolute',
        left: `${ann.x}%`, top: `${ann.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '24px', height: '24px', borderRadius: '50%',
        background: pinColor(ann.outcome),
        color: '#000', fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 10, boxShadow: `0 0 0 3px rgba(0,0,0,0.3)`,
        transition: 'transform 0.15s',
      }}
    >
      {ann.id}
      {activePin === ann.id && (
        <div style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
          borderRadius: '8px', padding: '8px 12px', width: '200px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'normal' }}>
            {ann.note}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Annotated Comparison
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Click numbered pins to see annotations. <span style={{ color: '#06D6A0' }}>● Improvement</span> &nbsp; <span style={{ color: '#FF4D9D' }}>● Regression</span> &nbsp; <span style={{ color: '#FFD166' }}>● Neutral</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {([
          { label: 'Version A', url: report.screenshotUrlA, pins: report.annotationsA, accent: '#FF8C42' },
          { label: 'Version B', url: report.screenshotUrlB, pins: report.annotationsB, accent: '#06D6A0' },
        ] as const).map(({ label, url, pins, accent }) => (
          <div key={label}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: accent, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${accent}40` }}>
              <img src={url} alt={label} style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover', objectPosition: 'top' }} />
              {pins.map(renderPin)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ship Confidence Score ────────────────────────────────────────────────────

function ShipConfidence({ score }: { score: number }) {
  const color = score >= 80 ? '#06D6A0' : score >= 60 ? '#FFD166' : '#FF4D9D'
  const recommendation = score >= 80
    ? 'Ship with confidence. Version B is ready to replace Version A.'
    : score >= 60
    ? 'Ship after addressing the listed regressions. Version B has strong improvements.'
    : 'Version B needs significant work before it\'s ready to ship. Fix regressions first.'

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
      {/* Circular gauge */}
      <div style={{ position: 'relative', width: '128px', height: '128px', flexShrink: 0 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Ship Confidence Score
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
          {recommendation}
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: '80–100', desc: 'Ship with confidence', c: '#06D6A0' },
            { label: '60–79', desc: 'Fix regressions first', c: '#FFD166' },
            { label: '0–59', desc: 'Significant work needed', c: '#FF4D9D' },
          ].map(({ label, desc, c }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong style={{ color: c }}>{label}</strong> — {desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ABTestingPage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [versionA, setVersionA] = useState<VersionState>(emptyVersion())
  const [versionB, setVersionB] = useState<VersionState>(emptyVersion())
  const [pageContext, setPageContext] = useState('')
  const [report, setReport] = useState<ABReport | null>(null)
  const [error, setError] = useState('')
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [scanImgA, setScanImgA] = useState('')
  const [scanImgB, setScanImgB] = useState('')

  const setStep = (idx: number, status: StepStatus) =>
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))

  const isReady = (v: VersionState) =>
    v.mode === 'file' ? !!v.file : /^https?:\/\/.+/.test(v.url)

  const captureUrl = async (url: string) => {
    const form = new FormData()
    form.append('url', url)
    const res = await fetch('/api/capture', { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Failed to capture URL: ${url}`)
    return res.json() as Promise<{ screenshotBase64: string; screenshotDataUrl: string }>
  }

  const handleAnalyze = async () => {
    if (!isReady(versionA) || !isReady(versionB)) return
    setAppState('analyzing')
    setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })))

    try {
      // Step 0: Capture URLs if needed
      let capturedA = { screenshotBase64: versionA.capturedBase64, screenshotDataUrl: versionA.capturedDataUrl }
      let capturedB = { screenshotBase64: versionB.capturedBase64, screenshotDataUrl: versionB.capturedDataUrl }

      const needsCaptureA = versionA.mode === 'url'
      const needsCaptureB = versionB.mode === 'url'

      if (needsCaptureA || needsCaptureB) {
        const captures = await Promise.all([
          needsCaptureA ? captureUrl(versionA.url) : Promise.resolve(null),
          needsCaptureB ? captureUrl(versionB.url) : Promise.resolve(null),
        ])
        if (captures[0]) capturedA = captures[0]
        if (captures[1]) capturedB = captures[1]
      }

      setScanImgA(capturedA.screenshotDataUrl || versionA.filePreview || '')
      setScanImgB(capturedB.screenshotDataUrl || versionB.filePreview || '')

      setStep(0, 'complete'); setStep(1, 'active')
      await new Promise(r => setTimeout(r, 200))
      setStep(1, 'complete'); setStep(2, 'active')
      await new Promise(r => setTimeout(r, 200))
      setStep(2, 'complete'); setStep(3, 'active')

      // Build form data for ab-analyze
      const form = new FormData()
      if (versionA.mode === 'file' && versionA.file) {
        form.append('screenshotA', versionA.file)
      } else {
        form.append('screenshotBase64A', capturedA.screenshotBase64!)
        form.append('screenshotDataUrlA', capturedA.screenshotDataUrl!)
      }
      if (versionB.mode === 'file' && versionB.file) {
        form.append('screenshotB', versionB.file)
      } else {
        form.append('screenshotBase64B', capturedB.screenshotBase64!)
        form.append('screenshotDataUrlB', capturedB.screenshotDataUrl!)
      }
      if (pageContext.trim()) form.append('pageContext', pageContext.trim())

      const res = await fetch('/api/ab-analyze', { method: 'POST', body: form })
      setStep(3, 'complete'); setStep(4, 'active')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data: ABReport = await res.json()
      setStep(4, 'complete')
      setReport(data)
      setAppState('results')

      // Save to local history + Supabase (best-effort)
      const historyRecord = {
        audit_type: 'ab_testing',
        title: `A/B Test${pageContext ? ` — ${pageContext}` : ''}`,
        url: null,
        overall_score: data.shipConfidenceScore,
        total_issues: data.regressions.length,
        critical_count: 0,
        high_count: data.regressions.length,
        medium_count: 0,
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
    setAppState('input')
    setVersionA(emptyVersion()); setVersionB(emptyVersion())
    setReport(null); setError(''); setPageContext('')
    setSteps(INITIAL_STEPS)
  }

  const updateVersion = (which: 'A' | 'B', patch: Partial<VersionState>) =>
    which === 'A' ? setVersionA(p => ({ ...p, ...patch })) : setVersionB(p => ({ ...p, ...patch }))

  const canRun = isReady(versionA) && isReady(versionB)

  return (
    <div style={{ padding: '32px', paddingBottom: '80px' }}>
      {/* Back link */}
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px', textDecoration: 'none', marginBottom: '28px' }}>
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>A/B Testing</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)' }}>
          Compare two UI designs and get a research-backed verdict on which one wins and exactly why.
        </p>
      </div>

      {/* ── INPUT STATE ── */}
      {appState === 'input' && (
        <div>
          {/* Two-panel upload */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {(['A', 'B'] as const).map(v => {
              const version = v === 'A' ? versionA : versionB
              const accent = v === 'A' ? '#FF8C42' : '#06D6A0'
              return (
                <VersionPanel
                  key={v}
                  label={`Version ${v}${v === 'A' ? ' — Current Design' : ' — New Variant'}`}
                  accent={accent}
                  version={version}
                  onFileSelect={(file, preview) => updateVersion(v, { file, filePreview: preview, mode: 'file' })}
                  onFileRemove={() => updateVersion(v, { file: null, filePreview: null })}
                  onUrlChange={url => updateVersion(v, { url })}
                  onModeChange={mode => updateVersion(v, { mode })}
                />
              )
            })}
          </div>

          {/* Optional context */}
          <div style={{ marginBottom: '24px', maxWidth: '640px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Page type context <span style={{ color: 'var(--text-muted)' }}>(optional — helps AI apply the right evaluation criteria)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Checkout page, Onboarding flow, Product listing..."
              value={pageContext}
              onChange={e => setPageContext(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)', borderRadius: '8px',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleAnalyze}
            disabled={!canRun}
            style={{
              height: '52px', padding: '0 32px',
              background: canRun ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'var(--bg-elevated)',
              color: canRun ? '#fff' : 'var(--text-muted)', border: 'none',
              borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '15px',
              fontWeight: 600, cursor: canRun ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'opacity 0.2s',
              boxShadow: canRun ? '0 0 24px rgba(139,92,246,0.3)' : 'none',
            }}
          >
            <Sparkles size={16} />
            Run A/B Analysis
          </button>

          {!canRun && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Provide both Version A and Version B to begin.
            </p>
          )}
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {appState === 'analyzing' && (
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', maxWidth: '1100px', margin: '64px auto', padding: '0 16px', flexWrap: 'wrap' }}>
          {/* Left: steps */}
          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Comparing designs...
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              The AI is evaluating both versions across 10 UX domains simultaneously.
            </p>
            <ProgressStepper steps={steps} />
          </div>
          {/* Right: both screenshots scanning side-by-side */}
          {(scanImgA || scanImgB) && (
            <div style={{ flex: '0 0 660px', minWidth: '400px', display: 'flex', gap: '12px' }}>
              {scanImgA && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: '#8B5CF6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Version A</p>
                  <ScanningPreview imageUrl={scanImgA} isFullPage={versionA.mode === 'url'} height={350} />
                </div>
              )}
              {scanImgB && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: '#EC4899', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Version B</p>
                  <ScanningPreview imageUrl={scanImgB} isFullPage={versionB.mode === 'url'} height={350} />
                </div>
              )}
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
          <button onClick={handleReset} style={{ padding: '10px 24px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── RESULTS STATE ── */}
      {appState === 'results' && report && (
        <div id="ab-report-container">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Analysed {new Date(report.timestamp).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  const { generatePDF } = await import('@/lib/pdf-export')
                  await generatePDF('ab-report-container', `oculus-ab-test-${report.id}.pdf`)
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
                  a.href = url; a.download = `oculus-ab-test-${report.id}.json`; a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 10V13H13V10M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Export JSON
              </button>
              <button
                onClick={async () => {
                  const data = btoa(JSON.stringify({ id: report.id, score: report.shipConfidenceScore }))
                  const url = `${window.location.origin}/results?data=${data}`
                  try { await navigator.clipboard.writeText(url); alert('Link copied!') } catch { prompt('Copy this link:', url) }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5L9.5 6.5M7 11L5 13C4 14 2 14 1.5 13.5C1 13 1 11 2 10L4 8M9 5L11 3C12 2 14 2 14.5 2.5C15 3 15 5 14 6L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Copy Link
              </button>
              <button onClick={handleReset} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}>
                New A/B Test
              </button>
            </div>
          </div>

          <WinnerBanner report={report} />
          <DomainScorecard domains={report.domainScores} />
          <KeyWinsSection wins={report.keyWins} />
          <RegressionsSection regressions={report.regressions} />
          <AnnotatedComparison report={report} />
          <ShipConfidence score={report.shipConfidenceScore} />
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .ab-panels { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
