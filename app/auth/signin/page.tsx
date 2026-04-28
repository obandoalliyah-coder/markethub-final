'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { User, Lock, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Fetch session to determine role and redirect
    const res = await fetch('/api/auth/session')
    const session = await res.json()
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else {
      router.push('/vendor/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1600&q=80)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-1">
            <img src="/logo.png" alt="MarketHub Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-gray-500 text-sm mt-1">Please login to your account.</p>
        </div>

        {registered && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            Account created! You can now sign in.
          </div>
        )}

        {error && (
          <div className="mb-4 flex flex-col gap-3">
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {error}
            </div>
            <Link
              href="/stalls"
              className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold py-2 rounded-lg transition-colors border border-gray-300"
            >
              Continue as Guest to View Stalls
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-2 focus-within:border-[#1e4d2b] transition-colors">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              name="email"
              type="email"
              placeholder="Username or Email Address"
              required
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-2 focus-within:border-[#1e4d2b] transition-colors">
              <Lock className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-5">
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#1e4d2b] font-semibold hover:underline">
              Register
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            Or{' '}
            <Link href="/stalls" className="text-[#1e4d2b] font-semibold hover:underline">
              Browse stalls as a guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}