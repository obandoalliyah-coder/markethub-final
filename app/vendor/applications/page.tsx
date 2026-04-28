'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, Store, CreditCard, RefreshCw, AlertTriangle, X, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Stall {
  id: string
  stallNumber: string
  location: string
  monthlyRate: number
}

interface Application {
  id: string
  stallId: string
  status: string
  applicationType: string
  applicationDate: string
  approvalDate?: string
  contractStart?: string
  contractEnd?: string
  stall: Stall
}

// Returns how many days until contractEnd. Negative = already expired.
function daysUntilExpiry(contractEnd: string): number {
  const end = new Date(contractEnd)
  const now = new Date()
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history'>('active')

  // Renewal modal state
  const [renewModal, setRenewModal] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null })
  const [renewBusinessType, setRenewBusinessType] = useState('')
  const [renewNotes, setRenewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Outstanding balance block modal
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; amount: number; count: number }>({
    open: false, amount: 0, count: 0,
  })

  useEffect(() => { fetchApplications() }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/vendor/applications')
      if (response.ok) setApplications(await response.json())
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  // Active = APPROVED applications that are the latest contract (NEW or RENEWAL)
  const activeLeases = applications.filter((app) => app.status === 'APPROVED')
  const pendingApps = applications.filter((app) => app.status === 'PENDING')
  const historyApps = applications.filter((app) =>
    app.status === 'REJECTED' || app.status === 'EXPIRED'
  )

  function handleRenewClick(app: Application) {
    setRenewBusinessType('')
    setRenewNotes('')
    setRenewModal({ open: true, app })
  }

  async function handleRenewSubmit() {
    if (!renewModal.app) return
    if (!renewBusinessType) {
      toast.error('Please select a business type.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/vendor/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stallId: renewModal.app.stallId,
          intendedUseType: renewBusinessType,
          applicationType: 'RENEWAL',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Outstanding balance block
        if (data.outstandingBalance) {
          setRenewModal({ open: false, app: null })
          setBalanceModal({
            open: true,
            amount: data.outstandingBalance,
            count: data.outstandingCount,
          })
        } else {
          toast.error(data.error || 'Failed to submit renewal.')
        }
        return
      }

      toast.success('Renewal application submitted! The admin will review it shortly.')
      setRenewModal({ open: false, app: null })
      fetchApplications()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Stalls</h1>
          <p className="text-gray-500 mt-2">Manage your active leases and track stall applications.</p>
        </div>
        <Link
          href="/vendor/stalls"
          className="bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center"
        >
          Browse More Stalls
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { key: 'active', label: `Active Leases (${activeLeases.length})` },
            { key: 'pending', label: `Pending (${pendingApps.length})` },
            { key: 'history', label: `History (${historyApps.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === key
                  ? 'border-[#1e4d2b] text-[#1e4d2b]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">

          {/* Active Leases */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeLeases.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No active leases right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeLeases.map((app) => {
                    const daysLeft = app.contractEnd ? daysUntilExpiry(app.contractEnd) : null
                    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0
                    const isExpired = daysLeft !== null && daysLeft <= 0
                    const canRenew = isExpiringSoon || isExpired

                    // Check if there's already a pending renewal for this stall
                    const hasPendingRenewal = applications.some(
                      (a) => a.stallId === app.stallId && a.applicationType === 'RENEWAL' && a.status === 'PENDING'
                    )

                    return (
                      <div key={app.id} className="bg-white border border-green-100 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(30,77,43,0.1)] hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-green-100 text-green-700 p-1.5 rounded-lg">
                                <CheckCircle2 className="w-5 h-5" />
                              </span>
                              <h3 className="text-xl font-bold text-gray-900">Stall #{app.stall.stallNumber}</h3>
                            </div>
                            <p className="text-sm text-gray-500 ml-9">{app.stall.location}</p>
                          </div>
                          <span className="bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-green-200">
                            Active
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Monthly Rate</span>
                            <span className="font-semibold">₱{app.stall.monthlyRate.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Contract Start</span>
                            <span className="font-semibold">
                              {app.contractStart ? new Date(app.contractStart).toLocaleDateString('en-PH') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Contract End</span>
                            <span className={`font-semibold ${isExpiringSoon ? 'text-orange-600' : isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                              {app.contractEnd ? new Date(app.contractEnd).toLocaleDateString('en-PH') : 'N/A'}
                            </span>
                          </div>
                          {daysLeft !== null && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Days Remaining</span>
                              <span className={`font-bold ${isExpiringSoon ? 'text-orange-600' : isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                {isExpired ? 'Expired' : `${daysLeft} days`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Expiry warning banner */}
                        {isExpiringSoon && !hasPendingRenewal && (
                          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-orange-700">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Your contract expires in <strong>{daysLeft} days</strong>. Consider renewing soon.</span>
                          </div>
                        )}
                        {isExpired && !hasPendingRenewal && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-red-700">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Your contract has <strong>expired</strong>. Please renew to keep your stall.</span>
                          </div>
                        )}
                        {hasPendingRenewal && (
                          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-blue-700">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Renewal application is <strong>under review</strong> by admin.</span>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Link
                            href="/vendor/payments"
                            className="flex-1 bg-white border border-gray-200 hover:border-[#1e4d2b] hover:text-[#1e4d2b] text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" /> Payments
                          </Link>
                          <button
                            onClick={() => handleRenewClick(app)}
                            disabled={!canRenew || hasPendingRenewal}
                            className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                              canRenew && !hasPendingRenewal
                                ? 'bg-[#1e4d2b] text-white hover:bg-[#2d6a4f]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={
                              hasPendingRenewal
                                ? 'Renewal pending review'
                                : !canRenew
                                ? `Renewal available 30 days before contract ends`
                                : 'Renew your contract'
                            }
                          >
                            <RefreshCw className="w-4 h-4" />
                            {hasPendingRenewal ? 'Renewal Pending' : 'Renew'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending Applications */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingApps.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">You have no pending applications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingApps.map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-orange-100 bg-orange-50/30 rounded-2xl p-5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-100 text-orange-600 p-3 rounded-xl">
                          {app.applicationType === 'RENEWAL' ? <RefreshCw className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {app.applicationType === 'RENEWAL' ? 'Renewal for' : 'Application for'} Stall #{app.stall.stallNumber}
                            </h3>
                            {app.applicationType === 'RENEWAL' && (
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                Renewal
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Submitted on {new Date(app.applicationDate).toLocaleDateString('en-PH')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:border-l sm:border-orange-100 sm:pl-6 ml-auto">
                        <div className="text-sm">
                          <p className="text-gray-500">Monthly Rate</p>
                          <p className="font-bold">₱{app.stall.monthlyRate.toLocaleString()}</p>
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-orange-200">
                          Pending Review
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {historyApps.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-medium">No application history found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {historyApps.map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-200 rounded-2xl p-5 gap-4 opacity-75">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 text-gray-500 p-3 rounded-xl">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">Stall #{app.stall.stallNumber}</h3>
                            {app.applicationType === 'RENEWAL' && (
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                Renewal
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">Applied on {new Date(app.applicationDate).toLocaleDateString('en-PH')}</p>
                        </div>
                      </div>
                      <div className="sm:border-l sm:border-gray-200 sm:pl-6 ml-auto">
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-gray-200">
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Renew Modal */}
      {renewModal.open && renewModal.app && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setRenewModal({ open: false, app: null })}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-5 h-5 text-[#1e4d2b]" />
                <h2 className="text-2xl font-bold text-gray-900">Renew Contract</h2>
              </div>
              <p className="text-sm text-gray-500">
                Renewing <strong className="text-gray-900">Stall #{renewModal.app.stall.stallNumber}</strong> for another 1 year.
              </p>
            </div>

            <div className="bg-[#1e4d2b]/5 border border-[#1e4d2b]/10 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Rate</span>
                <span className="font-semibold">₱{renewModal.app.stall.monthlyRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">New Contract Duration</span>
                <span className="font-semibold">1 Year</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">Business Type</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4d2b]"
                  value={renewBusinessType}
                  onChange={(e) => setRenewBusinessType(e.target.value)}
                >
                  <option value="">Select Business Type</option>
                  <option>Vegetables & Fruits</option>
                  <option>Meat & Seafood</option>
                  <option>Dry Goods</option>
                  <option>Cooked Food</option>
                  <option>Clothing & Apparel</option>
                  <option>Hardware & Tools</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  placeholder="Any additional information..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] resize-none"
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleRenewSubmit}
                disabled={submitting}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#1e4d2b]/20"
              >
                {submitting ? 'Submitting...' : 'Submit Renewal Application'}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-snug">
                Your renewal will be reviewed by the admin. You will be notified once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Balance Block Modal */}
      {balanceModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Outstanding Balance</h2>
            <p className="text-sm text-gray-500 mb-4">
              You have <strong className="text-red-600">{balanceModal.count} unpaid payment{balanceModal.count > 1 ? 's' : ''}</strong> totaling:
            </p>
            <p className="text-3xl font-bold text-red-600 mb-4">
              ₱{balanceModal.amount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You must settle all outstanding payments before you can renew your contract.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBalanceModal({ open: false, amount: 0, count: 0 })}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Close
              </button>
              <Link
                href="/vendor/payments"
                onClick={() => setBalanceModal({ open: false, amount: 0, count: 0 })}
                className="flex-1 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Pay Now
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
