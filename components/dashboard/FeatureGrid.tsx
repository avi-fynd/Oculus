'use client'

import { motion } from 'framer-motion'
import FeatureCard from './FeatureCard'
import type { FeatureCard as FeatureCardType } from '@/types'

const features: FeatureCardType[] = [
  {
    id: 'screenshot_audit',
    title: 'Screenshot Audit',
    description: 'Upload any UI screenshot and get an instant heuristic analysis with severity-ranked issues and recommendations.',
    icon: 'ImageIcon',
    accentColor: 'var(--card-screenshot)',
    href: '/dashboard/screenshot-audit',
    stats: 'Instant results',
  },
  {
    id: 'website_audit',
    title: 'Website Audit',
    description: 'Enter any URL and Oculus captures a full-page screenshot and runs a complete 10-domain UX evaluation.',
    icon: 'Globe',
    accentColor: 'var(--card-website)',
    href: '/dashboard/website-audit',
    stats: 'Live site analysis',
  },
  {
    id: 'heuristic_evaluation',
    title: 'Heuristic Evaluation',
    description: "Upload any URL or Image and get deep-dive evaluation against Nielsen's 10 heuristics, Baymard's 700+ guidelines, and WCAG 2.2 standards.",
    icon: 'ClipboardList',
    accentColor: 'var(--card-heuristic)',
    href: '/dashboard/heuristic-evaluation',
    stats: '700+ guidelines',
  },
  {
    id: 'heatmap_attention',
    title: 'Heatmap Attention',
    description: 'AI-generated attention heatmaps predict where users will look first — powered by eye-tracking neural models.',
    icon: 'Flame',
    accentColor: 'var(--card-heatmap)',
    href: '/dashboard/heatmap',
    stats: '96% accuracy',
  },
  {
    id: 'ab_testing',
    title: 'A/B Testing',
    description: 'Upload two design variants and get a research-backed comparison showing which performs better and why.',
    icon: 'GitCompare',
    accentColor: 'var(--card-abtesting)',
    href: '/dashboard/ab-testing',
    stats: 'Side-by-side analysis',
  },
  {
    id: 'figma_plugin',
    title: 'Figma Plugin',
    description: 'Audit any Figma frame directly inside your design workflow without switching tools or exporting files.',
    icon: 'Figma',
    accentColor: 'var(--card-figma)',
    href: '#',
    comingSoon: true,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function FeatureGrid() {
  return (
    <div style={{ padding: '32px 32px 0' }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--brand-secondary)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 500,
        marginBottom: '20px',
      }}>
        TOOLS
      </p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
        className="feature-grid"
      >
        {features.map(feature => (
          <FeatureCard key={feature.id} {...feature} />
        ))}
      </motion.div>

      <style>{`
        @media (max-width: 1024px) {
          .feature-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
