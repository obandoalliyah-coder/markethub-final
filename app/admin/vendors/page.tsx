'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, AlertTriangle, Search, Ban, FileText, User, RefreshCw, Phone, History, X } from 'lucide-react'
import { toast } from 'sonner'

interface VendorProfile {
  id: string
  businessName: string
  businessType: string
  contactNumber: string
  status: string
  userId: string
  profileImage?: string
  user: {
    email: string
    name: string
    role: string
  }
}

interface StallApplication {
  id: string
  status: string
  applicationType: string
  contractStart: string | null
  contractEnd: string | null
  stall: {
    stallNumber: string
    location: string
  }
}

export default function VendorsManagementPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null)
  const [stallHistory, setStallHistory] = useState<StallApplication[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchVendors()
    const interval = setInterval(fetchVendors, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/admin/vendors?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
      })
      if (response.ok) setVendors(await response.json())
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setIsLoading(false)
    }
  }

  async function openVendorModal(vendor: VendorProfile) {
    setSelectedVendor(vendor)
    setStallHistory([])
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/applications`)
      if (res.ok) setStallHistory(await res.json())
    } catch {
      toast.error('Failed to load stall history.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAction = async (vendorId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      setVendors(prev =>
        prev.map(v =>
          v.id === vendorId
            ? { ...v, status: action === 'SUSPEND' ? 'SUSPENDED' : action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
            : v
        )
      )
      toast.success(`Vendor ${action.toLowerCase()}d successfully.`)
    } catch {
      toast.error('Action failed.')
    }
  }

  const handlePassReset = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/reset-password`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { tempPassword } = await res.json()
      toast.success(`Password reset. Temp password: ${tempPassword}`, { duration: 10000 })
    } catch {
      toast.error('Failed to reset password.')
    }
  }

  const filteredVendors = vendors.filter(v => {
    const matchesSearch =
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' ? true : v.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getHistoryStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-700',
      PENDING: 'bg-orange-100 text-orange-700',
      REJECTED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`text-xs font-bold px-2 py-1 rounded ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Directory</h1>
        <p className="text-gray-500 mt-1 text-sm">Review registrations, manage statuses, and track stall histories.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor name, business, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto items-center">
          <button
            onClick={() => { toast.info('Refreshing...'); fetchVendors() }}
            className="p-2.5 rounded-lg text-gray-500 hover:text-[#1e4d2b] hover:bg-[#1e4d2b]/10 bg-white border border-gray-200 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {['all', 'PENDING', 'APPROVED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                filterStatus === s
                  ? s === 'all' ? 'bg-[#1e4d2b] text-white'
                  : s === 'PENDING' ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'all' ? 'All Vendors' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business / Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No vendors found matching your search or filter.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1e4d2b]/10 flex items-center justify-center text-[#1e4d2b] font-bold overflow-hidden shrink-0 border border-gray-100">
                          {vendor.profileImage ? (
                            <img src={vendor.profileImage} alt="pfp" className="w-full h-full object-cover" />
                          ) : (
                            vendor.businessName.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{vendor.businessName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> {vendor.user.name || 'No Name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium flex items-center gap-1.5 mb-0.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {vendor.contactNumber}
                      </div>
                      <div className="text-xs text-gray-500">{vendor.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        vendor.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        vendor.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {vendor.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                        {vendor.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {vendor.status === 'REJECTED' && <AlertTriangle className="w-3 h-3" />}
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {vendor.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleAction(vendor.id, 'APPROVE')} className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              Approve
                            </button>
                            <button onClick={() => handleAction(vendor.id, 'REJECT')} className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openVendorModal(vendor)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-[#1e4d2b] font-bold">
                  {selectedVendor.profileImage ? (
                    <img src={selectedVendor.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    selectedVendor.businessName.charAt(0)
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedVendor.businessName}</h2>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Owner Name</p>
                  <p className="font-semibold text-gray-900">{selectedVendor.user.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-semibold text-gray-900">{selectedVendor.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-semibold text-gray-900">{selectedVendor.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-semibold text-gray-900">{selectedVendor.businessType}</p>
                </div>
              </div>

              {/* Stall History */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 flex items-center gap-2">
                  <History className="w-5 h-5" /> Stall History
                </div>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e4d2b]" />
                  </div>
                ) : stallHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No stall applications found for this vendor.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-gray-500 font-medium">Stall</th>
                        <th className="px-4 py-3 text-gray-500 font-medium">Type</th>
                        <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                        <th className="px-4 py-3 text-gray-500 font-medium">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stallHistory.map((app) => (
                        <tr key={app.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            #{app.stall.stallNumber}
                            <p className="text-xs text-gray-400 font-normal">{app.stall.location}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${app.applicationType === 'RENEWAL' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {app.applicationType === 'RENEWAL' ? 'Renewal' : 'New'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{getHistoryStatusBadge(app.status)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {app.contractStart && app.contractEnd
                              ? `${new Date(app.contractStart).toLocaleDateString('en-PH')} – ${new Date(app.contractEnd).toLocaleDateString('en-PH')}`
                              : app.contractStart
                              ? `Started ${new Date(app.contractStart).toLocaleDateString('en-PH')}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-red-800 flex items-center gap-2 border-b border-red-200 pb-2">
                  <Ban className="w-4 h-4" /> Account Controls (Danger Zone)
                </h3>
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => handlePassReset(selectedVendor.id)}
                    className="bg-white border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Force Password Reset
                  </button>
                  <button
                    onClick={() => handleAction(selectedVendor.id, 'SUSPEND')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" /> Suspend Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}