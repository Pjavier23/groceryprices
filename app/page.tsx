"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getStores, getBestPrices, getProducts, getDemoPrices, BLS_PRODUCT_MAP, PRODUCT_CATALOG } from "@/lib/prices"
import { fetchBLSPrices } from "@/lib/bls"
import type { PriceEntry } from "@/lib/prices"
import type { BLSSeries } from "@/lib/bls"
import {
  SearchIcon, StoreIcon, DollarIcon, TrendUpIcon, TrendingDownIcon,
  CameraIcon, ChartIcon, DashboardIcon, ReceiptIcon,
  StarIcon, ZapIcon, ArrowUpIcon, ArrowDownIcon, GroceryIcon, LightbulbIcon
} from "@/lib/icons"

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
    fetchBLSPrices().then(data => {
      setBlsData(data.filter(s => s.latest > 0))
    }).catch(() => {})

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
    if (!query.trim()) { setResults([]); return }
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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/8 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/5 rounded-full blur-[100px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/15 text-cyan-400 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              Live Pricing Data — Powered by BLS
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight leading-tight">
              Find the{' '}
              <span className="gradient-text">
                Best Prices
              </span>
              <br />
              on Every Item
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Compare prices across Walmart, Target, Aldi, Whole Foods, and more. 
              Track trends with live government data, scan receipts, and save up to 40%.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-green-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-500" />
              <div className="relative flex items-center gap-3 bg-slate-900/90 border border-slate-700/40 rounded-2xl px-5 py-4 focus-within:border-cyan-500/40 transition-all">
                <SearchIcon className="w-5 h-5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search any grocery item... (milk, eggs, bread, chicken)"
                  className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-lg"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => handleSearch('')} className="text-slate-500 hover:text-white transition-colors text-sm px-2">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['Dairy', 'Produce', 'Meat', 'Bakery', 'Pantry'].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSearch(cat)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/40 text-slate-400 hover:bg-slate-700/50 hover:text-cyan-400 transition-all border border-slate-700/20 hover:border-cyan-500/20"
                >
                  {cat}
                </button>
              ))}
              <Link href="/trends" className="px-4 py-1.5 rounded-full text-xs font-medium bg-cyan-500/8 text-cyan-400 hover:bg-cyan-500/15 transition-all border border-cyan-500/15 flex items-center gap-1.5">
                <ZapIcon size={12} />
                View Trends
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-200">
              Results for &ldquo;{search}&rdquo;
              <span className="text-sm font-normal text-slate-500 ml-2">({results.length} items)</span>
            </h2>
          </div>
          <div className="grid gap-3">
            {results.map(item => (
              <Link key={item.product} href={`/compare?q=${encodeURIComponent(item.product)}`}>
                <div className="group gradient-card p-5 hover:border-cyan-500/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-green-500/10 border border-cyan-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <DollarIcon size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{item.product}</h3>
                        <span className="text-xs text-slate-500">{item.stores.length} stores</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">${item.bestPrice.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">Best at {item.bestStore}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.stores.slice(0, 6).map(s => (
                      <div key={s.store} className={`store-pill ${s.price === item.bestPrice ? 'active' : ''}`}>
                        <StoreIcon size={10} />
                        {s.store}
                        <span className={s.price === item.bestPrice ? 'text-green-400 font-bold' : 'text-slate-400'}>
                          ${s.price.toFixed(2)}
                        </span>
                        {s.price === item.bestPrice && <StarIcon size={10} className="text-green-400" />}
                      </div>
                    ))}
                    {item.stores.length > 6 && (
                      <span className="text-xs text-slate-500 self-center">+{item.stores.length - 6} more</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Live BLS Data */}
      {results.length === 0 && blsData.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TrendUpIcon size={16} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Live National Averages</h2>
              <p className="text-xs text-slate-500">Updated monthly — Bureau of Labor Statistics</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="live-dot" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {blsData.slice(0, 12).map(s => {
              const prodName = Object.entries(BLS_PRODUCT_MAP).find(([, id]) => id === s.id)?.[0]
              const info = PRODUCT_CATALOG.find(p => p.name === prodName)
              const isUp = (s.change3m ?? 0) > 0
              const isDown = (s.change3m ?? 0) < 0
              return (
                <Link key={s.id} href="/trends" className="group gradient-card p-4 hover:border-cyan-500/20 transition-all">
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    {info?.emoji || '📦'} {s.name}
                  </div>
                  <div className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight price-counter">
                    ${s.latest.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {isUp && <ArrowUpIcon size={12} className="text-red-400" />}
                    {isDown && <ArrowDownIcon size={12} className="text-green-400" />}
                    {!isUp && !isDown && <span className="w-3" />}
                    <span className={`text-xs font-medium ${
                      isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {isUp ? '+' : isDown ? '' : ''}${Math.abs(s.change3m ?? 0).toFixed(2)} (3mo)
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-5">
            <Link href="/trends" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/20 text-cyan-400 hover:from-cyan-500/20 hover:to-green-500/20 transition-all text-sm font-medium">
              <ZapIcon size={16} />
              View Full Trends & Insights
            </Link>
          </div>
        </div>
      )}

      {/* Trending Products */}
      {results.length === 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <ChartIcon size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Popular Items to Compare</h2>
              <p className="text-xs text-slate-500">See which stores have the best deals</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gradient-card p-5"><div className="skeleton h-20" /></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trending.map(item => (
                <Link key={item.product} href={`/compare?q=${encodeURIComponent(item.product)}`}>
                  <div className="group gradient-card p-5 hover:border-cyan-500/20 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                          <DollarIcon size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <h3 className="font-medium text-white text-sm group-hover:text-cyan-400 transition-colors">{item.product}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                        ${item.bestPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.stores.slice(0, 5).map(s => (
                        <span key={s.store} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                          s.price === item.bestPrice
                            ? 'bg-green-500/8 text-green-400 border border-green-500/15'
                            : 'bg-slate-800/30 text-slate-400 border border-slate-700/20'
                        }`}>
                          {s.store}: <strong>${s.price.toFixed(2)}</strong>
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

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/upload" className="group gradient-card p-7 text-center hover:border-cyan-500/20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/10 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CameraIcon size={24} className="text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Scan Receipt</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Upload a receipt photo — OCR extracts items, prices, and store automatically</p>
          </Link>
          <Link href="/compare" className="group gradient-card p-7 text-center hover:border-cyan-500/20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/10 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ChartIcon size={24} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Compare Prices</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Bar charts and ranked tables showing exactly which store is cheapest</p>
          </Link>
          <Link href="/dashboard" className="group gradient-card p-7 text-center hover:border-cyan-500/20 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/10 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DashboardIcon size={24} className="text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Track Savings</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Dashboard showing potential savings, store rankings, and price history</p>
          </Link>
        </div>
      </div>

      {/* Stores */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
            <StoreIcon size={16} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200">Tracked Stores</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {getStores().map(store => (
            <Link key={store} href={`/compare?store=${encodeURIComponent(store)}`}>
              <div className="group gradient-card px-5 py-3 hover:border-cyan-500/20 transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <StoreIcon size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-white font-medium text-sm">{store}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
