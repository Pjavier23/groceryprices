import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "GroceryPrices — Compare Grocery Prices",
  description: "Find the best grocery prices across Walmart, Target, Aldi, Whole Foods, and more. Scan receipts, compare prices, save money.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-cyan-400">🥕</span>
              <span className="text-white">Grocery</span>
              <span className="text-cyan-400">Prices</span>
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/compare" className="text-slate-400 hover:text-white transition-colors">Compare</a>
              <a href="/upload" className="text-slate-400 hover:text-white transition-colors">Scan</a>
              <a href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
