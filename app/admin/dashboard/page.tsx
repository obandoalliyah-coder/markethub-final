'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, Store, CreditCard, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalVendors: number
  approvedVendors: number
  totalStalls: number
  occupiedStalls: number
  pendingApplications: number
  pendingPayments: number
  verifiedPayments: number
  totalRevenue: number
}

interface Payment {
  id: string
  amount: number
  status: string
  dueDate: string
  stall: { stallNumber: string }
  vendor: { businessName: string; user: { name: string } }
}

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: '#22c55e',
  SUBMITTED: '#3b82f6',
  PENDING: '#f97316',
  OVERDUE: '#ef4444',
  REJECTED: '#ef4444',
}

const StatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, string> = {
    VERIFIED: 'Paid',
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    OVERDUE: 'Overdue',
    REJECTED: 'Rejected',
  }
  const colors: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-orange-100 text-orange-700',
    OVERDUE: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, reportsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/reports?type=monthly'),
        fetch('/api/admin/payments'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (reportsRes.ok) {
        const r = await reportsRes.json()
        setMonthlyData(r.monthlyRevenue || [])
      }
      if (paymentsRes.ok) {
        const p = await paymentsRes.json()
        setRecentPayments(p.slice(0, 5))
      }
      setLoading(false)
    }
    load()
  }, [])

  const availableStalls = (stats?.totalStalls || 0) - (stats?.occupiedStalls || 0)
  const overdueStalls = 0 // extend later

  const donutData = [
    { name: 'Occupied', value: stats?.occupiedStalls || 0, color: '#1e4d2b' },
    { name: 'Available', value: availableStalls, color: '#86efac' },
    { name: 'Overdue', value: overdueStalls, color: '#ef4444' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Administrator Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="bg-blue-100 rounded-lg p-2.5">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Vendors</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalVendors || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="bg-orange-100 rounded-lg p-2.5">
            <Store className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Stalls</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.totalStalls || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="bg-yellow-100 rounded-lg p-2.5">
            <CreditCard className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Payments</p>
            <p className="text-3xl font-bold text-gray-800">{stats?.pendingPayments || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="bg-red-100 rounded-lg p-2.5">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Overdue Payments</p>
            <p className="text-3xl font-bold text-gray-800">{overdueStalls}</p>
          </div>
        </div>
      </div>

      {/* Middle row — Recent Payments table + Stall Overview donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Payments</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b">
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Vendor</th>
                <th className="text-left pb-2 font-medium">Stall</th>
                <th className="text-left pb-2 font-medium">Amount</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPayments.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No payments yet</td></tr>
              ) : recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 text-gray-500">{new Date(p.dueDate).toLocaleDateString('en-PH')}</td>
                  <td className="py-2.5 font-medium text-gray-700">{p.vendor.user.name}</td>
                  <td className="py-2.5 text-gray-500">Stall #{p.stall.stallNumber}</td>
                  <td className="py-2.5 font-medium">₱{p.amount.toLocaleString()}</td>
                  <td className="py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-center gap-2 text-xs text-gray-400">
            <Link href="/admin/payments" className="hover:text-[#1e4d2b] flex items-center gap-1">
              View all payments <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stall Overview */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Stall Overview</h2>
          <div className="flex justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — Line chart + Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Activity line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Payment Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₱${v/1000}k`} />
              <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1e4d2b"
                strokeWidth={2}
                dot={{ fill: '#1e4d2b', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment History sidebar */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Payment History</h2>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data</p>
            ) : recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-700">{p.vendor.user.name}</p>
                  <p className="text-xs text-gray-400">Stall #{p.stall.stallNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₱{p.amount.toLocaleString()}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/payments" className="mt-4 block text-center text-xs text-[#1e4d2b] hover:underline">
            View all →
          </Link>
        </div>
      </div>
    </div>
  )
}