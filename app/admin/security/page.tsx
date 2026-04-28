'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function AdminSecurityPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('Please fill in all fields.')
      return
    }

    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    if (form.currentPassword === form.newPassword) {
      toast.error('New password must be different from current password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          password: form.newPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update password.')
        return
      }

      toast.success('Password updated successfully!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const PasswordInput = ({
    label,
    field,
    showKey,
  }: {
    label: string
    field: keyof typeof form
    showKey: keyof typeof show
  }) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-2 focus-within:border-[#1e4d2b] focus-within:ring-1 focus-within:ring-[#1e4d2b] transition-colors bg-gray-50">
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder="••••••••"
          className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Security</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account password.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="bg-[#1e4d2b]/10 p-2.5 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#1e4d2b]" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Choose a strong password of at least 8 characters.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput label="Current Password" field="currentPassword" showKey="current" />
          <PasswordInput label="New Password" field="newPassword" showKey="new" />
          <PasswordInput label="Confirm New Password" field="confirmPassword" showKey="confirm" />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}