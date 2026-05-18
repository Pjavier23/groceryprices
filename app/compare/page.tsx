"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getPricesForProduct, getProducts, getStores, getDemoPrices } from "@/lib/prices"
import type { PriceEntry } from "@/lib/prices"
import {
  SearchIcon, ChartIcon, DollarIcon, StoreIcon, StarIcon,
  ArrowUpIcon, ArrowDownIcon, ZapIcon, TagIcon, GroceryIcon
} from "@/lib/icons"

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
  const sortedResults = [...results].sort((a, b) => a.price - b.price)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/15 flex items-center justify-center">
          <ChartIcon size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare Prices</h1>
          <p className="text-slate-400 text-sm mt-0.5">Pick a product and see which store has the best deal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="gradient-card p-4 sticky top-24">
            <div className="relative mb-3">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/30 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No products found</div>
              ) : filteredProducts.map(product => (
                <button
                  key={product}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    selectedProduct === product
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  }`}
                >
                  <GroceryIcon size={14} className="shrink-0" />
                  {product}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-3">
          {results.length === 0 ? (
            <div className="gradient-card p-16 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/30 mx-auto mb-5 flex items-center justify-center">
                <ChartIcon size={28} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a Product</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Choose a product from the left panel to compare prices across stores.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Header Card */}
              <div className="gradient-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-white tracking-tight">{selectedProduct}</h2>
                      <span className="badge badge-cyan">{results.length} stores</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Price range: <strong className="text-white">${bestPrice.toFixed(2)}</strong> to <strong className="text-white">${maxPrice.toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Best Price</div>
                    <div className="text-3xl font-bold text-green-400 tracking-tight">${bestPrice.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">at {bestStore?.store}</div>
                  </div>
                </div>
                
                {/* Quick view of all stores + prices */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800/30">
                  {sortedResults.map(r => (
                    <div key={r.store} className={`store-pill ${r.price === bestPrice ? 'active' : ''}`}>
                      <StoreIcon size={10} />
                      {r.store}
                      <span className={r.price === bestPrice ? 'text-green-400 font-bold' : 'text-slate-400'}>
                        ${r.price.toFixed(2)}
                      </span>
                      {r.price === bestPrice && <StarIcon size={10} className="text-green-400" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="gradient-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <ChartIcon size={16} className="text-cyan-400" />
                  <h3 className="font-semibold text-white">Price Comparison</h3>
                </div>
                <div className="bar-chart" style={{ height: 260 }}>
                  {sortedResults.map(r => {
                    const height = maxPrice > 0 ? ((r.price / maxPrice) * 100) : 0
                    const isBest = r.price === bestPrice
                    const isHighest = r.price === maxPrice
                    const rank = sortedResults.indexOf(r) + 1
                    return (
                      <div key={r.store} className="bar flex flex-col items-center justify-end" style={{ flex: 1 }}>
                        <div className="text-xs font-bold font-mono mb-1.5 transition-colors" style={{ color: isBest ? '#22c55e' : '#f1f5f9' }}>
                          ${r.price.toFixed(2)}
                        </div>
                        <div className="relative w-full max-w-[48px] flex-1 flex flex-col justify-end">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              isBest ? 'bg-gradient-to-t from-green-500 to-green-400 glow-green' :
                              isHighest ? 'bg-gradient-to-t from-red-500 to-red-400' :
                              'bg-gradient-to-t from-cyan-600/80 to-cyan-400/80'
                            }`}
                            style={{ height: `${height}%`, minHeight: 16 }}
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {isBest && <StarIcon size={10} className="text-green-400" />}
                          <span className={`text-xs truncate max-w-[72px] text-center ${isBest ? 'text-green-400 font-semibold' : 'text-slate-400'}`}>
                            {r.store}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5">#{rank}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ranked Table */}
              <div className="gradient-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/30">
                  <h3 className="font-semibold text-white">All Prices — Ranked</h3>
                </div>
                <div className="divide-y divide-slate-800/20">
                  {sortedResults.map((r, i) => {
                    const rank = i + 1
                    const savings = r.price - bestPrice
                    return (
                      <div key={r.store} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            rank === 1 ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                            rank === results.length ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                            'bg-slate-700/30 text-slate-400 border border-slate-700/20'
                          }`}>
                            {rank === 1 ? <StarIcon size={12} /> : rank === results.length ? <ArrowDownIcon size={12} /> : rank}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <StoreIcon size={12} className="text-slate-500" />
                              <span className="font-medium text-white text-sm">{r.store}</span>
                            </div>
                            {r.date && (
                              <span className="text-xs text-slate-600">{r.date}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-base ${
                            rank === 1 ? 'text-green-400' :
                            rank === results.length ? 'text-red-400' :
                            'text-white'
                          }`}>
                            ${r.price.toFixed(2)}
                          </div>
                          {savings > 0 && (
                            <div className="text-xs text-red-400/70">+${savings.toFixed(2)} more</div>
                          )}
                          {rank === 1 && (
                            <div className="text-xs text-green-400/70">Best price</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Savings opportunity */}
              {results.length > 1 && (
                <div className="gradient-card p-6 border-l-4 border-l-green-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <DollarIcon size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Shopping Smarter Could Save You</h3>
                      <p className="text-sm text-slate-400">
                        Buying <strong className="text-white">{selectedProduct}</strong> at <strong className="text-green-400">{bestStore?.store}</strong> instead of{' '}
                        <strong className="text-red-400">{sortedResults[sortedResults.length - 1]?.store}</strong> saves{' '}
                        <strong className="text-green-400">${(maxPrice - bestPrice).toFixed(2)}</strong> per unit.
                        Over a year, that adds up to{' '}
                        <strong className="text-green-400 text-lg">${((maxPrice - bestPrice) * 52).toFixed(2)}</strong> if you buy weekly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1"><div className="skeleton h-96" /></div>
          <div className="lg:col-span-3"><div className="skeleton h-96" /></div>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
