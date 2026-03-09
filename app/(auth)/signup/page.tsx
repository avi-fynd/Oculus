import { redirect } from 'next/navigation'
import SignupForm from '@/components/auth/SignupForm'

export const metadata = { title: 'Sign Up — Oculus' }

export default function SignupPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/dashboard')
  return <SignupForm />
}
