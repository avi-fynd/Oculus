// Client-side localStorage audit history — works without Supabase

export interface LocalAuditRecord {
  id: string
  audit_type: string
  title: string
  url: string | null
  overall_score: number | null
  total_issues: number
  critical_count: number
  high_count: number
  medium_count: number
  minor_count: number
  status: 'completed' | 'failed'
  report_data: unknown
  created_at: string
}

const STORAGE_KEY = 'oculus_audit_history'
const MAX_RECORDS = 100

export function saveAuditToLocalHistory(
  record: Omit<LocalAuditRecord, 'id' | 'created_at'>
): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getLocalAuditHistory()
    const newRecord: LocalAuditRecord = {
      ...record,
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    }
    const updated = [newRecord, ...existing].slice(0, MAX_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore storage errors (private browsing / quota exceeded)
  }
}

export function getLocalAuditHistory(): LocalAuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalAuditRecord[]
  } catch {
    return []
  }
}
