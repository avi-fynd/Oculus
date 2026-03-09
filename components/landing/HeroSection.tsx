'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const words = ['Find', 'UX', 'Flaws', 'Before', 'Your', 'Users', 'Do']

const featureCards = [
  { icon: '🔍', title: 'Heuristic Analysis', desc: '700+ research-backed rules' },
  { icon: '♿', title: 'WCAG Accessibility', desc: 'WCAG 2.2 AA UI compliance' },
  { icon: '📄', title: 'PDF Reports', desc: 'Downloadable audit reports' },
]

export default function HeroSection() {
  return (
    <>
    <style>{`
      @keyframes arcPulse {
        0% { box-shadow: inset 0 -4px 20px rgba(168,85,247,0.4), 0 20px 80px rgba(120,0,255,0.2); border-bottom-color: rgba(168,85,247,0.3); }
        100% { box-shadow: inset 0 -4px 30px rgba(168,85,247,0.6), 0 30px 100px rgba(120,0,255,0.4); border-bottom-color: rgba(168,85,247,0.6); }
      }
      @keyframes float1 {
        0%, 100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(-40px,30px) scale(1.1); }
        66% { transform: translate(20px,-20px) scale(0.9); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(40px,-30px) scale(1.15); }
      }
    `}</style>
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '140px 24px 80px',
      overflow: 'hidden',
    }}>
      {/* Glowing Arc */}
      <div style={{
        position: 'absolute',
        top: '-400px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200%',
        height: '600px',
        borderBottomLeftRadius: '50%',
        borderBottomRightRadius: '50%',
        boxShadow: 'inset 0 -4px 20px rgba(168,85,247,0.4), 0 20px 80px rgba(120,0,255,0.2)',
        borderBottom: '2px solid rgba(168,85,247,0.3)',
        animation: 'arcPulse 4s ease-in-out infinite alternate',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute', top: '-150px', right: '-150px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0) 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '50px', left: '-150px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
        animation: 'float2 10s ease-in-out infinite',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
        background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(108,99,255,0.2), transparent)',
        pointerEvents: 'none',
      }} />

<div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            background: 'rgba(108,99,255,0.12)',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '50px',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--brand-secondary)',
            marginBottom: '28px',
          }}
        >
          <span>✦</span> AI-Powered UX Analysis
        </motion.div>

        {/* Animated H1 */}
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(40px, 7vw, 72px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.1,
          marginBottom: '24px',
        }}>
          {words.map((word, i) => (
            <motion.span
              key={word + i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              style={{ display: 'inline-block', marginRight: '0.25em' }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}
        >
          Get an instant, research-backed UX audits in seconds! Just upload a screenshot or paste a URL. The model is trained with Baymard Institute, Nielsen Norman, and WCAG 2.2 standards.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}
        >
          <Link
            href="/signup"
            style={{
              padding: '14px 28px',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 32px rgba(139,92,246,0.35)',
            }}
          >
            Get Started for Free
          </Link>
          <a
            href="#how-it-works"
            style={{
              padding: '14px 28px',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
          >
            Watch Demo
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          ✦ No credit card required &nbsp;✦ 3 free audits/month &nbsp;✦ Results in under 30 seconds
        </motion.p>
      </div>

      {/* Feature cards row */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: '16px',
          marginTop: '64px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '900px',
          padding: '0 16px',
        }}
      >
        {featureCards.map((card) => (
          <div key={card.title} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flex: '1',
            minWidth: '270px',
            maxWidth: '300px',
          }}>
            <span style={{ fontSize: '28px' }}>{card.icon}</span>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {card.title}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
    </>
  )
}
