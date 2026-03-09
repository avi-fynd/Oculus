'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  ImageIcon, Globe, ClipboardList, Flame, GitCompare, Figma, ArrowRight
} from 'lucide-react'
import type { FeatureCard as FeatureCardType } from '@/types'

const iconMap: Record<string, React.ReactNode> = {
  ImageIcon: <ImageIcon size={24} />,
  Globe: <Globe size={24} />,
  ClipboardList: <ClipboardList size={24} />,
  Flame: <Flame size={24} />,
  GitCompare: <GitCompare size={24} />,
  Figma: <Figma size={24} />,
}

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function FeatureCard({ id, title, description, icon, accentColor, href, comingSoon, stats }: FeatureCardType) {
  const [hovered, setHovered] = useState(false)

  const card = (
    <motion.div
      variants={cardVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hovered ? accentColor + '80' : 'var(--bg-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        cursor: comingSoon ? 'default' : 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: hovered && !comingSoon ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered && !comingSoon ? `0 0 24px ${accentColor}14` : 'none',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: accentColor + '1F',
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        color: accentColor,
      }}>
        {iconMap[icon]}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '8px',
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: '20px',
      }}>
        {description}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {stats && (
          <span style={{
            background: accentColor + '1A',
            color: accentColor,
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: '50px',
          }}>
            {stats}
          </span>
        )}
        <ArrowRight
          size={16}
          style={{
            color: hovered ? accentColor : 'var(--text-muted)',
            marginLeft: 'auto',
            transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.2s, color 0.2s',
          }}
        />
      </div>

      {/* Coming Soon overlay */}
      {comingSoon && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,10,15,0.7)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-lg)',
        }}>
          <span style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            padding: '6px 14px',
            borderRadius: '50px',
          }}>
            Coming Soon
          </span>
        </div>
      )}
    </motion.div>
  )

  if (comingSoon) return card

  return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>
}
