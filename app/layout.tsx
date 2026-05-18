import type { Metadata } from "next"
import "./globals.css"
import { GroceryIcon, SearchIcon, CameraIcon, ChartIcon, DashboardIcon, TrendUpIcon, ZapIcon } from "@/lib/icons"

export const metadata: Metadata = {
  title: "GroceryPrices — Smart Grocery Intelligence",
  description: "Track grocery prices across stores, scan receipts, compare pricing trends, and save money with real-time data from BLS and your purchases.",
  keywords: ["grocery prices", "price comparison", "receipt scanner", "food prices", "BLS data", "savings tracker"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="sticky top-0 z-50 border-b border-slate-800/30 bg-slate-950/80 backdrop-blur-2xl">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <GroceryIcon className="text-slate-950" size={18} />
              </div>
              <div>
                <span className="text-white">Grocery</span>
                <span className="text-cyan-400">Prices</span>
              </div>
            </a>
            
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/trends" icon={<ZapIcon size={14} />} label="Trends" live />
              <NavLink href="/compare" icon={<ChartIcon size={14} />} label="Compare" />
              <NavLink href="/upload" icon={<CameraIcon size={14} />} label="Scan" />
              <NavLink href="/dashboard" icon={<DashboardIcon size={14} />} label="Dashboard" />
            </div>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1">
              <MobileNavLink href="/trends" icon={<ZapIcon size={18} />} />
              <MobileNavLink href="/compare" icon={<ChartIcon size={18} />} />
              <MobileNavLink href="/upload" icon={<CameraIcon size={18} />} />
              <MobileNavLink href="/dashboard" icon={<DashboardIcon size={18} />} />
            </div>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  )
}

function NavLink({ href, icon, label, live }: { href: string; icon: React.ReactNode; label: string; live?: boolean }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
    >
      {live && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {icon}
      {label}
    </a>
  )
}

function MobileNavLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
    >
      {icon}
    </a>
  )
}
