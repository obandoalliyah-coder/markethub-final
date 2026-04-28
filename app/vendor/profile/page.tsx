'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Camera, Save, User, Lock, Trash2, Store, MapPin, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface VendorProfile {
  id: string
  businessName: string
  businessType: string
  ownerName: string
  contactNumber: string
  alternateContactNumber?: string
  address: string
  barangay: string
  municipality: string
  province: string
  zipCode: string
  businessPermitNumber?: string
  tinNumber?: string
  status: string
  profileImage?: string
}

export default function VendorProfilePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<VendorProfile>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/vendor/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData(data)
        if (data.profileImage) setImgPreview(data.profileImage)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasUnsavedChanges(true)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      setImgPreview(previewUrl)
      setSelectedImageFile(file)
      setHasUnsavedChanges(true)
      toast.info('Image selected. Click Save Changes to upload and keep it.')
    }
  }

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      return toast.error('Please fill out both fields')
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }

    setIsUpdatingPassword(true)
    try {
      const res = await fetch('/api/vendor/security/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      
      if (res.ok) {
        toast.success('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("Are you absolutely sure you want to permanently delete your account? All data, applications, and logs will be lost forever. This cannot be undone.")
    if (!isConfirmed) return
    
    try {
      const res = await fetch('/api/vendor/security/delete-account', {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success("Account deleted successfully.")
        await signOut({ callbackUrl: '/auth/signin' })
      } else {
        toast.error("Failed to delete account.")
      }
    } catch {
      toast.error('An error occurred during account deletion.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let finalFormData = { ...formData }

      // Upload image first if one was selected
      if (selectedImageFile) {
        toast.info('Uploading profile image...')
        const uploadData = new FormData()
        uploadData.append('file', selectedImageFile)
        
        const res = await fetch('/api/vendor/profile/upload', {
          method: 'POST',
          body: uploadData
        })
        
        if (res.ok) {
          const data = await res.json()
          finalFormData.profileImage = data.url
          setSelectedImageFile(null) // Clear after successful upload
        } else {
          toast.error('Failed to upload image. Profile will be saved without the new image.')
        }
      }

      const method = profile ? 'PUT' : 'POST'
      const response = await fetch('/api/vendor/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData(data)
        setHasUnsavedChanges(false)
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.profileImage }))
        toast.success(profile ? 'Profile updated successfully' : 'Profile created successfully')
      } else {
        toast.error('Failed to save profile')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
      </div>
    )
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] focus:border-transparent transition-all bg-gray-50/50"
  const labelClass = "text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider"

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[#1e4d2b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <User className="w-4 h-4" /> Profile Info
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-[#1e4d2b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Lock className="w-4 h-4" /> Security
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {profile?.status && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Application Status</p>
                      <p className="text-xs text-gray-500">Current status of your vendor profile</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      profile.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      profile.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      profile.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {profile.status}
                    </span>
                  </div>
                )}

                {/* Profile Picture Section */}
                <div className="flex items-start gap-6 pb-8 border-b border-gray-100">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                      {imgPreview ? (
                        <img src={imgPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-[#1e4d2b] text-white rounded-full shadow-md hover:bg-[#2d6a4f] transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange}
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                      Upload a square image, ideally 500x500px or larger. JPEG or PNG format.
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-[#1e4d2b]" />
                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Owner Name</label>
                      <input name="ownerName" value={formData.ownerName || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Number</label>
                      <input name="contactNumber" value={formData.contactNumber || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Alternate Contact</label>
                      <input name="alternateContactNumber" value={formData.alternateContactNumber || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-5 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-5 h-5 text-[#1e4d2b]" />
                    <h3 className="text-lg font-bold text-gray-900">Business Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Business Name</label>
                      <input name="businessName" value={formData.businessName || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Business Type</label>
                      <select name="businessType" value={formData.businessType || ''} onChange={handleInputChange} required className={inputClass}>
                        <option value="">Select type</option>
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
                      <label className={labelClass}>Permit Number</label>
                      <input name="businessPermitNumber" value={formData.businessPermitNumber || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>TIN Number</label>
                      <input name="tinNumber" value={formData.tinNumber || ''} onChange={handleInputChange} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-5 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-[#1e4d2b]" />
                    <h3 className="text-lg font-bold text-gray-900">Address Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Street Address</label>
                      <input name="address" value={formData.address || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Barangay</label>
                      <input name="barangay" value={formData.barangay || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Municipality</label>
                      <input name="municipality" value={formData.municipality || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <input name="province" value={formData.province || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Zip Code</label>
                      <input name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} required className={inputClass} />
                    </div>
                  </div>
                </div>



                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-70"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
              
              <div className="space-y-4 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-[#1e4d2b]" />
                  <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                </div>
                <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                <div className="grid grid-cols-1 gap-5 max-w-md">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                  <button onClick={handlePasswordUpdate} disabled={isUpdatingPassword} className="bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors w-fit disabled:opacity-70">
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
                </div>
                <p className="text-sm text-gray-500">Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={handleDeleteAccount} className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  Delete Account
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
