export type AuditType =
  | 'screenshot_audit'
  | 'website_audit'
  | 'heuristic_evaluation'
  | 'heatmap_attention'
  | 'ab_testing'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  created_at: string
  updated_at: string
}

export interface AuditHistoryItem {
  id: string
  user_id: string
  audit_type: AuditType
  title: string
  url: string | null
  screenshot_url: string | null
  overall_score: number | null
  total_issues: number
  critical_count: number
  high_count: number
  medium_count: number
  minor_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  report_data: Record<string, unknown> | null
  created_at: string
}

export interface FeatureCard {
  id: AuditType | 'figma_plugin'
  title: string
  description: string
  icon: string
  accentColor: string
  href: string
  comingSoon?: boolean
  stats?: string
}
