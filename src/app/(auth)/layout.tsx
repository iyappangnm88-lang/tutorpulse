import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nuzilo — Sign In',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFDF5] px-4 py-12 relative overflow-hidden">
      {/* Soft background ambient gradient */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#58CC02]/10 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-2.5 group">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#58CC02] text-white font-black text-2xl shadow-md shadow-[#58CC02]/30 group-hover:scale-105 transition-transform duration-200">
          N
        </div>
        <div className="text-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight">Nuzilo</span>
          <p className="text-xs text-[#3C9E00] font-bold">Learning that feels alive</p>
        </div>
      </Link>

      {/* Card container */}
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-100 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative z-10">
        {children}
      </div>

      {/* Clean footer */}
      <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
        <p>&copy; {new Date().getFullYear()} Nuzilo. All rights reserved.</p>
        <p className="text-[11px] text-slate-500">Designed & Developed by Kishore • Contact: 6381889943</p>
      </div>
    </div>
  )
}
