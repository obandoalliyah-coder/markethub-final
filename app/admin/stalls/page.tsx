'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, ImagePlus, Loader2, FileText } from 'lucide-react'
import Image from 'next/image'

interface Stall {
  id: string
  stallNumber: string
  location: string
  size: string | null
  monthlyRate: number
  status: string
  occupiedBy: string | null
  occupationDate: string | null
  images: string | null
  productType: string | null
}

const emptyForm = {
  stallNumber: '',
  location: '',
  size: '',
  monthlyRate: '',
  status: 'AVAILABLE',
}

const PRODUCT_TYPES = [
  'Vegetables & Fruits',
  'Meat & Seafood',
  'Dry Goods',
  'Cooked Food',
  'Clothing & Apparel',
  'Hardware & Tools',
  'Flowers & Plants',
  'Dairy & Eggs',
  'Beverages',
  'Others',
]

const StatusBadge = ({ status }: { status: string }) => {
  let bg = 'bg-gray-100 text-gray-700'
  if (status === 'OCCUPIED') bg = 'bg-orange-100 text-orange-700'
  else if (status === 'AVAILABLE') bg = 'bg-green-100 text-green-700'
  else if (status === 'UNDER_MAINTENANCE') bg = 'bg-red-100 text-red-700'
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${bg}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function parseJSON(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export default function AdminStallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null })
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState<string[]>([])
  const [productTypes, setProductTypes] = useState<string[]>([])
  const [uploadingImg, setUploadingImg] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [reportModal, setReportModal] = useState<{ open: boolean; stall: Stall | null; data: any }>({ open: false, stall: null, data: null })
  const [loadingReport, setLoadingReport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function fetchStalls() {
    setLoading(true)
    const res = await fetch('/api/admin/stalls')
    if (res.ok) setStalls(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchStalls() }, [])

  function openCreate() {
    setForm(emptyForm)
    setImages([])
    setProductTypes([])
    setModal({ open: true, editId: null })
  }

  function openEdit(s: Stall) {
    setForm({
      stallNumber: s.stallNumber,
      location: s.location,
      size: s.size || '',
      monthlyRate: s.monthlyRate.toString(),
      status: s.status,
    })
    setImages(parseJSON(s.images))
    setProductTypes(parseJSON(s.productType))
    setModal({ open: true, editId: s.id })
  }

  function toggleProductType(type: string) {
    setProductTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  async function handleImageUpload(file: File) {
    if (images.length >= 3) {
      toast.error('Maximum 3 images allowed per stall.')
      return
    }
    setUploadingImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/stalls/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Upload failed.'); return }
      setImages((prev) => [...prev, data.url])
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploadingImg(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.stallNumber || !form.location || !form.monthlyRate) {
      toast.error('Stall number, location, and monthly rate are required.')
      return
    }
    setProcessing(true)
    const url = modal.editId ? `/api/admin/stalls/${modal.editId}` : '/api/admin/stalls'
    const method = modal.editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, images, productType: productTypes }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(modal.editId ? 'Stall updated!' : 'Stall created!')
      setModal({ open: false, editId: null })
      fetchStalls()
    } else {
      toast.error(data.error || 'Failed to save.')
    }
    setProcessing(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setProcessing(true)
    const res = await fetch(`/api/admin/stalls/${deleteId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Stall deleted.')
      setDeleteId(null)
      fetchStalls()
    } else {
      toast.error(data.error || 'Failed to delete.')
    }
    setProcessing(false)
  }

  async function openReport(s: Stall) {
    setReportModal({ open: true, stall: s, data: null })
    setLoadingReport(true)
    try {
      const res = await fetch(`/api/admin/stalls/${s.id}/report`)
      if (res.ok) {
        const data = await res.json()
        setReportModal({ open: true, stall: s, data })
      } else {
        toast.error('Failed to load stall report.')
      }
    } catch {
      toast.error('Failed to load stall report.')
    } finally {
      setLoadingReport(false)
    }
  }

  const available = stalls.filter((s) => s.status === 'AVAILABLE').length
  const occupied = stalls.filter((s) => s.status === 'OCCUPIED').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stalls Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stalls.length} total · {available} available · {occupied} occupied
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Stall
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
          </div>
        ) : stalls.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No stalls yet. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Stall #', 'Images', 'Location', 'Size', 'Rate/Month', 'Product Types', 'Status', 'Occupied Since', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stalls.map((s) => {
                  const imgs = parseJSON(s.images)
                  const types = parseJSON(s.productType)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">#{s.stallNumber}</td>
                      <td className="px-4 py-3">
                        {imgs.length > 0 ? (
                          <div className="flex gap-1">
                            {imgs.slice(0, 3).map((url, i) => (
                              <div key={i} className="relative h-9 w-9 rounded overflow-hidden border border-gray-200">
                                <Image src={url} alt="" fill className="object-cover" sizes="36px" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No images</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.location}</td>
                      <td className="px-4 py-3 text-gray-500">{s.size || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">₱{s.monthlyRate.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {types.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {types.map((t) => (
                              <span key={t} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {s.occupationDate ? new Date(s.occupationDate).toLocaleDateString('en-PH') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openReport(s)} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="View Report">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            disabled={s.status === 'OCCUPIED'}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={s.status === 'OCCUPIED' ? 'Cannot delete occupied stall' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModal({ open: false, editId: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-gray-800 mb-5">{modal.editId ? 'Edit Stall' : 'Add New Stall'}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Stall Number *</label>
                  <input
                    value={form.stallNumber}
                    onChange={(e) => setForm({ ...form, stallNumber: e.target.value })}
                    placeholder="e.g. A-01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Rate/Month (₱) *</label>
                  <input
                    type="number"
                    value={form.monthlyRate}
                    onChange={(e) => setForm({ ...form, monthlyRate: e.target.value })}
                    placeholder="2000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Location *</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Section A, Ground Floor"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Size</label>
                  <input
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="e.g. 2x3 meters"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b] bg-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Product Type Multiselect */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Allowed Product Types <span className="text-gray-400 font-normal">({productTypes.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.map((type) => {
                    const selected = productTypes.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleProductType(type)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                          selected
                            ? 'bg-[#1e4d2b] text-white border-[#1e4d2b]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e4d2b] hover:text-[#1e4d2b]'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image upload section */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Stall Images <span className="text-gray-400 font-normal">({images.length}/3)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={url} alt={`Stall image ${i + 1}`} fill className="object-cover" sizes="80px" />
                      </div>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file)
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImg}
                        className="h-20 w-20 border-2 border-dashed border-gray-300 hover:border-[#1e4d2b] rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#1e4d2b] transition-colors disabled:opacity-50"
                      >
                        {uploadingImg ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-[10px] font-medium">Add Photo</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WEBP · Max 5MB each · Up to 3 photos</p>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal({ open: false, editId: null })} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={processing || uploadingImg} className="flex-1 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-60">
                {processing ? 'Saving...' : modal.editId ? 'Save Changes' : 'Create Stall'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
            <h2 className="font-bold text-gray-800 mb-2">Delete Stall</h2>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-60">
                {processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal.open && reportModal.stall && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setReportModal({ open: false, stall: null, data: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1e4d2b]" />
                Stall #{reportModal.stall.stallNumber} Report
              </h2>
              <p className="text-sm text-gray-500 mt-1">Admin Only View · Complete Occupancy & Payment History</p>
            </div>

            {loadingReport ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e4d2b]" />
              </div>
            ) : reportModal.data ? (
              <div className="space-y-8">
                {/* Occupancy History */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">Occupancy History</h3>
                  {reportModal.data.applications.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4">No applications found for this stall.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Vendor / Business</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Contract Period</th>
                            <th className="px-4 py-3">Applied On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reportModal.data.applications.map((app: any) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-800">{app.vendor.businessName}</p>
                                <p className="text-xs text-gray-500">{app.vendor.user?.name}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{app.applicationType}</span>
                              </td>
                              <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                              <td className="px-4 py-3 text-gray-600">
                                {app.contractStart && app.contractEnd ? (
                                  `${new Date(app.contractStart).toLocaleDateString()} - ${new Date(app.contractEnd).toLocaleDateString()}`
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Payment Ledger */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">Payment Ledger</h3>
                  {reportModal.data.payments.length === 0 ? (
                    <p className="text-sm text-gray-500 px-4">No payments found for this stall.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Vendor</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Period</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3">Date Paid</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reportModal.data.payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{p.vendor.businessName}</td>
                              <td className="px-4 py-3 font-semibold text-[#1e4d2b]">₱{p.amount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-gray-600">{p.paymentType}</td>
                              <td className="px-4 py-3 text-gray-600">{p.month && p.year ? `${p.month}/${p.year}` : '—'}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(p.dueDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-gray-800">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}