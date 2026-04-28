'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Bell,
  User,
  FileText,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck
} from 'lucide-react'

const vendorLinks = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/stalls', label: 'Stall Application', icon: Store },
  { href: '/vendor/applications', label: 'My Stalls', icon: FileText },
  { href: '/vendor/payments', label: 'Payment Tracking', icon: CreditCard },
  { href: '/vendor/notifications', label: 'Notifications', icon: Bell },
  { href: '/vendor/profile', label: 'Settings', icon: User },
]

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/payments', label: 'Payment Tracking', icon: CreditCard },
  { href: '/admin/stalls', label: 'Stalls Management', icon: Store },
  { href: '/admin/vendors', label: 'User Management', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/security', label: 'Security', icon: ShieldCheck }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const links = isAdmin ? adminLinks : vendorLinks

  const [unreadCount, setUnreadCount] = useState(0)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin && session?.user) {
      // Fetch notifications to get unread count
      const fetchNotifications = async () => {
        try {
          const res = await fetch('/api/vendor/notifications')
          if (res.ok) {
            const data = await res.json()
            const unread = data.filter((n: any) => !n.isRead).length
            setUnreadCount(unread)
          }
        } catch (e) {
          console.error('Failed to fetch notifications', e)
        }
      }
      fetchNotifications()

      // Listen for instant updates from other components
      window.addEventListener('notificationsUpdated', fetchNotifications)

      const fetchProfile = async () => {
         try {
            const res = await fetch('/api/vendor/profile')
            if (res.ok) {
               const data = await res.json()
               setProfileImage(data.profileImage)
            }
         } catch(e){}
      }
      fetchProfile()
      
      const handleProfileUpdate = (e: Event) => {
         const customEvent = e as CustomEvent
         if (customEvent.detail) setProfileImage(customEvent.detail)
         else fetchProfile()
      }
      window.addEventListener('profileUpdated', handleProfileUpdate)
      
      // Setup polling every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => {
         clearInterval(interval)
         window.removeEventListener('notificationsUpdated', fetchNotifications)
         window.removeEventListener('profileUpdated', handleProfileUpdate)
      }
    }
  }, [isAdmin, session?.user?.id])

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-[#163822] flex flex-col z-40 shadow-xl border-r border-[#2d6a4f]">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-6 border-b border-white/10">
        <img src="/logo2.png" alt="MarketHub Logo" className="h-10 w-auto object-contain" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-6 overflow-y-auto space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isNotificationLink = href === '/vendor/notifications'
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-between px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-white shadow-md text-[#1e4d2b]'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#1e4d2b]" : "text-white/70")} />
                {label}
              </div>
              
              {/* Notification Badge */}
              {isNotificationLink && unreadCount > 0 && (
                <span className={cn(
                  "flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors",
                  active ? "bg-red-500 text-white" : "bg-red-500 text-white shadow-sm"
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10 bg-black/10 space-y-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
        
        {/* User Badge */}
        {!isAdmin && session?.user && (
           <div className="flex items-center gap-3 px-1">
             <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border border-white/30 shrink-0 flex items-center justify-center">
               {profileImage ? (
                 <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-5 h-5 text-white/70" />
               )}
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{session.user.name || 'Vendor'}</p>
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Vendor</p>
             </div>
           </div>
        )}

        {isAdmin && session?.user && (
           <div className="flex items-center gap-3 px-1">
             <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 shrink-0 flex items-center justify-center">
                 <User className="w-5 h-5 text-white/70" />
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">Administrator</p>
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Root</p>
             </div>
           </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl text-sm font-semibold text-white/90 bg-white/5 border border-white/10 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-200 shadow-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}