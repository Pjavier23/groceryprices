"use client"

import { useState, useEffect } from "react"
import { getDemoPrices, getBestPrices, getStores } from "@/lib/prices"
import {
  DashboardIcon, DollarIcon, StoreIcon, StarIcon, ChartIcon,
  ArrowUpIcon, ArrowDownIcon, CalendarIcon, GroceryIcon,
  TrendUpIcon, LightbulbIcon, ZapIcon
} from "@/lib/icons"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    stores: 0,
    products: 0,
    totalSavings: 0,
    bestOverall: '',
  })
  const [storeData, setStoreData] = useState<{store: string; totalSpent: number; savings: number; itemCount: number}[]>([])

  useEffect(() => {
    const prices = getDemoPrices()
    const stores = getStores()
    const bestPrices = getBestPrices(prices)
    const products = Object.keys(bestPrices)
    
    const storeSavings: Record<string, number> = {}
    stores.forEach(s => { storeSavings[s] = 0 })
    
    products.forEach(product => {
      const productPrices = prices.filter(p => p.product_name === product)
      const cheapest = Math.min(...productPrices.map(p => p.price))
      productPrices.forEach(p => {
        storeSavings[p.store] += (p.price - cheapest)
      })
    })
    
    const bestStore = Object.entries(storeSavings).sort(([,a], [,b]) => a - b)[0]
    
    let totalIfCheapest = 0
    products.forEach(product => {
      const productPrices = prices.filter(p => p.product_name === product)
      totalIfCheapest += Math.min(...productPrices.map(p => p.price))
    })
    
    setStats({
      stores: stores.length,
      products: products.length,
      totalSavings: totalIfCheapest,
      bestOverall: bestStore?.[0] || '',
    })

    // Build store comparison data
    const sd = stores.map(store => {
      const storeItems = prices.filter(p => p.store === store)
      let totalSpent = 0
      let ifCheapest = 0
      
      products.forEach(product => {
        const productPrices = prices.filter(p => p.product_name === product)
        const cheapest = Math.min(...productPrices.map(p => p.price))
        const storePrice = productPrices.find(p => p.store === store)
        if (storePrice) {
          totalSpent += storePrice.price
          ifCheapest += cheapest
        }
      })
      
      return {
        store,
        totalSpent,
        savings: totalSpent - ifCheapest,
        itemCount: storeItems.length,
      }
    }).sort((a, b) => a.totalSpent - b.totalSpent)

    setStoreData(sd)
  }, [])

  const maxTotal = Math.max(...storeData.map(s => s.totalSpent), 1)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/15 flex items-center justify-center">
          <DashboardIcon size={22} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">See how much you could save by choosing the cheapest store</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="gradient-card p-6 hover:border-cyan-500/15 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
              <StoreIcon size={18} className="text-cyan-400" />
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Stores</div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.stores}</div>
        </div>
        <div className="gradient-card p-6 hover:border-cyan-500/15 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
              <GroceryIcon size={18} className="text-blue-400" />
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Products</div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.products}</div>
        </div>
        <div className="gradient-card p-6 hover:border-green-500/15 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
              <DollarIcon size={18} className="text-green-400" />
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Best Basket</div>
          </div>
          <div className="text-3xl font-bold text-green-400 tracking-tight">${stats.totalSavings.toFixed(2)}</div>
        </div>
        <div className="gradient-card p-6 hover:border-purple-500/15 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
              <StarIcon size={18} className="text-purple-400" />
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cheapest</div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight truncate">{stats.bestOverall}</div>
        </div>
      </div>

      {/* Store Comparison */}
      <div className="gradient-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
            <ChartIcon size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Store Cost Comparison — Full Basket</h2>
            <p className="text-xs text-slate-500">How much you'd spend buying everything at each store</p>
          </div>
        </div>

        <div className="space-y-4">
          {storeData.map((s, i) => {
            const width = (s.totalSpent / maxTotal) * 100
            const isBest = i === 0
            return (
              <div key={s.store}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isBest && <StarIcon size={12} className="text-green-400" />}
                    <span className="text-sm font-medium text-white">{s.store}</span>
                    <span className="text-xs text-slate-600">({s.itemCount} items)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.savings > 0 && (
                      <span className="text-xs text-red-400/70">+${s.savings.toFixed(2)} vs cheapest</span>
                    )}
                    <span className={`text-base font-bold ${isBest ? 'text-green-400' : 'text-white'}`}>
                      ${s.totalSpent.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-7 bg-slate-800/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 flex items-center justify-end px-3 ${
                      isBest
                        ? 'bg-gradient-to-r from-green-600 to-green-400'
                        : 'bg-gradient-to-r from-cyan-700/80 to-cyan-400/80'
                    }`}
                    style={{ width: `${Math.max(width, 4)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white/80">{Math.round(width)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="gradient-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
            <LightbulbIcon size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">How Your Intelligence Grows</h2>
            <p className="text-xs text-slate-500">Every scan and data source feeds the system</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: <GroceryIcon size={22} />, title: 'Scan Receipt', desc: 'Snap a photo of any grocery receipt', color: 'cyan' },
            { icon: <ZapIcon size={22} />, title: 'OCR Extracts', desc: 'AI reads product names & prices automatically', color: 'blue' },
            { icon: <StoreIcon size={22} />, title: 'Price Database', desc: 'Every scan + BLS data builds your comparison DB', color: 'green' },
            { icon: <TrendUpIcon size={22} />, title: 'Compare & Save', desc: 'Find the cheapest store for every item you buy', color: 'purple' },
          ].map((item, i) => {
            const colorClasses: Record<string, string> = {
              cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/10 text-cyan-400',
              blue: 'from-blue-500/10 to-purple-500/10 border-blue-500/10 text-blue-400',
              green: 'from-green-500/10 to-emerald-500/10 border-green-500/10 text-green-400',
              purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/10 text-purple-400',
            }
            return (
              <div key={i} className="text-center p-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[item.color]} mx-auto mb-3 flex items-center justify-center`}>
                  {item.icon}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
