"use client"

import { useState, useEffect } from "react"
import { getDemoPrices, getBestPrices, getStores } from "@/lib/prices"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    stores: 0,
    products: 0,
    totalSavings: 0,
    bestOverall: '',
  })

  useEffect(() => {
    const prices = getDemoPrices()
    const stores = getStores()
    const bestPrices = getBestPrices(prices)
    const products = Object.keys(bestPrices)
    
    // Calculate potential savings
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
    
    // Total max savings
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
  }, [])

  const savingsByStore = () => {
    const prices = getDemoPrices()
    const products = [...new Set(prices.map(p => p.product_name))]
    const stores = getStores()
    
    return stores.map(store => {
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
  }

  const storeData = savingsByStore()
  const maxTotal = Math.max(...storeData.map(s => s.totalSpent))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Savings Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        See how much you could save by choosing the cheapest store.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="gradient-card p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.stores}</div>
          <div className="text-xs text-slate-500">Stores Tracked</div>
        </div>
        <div className="gradient-card p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.products}</div>
          <div className="text-xs text-slate-500">Products Compared</div>
        </div>
        <div className="gradient-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            ${stats.totalSavings.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">Best Basket Total</div>
        </div>
        <div className="gradient-card p-4 text-center">
          <div className="text-lg font-bold text-cyan-400 truncate">{stats.bestOverall}</div>
          <div className="text-xs text-slate-500">Cheapest Store</div>
        </div>
      </div>

      {/* Store comparison */}
      <div className="gradient-card p-5 mb-8">
        <h2 className="font-semibold text-white mb-4">Store Cost Comparison (Full Basket)</h2>
        <div className="space-y-3">
          {storeData.map((s, i) => {
            const width = maxTotal > 0 ? (s.totalSpent / maxTotal) * 100 : 0
            const isBest = i === 0
            return (
              <div key={s.store}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white font-medium">{s.store}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{s.itemCount} items</span>
                    <span className={`font-bold ${isBest ? 'text-green-400' : 'text-white'}`}>
                      ${s.totalSpent.toFixed(2)}
                    </span>
                    {s.savings > 0 && (
                      <span className="text-xs text-red-400">+${s.savings.toFixed(2)}</span>
                    )}
                    {isBest && <span className="text-green-400 text-xs">★ Best</span>}
                  </div>
                </div>
                <div className="w-full h-6 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isBest
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="gradient-card p-5">
        <h2 className="font-semibold text-white mb-3">How This Grows</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', icon: '📸', title: 'Upload Receipt', desc: 'Snap a photo of any grocery receipt' },
            { step: '2', icon: '🤖', title: 'AI Extracts Items', desc: 'OCR reads product names & prices automatically' },
            { step: '3', icon: '📊', title: 'Price Database', desc: 'Every scan adds to our growing price comparison DB' },
            { step: '4', icon: '💰', title: 'Compare & Save', desc: 'Find the cheapest store for every item' },
          ].map(item => (
            <div key={item.step} className="text-center p-3">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
