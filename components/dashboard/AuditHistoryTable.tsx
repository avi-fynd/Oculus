'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { getLocalAuditHistory, type LocalAuditRecord } from '@/lib/local-history'

const auditTypeLabels: Record<string, { label: string; color: string }> = {
  screenshot_audit: { label: 'Screenshot', color: 'var(--card-screenshot)' },
  website_audit: { label: 'Website', color: 'var(--card-website)' },
  heuristic_evaluation: { label: 'Heuristic', color: 'var(--card-heuristic)' },
  heatmap_attention: { label: 'Heatmap', color: 'var(--card-heatmap)' },
  ab_testing: { label: 'A/B Test', color: 'var(--card-abtesting)' },
}

function ScoreCircle({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
  const color = score >= 80 ? 'var(--severity-low)' : score >= 50 ? 'var(--severity-medium)' : 'var(--severity-critical)'
  return (
    <span style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      fontWeight: 700,
      color,
    }}>
      {score}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateStr))
}

interface Props {
  limit?: number
  showViewAll?: boolean
}

export default function AuditHistoryTable({ limit = 10, showViewAll = true }: Props) {
  const [audits, setAudits] = useState<LocalAuditRecord[]>([])

  useEffect(() => {
    setAudits(getLocalAuditHistory())
  }, [])

  const displayed = audits.slice(0, limit)

  return (
    <div style={{ padding: '32px' }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--brand-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 500,
        marginBottom: '20px',
      }}>
        RECENT AUDITS
      </p>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {displayed.length === 0 ? (
          <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Search size={40} color="var(--text-muted)" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>No audits yet</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>Run your first audit above to see your history here.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 80px 140px 160px 110px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--bg-border)',
              padding: '12px 20px',
              gap: '12px',
            }}>
              {['Audit Type', 'Title / URL', 'Score', 'Issues', 'Date', 'Status'].map(col => (
                <span key={col} style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Rows */}
            {displayed.map((audit, i) => {
              const typeInfo = auditTypeLabels[audit.audit_type] || { label: audit.audit_type, color: 'var(--brand-primary)' }
              const isLast = i === displayed.length - 1
              return (
                <div
                  key={audit.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 80px 140px 160px 110px',
                    padding: '14px 20px',
                    gap: '12px',
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid var(--bg-border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{
                    background: typeInfo.color + '1A',
                    color: typeInfo.color,
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: '50px',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}>
                    {typeInfo.label}
                  </span>

                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {audit.title}
                    </p>
                    {audit.url && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {audit.url.length > 40 ? audit.url.slice(0, 40) + '…' : audit.url}
                      </p>
                    )}
                  </div>

                  <ScoreCircle score={audit.overall_score} />

                  <div>
                    {audit.critical_count > 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--severity-critical)' }}>
                        {audit.critical_count} Critical
                      </span>
                    )}
                    {audit.critical_count > 0 && audit.high_count > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>}
                    {audit.high_count > 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--severity-high)' }}>
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
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: '50px',
                    textTransform: 'capitalize',
                    display: 'inline-block',
                  }}>
                    {audit.status}
                  </span>
                </div>
              )
            })}

            {showViewAll && audits.length > limit && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--bg-border)', textAlign: 'right' }}>
                <a href="/dashboard/reports" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--brand-secondary)', textDecoration: 'none' }}>
                  View all {audits.length} audits →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
