'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '../ui/Logo'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background: 'rgba(10,10,15,0.3)',
      borderBottom: '1px solid var(--bg-border)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
          <Link
            href="/login"
            style={{
              padding: '8px 18px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              padding: '8px 18px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--brand-secondary)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(108,99,255,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--brand-primary)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid var(--bg-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '250px',
          marginLeft: 'auto',
        }}>
          <Link
            href="/login"
            style={{
              padding: '12px',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 500,
              color: '#fff',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              padding: '12px',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--brand-primary)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}
