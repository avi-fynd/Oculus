import { redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import type { Profile } from '@/types'

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null

  if (supabaseConfigured) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = data as Profile | null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header profile={profile} />
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}
