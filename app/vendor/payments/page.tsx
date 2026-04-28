'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, CheckCircle } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  paymentType: string
  month: number | null
  year: number | null
  proofDocument: string | null
  stall: { stallNumber: string }
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-orange-100 text-orange-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = {
    VERIFIED: 'Paid',
    SUBMITTED: 'Submitted',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function VendorPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function fetchPayments() {
    const res = await fetch('/api/vendor/payments')
    if (res.ok) setPayments(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  async function handleUploadProof(payment: Payment, file: File) {
    setUploading(payment.id)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('paymentId', payment.id)

      const res = await fetch('/api/vendor/payments/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to upload proof.')
        return
      }

      toast.success('Proof of payment submitted! The admin will verify it shortly.')
      await fetchPayments()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setUploading(null)
      if (fileInputRefs.current[payment.id]) {
        fileInputRefs.current[payment.id]!.value = ''
      }
    }
  }

  const canUpload = (status: string) =>
    status === 'PENDING' || status === 'REJECTED' || status === 'OVERDUE'

  const totalDue = payments
    .filter((p) => ['PENDING', 'OVERDUE'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPaid = payments
    .filter((p) => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payment Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your payment dues and upload proof of payment for admin verification.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Due</p>
          <p className="text-2xl font-bold text-orange-600">&#8369;{totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">&#8369;{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-800">{payments.length}</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">Payment Details</h2>
          <p className="text-xs text-gray-500">Transfer your payment using any of the methods below, then upload your proof of payment.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* GCash */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">GCash</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account Name</span>
                <span className="font-semibold text-gray-800">Luisito R. Navarro</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GCash Number</span>
                <span className="font-semibold text-gray-800">0917 123 4567</span>
              </div>
            </div>
          </div>
          {/* Bank Transfer */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-[#1e4d2b] text-white text-xs font-bold px-2 py-1 rounded">Bank Transfer</div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank</span>
                <span className="font-semibold text-gray-800">Land Bank of the Philippines</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account Name</span>
                <span className="font-semibold text-gray-800">Boac Public Market</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account Number</span>
                <span className="font-semibold text-gray-800">1234-5678-90</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No payment records yet.</p>
            <p className="text-xs mt-1">
              Payment dues will appear here once your stall application is approved
              and admin generates your payment schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Stall', 'Period', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      Stall #{p.stall?.stallNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {p.month && p.year
                        ? `${new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`
                        : p.paymentType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      &#8369;{p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(p.dueDate).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {p.paidDate
                        ? new Date(p.paidDate).toLocaleDateString('en-PH')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      {canUpload(p.status) && (
                        <>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            ref={(el) => { fileInputRefs.current[p.id] = el }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadProof(p, file)
                            }}
                          />
                          <button
                            onClick={() => fileInputRefs.current[p.id]?.click()}
                            disabled={uploading === p.id}
                            className="flex items-center gap-1.5 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-60 whitespace-nowrap"
                          >
                            {uploading === p.id ? (
                              <>
                                <div className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3" />
                                {p.status === 'REJECTED' ? 'Re-upload Proof' : 'Upload Proof'}
                              </>
                            )}
                          </button>
                          {p.status === 'REJECTED' && p.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[160px]">
                              Rejected: {p.rejectionReason}
                            </p>
                          )}
                        </>
                      )}
                      {p.status === 'VERIFIED' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="h-3 w-3" /> Paid
                        </span>
                      )}
                      {p.status === 'SUBMITTED' && (
                        <span className="text-xs text-blue-500 font-medium">Under review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}