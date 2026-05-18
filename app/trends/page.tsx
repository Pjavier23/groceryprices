"use client"

import { useState, useEffect } from "react"
import { fetchBLSPrices, getSeasonalTrend } from "@/lib/bls"
import { getProductInfo, BLS_PRODUCT_MAP, PRODUCT_CATALOG } from "@/lib/prices"
import type { BLSSeries } from "@/lib/bls"
import {
  TrendUpIcon, TrendingDownIcon, ArrowUpIcon, ArrowDownIcon,
  ZapIcon, DollarIcon, CalendarIcon, LightbulbIcon, ChartIcon,
  StarIcon, StoreIcon, ClockIcon
} from "@/lib/icons"

export default function TrendsPage() {
  const [series, setSeries] = useState<BLSSeries[]>([])
  const [selected, setSelected] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await fetchBLSPrices()
      setSeries(data.filter(s => s.latest > 0))
      if (data.length > 0) setSelected(data[0].id)
      setLoading(false)
    }
    load()
  }, [])

  const selectedSeries = series.find(s => s.id === selected)
  const trend = selectedSeries ? getSeasonalTrend(selectedSeries.points) : null
  const prodName = Object.entries(BLS_PRODUCT_MAP).find(([, id]) => id === selected)?.[0]
  const productInfo = prodName ? PRODUCT_CATALOG.find(p => p.name === prodName) : null

  const getMinMax = () => {
    if (!selectedSeries?.points.length) return { min: 0, max: 0, range: 0 }
    const vals = selectedSeries.points.map(p => p.value)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return { min, max, range: max - min }
  }

  const { min, max, range } = getMinMax()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-green-500/10 border border-cyan-500/15 flex items-center justify-center">
          <TrendUpIcon size={22} className="text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Price Trends</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="live-dot" />
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Live</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">National average grocery prices from the Bureau of Labor Statistics — updated monthly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        {/* Product Selector */}
        <div className="lg:col-span-1">
          <div className="gradient-card p-4 sticky top-24">
            <div className="flex items-center gap-2 mb-4 px-1">
              <StoreIcon size={14} className="text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Products</h3>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {series.map(s => {
                const pName = Object.entries(BLS_PRODUCT_MAP).find(([, id]) => id === s.id)?.[0]
                const info = pName ? PRODUCT_CATALOG.find(p => p.name === pName) : null
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${
                      selected === s.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {info?.emoji || '📦'}
                      {s.name}
                    </span>
                    <span className="text-xs font-semibold font-mono">${s.latest.toFixed(2)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="gradient-card p-10"><div className="skeleton h-80" /></div>
          ) : selectedSeries && trend ? (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="gradient-card p-5">
                  <div className="text-xs text-slate-500 mb-2">Current Price</div>
                  <div className="flex items-end gap-1.5">
                    <div className="text-3xl font-bold text-white tracking-tight price-counter">${selectedSeries.latest.toFixed(2)}</div>
                    <span className="text-xs text-slate-500 mb-1.5">/{selectedSeries.unit}</span>
                  </div>
                </div>
                <div className="gradient-card p-5">
                  <div className="text-xs text-slate-500 mb-2">3-Month Change</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      (selectedSeries.change3m ?? 0) > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                    }`}>
                      {(selectedSeries.change3m ?? 0) > 0
                        ? <ArrowUpIcon size={16} className="text-red-400" />
                        : <ArrowDownIcon size={16} className="text-green-400" />
                      }
                    </div>
                    <div className={`text-2xl font-bold ${(selectedSeries.change3m ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedSeries.change3m != null
                        ? `${selectedSeries.change3m > 0 ? '+' : ''}$${selectedSeries.change3m.toFixed(2)}`
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="gradient-card p-5">
                  <div className="text-xs text-slate-500 mb-2">Yearly Change</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      (selectedSeries.change12m ?? 0) > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                    }`}>
                      {(selectedSeries.change12m ?? 0) > 0
                        ? <ArrowUpIcon size={16} className="text-red-400" />
                        : <ArrowDownIcon size={16} className="text-green-400" />
                      }
                    </div>
                    <div className={`text-2xl font-bold ${(selectedSeries.change12m ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedSeries.change12m != null
                        ? `${selectedSeries.change12m > 0 ? '+' : ''}$${selectedSeries.change12m.toFixed(2)}`
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="gradient-card p-5">
                  <div className="text-xs text-slate-500 mb-2">Best Time to Buy</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <StarIcon size={16} className="text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{trend.lowMonth}</div>
                  </div>
                </div>
              </div>

              {/* Price History Chart */}
              <div className="gradient-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                      <ChartIcon size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedSeries.name} — Price History</h3>
                      <p className="text-xs text-slate-500">{selectedSeries.points.length} data points over 2 years</p>
                    </div>
                  </div>
                </div>

                <div className="relative" style={{ height: 300 }}>
                  {/* Y-axis */}
                  <div className="absolute left-0 top-0 bottom-10 w-14 flex flex-col justify-between text-xs text-slate-500">
                    <span>${max.toFixed(2)}</span>
                    <span>${((max + min) / 2).toFixed(2)}</span>
                    <span>${min.toFixed(2)}</span>
                  </div>
                  
                  {/* Grid lines */}
                  <div className="absolute left-14 right-0 top-0 bottom-10">
                    <div className="border-t border-slate-800/30 h-full flex flex-col justify-between">
                      <div className="border-b border-slate-800/30 flex-1" />
                      <div className="border-b border-slate-800/30 flex-1" />
                      <div className="flex-1" />
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="ml-14 h-[calc(100%-40px)]">
                    <div className="flex items-end gap-0.5 h-full">
                      {selectedSeries.points.map((pt, i) => {
                        const height = range > 0 ? ((pt.value - min) / range) * 100 : 50
                        const isLatest = i === selectedSeries.points.length - 1
                        const isUp = i > 0 && pt.value > selectedSeries.points[i - 1].value
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end min-w-[6px] group/chart relative">
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/chart:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                              {pt.periodLabel}: ${pt.value.toFixed(2)}
                            </div>
                            <div
                              className={`w-full rounded-t transition-all duration-300 cursor-pointer ${
                                isLatest ? 'bg-cyan-400' :
                                isUp ? 'bg-red-500/60 hover:bg-red-400/80' :
                                'bg-green-500/60 hover:bg-green-400/80'
                              }`}
                              style={{ height: `${height}%`, minHeight: 3 }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* X-axis */}
                  <div className="ml-14 flex justify-between text-[10px] text-slate-500 mt-2">
                    {selectedSeries.points.filter((_, i) => i % 4 === 0 || i === selectedSeries.points.length - 1).map((pt, i) => (
                      <span key={i}>{pt.periodLabel}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seasonal Insights */}
              <div className="gradient-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                    <CalendarIcon size={18} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Seasonal Pricing</h3>
                    <p className="text-xs text-slate-500">Average price by month over 2 years</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(month => {
                    const avg = trend.monthlyAverages[month]
                    const isLow = month === trend.lowMonth
                    const isHigh = month === trend.highMonth
                    return (
                      <div key={month} className={`text-center p-3 rounded-xl transition-all ${
                        isLow ? 'bg-green-500/10 border border-green-500/20 shadow-sm shadow-green-500/5' :
                        isHigh ? 'bg-red-500/10 border border-red-500/20 shadow-sm shadow-red-500/5' :
                        'bg-slate-800/30 border border-slate-800/30'
                      }`}>
                        <div className="text-sm font-semibold text-slate-400">{month}</div>
                        <div className={`text-lg font-bold mt-1 ${
                          isLow ? 'text-green-400' : isHigh ? 'text-red-400' : 'text-white'
                        }`}>
                          {avg ? `$${avg.toFixed(2)}` : '—'}
                        </div>
                        <div className="text-[10px] mt-1">
                          {isLow && <span className="text-green-400 font-medium">💰 Best deal</span>}
                          {isHigh && <span className="text-red-400 font-medium">🔥 Peak price</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Insights */}
              <div className="gradient-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                    <LightbulbIcon size={18} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Smart Insights</h3>
                    <p className="text-xs text-slate-500">What this means for your wallet</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/30">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <DollarIcon size={15} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-slate-300">
                        <strong className="text-white">{selectedSeries.name}</strong> averages{' '}
                        <strong className="text-white">${trend.avgPrice.toFixed(2)}</strong> over the past 2 years.
                        Prices are{' '}
                        <strong className={selectedSeries.change12m && selectedSeries.change12m > 0 ? 'text-red-400' : 'text-green-400'}>
                          {selectedSeries.change12m && selectedSeries.change12m > 0 ? 'up' : 'down'} ${Math.abs(selectedSeries.change12m ?? 0).toFixed(2)}
                        </strong>{' '}
                        from this time last year.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarIcon size={15} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-300">
                        <strong className="text-green-400">Best time to stock up:</strong> {trend.lowMonth} when prices
                        are typically lowest. <strong className="text-slate-400">Avoid:</strong> {trend.highMonth} when prices peak.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <TrendUpIcon size={15} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-slate-300">
                        The spread between highest and lowest monthly averages is{' '}
                        <strong className="text-white">${(trend.avgPrice - trend.monthlyAverages[trend.lowMonth] > 0 ? 
                          (trend.monthlyAverages[trend.highMonth] - trend.monthlyAverages[trend.lowMonth]).toFixed(2) : '0.00')}</strong>.
                        Buying smart could save you <strong className="text-green-400">
                          ${((trend.monthlyAverages[trend.highMonth] - trend.monthlyAverages[trend.lowMonth]) * 12).toFixed(2)}
                        </strong> per year on this item alone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="gradient-card p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/30 mx-auto mb-5 flex items-center justify-center">
                <ChartIcon size={28} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Data Selected</h3>
              <p className="text-sm text-slate-500">Choose a product from the left panel to view price trends.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
