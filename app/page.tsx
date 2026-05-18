"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getStores, getBestPrices, getProducts, getDemoPrices, BLS_PRODUCT_MAP, PRODUCT_CATALOG } from "@/lib/prices"
import { fetchBLSPrices } from "@/lib/bls"
import type { PriceEntry } from "@/lib/prices"
import type { BLSSeries } from "@/lib/bls"

type SearchResult = {
  product: string
  stores: { store: string; price: number }[]
  bestPrice: number
  bestStore: string
}

export default function Home() {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [trending, setTrending] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [blsData, setBlsData] = useState<BLSSeries[]>([])

  useEffect(() => {
    // Load BLS live data
    fetchBLSPrices().then(data => {
      setBlsData(data.filter(s => s.latest > 0))
    }).catch(() => {})

    // Load trending products
    const prices = getDemoPrices()
    const products = [...new Set(prices.map(p => p.product_name))]
    const top: SearchResult[] = products.slice(0, 8).map(name => {
      const storePrices = prices.filter(p => p.product_name === name)
      const sorted = [...storePrices].sort((a, b) => a.price - b.price)
      return {
        product: name,
        stores: storePrices.map(p => ({ store: p.store, price: p.price })),
        bestPrice: sorted[0]?.price || 0,
        bestStore: sorted[0]?.store || '',
      }
    })
    setTrending(top)
    setLoading(false)
  }, [])

  const handleSearch = (query: string) => {
    setSearch(query)
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const prices = getDemoPrices()
    const products = [...new Set(prices.filter(p =>
      p.product_name.toLowerCase().includes(q) ||
      p.store.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    ).map(p => p.product_name))]

    const r: SearchResult[] = products.map(name => {
      const storePrices = prices.filter(p => p.product_name === name)
      const sorted = [...storePrices].sort((a, b) => a.price - b.price)
      return {
        product: name,
        stores: storePrices.map(p => ({ store: p.store, price: p.price })),
        bestPrice: sorted[0]?.price || 0,
        bestStore: sorted[0]?.store || '',
      }
    })
    setResults(r)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
              📊 Live Price Comparison
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Find the{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Best Grocery Prices
              </span>{' '}
              Near You
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Compare prices across Walmart, Target, Aldi, Whole Foods, and more. 
              Save up to 40% on your grocery bill.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 rounded-2xl px-4 py-3 focus-within:border-cyan-500/50 transition-all">
              <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search any grocery item... (e.g. whole milk, eggs, bread)"
                className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-lg"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Dairy', 'Produce', 'Meat', 'Bakery'].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSearch(cat)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-cyan-400 transition-all border border-slate-700/30"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-300">
            Results for &ldquo;{search}&rdquo;
          </h2>
          <div className="space-y-4">
            {results.map(item => (
              <Link key={item.product} href={`/compare?q=${encodeURIComponent(item.product)}`}>
                <div className="gradient-card p-4 hover:border-cyan-500/30 transition-all cursor-pointer block">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{item.product}</h3>
                    <span className="text-xs text-slate-500">{item.stores.length} stores</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.stores.slice(0, 5).map(s => (
                      <div key={s.store} className={`store-pill ${s.price === item.bestPrice ? 'active' : ''}`}>
                        {s.store}
                        <span className={s.price === item.bestPrice ? 'text-green-400 font-bold' : 'text-slate-400'}>
                          ${s.price.toFixed(2)}
                        </span>
                        {s.price === item.bestPrice && <span className="text-green-400 text-xs">★</span>}
                      </div>
                    ))}
                    {item.stores.length > 5 && (
                      <span className="text-xs text-slate-500 self-center">+{item.stores.length - 5} more</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Products */}
      {results.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-lg font-semibold mb-4 text-slate-300">Popular Items to Compare</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gradient-card p-4"><div className="skeleton h-16" /></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trending.map(item => (
                <Link key={item.product} href={`/compare?q=${encodeURIComponent(item.product)}`}>
                  <div className="gradient-card p-4 hover:border-cyan-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white text-sm">{item.product}</h3>
                      <span className="text-xs text-green-400 font-semibold">${item.bestPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.stores.slice(0, 4).map(s => (
                        <span key={s.store} className={`text-xs px-2 py-0.5 rounded-full ${
                          s.price === item.bestPrice
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-slate-800/50 text-slate-400'
                        }`}>
                          {s.store}: ${s.price.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLS Live Price Trends */}
      {blsData.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Live National Averages</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] border border-green-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              BLS
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {blsData.slice(0, 12).map(s => {
              const info = PRODUCT_CATALOG.find(p => p.name === Object.entries(BLS_PRODUCT_MAP).find(([, id]) => id === s.id)?.[0])
              return (
                <Link key={s.id} href={`/trends`} className="gradient-card p-3 hover:border-cyan-500/30 transition-all">
                  <div className="text-sm text-slate-400">{info?.emoji || '📦'} {s.name}</div>
                  <div className="text-lg font-bold text-white mt-1">${s.latest.toFixed(2)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs ${(s.change3m ?? 0) > 0 ? 'text-red-400' : (s.change3m ?? 0) < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                      {(s.change3m ?? 0) > 0 ? '↑' : (s.change3m ?? 0) < 0 ? '↓' : '→'} ${Math.abs(s.change3m ?? 0).toFixed(2)} 3m
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-3">
            <Link href="/trends" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              View all trends & insights →
            </Link>
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/upload" className="gradient-card p-6 text-center hover:border-cyan-500/30 transition-all">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold text-white mb-1">Scan Receipt</h3>
            <p className="text-sm text-slate-400">Upload a receipt photo — we&apos;ll extract items &amp; prices automatically</p>
          </Link>
          <Link href="/compare" className="gradient-card p-6 text-center hover:border-cyan-500/30 transition-all">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-white mb-1">Compare Prices</h3>
            <p className="text-sm text-slate-400">See which store has the best price for every item</p>
          </Link>
          <Link href="/dashboard" className="gradient-card p-6 text-center hover:border-cyan-500/30 transition-all">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-white mb-1">Track Savings</h3>
            <p className="text-sm text-slate-400">See how much you save over time by shopping smarter</p>
          </Link>
        </div>
      </div>

      {/* Stores */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Tracked Stores</h2>
        <div className="flex flex-wrap gap-3">
          {getStores().map(store => (
            <Link key={store} href={`/compare?store=${encodeURIComponent(store)}`}>
              <div className="gradient-card px-4 py-2.5 hover:border-cyan-500/30 transition-all cursor-pointer">
                <span className="text-white font-medium text-sm">{store}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
