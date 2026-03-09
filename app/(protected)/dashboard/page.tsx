import GreetingBanner from '@/components/dashboard/GreetingBanner'
import FeatureGrid from '@/components/dashboard/FeatureGrid'
import AuditHistoryTable from '@/components/dashboard/AuditHistoryTable'
import type { Profile } from '@/types'

export const metadata = { title: 'Dashboard — Oculus' }

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function DashboardPage() {
  let firstName = 'there'

  if (supabaseConfigured) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      firstName = (profile as Profile | null)?.full_name?.split(' ')[0] || 'there'
    }
  }

  return (
    <div style={{ paddingBottom: '64px' }}>
      <GreetingBanner firstName={firstName} />
      <FeatureGrid />
      <AuditHistoryTable />
    </div>
  )
}
