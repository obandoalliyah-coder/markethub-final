import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  if (!session) redirect('/auth/signin')
  if (session.user?.role !== 'ADMIN') redirect('/vendor/dashboard')

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-52 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}