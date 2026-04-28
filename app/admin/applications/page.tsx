'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, FileText, Download, UserPlus, RefreshCw } from 'lucide-react'

interface Application {
  id: string
  status: string
  intendedUseType: string | null
  applicationType?: string
  applicationDate: string
  contractStart: string | null
  contractEnd: string | null
  rejectionReason: string | null
  vendor: {
    id: string
    businessName: string
    businessType: string
    ownerName: string
    user: { name: string; email: string }
    businessPermit?: string
    validId?: string
  }
  stall: {
    id: string
    stallNumber: string
    location: string
    size: string | null
    monthlyRate: number
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    PENDING: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [processing, setProcessing] = useState(false)

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [rejectReason, setRejectReason] = useState('')

  // Document Preview Modal
  const [docModal, setDocModal] = useState<{ open: boolean; url: string; title: string }>({ open: false, url: '', title: '' })

  // Generate payment modal
  const [payModal, setPayModal] = useState<{
    open: boolean
    app: Application | null
  }>({ open: false, app: null })
  const [payAmount, setPayAmount] = useState('')
  const [payDueDate, setPayDueDate] = useState('')
  const [payMonth, setPayMonth] = useState('')
  const [payYear, setPayYear] = useState(new Date().getFullYear().toString())

  async function fetchApplications(status: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/applications?status=${status}`)
      if (res.ok) setApplications(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApplications(filter) }, [filter])

  async function handleApprove(id: string) {
    setProcessing(true)
    const res = await fetch(`/api/admin/applications/${id}/approve`, { method: 'PUT' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Application approved! Stall marked as Occupied.')
      fetchApplications(filter)
    } else {
      toast.error(data.error || 'Failed to approve.')
    }
    setProcessing(false)
  }

  async function handleReject() {
    if (!rejectReason) {
      toast.error('Please specify a rejection reason.')
      return
    }
    setProcessing(true)
    const res = await fetch(`/api/admin/applications/${rejectModal.id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Application rejected.')
      setRejectModal({ open: false, id: '' })
      setRejectReason('')
      fetchApplications(filter)
    } else {
      toast.error(data.error || 'Failed to reject.')
    }
    setProcessing(false)
  }

  function openPayModal(app: Application) {
    setPayModal({ open: true, app })
    setPayAmount(app.stall.monthlyRate.toString())
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setPayDueDate(end.toISOString().split('T')[0])
    setPayMonth((now.getMonth() + 1).toString())
    setPayYear(now.getFullYear().toString())
  }

  async function handleGeneratePayment() {
    if (!payModal.app || !payAmount || !payDueDate) {
      toast.error('Amount and due date are required.')
      return
    }
    setProcessing(true)
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: payModal.app.vendor.id,
        stallId: payModal.app.stall.id,
        applicationId: payModal.app.id,
        amount: payAmount,
        dueDate: payDueDate,
        paymentType: 'MONTHLY',
        month: payMonth ? parseInt(payMonth) : null,
        year: payYear ? parseInt(payYear) : null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Payment record created and vendor notified!')
      setPayModal({ open: false, app: null })
    } else {
      toast.error(data.error || 'Failed to create payment.')
    }
    setProcessing(false)
  }

  const handleShowDoc = (e: React.MouseEvent, docUrl: string | undefined, title: string) => {
    e.stopPropagation()
    if (docUrl) {
      setDocModal({ open: true, url: docUrl, title })
    } else {
      toast.error('Document not uploaded.')
    }
  }

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unified Applications Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review unified records of New and Renewed stall applications.</p>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === tab
                ? 'bg-[#1e4d2b] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium">
            No {filter.toLowerCase()} applications in the queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor & Docs</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stall & Rates</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      {app.applicationType === 'Renewal' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 w-fit">
                          <RefreshCw className="w-3.5 h-3.5" /> Renewal
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 w-fit">
                          <UserPlus className="w-3.5 h-3.5" /> New App
                        </span>
                      )}
                      <p className="text-[11px] text-gray-400 mt-2">{new Date(app.applicationDate).toLocaleDateString()}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{app.vendor.businessName}</p>
                      <p className="text-xs text-gray-500 mb-2">{app.vendor.user.name}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleShowDoc(e, app.vendor.businessPermit || 'dummy.jpg', 'Business Permit')}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          <FileText className="w-3 h-3" /> Permit
                        </button>
                        <button 
                          onClick={(e) => handleShowDoc(e, app.vendor.validId || 'dummy.jpg', 'Valid ID')}
                          className="flex items-center gap-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          <FileText className="w-3 h-3" /> ID
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1e4d2b]">Stall #{app.stall.stallNumber}</p>
                      <p className="text-xs text-gray-500 mb-0.5">{app.intendedUseType || app.vendor.businessType}</p>
                      <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                        ₱{app.stall.monthlyRate.toLocaleString()}/mo
                      </p>
                    </td>

                    <td className="px-5 py-4"><StatusBadge status={app.status} /></td>

                    <td className="px-5 py-4 text-right align-top">
                      {app.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={processing}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal({ open: true, id: app.id }); setRejectReason('') }}
                            disabled={processing}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {app.status === 'APPROVED' && (
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => openPayModal(app)}
                            disabled={processing}
                            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Generate Payment
                          </button>
                        </div>
                      )}
                      
                      {app.status === 'REJECTED' && (
                        <div className="text-xs text-gray-500 max-w-[150px] text-right truncate bg-gray-50 p-2 rounded ml-auto" title={app.rejectionReason || 'No reason provided'}>
                          {app.rejectionReason || 'Rejected based on review'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setRejectModal({ open: false, id: '' })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Reject Request</h2>
            <p className="text-sm text-gray-500 mb-4">Provide a clear reason for the vendor.</p>
            <textarea
              rows={4}
              placeholder="e.g. Missing required municipal documents..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2 mt-5">
              <button onClick={() => setRejectModal({ open: false, id: '' })} className="flex-1 text-gray-600 font-semibold text-sm hover:bg-gray-100 rounded-xl py-2.5 transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={processing} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-60 transition-colors shadow-sm">
                {processing ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Reviewer Modal */}
      {docModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" /> Document Viewer - {docModal.title}
              </h2>
              <div className="flex gap-2">
                <a href={docModal.url} download className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Download className="w-5 h-5" />
                </a>
                <button onClick={() => setDocModal({ open: false, url: '', title: '' })} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-100 flex-1 overflow-auto flex justify-center items-center">
               <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" alt="Document Preview" className="max-w-full max-h-full rounded-lg shadow-sm" /> 
            </div>
          </div>
        </div>
      )}

      {/* Generate Payment Modal (Existing omitted mostly for brevity but preserved structure) */}
      {payModal.open && payModal.app && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button onClick={() => setPayModal({ open: false, app: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Generate Payment</h2>
            <p className="text-sm text-gray-500 mb-4 text-balance">
              For <strong>{payModal.app.vendor.user.name}</strong> — Stall #{payModal.app.stall.stallNumber}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1 uppercase tracking-wider">Amount (₱) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4d2b] focus:ring-1 focus:ring-[#1e4d2b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1 uppercase tracking-wider">Due Date *</label>
                    <input
                      type="date"
                      value={payDueDate}
                      onChange={(e) => setPayDueDate(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4d2b] focus:ring-1 focus:ring-[#1e4d2b]"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1 uppercase tracking-wider">Month</label>
                    <select
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4d2b] focus:ring-1 focus:ring-[#1e4d2b]"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                 </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setPayModal({ open: false, app: null })} className="flex-1 text-gray-600 font-semibold text-sm hover:bg-gray-100 rounded-xl py-2.5 transition-colors">Cancel</button>
              <button onClick={handleGeneratePayment} disabled={processing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-60 shadow-sm transition-colors">
                {processing ? 'Creating...' : 'Create Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}