'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import Logo from '../ui/Logo'
import UserDropdown from './UserDropdown'
import type { Profile } from '@/types'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/reports', label: 'Reports' },
]

interface HeaderProps {
  profile: Profile | null
}

export default function Header({ profile }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--bg-border)',
      height: '64px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 32px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>

          <nav className="hidden md:flex" style={{ gap: '4px', display: 'flex' }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '6px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: pathname === link.href ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (pathname !== link.href) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (pathname !== link.href) e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px', borderRadius: '50%' }}>
            <Bell size={20} />
          </button>
          <UserDropdown profile={profile} />
        </div>
      </div>
    </header>
  )
}
