// app/api/receipts/route.ts
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://tkljofxcndnwqyqrtrnx.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbGpvZnhjbmRud3F5cXJ0cm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzMxNSwiZXhwIjoyMDg3MzQzMzE1fQ.I07_YtatFR6sZfDRmjtwLTaMb83w-tRRAKMknoFXQFg'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { store, date, total, items, raw_text, zip_code } = body

    // Save receipt
    const receiptRes = await fetch(`${SUPABASE_URL}/rest/v1/grocery_receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        store,
        date,
        total,
        items: items || [],
        raw_text,
        zip_code,
      }),
    })

    if (!receiptRes.ok) {
      return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 })
    }

    const receipt = await receiptRes.json()

    // Save individual price entries
    if (items && Array.isArray(items)) {
      const priceRows = items.map((item: any) => ({
        product_name: item.name,
        store: store || 'Unknown',
        price: item.price,
        category: item.category || null,
        unit: item.unit || null,
        quantity: item.quantity || null,
        date: date || new Date().toISOString().split('T')[0],
        source: 'receipt',
        receipt_id: receipt[0]?.id,
        zip_code: zip_code || null,
      }))

      if (priceRows.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/grocery_prices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(priceRows),
        })
      }
    }

    return NextResponse.json({ success: true, receipt: receipt[0] })
  } catch (err) {
    console.error('Receipt save error:', err)
    return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/grocery_prices?select=*&order=created_at.desc&limit=100`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 })
  }
}
