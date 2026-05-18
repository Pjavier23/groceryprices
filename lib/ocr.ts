// lib/ocr.ts
// Receipt OCR pipeline using Tesseract.js
import Tesseract from 'tesseract.js'

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
  [/stop\s*[&]?\s*shop/i, 'Stop & Shop'],
]

const PRICE_RE = /\$?(\d+\.\d{2})\b/

export async function extractReceiptText(imageBuffer: Buffer): Promise<ReceiptParseResult> {
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {},
  })
  
  const text = result.data.text
  const lines = text.split('\n').filter((l: string) => l.trim())
  return parseReceiptText(text, lines)
}

export async function extractPDFText(pdfBuffer: Buffer): Promise<ReceiptParseResult> {
  // Lazy load pdfjs to avoid DOMMatrix errors at build time
  const pdfjs = await import('pdfjs-dist')
  const data = new Uint8Array(pdfBuffer)
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
  let store: string | undefined
  for (const [pattern, name] of STORE_PATTERNS) {
    if (pattern.test(text)) {
      store = name
      break
    }
  }
  
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  const date = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : undefined
  
  const items: ReceiptItem[] = []
  let total: number | undefined
  
  for (const line of lines) {
    const priceMatch = line.match(PRICE_RE)
    if (!priceMatch) continue
    
    const price = parseFloat(priceMatch[1])
    const name = line.replace(PRICE_RE, '').trim()
    
    if (!name || price === 0) continue
    
    if (/total|tend|change|cash|visa|mc |debit|credit|tax|balance/i.test(name) && price > 0) {
      if (/total|tend/i.test(name)) total = price
      continue
    }
    
    items.push({ name, price })
  }
  
  return { store, date, total, items, raw_text: text }
}
