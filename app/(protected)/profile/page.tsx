import type { Profile } from '@/types'

export const metadata = { title: 'Profile — Oculus' }

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function ProfilePage() {
  let p: Profile | null = null

  if (supabaseConfigured) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      p = data as Profile | null
    }
  }

  return (
    <div style={{ padding: '40px 32px' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '8px' }}>
        ACCOUNT
      </p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: 'var(--text-primary)', marginBottom: '32px' }}>
        Your Profile
      </h1>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '560px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <img
            src={p?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p?.full_name || 'U')}&background=6C63FF&color=fff&size=72`}
            alt="Avatar"
            width={72}
            height={72}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', fontWeight: 600 }}>{p?.full_name}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>{p?.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Full Name', value: p?.full_name || '—' },
            { label: 'Email', value: p?.email || '—' },
            { label: 'Member Since', value: p?.created_at ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(p.created_at)) : '—' },
          ].map(field => (
            <div key={field.label} style={{ borderBottom: '1px solid var(--bg-border)', paddingBottom: '16px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {field.label}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-primary)' }}>
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
