'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck, CheckCircle, XCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    const res = await fetch('/api/vendor/notifications')
    if (res.ok) setNotifications(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  async function markRead(id: string) {
    const res = await fetch(`/api/vendor/notifications/${id}/read`, { method: 'PUT' })
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      window.dispatchEvent(new Event('notificationsUpdated'))
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.isRead)
    await Promise.all(unread.map((n) => fetch(`/api/vendor/notifications/${n.id}/read`, { method: 'PUT' })))
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    window.dispatchEvent(new Event('notificationsUpdated'))
    toast.success('All notifications marked as read.')
  }

  const typeIcon = (type: string) => {
    if (type.includes('APPROVED')) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (type.includes('REJECTED')) return <XCircle className="h-5 w-5 text-red-500" />
    if (type.includes('VERIFIED')) return <CheckCircle className="h-5 w-5 text-blue-500" />
    return <Info className="h-5 w-5 text-gray-400" />
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4 text-[#1e4d2b]" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  n.isRead ? 'bg-white' : 'bg-green-50/50'
                }`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors mt-0.5 shadow-sm"
                  >
                    <span className="flex items-center gap-1.5"><CheckCheck className="w-3.5 h-3.5"/> Mark Read</span>
                  </button>
                )}
                {n.isRead && (
                  <span className="shrink-0 h-2 w-2 rounded-full bg-gray-200 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}