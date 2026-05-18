// lib/prices.ts
// Unified price engine — combines BLS, USDA, receipt DB, and demo fallback

import { fetchBLSPrices, getSeasonalTrend, type BLSSeries } from './bls'

export type PriceEntry = {
  product_name: string
  store: string
  price: number
  date: string
  category: string
  unit?: string
  source: 'bls' | 'demo' | 'receipt'
}

export type ProductInfo = {
  name: string
  category: string
  blsId?: string // BLS series ID for live pricing
  typicalUnit: string
  emoji: string
  seasonality?: string
}

// BLS product mapping — which items map to which BLS series
export const BLS_PRODUCT_MAP: Record<string, string> = {
  'Whole Milk': 'APU0000701111',
  'Lowfat Milk': 'APU0000720111',
  'White Bread': 'APU0000702111',
  'Chicken Breast': 'APU0000703111',
  'Eggs (dozen)': 'APU0000704111',
  'Bacon': 'APU0000706111',
  'Cheddar Cheese': 'APU0000708111',
  'Potatoes': 'APU0000712211',
  'Bananas': 'APU0000712311',
  'Whole Wheat Bread': 'APU0000713111',
  'Ground Beef': 'APU0000720311',
}

// Extended product catalog with metadata
export const PRODUCT_CATALOG: ProductInfo[] = [
  { name: 'Whole Milk', category: 'Dairy', blsId: 'APU0000701111', typicalUnit: 'gal.', emoji: '🥛' },
  { name: 'Lowfat Milk', category: 'Dairy', blsId: 'APU0000720111', typicalUnit: 'gal.', emoji: '🥛' },
  { name: 'Eggs (dozen)', category: 'Dairy', blsId: 'APU0000704111', typicalUnit: 'doz.', emoji: '🥚' },
  { name: 'Cheddar Cheese', category: 'Dairy', blsId: 'APU0000708111', typicalUnit: 'lb.', emoji: '🧀' },
  { name: 'Greek Yogurt', category: 'Dairy', typicalUnit: '32oz', emoji: '🫙' },
  { name: 'Butter', category: 'Dairy', typicalUnit: '1lb', emoji: '🧈' },
  { name: 'White Bread', category: 'Bakery', blsId: 'APU0000702111', typicalUnit: 'lb.', emoji: '🍞' },
  { name: 'Whole Wheat Bread', category: 'Bakery', blsId: 'APU0000713111', typicalUnit: 'lb.', emoji: '🍞' },
  { name: 'Chicken Breast', category: 'Meat', blsId: 'APU0000703111', typicalUnit: 'lb.', emoji: '🍗' },
  { name: 'Ground Beef', category: 'Meat', blsId: 'APU0000720311', typicalUnit: 'lb.', emoji: '🥩' },
  { name: 'Bacon', category: 'Meat', blsId: 'APU0000706111', typicalUnit: 'lb.', emoji: '🥓' },
  { name: 'Bananas', category: 'Produce', blsId: 'APU0000712311', typicalUnit: 'lb.', emoji: '🍌' },
  { name: 'Potatoes', category: 'Produce', blsId: 'APU0000712211', typicalUnit: 'lb.', emoji: '🥔' },
  { name: 'Apples', category: 'Produce', typicalUnit: 'lb.', emoji: '🍎' },
  { name: 'Tomatoes', category: 'Produce', typicalUnit: 'lb.', emoji: '🍅' },
  { name: 'Avocados', category: 'Produce', typicalUnit: 'ea.', emoji: '🥑' },
  { name: 'Onions', category: 'Produce', typicalUnit: 'lb.', emoji: '🧅' },
  { name: 'Pasta', category: 'Pantry', typicalUnit: '1lb', emoji: '🍝' },
  { name: 'Rice', category: 'Pantry', typicalUnit: '2lb', emoji: '🍚' },
  { name: 'Cereal', category: 'Pantry', typicalUnit: '12oz', emoji: '🥣' },
  { name: 'Peanut Butter', category: 'Pantry', typicalUnit: '16oz', emoji: '🥜' },
  { name: 'Granola Bars', category: 'Pantry', typicalUnit: 'box', emoji: '🍫' },
  { name: 'Canned Beans', category: 'Pantry', typicalUnit: '15oz', emoji: '🥫' },
  { name: 'Tomato Sauce', category: 'Pantry', typicalUnit: '15oz', emoji: '🥫' },
  { name: 'Orange Juice', category: 'Beverages', typicalUnit: '1/2 gal.', emoji: '🧃' },
  { name: 'Ground Coffee', category: 'Beverages', typicalUnit: '12oz', emoji: '☕' },
  { name: 'Salmon', category: 'Seafood', typicalUnit: 'lb.', emoji: '🐟' },
  { name: 'Shrimp', category: 'Seafood', typicalUnit: 'lb.', emoji: '🦐' },
]

// Store names
export const STORES = [
  'Walmart', 'Target', 'Aldi', 'Safeway', "Trader Joe's",
  'Whole Foods', 'Kroger', 'Giant', 'Costco', 'ShopRite', 'Publix'
]

const CATEGORIES = ['Dairy', 'Meat', 'Produce', 'Bakery', 'Pantry', 'Beverages', 'Seafood']

// Demo price data (fallback when BLS unavailable)
const DEMO_PRICES: PriceEntry[] = [
  { product_name: 'Whole Milk', store: 'Walmart', price: 3.49, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Target', price: 3.59, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Aldi', price: 3.29, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Safeway', price: 4.19, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: "Trader Joe's", price: 3.49, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Whole Foods', price: 4.49, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Kroger', price: 3.39, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Whole Milk', store: 'Costco', price: 2.99, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Eggs (dozen)', store: 'Walmart', price: 5.29, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Eggs (dozen)', store: 'Target', price: 5.49, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Eggs (dozen)', store: 'Aldi', price: 4.99, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Eggs (dozen)', store: 'Whole Foods', price: 7.29, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Chicken Breast', store: 'Walmart', price: 3.98, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Chicken Breast', store: 'Target', price: 4.29, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Chicken Breast', store: 'Aldi', price: 3.79, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Chicken Breast', store: 'Whole Foods', price: 7.99, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Bananas', store: 'Walmart', price: 0.58, date: '2026-05', category: 'Produce', unit: 'lb.', source: 'demo' },
  { product_name: 'Bananas', store: 'Target', price: 0.65, date: '2026-05', category: 'Produce', unit: 'lb.', source: 'demo' },
  { product_name: 'Bananas', store: 'Aldi', price: 0.49, date: '2026-05', category: 'Produce', unit: 'lb.', source: 'demo' },
  { product_name: 'White Bread', store: 'Walmart', price: 1.98, date: '2026-05', category: 'Bakery', source: 'demo' },
  { product_name: 'White Bread', store: 'Aldi', price: 1.49, date: '2026-05', category: 'Bakery', source: 'demo' },
  { product_name: 'White Bread', store: 'Whole Foods', price: 4.99, date: '2026-05', category: 'Bakery', source: 'demo' },
  { product_name: 'Ground Beef', store: 'Walmart', price: 5.44, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Ground Beef', store: 'Aldi', price: 4.79, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Ground Beef', store: 'Whole Foods', price: 8.99, date: '2026-05', category: 'Meat', source: 'demo' },
  { product_name: 'Pasta', store: 'Walmart', price: 1.24, date: '2026-05', category: 'Pantry', source: 'demo' },
  { product_name: 'Pasta', store: 'Aldi', price: 0.95, date: '2026-05', category: 'Pantry', source: 'demo' },
  { product_name: 'Cheddar Cheese', store: 'Walmart', price: 3.98, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Cheddar Cheese', store: 'Aldi', price: 3.49, date: '2026-05', category: 'Dairy', source: 'demo' },
  { product_name: 'Orange Juice', store: 'Walmart', price: 3.78, date: '2026-05', category: 'Beverages', source: 'demo' },
  { product_name: 'Orange Juice', store: 'Aldi', price: 3.29, date: '2026-05', category: 'Beverages', source: 'demo' },
  { product_name: 'Potatoes', store: 'Walmart', price: 2.98, date: '2026-05', category: 'Produce', unit: '5lb bag', source: 'demo' },
  { product_name: 'Potatoes', store: 'Aldi', price: 2.49, date: '2026-05', category: 'Produce', unit: '5lb bag', source: 'demo' },
  { product_name: 'Apples', store: 'Walmart', price: 1.98, date: '2026-05', category: 'Produce', unit: 'lb.', source: 'demo' },
  { product_name: 'Apples', store: 'Aldi', price: 1.49, date: '2026-05', category: 'Produce', unit: 'lb.', source: 'demo' },
  { product_name: 'Salmon', store: 'Walmart', price: 11.98, date: '2026-05', category: 'Seafood', unit: 'lb.', source: 'demo' },
  { product_name: 'Salmon', store: 'Whole Foods', price: 15.99, date: '2026-05', category: 'Seafood', unit: 'lb.', source: 'demo' },
]

// Cached BLS data
let blsCache: Record<string, number> | null = null
let blsCacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Get BLS prices merged with demo data
 */
export async function getAllPrices(): Promise<PriceEntry[]> {
  const prices = [...DEMO_PRICES]
  
  // Try to fetch BLS live data
  try {
    const now = Date.now()
    if (!blsCache || now - blsCacheTime > CACHE_TTL) {
      const series = await fetchBLSPrices()
      blsCache = {}
      for (const s of series) {
        if (s.latest > 0) blsCache[s.id] = s.latest
      }
      blsCacheTime = now
    }

    if (blsCache && Object.keys(blsCache).length > 0) {
      // Overlay BLS prices — these are national averages
      for (const [productName, blsId] of Object.entries(BLS_PRODUCT_MAP)) {
        const blsPrice = blsCache[blsId]
        if (blsPrice && blsPrice > 0) {
          // BLS price is national average; add as "National Average" entry
          prices.push({
            product_name: productName,
            store: 'National Avg.',
            price: blsPrice,
            date: '2026-05',
            category: PRODUCT_CATALOG.find(p => p.name === productName)?.category || 'Other',
            source: 'bls',
          })
        }
      }
    }
  } catch (err) {
    console.warn('BLS fetch failed, using demo only:', err)
  }

  return prices
}

/**
 * Get BLS series data for a specific product
 */
export async function getBLSSeriesForProduct(productName: string): Promise<BLSSeries | null> {
  const blsId = BLS_PRODUCT_MAP[productName]
  if (!blsId) return null
  
  const series = await fetchBLSPrices([blsId])
  return series[0] || null
}

/**
 * Get prices for a specific product
 */
export function getPricesForProduct(name: string, allPrices: PriceEntry[]): PriceEntry[] {
  return allPrices.filter(p => p.product_name === name)
}

/**
 * Get best prices for each product
 */
export function getBestPrices(allPrices: PriceEntry[]): Record<string, { store: string; price: number }> {
  const best: Record<string, { store: string; price: number }> = {}
  for (const p of allPrices) {
    if (!best[p.product_name] || p.price < best[p.product_name].price) {
      best[p.product_name] = { store: p.store, price: p.price }
    }
  }
  return best
}

/**
 * Get list of all product names
 */
export function getProducts(): string[] {
  return PRODUCT_CATALOG.map(p => p.name)
}

/**
 * Get list of stores
 */
export function getStores(): string[] {
  return STORES
}

/**
 * Get product info by name
 */
export function getProductInfo(name: string): ProductInfo | undefined {
  return PRODUCT_CATALOG.find(p => p.name === name)
}

/**
 * Get categories
 */
export function getCategories(): string[] {
  return CATEGORIES
}

/**
 * Calculate savings statistics
 */
export function calculateSavings(allPrices: PriceEntry[]): {
  totalIfCheapest: number
  perStore: Record<string, { total: number; savings: number; count: number }>
} {
  const products = [...new Set(allPrices.map(p => p.product_name))]
  const stores = [...new Set(allPrices.map(p => p.store))]

  const perStore: Record<string, { total: number; savings: number; count: number }> = {}
  stores.forEach(s => { perStore[s] = { total: 0, savings: 0, count: 0 } })

  let totalIfCheapest = 0

  products.forEach(product => {
    const productPrices = allPrices.filter(p => p.product_name === product)
    const cheapest = Math.min(...productPrices.map(p => p.price))
    totalIfCheapest += cheapest

    productPrices.forEach(p => {
      perStore[p.store] = {
        total: (perStore[p.store]?.total || 0) + p.price,
        savings: (perStore[p.store]?.savings || 0) + (p.price - cheapest),
        count: (perStore[p.store]?.count || 0) + 1,
      }
    })
  })

  return { totalIfCheapest, perStore }
}

/**
 * Get demo prices (synchronous, for client components)
 */
export function getDemoPrices(): PriceEntry[] {
  return DEMO_PRICES
}
