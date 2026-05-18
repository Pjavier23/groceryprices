// lib/bls.ts
// Bureau of Labor Statistics API — free, no key required
// Provides average retail food prices from government data

export type BLSPoint = {
  year: string
  month: string // "M01" through "M12"
  value: number
  periodLabel: string // "Jan 2025"
}

export type BLSSeries = {
  id: string
  name: string
  unit: string
  points: BLSPoint[]
  latest: number
  change3m: number | null  // 3-month change
  change12m: number | null // 12-month change
}

// BLS Series IDs for common grocery items
// Description source: https://www.bls.gov/regions/mid-atlantic/data/averageretailfoodandenergyprices_us.htm
export const BLS_SERIES: Record<string, { name: string; unit: string }> = {
  APU0000701111: { name: 'Milk (Whole)', unit: 'per gal.' },
  APU0000720111: { name: 'Milk (Lowfat)', unit: 'per gal.' },
  APU0000702111: { name: 'White Bread', unit: 'per lb.' },
  APU0000713111: { name: 'Whole Wheat Bread', unit: 'per lb.' },
  APU0000703111: { name: 'Chicken Breast', unit: 'per lb.' },
  APU0000704111: { name: 'Eggs (Grade A)', unit: 'per doz.' },
  APU0000706111: { name: 'Bacon (Sliced)', unit: 'per lb.' },
  APU0000708111: { name: 'Cheddar Cheese', unit: 'per lb.' },
  APU0000712211: { name: 'Potatoes (White)', unit: 'per lb.' },
  APU0000712311: { name: 'Bananas', unit: 'per lb.' },
  APU0000720311: { name: 'Ground Beef', unit: 'per lb.' },
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Fetch BLS data for multiple series IDs
 */
export async function fetchBLSPrices(seriesIds?: string[]): Promise<BLSSeries[]> {
  const ids = seriesIds || Object.keys(BLS_SERIES)
  const endYear = new Date().getFullYear()
  const startYear = endYear - 2  // 2 years of history
  
  const seriesIdsArray = ids.length > 50 ? ids.slice(0, 50) : ids

  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'GroceryPrices/1.0' },
      body: JSON.stringify({
        seriesid: seriesIdsArray,
        startyear: String(startYear),
        endyear: String(endYear),
      }),
    })

    const data = await res.json()
    if (data.status !== 'REQUEST_SUCCEEDED') {
      console.warn('BLS API error:', data.message)
      return []
    }

    const series: BLSSeries[] = (data.Results?.series || []).map((s: any) => {
      const points: BLSPoint[] = (s.data || [])
        .filter((d: any) => d.value && d.value !== '-')
        .map((d: any) => ({
          year: d.year,
          month: d.period,
          value: parseFloat(d.value),
          periodLabel: `${MONTH_NAMES[parseInt(d.period.replace('M', ''))] || d.period} ${d.year}`,
        }))
        .sort((a: BLSPoint, b: BLSPoint) => a.year.localeCompare(b.year) || a.month.localeCompare(b.month))

      const latest = points[points.length - 1]?.value || 0
      
      // Calculate 3-month change
      const idx3m = points.length - 4
      const val3m = idx3m >= 0 ? points[idx3m]?.value : null
      const change3m = val3m ? latest - val3m : null

      // Calculate 12-month change
      const idx12m = points.length - 13
      const val12m = idx12m >= 0 ? points[idx12m]?.value : null
      const change12m = val12m ? latest - val12m : null

      const meta = BLS_SERIES[s.seriesID] || { name: s.seriesID, unit: '' }
      return {
        id: s.seriesID,
        name: meta.name,
        unit: meta.unit,
        points,
        latest,
        change3m,
        change12m,
      }
    })

    return series
  } catch (err) {
    console.error('BLS fetch failed:', err)
    return []
  }
}

/**
 * Get a single BLS series
 */
export async function getBLSPrice(seriesId: string): Promise<BLSSeries | null> {
  const series = await fetchBLSPrices([seriesId])
  return series[0] || null
}

/**
 * Calculate seasonal price trend from historical data
 * Returns which months typically have the lowest/highest prices
 */
export function getSeasonalTrend(points: BLSPoint[]): {
  lowMonth: string
  highMonth: string
  avgPrice: number
  monthlyAverages: Record<string, number>
} {
  const byMonth: Record<string, number[]> = {}
  
  for (const p of points) {
    const m = p.month // "M01" to "M12"
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(p.value)
  }

  const monthlyAverages: Record<string, number> = {}
  let minAvg = Infinity, maxAvg = -Infinity
  let lowMonth = '', highMonth = ''
  
  for (const [m, vals] of Object.entries(byMonth)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    monthlyAverages[MONTH_NAMES[parseInt(m.replace('M', ''))]] = avg
    if (avg < minAvg) { minAvg = avg; lowMonth = MONTH_NAMES[parseInt(m.replace('M', ''))] }
    if (avg > maxAvg) { maxAvg = avg; highMonth = MONTH_NAMES[parseInt(m.replace('M', ''))] }
  }

  const allValues = points.map(p => p.value)
  const avgPrice = allValues.reduce((a, b) => a + b, 0) / allValues.length

  return { lowMonth, highMonth, avgPrice, monthlyAverages }
}
