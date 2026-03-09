'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  rightElement?: React.ReactNode
}

export default function Input({ label, error, hint, rightElement, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <label style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: 500,
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          {...props}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 14px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--text-primary)',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'var(--severity-critical)' : 'var(--bg-border)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            paddingRight: rightElement ? '48px' : '14px',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand-primary)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--severity-critical)' : 'var(--bg-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {rightElement && (
          <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '13px', color: 'var(--error)', fontFamily: 'var(--font-body)' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{hint}</span>
      )}
    </div>
  )
}
