'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Logo from '../ui/Logo'
import Input from '../ui/Input'
import Button from '../ui/Button'

function getPasswordStrength(pwd: string): { label: string; width: string; color: string } {
  if (pwd.length === 0) return { label: '', width: '0%', color: 'transparent' }
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd)
  if (pwd.length >= 8 && hasSpecial) return { label: 'Strong', width: '100%', color: 'var(--severity-low)' }
  if (pwd.length >= 8) return { label: 'Medium', width: '66%', color: 'var(--severity-medium)' }
  return { label: 'Weak', width: '33%', color: 'var(--severity-critical)' }
}

export default function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const strength = getPasswordStrength(password)

  const validate = () => {
    let valid = true
    setNameError('')
    setEmailError('')
    setPasswordError('')
    if (!name.trim()) { setNameError('Full name is required'); valid = false }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Please enter a valid email address'); valid = false }
    if (!password || password.length < 8) { setPasswordError('Password must be at least 8 characters'); valid = false }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        setSuccess(true)
        toast.success('Account created! Check your email.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '400px', margin: '0 auto', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>📧</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--text-primary)' }}>Check your email</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          We've sent you a confirmation link. Click it to activate your account and get started.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <Logo style={{ marginBottom: '32px' }} />

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
        Create your account.
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Start auditing UX for free. No credit card needed.
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          error={nameError}
        />
        <Input
          label="Work email"
          type="email"
          placeholder="jane@company.com"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={emailError}
        />

        <div>
          <Input
            label="Create password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={passwordError}
            rightElement={
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          {password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', background: 'var(--bg-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '4px', transition: 'width 0.3s, background 0.3s' }} />
              </div>
              <p style={{ marginTop: '4px', fontSize: '12px', color: strength.color, fontFamily: 'var(--font-body)' }}>{strength.label}</p>
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Create Account
        </Button>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--bg-border)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--bg-border)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', background: 'transparent', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>
      </form>

      <p style={{ marginTop: '28px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--brand-secondary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign in →
        </Link>
      </p>
    </div>
  )
}
