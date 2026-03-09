'use client'

import { useRef, useState } from 'react'

interface ScanningPreviewProps {
  imageUrl: string
  /** Enable auto-scroll for full-page URL screenshots */
  isFullPage?: boolean
  /** Container height in px. Default 400 */
  height?: number
}

export default function ScanningPreview({
  imageUrl,
  isFullPage = false,
  height = 400,
}: ScanningPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scrollDuration, setScrollDuration] = useState(0)

  function handleImageLoad() {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container || !isFullPage) return

    const containerW = container.clientWidth
    const displayedH = (img.naturalHeight / img.naturalWidth) * containerW
    const dist = Math.max(0, displayedH - height)

    if (dist > 0) {
      // ~55px per second feels natural for a page scan
      setScrollDuration(Math.min(dist / 55, 28))
    }
  }

  return (
    <>
      <style>{`
        @keyframes scanLineMove {
          0%   { top: -2px; opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scanGlowMove {
          0%   { top: -80px; }
          100% { top: 100%; }
        }
        @keyframes scanPageScroll {
          0%   { transform: translateY(0); }
          80%  { transform: translateY(var(--scroll-end)); }
          90%  { transform: translateY(var(--scroll-end)); }
          100% { transform: translateY(0); }
        }
        @keyframes scanBadgePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: `${height}px`,
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid rgba(108,99,255,0.3)',
          background: 'var(--bg-elevated)',
          boxShadow: '0 0 40px rgba(108,99,255,0.1)',
          flexShrink: 0,
        }}
      >
        {/* Screenshot */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Scanning preview"
          onLoad={handleImageLoad}
          style={{
            width: '100%',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            ...(scrollDuration > 0 ? {
              // @ts-ignore CSS custom property
              '--scroll-end': `calc(-100% + ${height}px)`,
              animation: `scanPageScroll ${scrollDuration}s ease-in-out infinite`,
              animationDelay: '0.3s',
            } : {}),
          } as React.CSSProperties}
        />

        {/* Glow trail — follows the scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '80px',
            background:
              'linear-gradient(to bottom, rgba(108,99,255,0.18) 0%, rgba(108,99,255,0.06) 55%, transparent 100%)',
            animation: 'scanGlowMove 2.4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Hard scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '2px',
            background:
              'linear-gradient(to right, transparent 0%, #6C63FF 20%, #8B5CF6 50%, #6C63FF 80%, transparent 100%)',
            boxShadow: '0 0 14px rgba(108,99,255,0.9), 0 0 28px rgba(108,99,255,0.4)',
            animation: 'scanLineMove 2.4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* Top vignette */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '48px',
            background: 'linear-gradient(to bottom, var(--bg-elevated) 0%, transparent 100%)',
            zIndex: 4, pointerEvents: 'none',
          }}
        />

        {/* Bottom vignette */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
            background: 'linear-gradient(to top, var(--bg-elevated) 0%, transparent 100%)',
            zIndex: 4, pointerEvents: 'none',
          }}
        />

        {/* "AI Scanning" badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(8,8,14,0.82)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108,99,255,0.55)',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#8B5CF6',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            zIndex: 5,
            animation: 'scanBadgePulse 1.8s ease-in-out infinite',
            fontFamily: 'var(--font-body)',
          }}
        >
          ● AI Scanning
        </div>
      </div>
    </>
  )
}
