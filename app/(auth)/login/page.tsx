import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = { title: 'Sign In — Oculus' }

export default function LoginPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect('/dashboard')
  return <LoginForm />
}
