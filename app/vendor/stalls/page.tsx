'use client'

import { useEffect, useState } from 'react'
import { X, MapPin, Maximize, CircleDollarSign, Info, ArrowRight, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

interface Stall {
  id: string
  stallNumber: string
  location: string
  size: string | null
  monthlyRate: number
  status: string
  images: string | null
  productType: string | null
}

interface ApplicationForm {
  stallId: string
  stallNumber: string
  businessType: string
  productType: string | null
  notes: string
}

function parseImages(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function ImageCarousel({ images, height = 'h-40' }: { images: string[]; height?: string }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return (
      <div className={`${height} bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-2`}>
        <ImageOff className="w-8 h-8" />
        <span className="text-xs">No photos available</span>
      </div>
    )
  }

  return (
    <div className={`${height} relative overflow-hidden bg-gray-100`}>
      <Image
        src={images[current]}
        alt={`Stall photo ${current + 1}`}
        fill
        className="object-contain transition-opacity duration-300"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function VendorStallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<ApplicationForm>({
    stallId: '',
    stallNumber: '',
    businessType: '',
    productType: null,
    notes: '',
  })

  useEffect(() => {
    fetch('/api/vendor/stalls')
      .then((r) => r.json())
      .then((data) => { setStalls(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleApplyClick(stall: Stall) {
    setForm({ 
      stallId: stall.id, 
      stallNumber: stall.stallNumber, 
      businessType: stall.productType || '', 
      productType: stall.productType || null,
      notes: '' 
    })
    setSelectedStall(null)
    setShowApplyModal(true)
  }

  async function handleSubmit() {
    if (!form.businessType) {
      toast.error('Please select a business type.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/vendor/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stallId: form.stallId, intendedUseType: form.businessType }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit application.')
      } else {
        toast.success('Application submitted successfully!')
        setShowApplyModal(false)
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Available</span>
      case 'OCCUPIED':
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Occupied</span>
      case 'UNDER_MAINTENANCE':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Maintenance</span>
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Stalls</h1>
          <p className="text-gray-500 mt-1 text-sm">Browse available spaces and submit rental applications.</p>
        </div>
        <Link href="/vendor/applications" className="text-sm font-medium text-[#1e4d2b] bg-[#1e4d2b]/10 hover:bg-[#1e4d2b]/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit">
          My Applications <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e4d2b]" />
        </div>
      ) : stalls.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">No stalls found in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stalls.map((stall) => {
            const imgs = parseImages(stall.images)
            return (
              <div
                key={stall.id}
                onClick={() => setSelectedStall(stall)}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#1e4d2b]/30 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image area with carousel */}
                <div className="relative h-40">
                  <ImageCarousel images={imgs} height="h-40" />
                  <div className="absolute top-3 right-3 z-10">
                    {getStatusBadge(stall.status)}
                  </div>
                  {imgs.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
                      <h3 className="text-white font-bold text-xl">Stall #{stall.stallNumber}</h3>
                    </div>
                  )}
                  {imgs.length === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                      <h3 className="text-gray-700 font-bold text-lg">Stall #{stall.stallNumber}</h3>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="space-y-2.5 mb-4 flex-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                      {stall.location || 'Main Building'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Maximize className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                      {stall.size ? `${stall.size} sqm` : 'Standard Size'}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-[#1e4d2b]">
                      <CircleDollarSign className="w-4 h-4 mr-2 text-[#1e4d2b] shrink-0" />
                      ₱{stall.monthlyRate.toLocaleString()}/mo
                    </div>
                  </div>

                  {stall.status === 'AVAILABLE' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApplyClick(stall) }}
                      className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-2.5 rounded-xl text-sm cursor-not-allowed">
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stall Details Modal */}
      {selectedStall && (() => {
        const imgs = parseImages(selectedStall.images)
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative">
              <button
                onClick={() => setSelectedStall(null)}
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Full-size carousel in modal */}
              <div className="relative h-60">
                <ImageCarousel images={imgs} height="h-60" />
                {imgs.length === 0 && (
                  <div className="absolute inset-0 flex items-end p-5">
                    <h2 className="text-gray-700 font-bold text-2xl">Stall #{selectedStall.stallNumber}</h2>
                  </div>
                )}
                {imgs.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5 pointer-events-none">
                    <h2 className="text-white font-bold text-2xl">Stall #{selectedStall.stallNumber}</h2>
                  </div>
                )}
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-gray-500">{selectedStall.location || 'Market Area'}</p>
                  {getStatusBadge(selectedStall.status)}
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 mb-8 space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Maximize className="w-4 h-4" /> Size
                    </span>
                    <span className="text-sm font-bold text-gray-900">{selectedStall.size || 'N/A'} sqm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Zone
                    </span>
                    <span className="text-sm font-bold text-gray-900">{selectedStall.location || 'Main Section'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4" /> Monthly Rental
                    </span>
                    <span className="text-lg font-bold text-[#1e4d2b]">₱{selectedStall.monthlyRate.toLocaleString()}</span>
                  </div>
                </div>

                {selectedStall.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleApplyClick(selectedStall)}
                    className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
                  >
                    Start Application <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Application Form Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Application</h2>
              <p className="text-sm text-gray-500 mt-1">Applying for <strong className="text-gray-900">Stall #{form.stallNumber}</strong></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">Business Type</label>
                {form.productType ? (
                  <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-100 text-gray-700 cursor-not-allowed">
                    {form.productType}
                  </div>
                ) : (
                  <select
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4d2b]"
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
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
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider">Proposed Use / Notes</label>
                <textarea
                  placeholder="Describe your primary products..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#1e4d2b]/20"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-snug">
                Your application will be sent to the administrator for review. You will be notified once approved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}