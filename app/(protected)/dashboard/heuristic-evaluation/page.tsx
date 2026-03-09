'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Sparkles, Upload, Link2, ChevronDown, ChevronUp,
  AlertTriangle, AlertCircle, Info, CheckCircle, BookOpen, Copy, Check,
  Layers, Zap, Eye, Brain, Heart, Smartphone, Award,
} from 'lucide-react'
import ScanningPreview from '@/components/ScanningPreview'
import { saveAuditToLocalHistory } from '@/lib/local-history'
import type {
  HeuristicReport, HeuristicFinding, HeuristicFrameworkScore,
  HeuristicFrameworkId, HeuristicPageType, HeuristicDeviceContext,
} from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#FF8C42'

const PAGE_TYPES: HeuristicPageType[] = [
  'Homepage', 'Product Listing Page', 'Product Detail Page', 'Shopping Cart',
  'Checkout', 'Login / Sign-up', 'User Onboarding', 'SaaS Dashboard',
  'Feature Page', 'Landing Page', 'Mobile App Screen', 'Form Page', 'Settings Page',
]

const FRAMEWORK_META: Record<HeuristicFrameworkId, {
  label: string; shortLabel: string; icon: React.ReactNode; color: string; desc: string
}> = {
  nielsen: { label: "Nielsen's 10 Usability Heuristics", shortLabel: 'Nielsen NNG', icon: <Layers size={16} />, color: '#6C63FF', desc: 'Evaluating against 10 empirically validated usability principles from Nielsen Norman Group...' },
  baymard: { label: 'Baymard Institute Guidelines', shortLabel: 'Baymard', icon: <Award size={16} />, color: '#00C9A7', desc: 'Applying 700+ page-type-specific guidelines from Baymard\'s research corpus...' },
  wcag: { label: 'WCAG 2.2 Accessibility', shortLabel: 'WCAG 2.2', icon: <Eye size={16} />, color: '#4ECDC4', desc: 'Checking perceivability, operability, understandability, and robustness...' },
  gestalt: { label: 'Gestalt Visual Principles', shortLabel: 'Gestalt', icon: <Zap size={16} />, color: '#FFD166', desc: 'Analyzing proximity, similarity, continuity, closure, and figure-ground...' },
  cognitive: { label: 'Cognitive Psychology Laws', shortLabel: 'Cognitive', icon: <Brain size={16} />, color: '#FF6B6B', desc: "Evaluating Hick's Law, Miller's Law, Fitts's Law, and cognitive load..." },
  emotional: { label: 'Emotional Design & Trust', shortLabel: 'Emotional', icon: <Heart size={16} />, color: '#FF4D9D', desc: "Assessing Norman's 3 levels, Fogg's credibility, and Kahneman's Peak-End Rule..." },
  mobile: { label: 'Mobile & Touch Standards', shortLabel: 'Mobile HIG', icon: <Smartphone size={16} />, color: '#C77DFF', desc: 'Checking touch targets, thumb zones, gesture conflicts, and reading ergonomics...' },
}

const PRINCIPLES_GLOSSARY: Record<string, string> = {
  "Nielsen #1: Visibility of System Status": "Always keep users informed about what is happening through appropriate feedback within a reasonable time.",
  "Nielsen #2: Match Between System and the World": "Use words, phrases, and concepts familiar to the user rather than system-oriented language — speak the user's language.",
  "Nielsen #3: User Control and Freedom": "Users who choose functions by mistake need a clearly marked emergency exit without going through an extended dialogue.",
  "Nielsen #4: Consistency and Standards": "Users should not have to wonder whether different words, situations, or actions mean the same thing — follow platform conventions.",
  "Nielsen #5: Error Prevention": "A careful design that prevents problems from occurring is better than good error messages. Eliminate error-prone conditions.",
  "Nielsen #6: Recognition Rather Than Recall": "Minimize the user's memory load by making objects, actions, and options visible. Instructions should be retrievable whenever appropriate.",
  "Nielsen #7: Flexibility and Efficiency of Use": "Accelerators — unseen by novices — may speed up interaction for experts, allowing the design to serve both inexperienced and experienced users.",
  "Nielsen #8: Aesthetic and Minimalist Design": "Dialogues should not contain irrelevant or rarely needed information. Every extra unit of information competes with relevant units and diminishes their relative visibility.",
  "Nielsen #9: Help Users Recognize, Diagnose, and Recover from Errors": "Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.",
  "Nielsen #10: Help and Documentation": "Even if the system can be used without documentation, help content must be easy to search, focused on the user's task, and list concrete steps to carry out.",
  "Cognitive: Hick's Law": "The time to make a decision increases logarithmically with the number of choices. Reduce options at each decision point — or group and progressively disclose them.",
  "Cognitive: Miller's Law": "The average person can hold approximately 7 (±2) items in working memory at a time. Structure information into chunks that respect this limit.",
  "Cognitive: Fitts's Law": "The time to acquire a target is a function of the target's size and the distance to it. Make important interactive targets large and close to the natural resting position.",
  "Cognitive: Cognitive Load Theory": "Humans have finite mental processing capacity. Reduce extraneous load (caused by poor design) so available capacity can be invested in understanding the content.",
  "Gestalt: Law of Proximity": "Elements placed close together are perceived as belonging to the same group. Spatial distance communicates relational distance.",
  "Gestalt: Law of Similarity": "Elements that share visual characteristics — color, shape, size, typography — are perceived as related. Use similarity consistently to signal relationship.",
  "Gestalt: Law of Common Region": "Elements enclosed within the same defined boundary are perceived as a group, even if they differ in appearance.",
  "Gestalt: Law of Continuity": "The eye follows smooth, continuous paths and prefers to see continuous forms over discontinuous ones. Design visual flow that guides attention in the intended sequence.",
  "Gestalt: Law of Closure": "The human mind tends to complete incomplete shapes and perceive whole objects even when parts are missing — use this deliberately for scroll affordances and progressive reveal.",
  "Gestalt: Figure-Ground": "Humans instinctively separate visual elements into a foreground subject and a background. CTAs and primary content must clearly read as foreground figures.",
  "Emotional: Norman's Visceral Design": "Visceral design governs the immediate emotional response to visual appearance. First impressions form in under 50 milliseconds and strongly influence the rest of the experience.",
  "Emotional: Norman's Behavioral Design": "Behavioral design governs the pleasure and effectiveness of use. The interface must support efficient, error-free, and satisfying task completion.",
  "Emotional: Norman's Reflective Design": "Reflective design governs the meaning and self-image users project onto a product. The brand experience must feel aspirational and consistent with users' self-perception.",
  "Emotional: Fogg's Surface Credibility": "Users judge trustworthiness based on visual appearance alone in the first seconds of contact. Professional, consistent design signals competence and legitimacy.",
  "Emotional: Fogg's Earned Credibility": "Trust accumulates through positive interactions over time. Reliability, transparency, and consistency build the credibility that converts skeptics into advocates.",
  "Emotional: Kahneman's Peak-End Rule": "People judge an experience largely based on how they felt at its most intense point and at its end — not the average. Design emotional peaks and endings deliberately.",
  "WCAG 2.2 — Perceivable": "All information and UI components must be presentable in ways users can perceive, including those with visual, auditory, or cognitive disabilities.",
  "WCAG 2.2 — Operable": "All UI components and navigation must be operable by users who cannot use a mouse, including keyboard-only and switch-access users.",
  "WCAG 2.2 — Understandable": "Information and the operation of the UI must be understandable to all users — language must be clear and errors must be specific and actionable.",
  "WCAG 2.2 — Robust": "Content must be robust enough to be interpreted by a wide variety of user agents, including current and future assistive technologies.",
  "Mobile: Apple HIG Touch Targets": "Apple Human Interface Guidelines specify a minimum touch target size of 44×44 points to prevent tap errors on touchscreen devices.",
  "Mobile: Material Design Touch Targets": "Google Material Design 3 specifies a minimum interactive touch target of 48×48 density-independent pixels for all interactive components.",
  "Mobile: Thumb Zone Accessibility": "Most mobile users hold their phone with one hand. Primary actions should be reachable by the right thumb in the lower portion of the screen without repositioning the grip.",
  "Mobile: Gesture Conflict Prevention": "Custom swipe gestures must not conflict with system navigation gestures such as iOS back-swipe or Android's gesture navigation bar.",
  "Mobile: Minimum Font Size": "Body text on mobile should be at least 16px to remain legible at typical arm-length viewing distances without requiring the user to zoom.",
  "Mobile: Optimal Line Length": "Comfortable mobile reading requires 45–75 characters per line. Lines shorter or longer than this range measurably impair reading speed and comprehension.",
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'input' | 'capturing' | 'analyzing' | 'results' | 'error'
type InputMode = 'file' | 'url'
type FrameworkStatus = 'pending' | 'active' | 'complete'

interface FrameworkStep {
  id: HeuristicFrameworkId
  status: FrameworkStatus
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === 'critical') return '#FF4D4D'
  if (s === 'high') return '#FF8C42'
  if (s === 'medium') return '#FFD166'
  return '#94A3B8'
}

function severityBg(s: string) {
  if (s === 'critical') return 'rgba(255,77,77,0.12)'
  if (s === 'high') return 'rgba(255,140,66,0.12)'
  if (s === 'medium') return 'rgba(255,209,102,0.12)'
  return 'rgba(148,163,184,0.12)'
}

function SeverityIcon({ s }: { s: string }) {
  if (s === 'critical') return <AlertCircle size={14} />
  if (s === 'high') return <AlertTriangle size={14} />
  if (s === 'medium') return <Info size={14} />
  return <CheckCircle size={14} />
}

function scoreColor(score: number) {
  if (score >= 75) return '#00C9A7'
  if (score >= 50) return '#FFD166'
  return '#FF4D4D'
}

function gradeFromScore(score: number) {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ scores, includesMobile }: { scores: HeuristicFrameworkScore[]; includesMobile: boolean }) {
  const n = scores.length
  const cx = 160
  const cy = 160
  const R = 110
  const labelR = 142

  function getPoint(i: number, fraction: number) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    return {
      x: cx + fraction * R * Math.cos(angle),
      y: cy + fraction * R * Math.sin(angle),
    }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  const scorePts = scores.map((s, i) => getPoint(i, s.score / 100))
  const scorePolygon = scorePts.map(p => `${p.x},${p.y}`).join(' ')

  const idOrder: HeuristicFrameworkId[] = ['nielsen', 'baymard', 'wcag', 'gestalt', 'cognitive', 'emotional', 'mobile']
  const orderedScores = idOrder
    .filter(id => includesMobile || id !== 'mobile')
    .map(id => scores.find(s => s.id === id))
    .filter(Boolean) as HeuristicFrameworkScore[]

  const orderedPts = orderedScores.map((s, i) => getPoint(i, s.score / 100))
  const orderedPolygon = orderedPts.map(p => `${p.x},${p.y}`).join(' ')

  const frameworkLabels = orderedScores.map((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    const lx = cx + labelR * Math.cos(angle)
    const ly = cy + labelR * Math.sin(angle)
    const meta = FRAMEWORK_META[s.id]
    return { x: lx, y: ly, label: meta.shortLabel, score: s.score, color: meta.color, angle }
  })

  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: '320px', overflow: 'visible' }}>
      {/* Grid */}
      {gridLevels.map((level, gi) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, level)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon key={gi} points={pts} fill="none"
            stroke={level === 1.0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={level === 1.0 ? 1 : 0.8} />
        )
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const outer = getPoint(i, 1.0)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
      })}

      {/* Score polygon fill */}
      <polygon points={orderedPolygon}
        fill={`${ACCENT}22`} stroke={ACCENT} strokeWidth={2}
        strokeLinejoin="round" />

      {/* Score dots */}
      {orderedPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4}
          fill={ACCENT} stroke="var(--bg-base)" strokeWidth={1.5} />
      ))}

      {/* Labels */}
      {frameworkLabels.map((fl, i) => {
        let anchor: 'start' | 'middle' | 'end' = 'middle'
        if (fl.x < cx - 20) anchor = 'end'
        if (fl.x > cx + 20) anchor = 'start'
        return (
          <g key={i}>
            <text x={fl.x} y={fl.y - 4} textAnchor={anchor}
              fontSize="9" fontWeight="600" fill={fl.color}
              fontFamily="var(--font-body)">
              {fl.label}
            </text>
            <text x={fl.x} y={fl.y + 8} textAnchor={anchor}
              fontSize="8" fill="rgba(255,255,255,0.5)"
              fontFamily="var(--font-body)">
              {fl.score}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = scoreColor(score)
  const grade = gradeFromScore(score)
  return (
    <svg viewBox="0 0 140 140" style={{ width: '140px', height: '140px' }}>
      <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={70} y={65} textAnchor="middle" fontSize="26" fontWeight="700"
        fill={color} fontFamily="var(--font-heading)">{score}</text>
      <text x={70} y={82} textAnchor="middle" fontSize="13" fontWeight="600"
        fill="rgba(255,255,255,0.5)" fontFamily="var(--font-body)">Grade {grade}</text>
    </svg>
  )
}

// ─── Finding Card ─────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: HeuristicFinding }) {
  const [expanded, setExpanded] = useState(false)
  const sc = severityColor(finding.severity)
  const sb = severityBg(finding.severity)

  return (
    <div style={{
      border: `1px solid ${finding.isConvergent ? sc + '60' : 'var(--bg-border)'}`,
      borderLeft: `3px solid ${sc}`,
      borderRadius: '10px',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
      >
        {/* Severity badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: sb, color: sc,
          padding: '3px 8px', borderRadius: '4px',
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
          marginTop: '2px',
        }}>
          <SeverityIcon s={finding.severity} />
          {finding.severity}
        </div>

        {/* Title + convergent tag */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 600,
              color: 'var(--text-primary)', lineHeight: 1.4,
            }}>
              {finding.title}
            </span>
            {finding.isConvergent && (
              <span style={{
                background: `${ACCENT}22`, color: ACCENT,
                border: `1px solid ${ACCENT}60`,
                padding: '2px 7px', borderRadius: '4px',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                ⚡ Convergent Violation
              </span>
            )}
          </div>

          {/* Citation pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
            {finding.citations.map((c, ci) => {
              const meta = FRAMEWORK_META[c.framework]
              return (
                <span key={ci} style={{
                  background: `${meta.color}18`,
                  color: meta.color,
                  border: `1px solid ${meta.color}40`,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {meta.icon}
                  {c.principle}
                </span>
              )
            })}
          </div>
        </div>

        <div style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: '2px' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--bg-border)',
          padding: '16px 20px',
          display: 'grid', gap: '16px',
        }}>
          {[
            { label: 'Observation', text: finding.observation, color: 'var(--text-primary)' },
            { label: 'User Impact', text: finding.userImpact, color: '#FFD166' },
            { label: 'Recommendation', text: finding.recommendation, color: '#00C9A7' },
            { label: 'Real-World Example', text: finding.realWorldExample, color: 'var(--text-secondary)' },
          ].map(({ label, text, color }) => (
            <div key={label}>
              <p style={{
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px',
                fontFamily: 'var(--font-body)',
              }}>
                {label}
              </p>
              <p style={{ fontSize: '14px', color, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Framework Scorecard ──────────────────────────────────────────────────────

function FrameworkScorecard({ scores }: { scores: HeuristicFrameworkScore[] }) {
  const includesMobile = scores.some(s => s.id === 'mobile')

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '12px',
      padding: '28px',
    }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600,
        color: 'var(--text-primary)', marginBottom: '24px',
      }}>
        Framework Scorecard
      </h2>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Radar chart */}
        <div style={{ display: 'flex', justifyContent: 'center', minWidth: '220px', flex: '0 0 auto' }}>
          <RadarChart scores={scores} includesMobile={includesMobile} />
        </div>

        {/* Framework rows */}
        <div style={{ flex: 1, minWidth: '260px', display: 'grid', gap: '10px' }}>
          {scores.map(s => {
            const meta = FRAMEWORK_META[s.id]
            const sc = scoreColor(s.score)
            return (
              <div key={s.id} style={{
                display: 'grid', gap: '4px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: meta.color, fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
                    {meta.icon}
                    {meta.label}
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: 700, color: sc,
                    fontFamily: 'var(--font-heading)', minWidth: '32px', textAlign: 'right',
                  }}>{s.score}</span>
                </div>
                {/* Score bar */}
                <div style={{
                  height: '3px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '2px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${s.score}%`, height: '100%',
                    background: sc, borderRadius: '2px',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <p style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', lineHeight: 1.4, marginTop: '2px',
                }}>
                  {s.topFinding}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Principles Glossary ──────────────────────────────────────────────────────

function PrinciplesGlossary({ findings }: { findings: HeuristicFinding[] }) {
  const [open, setOpen] = useState(false)

  // Collect all cited principles
  const cited = new Set<string>()
  findings.forEach(f => f.citations.forEach(c => cited.add(c.principle)))

  // Filter glossary to cited principles only, then sort
  const entries = Object.entries(PRINCIPLES_GLOSSARY)
    .filter(([key]) => [...cited].some(c => c.includes(key) || key.includes(c.split(':')[1]?.trim() || c)))
    .sort(([a], [b]) => a.localeCompare(b))

  // If no cited principles match exactly, show all cited
  const displayEntries = entries.length > 0
    ? entries
    : Object.entries(PRINCIPLES_GLOSSARY).slice(0, 12)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} color={ACCENT} />
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Principles Reference Glossary
          </span>
          <span style={{
            background: `${ACCENT}22`, color: ACCENT,
            padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
          }}>
            {Object.keys(PRINCIPLES_GLOSSARY).length} principles
          </span>
        </div>
        {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{
          borderTop: '1px solid var(--bg-border)',
          padding: '20px 24px',
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        }}>
          {Object.entries(PRINCIPLES_GLOSSARY).map(([principle, definition]) => {
            const isCited = [...cited].some(c => c === principle || principle.startsWith(c.split(':')[0]))
            const meta = Object.values(FRAMEWORK_META).find(m =>
              principle.toLowerCase().startsWith(m.shortLabel.toLowerCase().split(' ')[0]) ||
              (principle.startsWith('Nielsen') && m.label.includes('Nielsen')) ||
              (principle.startsWith('WCAG') && m.label.includes('WCAG')) ||
              (principle.startsWith('Gestalt') && m.label.includes('Gestalt')) ||
              (principle.startsWith('Cognitive') && m.label.includes('Cognitive')) ||
              (principle.startsWith('Emotional') && m.label.includes('Emotional')) ||
              (principle.startsWith('Mobile') && m.label.includes('Mobile'))
            )
            return (
              <div key={principle} style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: isCited ? `${meta?.color ?? ACCENT}0D` : 'var(--bg-elevated)',
                border: `1px solid ${isCited ? (meta?.color ?? ACCENT) + '30' : 'var(--bg-border)'}`,
              }}>
                <p style={{
                  fontSize: '12px', fontWeight: 600, color: meta?.color ?? 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', marginBottom: '4px',
                }}>
                  {principle}
                </p>
                <p style={{
                  fontSize: '13px', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', lineHeight: 1.55,
                }}>
                  {definition}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Analyzing View ───────────────────────────────────────────────────────────

function AnalyzingView({
  steps,
  deviceContext,
  scanImageUrl,
}: {
  steps: FrameworkStep[]
  deviceContext: HeuristicDeviceContext
  scanImageUrl: string
}) {
  return (
    <div style={{
      display: 'flex', gap: '40px', alignItems: 'flex-start',
      maxWidth: '1200px', margin: '60px auto', padding: '0 24px',
      flexWrap: 'wrap',
    }}>
      {/* Left: icon + title + framework steps */}
      <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: `${ACCENT}1A`, border: `2px solid ${ACCENT}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'hePulse 2s ease-in-out infinite',
          }}>
            <Sparkles size={22} color={ACCENT} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Heuristic Evaluation in Progress
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Sequential framework-by-framework analysis — up to 60 seconds
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps
            .filter(s => deviceContext === 'Desktop' ? s.id !== 'mobile' : true)
            .map((step, i) => {
              const meta = FRAMEWORK_META[step.id]
              const isActive = step.status === 'active'
              const isDone = step.status === 'complete'
              return (
                <div key={step.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', borderRadius: '10px',
                  background: isActive ? `${meta.color}12` : 'var(--bg-surface)',
                  border: `1px solid ${isActive ? meta.color + '50' : 'var(--bg-border)'}`,
                  transition: 'all 0.3s ease',
                  opacity: step.status === 'pending' ? 0.45 : 1,
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: isDone ? '#00C9A7' : isActive ? meta.color : 'var(--bg-elevated)',
                    border: `1px solid ${isDone ? '#00C9A7' : isActive ? meta.color : 'var(--bg-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.3s',
                    animation: isActive ? 'hePulse 1.5s ease-in-out infinite' : 'none',
                  }}>
                    {isDone
                      ? <CheckCircle size={14} color="#fff" />
                      : <span style={{ color: isActive ? '#fff' : 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
                          {i + 1}
                        </span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: isDone ? '#00C9A7' : isActive ? meta.color : 'var(--text-muted)', marginBottom: '2px' }}>
                      {meta.label}
                    </p>
                    {isActive && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                        {meta.desc}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: isDone ? '#00C9A7' : isActive ? meta.color : 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isDone ? 'Complete' : isActive ? 'Evaluating...' : 'Pending'}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {/* Right: scanning preview */}
      {scanImageUrl && (
        <div style={{ flex: '0 0 650px', minWidth: '300px' }}>
          <ScanningPreview
            imageUrl={scanImageUrl}
            isFullPage={scanImageUrl.startsWith('data:image') && scanImageUrl.length > 50000}
            height={350}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HeuristicEvaluationPage() {
  const [appState, setAppState] = useState<AppState>('input')
  const [inputMode, setInputMode] = useState<InputMode>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string>('')
  const [targetUrl, setTargetUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [pageType, setPageType] = useState<HeuristicPageType>('Homepage')
  const [deviceContext, setDeviceContext] = useState<HeuristicDeviceContext>('Desktop')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [report, setReport] = useState<HeuristicReport | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const ALL_FRAMEWORK_IDS: HeuristicFrameworkId[] = ['nielsen', 'baymard', 'wcag', 'gestalt', 'cognitive', 'emotional', 'mobile']
  const [frameworkSteps, setFrameworkSteps] = useState<FrameworkStep[]>(
    ALL_FRAMEWORK_IDS.map(id => ({ id, status: 'pending' as FrameworkStatus }))
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── File handling ──

  function handleFile(f: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return
    setSelectedFile(f)
    const objUrl = URL.createObjectURL(f)
    setPreviewUrl(objUrl)
    setScanPreviewUrl(objUrl)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  // ── Framework step animation ──

  function startStepAnimation() {
    let current = 0
    const ids = deviceContext === 'Desktop'
      ? ALL_FRAMEWORK_IDS.filter(id => id !== 'mobile')
      : ALL_FRAMEWORK_IDS

    setFrameworkSteps(ALL_FRAMEWORK_IDS.map(id => ({ id, status: 'pending' as FrameworkStatus })))

    // Activate first step immediately
    setFrameworkSteps(prev => prev.map((s, i) => ({
      ...s,
      status: s.id === ids[0] ? 'active' : 'pending',
    })))

    stepTimerRef.current = setInterval(() => {
      current++
      if (current >= ids.length) {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current)
        return
      }
      setFrameworkSteps(prev => prev.map(s => {
        const idx = ids.indexOf(s.id)
        if (idx < current) return { ...s, status: 'complete' }
        if (idx === current) return { ...s, status: 'active' }
        return { ...s, status: 'pending' }
      }))
    }, 8500)
  }

  function completeAllSteps() {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    setFrameworkSteps(ALL_FRAMEWORK_IDS.map(id => ({ id, status: 'complete' as FrameworkStatus })))
  }

  // ── Run evaluation ──

  async function runEvaluation() {
    if (inputMode === 'file' && !selectedFile) return
    if (inputMode === 'url' && !targetUrl.trim()) return

    setError('')
    startStepAnimation()

    let base64: string | null = null
    let dataUrl: string | null = null

    if (inputMode === 'url') {
      setAppState('capturing')
      try {
        const capForm = new FormData()
        capForm.append('url', targetUrl)
        const capRes = await fetch('/api/capture', {
          method: 'POST',
          body: capForm,
        })
        if (!capRes.ok) throw new Error('Failed to capture URL')
        const capData = await capRes.json()
        base64 = capData.screenshotBase64
        dataUrl = capData.screenshotDataUrl ?? capData.screenshotUrl
        setScanPreviewUrl(dataUrl || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'URL capture failed')
        setAppState('error')
        return
      }
    }

    setAppState('analyzing')

    try {
      const fd = new FormData()
      fd.append('pageType', pageType)
      fd.append('deviceContext', deviceContext)
      if (primaryGoal.trim()) fd.append('primaryGoal', primaryGoal.trim())

      if (base64 && dataUrl) {
        fd.append('screenshotBase64', base64)
        fd.append('screenshotDataUrl', dataUrl)
      } else if (selectedFile) {
        fd.append('screenshot', selectedFile)
      }

      const res = await fetch('/api/heuristic', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Analysis failed')
      }
      const data: HeuristicReport = await res.json()
      completeAllSteps()
      setReport(data)
      setAppState('results')

      // Save to local history + Supabase (best-effort)
      const historyRecord = {
        audit_type: 'heuristic_evaluation',
        title: inputMode === 'url' ? targetUrl : selectedFile?.name ?? 'Screenshot',
        url: inputMode === 'url' ? targetUrl : null,
        overall_score: data.overallScore,
        total_issues: data.findings.length,
        critical_count: data.severityCounts.critical,
        high_count: data.severityCounts.high,
        medium_count: data.severityCounts.medium,
        minor_count: data.severityCounts.minor,
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
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setAppState('error')
    }
  }

  // ── Copy share link ──

  function copyLink() {
    if (!report) return
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/heuristic-evaluation?id=${report.id}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  // ── Filtered findings ──

  const filteredFindings = report?.findings.filter(f =>
    filterSeverity === 'all' || f.severity === filterSeverity
  ) ?? []

  // ──────────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        @keyframes hePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes heSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span style={{ color: 'var(--bg-border)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={14} color={ACCENT} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Heuristic Evaluation
            </span>
          </div>
        </div>

        {appState === 'results' && report && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                const { generatePDF } = await import('@/lib/pdf-export')
                await generatePDF('heuristic-report-container', `oculus-heuristic-${report.id}.pdf`)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '6px', border: 'none',
                background: 'var(--brand-primary)', color: '#fff', fontSize: '13px', cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 11v1.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="11" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `oculus-heuristic-${report.id}.json`; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '6px',
                background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 10V13H13V10M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export JSON
            </button>
            <button onClick={copyLink} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '6px',
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => { setAppState('input'); setReport(null); setSelectedFile(null); setPreviewUrl(''); setScanPreviewUrl(''); setTargetUrl('') }}
              style={{
                padding: '7px 14px', borderRadius: '6px',
                background: `${ACCENT}18`, border: `1px solid ${ACCENT}50`,
                color: ACCENT, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              New Evaluation
            </button>
          </div>
        )}
      </div>

      {/* ── INPUT STATE ── */}
      {appState === 'input' && (
        <div style={{ maxWidth: '680px', margin: '0', padding: '12px 24px', animation: 'heSlideIn 0.4s ease' }}>
          <div style={{ textAlign: 'left', marginBottom: '36px' }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: '10px',
            }}>
              Heuristic Evaluation
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Deep, principle-by-principle examination across 7 UX research frameworks —
              every finding traced to a named law, researcher, or institution.
            </p>
          </div>

          {/* Input mode toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg-elevated)',
            borderRadius: '8px', padding: '3px', marginBottom: '20px',
          }}>
            {(['file', 'url'] as InputMode[]).map(m => (
              <button key={m} onClick={() => setInputMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                background: inputMode === m ? 'var(--bg-surface)' : 'none',
                color: inputMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {m === 'file' ? <><Upload size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Upload Screenshot</> : <><Link2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Enter URL</>}
              </button>
            ))}
          </div>

          {/* Upload zone */}
          {inputMode === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${isDragging ? ACCENT : selectedFile ? ACCENT + '80' : 'var(--bg-border)'}`,
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? `${ACCENT}08` : 'var(--bg-surface)',
                transition: 'all 0.2s',
                marginBottom: '20px',
              }}
            >
              {selectedFile ? (
                <div>
                  {previewUrl && <img src={previewUrl} alt="Preview" style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '8px', marginBottom: '10px', objectFit: 'contain' }} />}
                  <p style={{ fontSize: '14px', color: ACCENT, fontWeight: 600 }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Click to change</p>
                </div>
              ) : (
                <div>
                  <Upload size={32} color={ACCENT} style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '6px' }}>
                    Drop screenshot here or click to upload
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>PNG, JPG, WebP · Max 10MB</p>
                </div>
              )}
            </div>
          )}

          {inputMode === 'url' && (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://your-website.com"
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Oculus captures a full-page screenshot automatically using a headless browser.
              </p>
            </div>
          )}

          {/* Context configuration panel */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: ACCENT, marginBottom: '20px',
              fontFamily: 'var(--font-body)',
            }}>
              Evaluation Context
            </p>

            {/* Page type */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Page Type
              </label>
              <select
                value={pageType}
                onChange={e => setPageType(e.target.value as HeuristicPageType)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: '14px',
                  outline: 'none', cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                {PAGE_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>

            {/* Device context */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Device Context
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['Desktop', 'Mobile', 'Both'] as HeuristicDeviceContext[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDeviceContext(d)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '8px',
                      border: `1px solid ${deviceContext === d ? ACCENT : 'var(--bg-border)'}`,
                      background: deviceContext === d ? `${ACCENT}18` : 'var(--bg-elevated)',
                      color: deviceContext === d ? ACCENT : 'var(--text-secondary)',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary goal */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Primary Goal <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={primaryGoal}
                onChange={e => setPrimaryGoal(e.target.value)}
                placeholder='e.g. "Users should complete a subscription purchase"'
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
                  borderRadius: '8px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                A one-sentence description of the page's conversion intent. Findings will be weighted against whether the design serves this goal.
              </p>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runEvaluation}
            disabled={(inputMode === 'file' && !selectedFile) || (inputMode === 'url' && !targetUrl.trim())}
            style={{
              width: '100%', padding: '14px',
              background: ((inputMode === 'file' && selectedFile) || (inputMode === 'url' && targetUrl.trim()))
                ? 'linear-gradient(135deg, #FF8C42, #FF4D9D)'
                : 'var(--bg-elevated)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontSize: '15px', fontWeight: 700,
              cursor: ((inputMode === 'file' && selectedFile) || (inputMode === 'url' && targetUrl.trim())) ? 'pointer' : 'not-allowed',
              opacity: ((inputMode === 'file' && selectedFile) || (inputMode === 'url' && targetUrl.trim())) ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Sparkles size={18} />
            Run Heuristic Evaluation
          </button>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {/* ── CAPTURING STATE ── */}
      {appState === 'capturing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: `${ACCENT}1A`, border: `2px solid ${ACCENT}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'hePulse 1.5s ease-in-out infinite',
          }}>
            <Link2 size={22} color={ACCENT} />
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Capturing page...
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Rendering full-page screenshot via headless browser</p>
        </div>
      )}

      {/* ── ANALYZING STATE ── */}
      {appState === 'analyzing' && (
        <AnalyzingView steps={frameworkSteps} deviceContext={deviceContext} scanImageUrl={scanPreviewUrl} />
      )}

      {/* ── ERROR STATE ── */}
      {appState === 'error' && (
        <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <AlertCircle size={40} color="#FF4D4D" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Evaluation Failed
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => setAppState('input')} style={{
            padding: '10px 24px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}50`,
            borderRadius: '8px', color: ACCENT, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── RESULTS STATE ── */}
      {appState === 'results' && report && (
        <div id="heuristic-report-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px 60px', animation: 'heSlideIn 0.5s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Evaluation Summary */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: '12px',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Score ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <ScoreRing score={report.overallScore} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Heuristic Score</span>
              </div>

              {/* Severity counts + verdict */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {(['critical', 'high', 'medium', 'minor'] as const).map(s => (
                    <div key={s} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: severityBg(s), border: `1px solid ${severityColor(s)}40`,
                      padding: '5px 12px', borderRadius: '20px',
                      fontSize: '13px', fontWeight: 600, color: severityColor(s),
                    }}>
                      <SeverityIcon s={s} />
                      {report.severityCounts[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                    </div>
                  ))}
                </div>

                <p style={{
                  fontSize: '14px', color: 'var(--text-secondary)',
                  lineHeight: 1.7, fontFamily: 'var(--font-body)',
                  borderLeft: `3px solid ${ACCENT}`, paddingLeft: '14px',
                }}>
                  {report.narrativeVerdict}
                </p>
              </div>
            </div>

            {/* Context tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--bg-border)' }}>
              {[
                { label: report.pageType, color: ACCENT },
                { label: report.deviceContext, color: '#4ECDC4' },
                ...(report.primaryGoal ? [{ label: `Goal: ${report.primaryGoal}`, color: '#94A3B8' }] : []),
              ].map(({ label, color }) => (
                <span key={label} style={{
                  background: `${color}18`, color, border: `1px solid ${color}40`,
                  padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Framework Scorecard */}
          <FrameworkScorecard scores={report.frameworkScores} />

          {/* Findings */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Findings <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 400 }}>({filteredFindings.length})</span>
              </h2>

              {/* Severity filter */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'critical', 'high', 'medium', 'minor'].map(f => (
                  <button key={f} onClick={() => setFilterSeverity(f)} style={{
                    padding: '5px 12px', borderRadius: '20px',
                    border: `1px solid ${filterSeverity === f ? (f === 'all' ? ACCENT : severityColor(f)) : 'var(--bg-border)'}`,
                    background: filterSeverity === f ? (f === 'all' ? `${ACCENT}20` : `${severityColor(f)}15`) : 'var(--bg-elevated)',
                    color: filterSeverity === f ? (f === 'all' ? ACCENT : severityColor(f)) : 'var(--text-muted)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    transition: 'all 0.15s',
                  }}>
                    {f}
                    {f !== 'all' && ` (${report.severityCounts[f as keyof typeof report.severityCounts]})`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredFindings.map(finding => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </div>

          {/* Screenshot */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
            borderRadius: '12px', padding: '20px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Evaluated Screenshot
            </p>
            <img src={report.screenshotUrl} alt="Evaluated screenshot"
              style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
          </div>

          {/* Principles Glossary */}
          <PrinciplesGlossary findings={report.findings} />
        </div>
      )}
    </div>
  )
}
