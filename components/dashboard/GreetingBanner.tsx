'use client'

import { motion } from 'framer-motion'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  return 'Evening'
}

interface GreetingBannerProps {
  firstName: string
}

export default function GreetingBanner({ firstName }: GreetingBannerProps) {
  return (
    <div style={{ padding: '40px 32px 0' }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--brand-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 500,
        marginBottom: '8px',
      }}>
        DASHBOARD
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(28px, 3vw, 40px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          marginBottom: '8px',
        }}
      >
        Good {getGreeting()}, {firstName}.
      </motion.h1>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
      }}>
        Last Used: Website Audit
      </p>
    </div>
  )
}
