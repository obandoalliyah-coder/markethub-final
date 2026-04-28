'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from 'next-auth/react'

const MARINDUQUE_DATA = {
  "Boac": {
    zip: "4900",
    barangays: ["Agos", "Antipolo", "Badias", "Balagbag", "Balanacan (Poblacion)", "Bantad", "Baybay Bajo", "Baybay Ibinanga", "Baybayanan", "Binoboy", "Buliasnin", "Catubtub", "Cawit", "Dawis", "Libtang", "Lupac", "Mabuhay", "Maligaya", "Mapote", "Marcos", "Matanding", "Murallon (Poblacion)", "Ogbac", "Pawa", "Pili", "Poctoy", "Poras", "Putting Buhangin", "Puyog", "Sabong", "San Miguel (Poblacion)", "Santol", "Sawi", "Tabi", "Tabigue", "Tanza"]
  },
  "Buenavista": {
    zip: "4904",
    barangays: ["Bacoro", "Bagacay", "Banuyo", "Belarmino", "Budbudin", "Cabugao", "Dayan", "Gabion", "Malapay", "Mangiliol", "Masiga", "Poblacion", "Sabang", "Tagum", "Yaw-Yaw"]
  },
  "Gasan": {
    zip: "4905",
    barangays: ["Bacong-Bacong", "Bacong-Bukal", "Bangkal", "Banotbot", "Caigangan", "Dalaguete", "Dili", "Gabao", "Gogon", "Libtang", "Mahunod", "Malaruhat", "Mangiliol", "Marcos", "Napaan", "Pinggan", "Poblacion", "Tabionan", "Talao", "Taliongtiong", "Tamao", "Tiguion", "Uson"]
  },
  "Mogpog": {
    zip: "4901",
    barangays: ["Argao", "Balanacan", "Ino", "Janagdong", "Lamesa", "Laon", "Magapua", "Malayak", "Malusak", "Mampaitan", "Mangyan-Mababad", "Poblacion", "Silangan", "Sumangga", "Tarug", "Villa Mendez"]
  },
  "Santa Cruz": {
    zip: "4902",
    barangays: ["Alobo", "Angas", "Aturan", "Bagong Silang Poblacion", "Baguidbirin", "Matalaba", "Mongpong", "Morales", "Napo", "Pag-asa Poblacion", "Pantayin", "Polo", "Pulong-Parang", "Punong"]
  },
  "Torrijos": {
    zip: "4903",
    barangays: ["Agogoo", "Amoingon", "Bahi", "Buenavista", "Cabuyao", "Candahon", "Dawis", "Del Carmen", "Green Village", "Mabuhay", "Malakas", "Marlanga", "Paynosa", "Poblacion", "San Andres B.", "San Andres V.", "San Isidro", "San Jose", "San Roque", "Santa Cruz", "Santo Cristo", "Semirara", "Suha", "Tabionan", "Tagumpay", "Tambunan", "Tiguion"]
  }
}

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const lastStepChangeTime = useRef<number>(0)

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    ownerName: '', contactNumber: '', businessName: '', businessType: '',
    address: '', barangay: '', municipality: '', province: 'Marinduque', zipCode: ''
  })

  useEffect(() => {
    if (formData.municipality && MARINDUQUE_DATA[formData.municipality as keyof typeof MARINDUQUE_DATA]) {
      setFormData(prev => ({
        ...prev,
        zipCode: MARINDUQUE_DATA[formData.municipality as keyof typeof MARINDUQUE_DATA].zip
      }))
    }
  }, [formData.municipality])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    if (name === 'municipality') {
      setFormData(prev => ({ ...prev, barangay: '' }))
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  const isInvalid = (name: keyof typeof formData) => {
    function getInvalidStatus(n: keyof typeof formData) {
      if (!touched[n]) return false;
      if (n === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      if (n === 'password') return formData.password.length < 8;
      if (n === 'confirmPassword') return formData.password !== formData.confirmPassword;
      return !formData[n];
    }
    return getInvalidStatus(name);
  }

  const getBorderColor = (name: keyof typeof formData) => {
    return isInvalid(name) ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#1e4d2b]'
  }

  // Basic validation before going next
  function handleNext() {
    setError('')

    let fieldsToTouch: (keyof typeof formData)[] = [];

    if (step === 1) {
      fieldsToTouch = ['name', 'email', 'password', 'confirmPassword'];
      const hasEmpty = !formData.name || !formData.email || !formData.password || !formData.confirmPassword;
      const invalidEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      const invalidPass = formData.password.length < 8
      const mismatch = formData.password !== formData.confirmPassword

      if (hasEmpty || invalidEmail || invalidPass || mismatch) {
        setTouched(prev => ({
          ...prev,
          name: true, email: true, password: true, confirmPassword: true
        }))
        if (hasEmpty) setError('Please fill in all account fields.')
        else if (mismatch) setError('Passwords do not match.')
        else if (invalidEmail) setError('Please provide a valid email format.')
        else if (invalidPass) setError('Password must be at least 8 characters.')
        return
      }
    } else if (step === 2) {
      fieldsToTouch = ['ownerName', 'contactNumber', 'businessName', 'businessType'];
      if (!formData.ownerName || !formData.contactNumber || !formData.businessName || !formData.businessType) {
        setTouched(prev => ({
          ...prev,
          ownerName: true, contactNumber: true, businessName: true, businessType: true
        }))
        setError('Please fill in all business details.')
        return
      }
    }

    setStep(prev => prev + 1)
    lastStepChangeTime.current = Date.now()
  }

  function handleBack() {
    setError('')
    setStep(prev => prev - 1)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (Date.now() - lastStepChangeTime.current < 500) {
       return
    }

    if (step < 3) {
      handleNext()
      return
    }

    setError('')
    
    if (!formData.address || !formData.barangay || !formData.municipality || !formData.province || !formData.zipCode) {
      setTouched(prev => ({
        ...prev,
        address: true, barangay: true, municipality: true, province: true, zipCode: true
      }))
      setError('Please fill in all address fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok) { 
        setError(result.error || 'Registration failed.')
        setLoading(false)
        return 
      }

      // Auto login after successful signup
      const signInRes = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (!signInRes?.error) {
        router.push('/vendor/dashboard')
      } else {
        router.push('/auth/signin?registered=true')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const field = (name: keyof typeof formData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className={`text-xs font-medium block mb-1 ${isInvalid(name) ? 'text-red-500' : 'text-gray-500'}`}>
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder || label}
        value={formData[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${getBorderColor(name)}`}
      />
    </div>
  )

  const availableBarangays = formData.municipality && MARINDUQUE_DATA[formData.municipality as keyof typeof MARINDUQUE_DATA] 
    ? MARINDUQUE_DATA[formData.municipality as keyof typeof MARINDUQUE_DATA].barangays 
    : []

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center py-10 px-4"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1600&q=80)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg px-8 py-8 overflow-hidden relative">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-1">
            <img src="/logo.png" alt="MarketHub Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-gray-500 text-sm mt-1">Create your vendor account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= i ? 'bg-[#1e4d2b] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`w-8 h-1 transition-colors ${step > i ? 'bg-[#1e4d2b]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center transition-opacity">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative w-full overflow-hidden" style={{ minHeight: '300px' }}>
            {/* Step 1: Account Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 1 ? 'translate-x-0 opacity-100 relative' : step > 1 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 1: Account Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('name', 'Full Name', 'text', 'Juan dela Cruz')}
                {field('email', 'Email Address', 'email', 'juan@example.com')}
                
                {/* Custom Password Field */}
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isInvalid('password') ? 'text-red-500' : 'text-gray-500'}`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative flex items-center border rounded-lg px-3 py-2 transition-colors bg-white ${getBorderColor('password')}`}>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full text-sm focus:outline-none bg-transparent pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Custom Confirm Password Field */}
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isInvalid('confirmPassword') ? 'text-red-500' : 'text-gray-500'}`}>
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative flex items-center border rounded-lg px-3 py-2 transition-colors bg-white ${getBorderColor('confirmPassword')}`}>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full text-sm focus:outline-none bg-transparent pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Business Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 2 ? 'translate-x-0 opacity-100 relative' : step > 2 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 2: Business Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('ownerName', 'Owner Name', 'text', 'Juan dela Cruz')}
                {field('contactNumber', 'Contact Number', 'tel', '09XXXXXXXXX')}
                {field('businessName', 'Business Name', 'text', "Juan's Store")}
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isInvalid('businessType') ? 'text-red-500' : 'text-gray-500'}`}>
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white transition-colors ${getBorderColor('businessType')}`}
                  >
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
              </div>
            </div>

            {/* Step 3: Address Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 3 ? 'translate-x-0 opacity-100 relative' : step > 3 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 3: Address (Marinduque Only)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('address', 'Street / House No.')}
                
                {/* Province (Fixed) */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value="Marinduque"
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
                  >
                    <option>Marinduque</option>
                  </select>
                </div>

                {/* Municipality */}
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isInvalid('municipality') ? 'text-red-500' : 'text-gray-500'}`}>
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white transition-colors ${getBorderColor('municipality')}`}
                  >
                    <option value="">Select Municipality</option>
                    {Object.keys(MARINDUQUE_DATA).map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>

                {/* Barangay */}
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isInvalid('barangay') ? 'text-red-500' : 'text-gray-500'}`}>
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!formData.municipality}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white transition-colors ${getBorderColor('barangay')} disabled:opacity-50`}
                  >
                    <option value="">Select Barangay</option>
                    {availableBarangays.map(brgy => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                </div>

                {/* Zip Code */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="zipCode"
                    type="text"
                    value={formData.zipCode}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-[#1e4d2b] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}