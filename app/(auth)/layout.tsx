'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/ui/Logo'

const stats = [
  '700+ UX guidelines evaluated per audit',
  '10 design domains checked in every report',
  '95% human-level accuracy',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [statIndex, setStatIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStatIndex(i => (i + 1) % stats.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
    }}>
      {/* Left panel - hidden on mobile */}
      <div
        className="hidden md:flex"
        style={{
          width: '50%',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--bg-border)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          gap: '48px',
        }}
      >
        <Logo />

        <div style={{ textAlign: 'center', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={statIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                maxWidth: '300px',
              }}
            >
              "{stats[statIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {stats.map((_, i) => (
            <div key={i} style={{
              width: i === statIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === statIndex ? 'var(--brand-primary)' : 'var(--bg-border)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}
