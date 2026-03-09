import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import { BentoGrid, UxLawsSection, Footer } from '@/components/LandingSections'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <HeroSection />
        <BentoGrid />
        <UxLawsSection />
      </main>
      <Footer />
    </div>
  )
}
