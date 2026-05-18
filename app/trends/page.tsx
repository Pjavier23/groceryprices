"use client"

import { useState, useEffect } from "react"
import { fetchBLSPrices, getSeasonalTrend } from "@/lib/bls"
import { getProductInfo, BLS_PRODUCT_MAP, STORES } from "@/lib/prices"
import type { BLSSeries } from "@/lib/bls"

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

  const getMinMax = () => {
    if (!selectedSeries?.points.length) return { min: 0, max: 0, range: 0 }
    const vals = selectedSeries.points.map(p => p.value)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return { min, max, range: max - min }
  }

  const { min, max, range } = getMinMax()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">Price Trends</h1>
        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
          LIVE
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        National average grocery prices from the Bureau of Labor Statistics. Updated monthly.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product selector */}
        <div className="lg:col-span-1">
          <div className="gradient-card p-4 sticky top-20">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Products</h3>
            <div className="space-y-1">
              {series.map(s => {
                const info = getProductInfo(
                  Object.entries(BLS_PRODUCT_MAP).find(([, id]) => id === s.id)?.[0] || ''
                )
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                      selected === s.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span>
                      {info?.emoji || '📦'} {s.name}
                    </span>
                    <span className="text-xs font-semibold">${s.latest.toFixed(2)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart + details */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="gradient-card p-8"><div className="skeleton h-64" /></div>
          ) : selectedSeries && trend ? (
            <div className="space-y-6">
              {/* Header stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="gradient-card p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Current Price</div>
                  <div className="text-xl font-bold text-white">${selectedSeries.latest.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">{selectedSeries.unit}</div>
                </div>
                <div className="gradient-card p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">3-Month Change</div>
                  <div className={`text-xl font-bold ${(selectedSeries.change3m ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedSeries.change3m != null ? `${selectedSeries.change3m > 0 ? '+' : ''}$${selectedSeries.change3m.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className="gradient-card p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Yearly Change</div>
                  <div className={`text-xl font-bold ${(selectedSeries.change12m ?? 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedSeries.change12m != null ? `${selectedSeries.change12m > 0 ? '+' : ''}$${selectedSeries.change12m.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className="gradient-card p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Best Time to Buy</div>
                  <div className="text-xl font-bold text-cyan-400">{trend.lowMonth}</div>
                </div>
              </div>

              {/* Price History Chart */}
              <div className="gradient-card p-5">
                <h3 className="font-semibold text-white mb-4">Price History (24 months)</h3>
                <div className="relative" style={{ height: 250 }}>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-slate-500">
                    <span>${max.toFixed(2)}</span>
                    <span>${(max + min) / 2 > 0 ? ((max + min) / 2).toFixed(2) : ''}</span>
                    <span>${min.toFixed(2)}</span>
                  </div>
                  {/* Chart area */}
                  <div className="ml-14 h-full">
                    <div className="flex items-end gap-1 h-[calc(100%-24px)]">
                      {selectedSeries.points.map((pt, i) => {
                        const height = range > 0 ? ((pt.value - min) / range) * 100 : 50
                        const isLatest = i === selectedSeries.points.length - 1
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end min-w-[8px]" title={`${pt.periodLabel}: $${pt.value.toFixed(2)}`}>
                            <div
                              className={`w-full rounded-t transition-all duration-300 ${
                                isLatest ? 'bg-cyan-400' : 'bg-cyan-600/60 hover:bg-cyan-500/80'
                              }`}
                              style={{ height: `${height}%`, minHeight: 4 }}
                            />
                          </div>
                        )
                      })}
                    </div>
                    {/* X-axis labels */}
                    <div className="flex justify-between text-xs text-slate-500 mt-1 ml-0">
                      {selectedSeries.points.filter((_, i) => i % 3 === 0 || i === selectedSeries.points.length - 1).map((pt, i) => (
                        <span key={i}>{pt.periodLabel}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonal insights */}
              <div className="gradient-card p-5">
                <h3 className="font-semibold text-white mb-4">Seasonal Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => {
                    const avg = trend.monthlyAverages[month]
                    const isLow = month === trend.lowMonth
                    const isHigh = month === trend.highMonth
                    return (
                      <div key={month} className={`text-center p-2 rounded-lg ${
                        isLow ? 'bg-green-500/10 border border-green-500/20' :
                        isHigh ? 'bg-red-500/10 border border-red-500/20' :
                        'bg-slate-800/30'
                      }`}>
                        <div className="text-xs text-slate-400">{month}</div>
                        <div className={`text-sm font-bold ${isLow ? 'text-green-400' : isHigh ? 'text-red-400' : 'text-white'}`}>
                          {avg ? `$${avg.toFixed(2)}` : '—'}
                        </div>
                        {(isLow || isHigh) && (
                          <div className="text-[10px] text-slate-500">{isLow ? '💰 Cheapest' : '🔥 Priciest'}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Future prediction */}
              <div className="gradient-card p-5">
                <h3 className="font-semibold text-white mb-2">📈 What This Means For You</h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>
                    <strong className="text-cyan-400">{selectedSeries.name}</strong> averages 
                    <strong className="text-white"> ${trend.avgPrice.toFixed(2)}</strong> over the past 2 years. 
                    Prices are <strong className={selectedSeries.change12m && selectedSeries.change12m > 0 ? 'text-red-400' : 'text-green-400'}>
                      {selectedSeries.change12m && selectedSeries.change12m > 0 ? 'up' : 'down'} ${Math.abs(selectedSeries.change12m || 0).toFixed(2)}
                    </strong> from this time last year.
                  </p>
                  <p>
                    💡 <strong className="text-green-400">Best time to stock up:</strong> {trend.lowMonth} (prices typically lowest)
                    {trend.highMonth !== trend.lowMonth ? ` · Avoid: ${trend.highMonth} (prices peak)` : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="gradient-card p-8 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-400">Select a product to view trends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
