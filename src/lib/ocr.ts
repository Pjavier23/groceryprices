// lib/ocr.ts
// Receipt OCR pipeline using Tesseract.js
import Tesseract from 'tesseract.js'
import * as pdfjs from 'pdfjs-dist'

// Configure pdfjs worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = ''
} catch {}

export type ReceiptItem = {
  name: string
  price: number
  quantity?: number
  category?: string
}

export type ReceiptParseResult = {
  store?: string
  date?: string
  total?: number
  items: ReceiptItem[]
  raw_text: string
}

// Common store names and patterns
const STORE_PATTERNS: [RegExp, string][] = [
  [/walmart/i, 'Walmart'],
  [/target/i, 'Target'],
  [/costco/i, 'Costco'],
  [/safeway/i, 'Safeway'],
  [/trader\s*joes?/i, "Trader Joe's"],
  [/whole\s*foods/i, 'Whole Foods'],
  [/kroger/i, 'Kroger'],
  [/aldi/i, 'Aldi'],
  [/giant/i, 'Giant'],
  [/shoprite/i, 'ShopRite'],
  [/food\s*lion/i, 'Food Lion'],
  [/wegmans/i, 'Wegmans'],
  [/publix/i, 'Publix'],
  [/hebrew\s*national/i, "Hebrew National"],
  [/stop\s*[&]?\s*shop/i, 'Stop & Shop'],
]

// Price pattern: $X.XX or X.XX
const PRICE_RE = /\$?(\d+\.\d{2})\b/

export async function extractReceiptText(imageBuffer: Buffer): Promise<ReceiptParseResult> {
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: (m: any) => { if (m.status === 'recognizing text') {} },
  })
  
  const text = result.data.text
  const lines = text.split('\n').filter(l => l.trim())
  
  return parseReceiptText(text, lines)
}

export async function extractPDFText(pdfBuffer: Buffer): Promise<ReceiptParseResult> {
  const data = new Uint8Array(pdfBuffer.buffer || pdfBuffer)
  const doc = await pdfjs.getDocument({ data }).promise
  let text = ''
  
  for (let i = 1; i <= Math.min(doc.numPages, 5); i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  
  const lines = text.split('\n').filter(l => l.trim())
  return parseReceiptText(text, lines)
}

function parseReceiptText(text: string, lines: string[]): ReceiptParseResult {
  // Detect store
  let store: string | undefined
  for (const [pattern, name] of STORE_PATTERNS) {
    if (pattern.test(text)) {
      store = name
      break
    }
  }
  
  // Detect date
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  const date = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : undefined
  
  // Extract items (lines containing a price)
  const items: ReceiptItem[] = []
  let total: number | undefined
  
  for (const line of lines) {
    const priceMatch = line.match(PRICE_RE)
    if (!priceMatch) continue
    
    const price = parseFloat(priceMatch[1])
    const name = line.replace(PRICE_RE, '').trim()
    
    if (!name || price === 0) continue
    
    // Check if it's the total
    if (/total|tend|change|cash|visa|mc |debit|credit|tax|balance/i.test(name) && price > 0) {
      if (/total|tend/i.test(name)) total = price
      continue
    }
    
    items.push({ name, price })
  }
  
  return { store, date, total, items, raw_text: text }
}

// Lookup product details via Open Food Facts
export async function lookupBarcode(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`)
    const data = await res.json()
    if (data.status === 1) {
      return {
        name: data.product.product_name,
        brand: data.product.brands,
        category: data.product.categories_tags?.[0]?.replace('en:', '') || undefined,
        image: data.product.image_url,
        quantity: data.product.quantity,
      }
    }
  } catch {}
  return null
}
