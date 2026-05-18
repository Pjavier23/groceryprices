// app/api/prices/route.ts
import { NextResponse } from 'next/server'
import { fetchBLSPrices } from '@/lib/bls'

export async function GET() {
  try {
    const series = await fetchBLSPrices()
    
    const data = series.map(s => ({
      id: s.id,
      name: s.name,
      unit: s.unit,
      latest: s.latest,
      change3m: s.change3m,
      change12m: s.change12m,
      recentPoints: s.points.slice(-12).map(p => ({
        date: p.periodLabel,
        value: p.value,
      })),
    }))

    return NextResponse.json({
      source: 'bls',
      lastUpdated: new Date().toISOString(),
      products: data,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
