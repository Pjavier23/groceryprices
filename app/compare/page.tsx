"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getPricesForProduct, getProducts, getStores, getDemoPrices } from "@/lib/prices"
import type { PriceEntry } from "@/lib/prices"

function CompareContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialStore = searchParams.get('store') || ''
  
  const [search, setSearch] = useState(initialQuery)
  const [selectedProduct, setSelectedProduct] = useState(initialQuery)
  const [results, setResults] = useState<PriceEntry[]>([])
  const [allPrices, setAllPrices] = useState<PriceEntry[]>([])

  useEffect(() => {
    setAllPrices(getDemoPrices())
  }, [])

  useEffect(() => {
    if (initialQuery) handleSelectProduct(initialQuery)
    else if (initialStore) {
      const storePrices = getDemoPrices().filter(p => p.store === initialStore)
      setResults(storePrices)
      setSelectedProduct(`All items at ${initialStore}`)
    }
  }, [initialQuery, initialStore])

  const handleSelectProduct = (name: string) => {
    setSelectedProduct(name)
    const prices = getPricesForProduct(name, allPrices)
    setResults(prices)
  }

  const stores = getStores()
  const products = getProducts()
  
  const filteredProducts = search
    ? products.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : products

  const bestPrice = results.length > 0 ? Math.min(...results.map(r => r.price)) : 0
  const bestStore = results.find(r => r.price === bestPrice)

  const maxPrice = results.length > 0 ? Math.max(...results.map(r => r.price)) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Price Comparison</h1>
      <p className="text-slate-400 text-sm mb-6">Compare prices across stores to find the best deal.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - product list */}
        <div className="lg:col-span-1">
          <div className="gradient-card p-4 sticky top-20">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 mb-3"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredProducts.map(product => (
                <button
                  key={product}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedProduct === product
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {product}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="gradient-card p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a product</h3>
              <p className="text-slate-400 text-sm">Choose a product from the list to compare prices across stores.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="gradient-card p-5">
                <h2 className="text-xl font-bold text-white mb-1">{selectedProduct}</h2>
                <p className="text-sm text-slate-400">
                  Best price: <span className="text-green-400 font-bold">${bestPrice.toFixed(2)}</span> at {bestStore?.store}
                  {' · '}Savings up to: <span className="text-cyan-400 font-bold">${(maxPrice - bestPrice).toFixed(2)}</span>
                </p>
              </div>

              {/* Bar chart */}
              <div className="gradient-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Price Comparison</h3>
                <div className="bar-chart" style={{ height: 220 }}>
                  {results.map(r => {
                    const height = maxPrice > 0 ? ((r.price / maxPrice) * 100) : 0
                    const isBest = r.price === bestPrice
                    const isHighest = r.price === maxPrice
                    return (
                      <div key={r.store} className="bar flex flex-col items-center justify-end" style={{ flex: 1 }}>
                        <span className="text-xs font-bold mb-1" style={{ color: isBest ? '#22c55e' : '#f1f5f9' }}>
                          ${r.price.toFixed(2)}
                        </span>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isBest ? 'bg-gradient-to-t from-green-500 to-green-400 glow-green' :
                            isHighest ? 'bg-gradient-to-t from-red-500 to-red-400' :
                            'bg-gradient-to-t from-cyan-600 to-cyan-400'
                          }`}
                          style={{ height: `${height}%`, minHeight: 16 }}
                        />
                        <span className="text-xs text-slate-400 mt-1 truncate max-w-[80px] text-center">
                          {r.store}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="gradient-card overflow-hidden">
                <div className="p-4 border-b border-slate-800/50">
                  <h3 className="text-sm font-semibold text-slate-300">All Prices</h3>
                </div>
                <div className="divide-y divide-slate-800/30">
                  {[...results].sort((a, b) => a.price - b.price).map(r => {
                    const rank = [...results].sort((a, b) => a.price - b.price).findIndex(x => x.store === r.store) + 1
                    return (
                      <div key={r.store} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            rank === 1 ? 'bg-green-500/20 text-green-400' :
                            rank === results.length ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700/50 text-slate-400'
                          }`}>{rank}</span>
                          <div>
                            <span className="text-white text-sm font-medium">{r.store}</span>
                            <span className="text-xs text-slate-500 ml-2">{r.date}</span>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${
                          rank === 1 ? 'text-green-400' :
                          rank === results.length ? 'text-red-400' :
                          'text-white'
                        }`}>${r.price.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-64" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
