'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, ExternalLink } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  status: string
  paymentType: string
  dueDate: string
  paidDate: string | null
  proofDocument: string | null
  verificationNotes: string | null
  rejectionReason: string | null
  stall: { stallNumber: string; location: string }
  vendor: { businessName: string; user: { name: string; email: string } }
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-orange-100 text-orange-700',
    REJECTED: 'bg-gray-100 text-gray-700',
  }
  const labels: Record<string, string> = {
    VERIFIED: 'Paid (Verified)',
    SUBMITTED: 'Needs Verification',
    PENDING: 'Awaiting Payment',
    REJECTED: 'Rejected',
  }
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('SUBMITTED')
  const [processing, setProcessing] = useState(false)

  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [rejectReason, setRejectReason] = useState('')

  const [verifyNotes, setVerifyNotes] = useState('')
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; id: string; amount: number; stall: string }>({
    open: false, id: '', amount: 0, stall: '',
  })

  async function fetchPayments(status: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments?status=${status}`)
      if (res.ok) setPayments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments(filter) }, [filter])

  async function handleVerify() {
    setProcessing(true)
    const res = await fetch(`/api/admin/payments/${verifyModal.id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: verifyNotes }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Payment verified!')
      setVerifyModal({ open: false, id: '', amount: 0, stall: '' })
      setVerifyNotes('')
      fetchPayments(filter)
    } else {
      toast.error(data.error || 'Failed to verify.')
    }
    setProcessing(false)
  }

  async function handleReject() {
    setProcessing(true)
    const res = await fetch(`/api/admin/payments/${rejectModal.id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason || 'Payment proof could not be verified.' }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Payment rejected.')
      setRejectModal({ open: false, id: '' })
      setRejectReason('')
      fetchPayments(filter)
    } else {
      toast.error(data.error || 'Failed to reject.')
    }
    setProcessing(false)
  }

  const tabs = ['SUBMITTED', 'VERIFIED', 'PENDING', 'REJECTED']

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review vendor proof of payments, then verify or reject them.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              filter === tab
                ? 'bg-[#1e4d2b] text-white shadow-sm scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab === 'SUBMITTED' ? 'Needs Verification' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50">
            <div className="text-gray-400 font-medium">
              No {filter === 'SUBMITTED' ? 'payments awaiting verification' : filter.toLowerCase() + ' payments'} found.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stall</th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proof & Status</th>
                  {filter === 'SUBMITTED' && (
                    <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-gray-900">{p.vendor.businessName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.vendor.user.name}</p>
                      <p className="text-xs text-gray-400">{p.vendor.user.email}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-[#1e4d2b]">Stall #{p.stall.stallNumber}</p>
                      <p className="text-xs text-gray-500">{p.stall.location}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-gray-900">&#8369;{p.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-600">Due: </span>
                          {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {p.paidDate && (
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-600">Submitted: </span>
                            {new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top space-y-2">
                      <StatusBadge status={p.status} />
                      {p.proofDocument && (
                        <a
                          href={p.proofDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 w-fit text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" /> View Proof
                        </a>
                      )}
                      {p.status === 'REJECTED' && p.rejectionReason && (
                        <p className="text-xs text-red-500 max-w-[200px]">
                          Reason: {p.rejectionReason}
                        </p>
                      )}
                    </td>
                    {filter === 'SUBMITTED' && (
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => setVerifyModal({ open: true, id: p.id, amount: p.amount, stall: p.stall.stallNumber })}
                            disabled={processing}
                            className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Mark Verified
                          </button>
                          <button
                            onClick={() => { setRejectModal({ open: true, id: p.id }); setRejectReason('') }}
                            disabled={processing}
                            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {verifyModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setVerifyModal({ open: false, id: '', amount: 0, stall: '' })}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Verify Payment</h2>
            <p className="text-sm text-gray-500 mb-5">
              Confirm receipt of <strong>&#8369;{verifyModal.amount.toLocaleString()}</strong> for Stall #{verifyModal.stall}.
            </p>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1 uppercase tracking-wider">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Reference number confirmed, receipt matches..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1e4d2b]"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setVerifyModal({ open: false, id: '', amount: 0, stall: '' })}
                className="flex-1 text-gray-600 font-bold hover:bg-gray-100 rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={processing}
                className="flex-1 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-2.5 rounded-xl disabled:opacity-60 shadow-sm transition-colors"
              >
                {processing ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setRejectModal({ open: false, id: '' })}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Reject Proof</h2>
            <p className="text-sm text-gray-500 mb-5">
              The vendor will be notified and can re-upload their proof.
            </p>
            <textarea
              rows={3}
              placeholder="Reason for rejection (e.g. Blurry photo, incorrect amount)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setRejectModal({ open: false, id: '' })}
                className="flex-1 text-gray-600 font-bold hover:bg-gray-100 rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl disabled:opacity-60 shadow-sm transition-colors"
              >
                {processing ? 'Rejecting...' : 'Reject Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}