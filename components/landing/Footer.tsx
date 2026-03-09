export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--bg-border)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-muted)',
      }}>
        © 2026 Oculus. Built for UX designers.
      </p>
    </footer>
  )
}
