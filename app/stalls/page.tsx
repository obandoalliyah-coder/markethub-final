import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Store } from 'lucide-react'

export default async function PublicStallsPage() {
  const stalls = await prisma.stall.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { location: 'asc' }
  })

  function parseJSON(raw: string | null): string[] {
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="MarketHub" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm font-semibold text-gray-700 hover:text-[#1e4d2b] transition-colors px-4 py-2 rounded-lg hover:bg-gray-50">
              Sign In
            </Link>
            <Link href="/auth/signup" className="text-sm font-semibold text-white bg-[#1e4d2b] hover:bg-[#2d6a4f] transition-colors px-4 py-2 rounded-lg">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 pt-24 pb-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Stalls</h1>
          <p className="text-gray-500 mt-2">Browse the current stalls available for lease at the MarketHub.</p>
        </div>

        {stalls.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No stalls are currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stalls.map((stall) => {
              const imgs = parseJSON(stall.images)
              const types = parseJSON(stall.productType)
              
              return (
                <div key={stall.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 w-full bg-gray-100 border-b border-gray-100">
                    {imgs.length > 0 ? (
                      <Image src={imgs[0]} alt={`Stall ${stall.stallNumber}`} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <Store className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                      AVAILABLE
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-gray-900">Stall {stall.stallNumber}</h2>
                      <span className="text-[#1e4d2b] font-bold text-lg">₱{stall.monthlyRate.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                      {stall.location}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                      {types.map(t => (
                        <span key={t} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                          {t}
                        </span>
                      ))}
                      {stall.size && (
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
                          {stall.size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
