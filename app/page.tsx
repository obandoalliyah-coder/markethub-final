import Link from 'next/link'
import { Store, CreditCard, Bell, FileText, CheckCircle, ArrowRight, MapPin, Users, ShieldCheck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MarketHub" className="h-10 w-auto object-contain" />
          </div>
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

      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center pt-16"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center px-6 max-w-4xl mx-auto">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-white/30">
            Boac Public Market · Marinduque
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Your Market,<br />
            <span className="text-[#4ade80]">Digitized.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            MarketHub brings Boac's public market online. Apply for stalls, track payments, and manage your vendor account — all from your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-bold px-8 py-4 rounded-xl transition-all text-base shadow-lg"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all text-base border border-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <div className="w-px h-10 bg-white/30" />
          <span className="text-xs tracking-widest uppercase">Scroll</span>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1e4d2b] py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '100+', label: 'Market Stalls' },
            { value: '24/7', label: 'Online Access' },
            { value: '100%', label: 'Digital Payments' },
            { value: 'Free', label: 'Vendor Registration' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-[#4ade80] mb-1">{value}</p>
              <p className="text-sm text-white/70 font-medium uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#1e4d2b] text-sm font-bold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Everything you need</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">From stall applications to monthly payments, MarketHub covers the full lifecycle of market operations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                color: 'bg-green-100 text-[#1e4d2b]',
                title: 'Browse & Apply for Stalls',
                desc: 'View available stalls with photos, location, size, and monthly rates. Apply online in minutes.',
              },
              {
                icon: CreditCard,
                color: 'bg-blue-100 text-blue-700',
                title: 'Easy Payment Tracking',
                desc: 'Upload your GCash or bank transfer proof and let the admin verify it. No more manual collection.',
              },
              {
                icon: Bell,
                color: 'bg-orange-100 text-orange-700',
                title: 'Real-time Notifications',
                desc: 'Get instant alerts for application approvals, payment confirmations, and upcoming due dates.',
              },
              {
                icon: FileText,
                color: 'bg-purple-100 text-purple-700',
                title: 'Digital Contract Renewal',
                desc: 'Renew your stall contract digitally when it\'s about to expire — no paperwork, no queues.',
              },
              {
                icon: ShieldCheck,
                color: 'bg-red-100 text-red-700',
                title: 'Secure & Role-based',
                desc: 'Separate dashboards for vendors and administrators with full authentication and access control.',
              },
              {
                icon: Users,
                color: 'bg-teal-100 text-teal-700',
                title: 'Admin Dashboard',
                desc: 'Admins can manage vendors, track payments, generate reports, and oversee all market operations.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#1e4d2b] text-sm font-bold uppercase tracking-widest">How it works</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Get started in 3 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gray-200" />

            {[
              { step: '01', title: 'Create an account', desc: 'Register as a vendor with your business details and contact information.' },
              { step: '02', title: 'Apply for a stall', desc: 'Browse available stalls and submit your application. Admin will review and approve.' },
              { step: '03', title: 'Pay monthly rent', desc: 'Upload proof of payment each month. Admin verifies and your record is updated.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#1e4d2b] text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-6 relative z-10">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[#1e4d2b] text-sm font-bold uppercase tracking-widest">Payments</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-3">Accepted payment methods</h2>
          <p className="text-gray-500 mb-10">Pay via GCash or bank transfer, then upload your proof of payment.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-blue-100">
              <div className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-lg w-fit mb-4">GCash</div>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Name</span>
                  <span className="font-semibold text-gray-800">Luisito R. Navarro</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Number</span>
                  <span className="font-semibold text-gray-800">0917 123 4567</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-green-100">
              <div className="bg-[#1e4d2b] text-white text-sm font-bold px-3 py-1 rounded-lg w-fit mb-4">Bank Transfer</div>
              <div className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-gray-800">Land Bank of the Philippines</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Name</span>
                  <span className="font-semibold text-gray-800">Boac Public Market</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No.</span>
                  <span className="font-semibold text-gray-800">1234-5678-90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#1e4d2b]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to join the market?</h2>
          <p className="text-white/70 mb-10 text-lg">Create your vendor account today and start managing your stall digitally.</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#1e4d2b] font-extrabold px-10 py-4 rounded-xl transition-all text-base shadow-lg"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MarketHub" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            Boac Public Market, Boac, Marinduque
          </div>
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} MarketHub. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
