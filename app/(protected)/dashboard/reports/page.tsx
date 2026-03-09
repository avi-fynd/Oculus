'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Trash2 } from 'lucide-react'
import { getLocalAuditHistory, type LocalAuditRecord } from '@/lib/local-history'

const auditTypeLabels: Record<string, { label: string; color: string; href: string }> = {
  screenshot_audit:    { label: 'Screenshot',  color: 'var(--card-screenshot)',  href: '/dashboard/screenshot-audit' },
  website_audit:       { label: 'Website',      color: 'var(--card-website)',     href: '/dashboard/website-audit' },
  heuristic_evaluation:{ label: 'Heuristic',   color: 'var(--card-heuristic)',   href: '/dashboard/heuristic-evaluation' },
  heatmap_attention:   { label: 'Heatmap',      color: 'var(--card-heatmap)',     href: '/dashboard/heatmap' },
  ab_testing:          { label: 'A/B Test',     color: 'var(--card-abtesting)',   href: '/dashboard/ab-testing' },
}

const ALL_TYPES = Object.keys(auditTypeLabels)

function ScoreCircle({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
  const color = score >= 80 ? 'var(--severity-low)' : score >= 50 ? 'var(--severity-medium)' : 'var(--severity-critical)'
  return (
    <span style={{
      width: '38px', height: '38px', borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color,
    }}>
      {score}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function ReportsPage() {
  const [allAudits, setAllAudits] = useState<LocalAuditRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    setAllAudits(getLocalAuditHistory())
  }, [])

  const filtered = allAudits.filter(a => {
    const matchType = filterType === 'all' || a.audit_type === filterType
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.url?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchType && matchSearch
  })

  const handleClearAll = () => {
    if (!confirm('Clear all audit history from this device?')) return
    localStorage.removeItem('oculus_audit_history')
    setAllAudits([])
  }

  return (
    <div style={{ padding: '32px', paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back link */}
      <Link href="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '14px',
        textDecoration: 'none', marginBottom: '28px',
      }}>
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: '8px',
          }}>
            Reports
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)' }}>
            All audit reports from this device — {allAudits.length} total
          </p>
        </div>
        {allAudits.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '6px',
              background: 'transparent', border: '1px solid var(--bg-border)',
              color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Trash2 size={14} /> Clear all
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by title or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px', background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)', borderRadius: '8px',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '6px 14px', borderRadius: '50px',
              background: filterType === 'all' ? 'var(--brand-primary)' : 'var(--bg-elevated)',
              color: filterType === 'all' ? '#fff' : 'var(--text-secondary)',
              border: filterType === 'all' ? 'none' : '1px solid var(--bg-border)',
              fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer',
            }}
          >
            All
          </button>
          {ALL_TYPES.map(type => {
            const info = auditTypeLabels[type]
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '6px 14px', borderRadius: '50px',
                  background: filterType === type ? info.color : 'var(--bg-elevated)',
                  color: filterType === type ? '#fff' : 'var(--text-secondary)',
                  border: filterType === type ? 'none' : '1px solid var(--bg-border)',
                  fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                {info.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Search size={44} color="var(--text-muted)" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {allAudits.length === 0 ? 'No audits yet' : 'No matching audits'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>
              {allAudits.length === 0
                ? 'Run an audit from the dashboard to see reports here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 80px 160px 160px 100px 120px',
              background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)',
              padding: '12px 20px', gap: '12px',
            }}>
              {['Type', 'Title / URL', 'Score', 'Issues', 'Date', 'Status', 'Action'].map(col => (
                <span key={col} style={{
                  fontFamily: 'var(--font-body)', fontSize: '12px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--text-muted)', fontWeight: 500,
                }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((audit, i) => {
              const typeInfo = auditTypeLabels[audit.audit_type] || { label: audit.audit_type, color: 'var(--brand-primary)', href: '/dashboard' }
              const isLast = i === filtered.length - 1
              return (
                <div
                  key={audit.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 80px 160px 160px 100px 120px',
                    padding: '14px 20px', gap: '12px', alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid var(--bg-border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    background: typeInfo.color + '1A', color: typeInfo.color,
                    fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500,
                    padding: '4px 10px', borderRadius: '50px', whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}>
                    {typeInfo.label}
                  </span>

                  <div style={{ overflow: 'hidden' }}>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                      color: 'var(--text-primary)', marginBottom: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {audit.title}
                    </p>
                    {audit.url && (
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {audit.url.length > 45 ? audit.url.slice(0, 45) + '…' : audit.url}
                      </p>
                    )}
                  </div>

                  <ScoreCircle score={audit.overall_score} />

                  <div>
                    {audit.critical_count > 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--severity-critical)', display: 'block' }}>
                        {audit.critical_count} Critical
                      </span>
                    )}
                    {audit.high_count > 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--severity-high)', display: 'block' }}>
                        {audit.high_count} High
                      </span>
                    )}
                    {audit.critical_count === 0 && audit.high_count === 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {audit.total_issues} issues
                      </span>
                    )}
                  </div>

                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {formatDate(audit.created_at)}
                  </span>

                  <span style={{
                    background: audit.status === 'completed' ? 'rgba(6,214,160,0.1)' : 'rgba(255,77,79,0.1)',
                    color: audit.status === 'completed' ? 'var(--severity-low)' : 'var(--severity-critical)',
                    fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500,
                    padding: '4px 10px', borderRadius: '50px', textTransform: 'capitalize',
                    display: 'inline-block',
                  }}>
                    {audit.status}
                  </span>

                  <Link
                    href={typeInfo.href}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: '13px',
                      color: 'var(--brand-secondary)', textDecoration: 'none', fontWeight: 500,
                    }}
                  >
                    Run again →
                  </Link>
                </div>
              )
            })}
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'right' }}>
          Showing {filtered.length} of {allAudits.length} audits · Stored locally on this device
        </p>
      )}
    </div>
  )
}
