// lib/prices.ts
// Price comparison logic + browser-scraped price data
import { supabase } from './supabase'

export type PriceEntry = {
  product_name: string
  price: number
  store: string
  date: string
  quantity?: string
  category?: string
}

// Major store comparison - scraped via browser periodically
// This is a seed data function for demo
export function getDemoPrices(): PriceEntry[] {
  return [
    // Whole Milk (gallon)
    { product_name: 'Whole Milk (gallon)', price: 3.49, store: 'Walmart', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 3.99, store: 'Target', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 4.79, store: 'Safeway', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 4.19, store: 'Giant', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 6.99, store: 'Whole Foods', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 3.29, store: 'Aldi', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 5.99, store: "Trader Joe's", date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Whole Milk (gallon)', price: 3.99, store: 'Kroger', date: '2026-05-17', category: 'Dairy' },
    
    // Eggs (dozen)
    { product_name: 'Eggs (dozen)', price: 2.99, store: 'Walmart', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Eggs (dozen)', price: 3.49, store: 'Target', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Eggs (dozen)', price: 4.99, store: 'Whole Foods', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Eggs (dozen)', price: 2.69, store: 'Aldi', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Eggs (dozen)', price: 3.99, store: 'Safeway', date: '2026-05-17', category: 'Dairy' },
    { product_name: 'Eggs (dozen)', price: 3.29, store: 'Kroger', date: '2026-05-17', category: 'Dairy' },
    
    // Bread
    { product_name: 'White Bread (loaf)', price: 1.98, store: 'Walmart', date: '2026-05-17', category: 'Bakery' },
    { product_name: 'White Bread (loaf)', price: 2.49, store: 'Target', date: '2026-05-17', category: 'Bakery' },
    { product_name: 'White Bread (loaf)', price: 3.49, store: 'Safeway', date: '2026-05-17', category: 'Bakery' },
    { product_name: 'White Bread (loaf)', price: 4.99, store: 'Whole Foods', date: '2026-05-17', category: 'Bakery' },
    { product_name: 'White Bread (loaf)', price: 1.89, store: 'Aldi', date: '2026-05-17', category: 'Bakery' },
    
    // Bananas (per lb)
    { product_name: 'Bananas (per lb)', price: 0.58, store: 'Walmart', date: '2026-05-17', category: 'Produce' },
    { product_name: 'Bananas (per lb)', price: 0.69, store: 'Target', date: '2026-05-17', category: 'Produce' },
    { product_name: 'Bananas (per lb)', price: 0.79, store: 'Safeway', date: '2026-05-17', category: 'Produce' },
    { product_name: 'Bananas (per lb)', price: 0.49, store: 'Aldi', date: '2026-05-17', category: 'Produce' },
    { product_name: 'Bananas (per lb)', price: 0.89, store: 'Whole Foods', date: '2026-05-17', category: 'Produce' },
    { product_name: 'Bananas (per lb)', price: 0.69, store: 'Kroger', date: '2026-05-17', category: 'Produce' },
    
    // Chicken Breast (per lb)
    { product_name: 'Chicken Breast (per lb)', price: 3.97, store: 'Walmart', date: '2026-05-17', category: 'Meat' },
    { product_name: 'Chicken Breast (per lb)', price: 4.99, store: 'Target', date: '2026-05-17', category: 'Meat' },
    { product_name: 'Chicken Breast (per lb)', price: 5.99, store: 'Safeway', date: '2026-05-17', category: 'Meat' },
    { product_name: 'Chicken Breast (per lb)', price: 7.99, store: 'Whole Foods', date: '2026-05-17', category: 'Meat' },
    { product_name: 'Chicken Breast (per lb)', price: 3.49, store: 'Aldi', date: '2026-05-17', category: 'Meat' },
    { product_name: 'Chicken Breast (per lb)', price: 4.49, store: 'Kroger', date: '2026-05-17', category: 'Meat' },
  ]
}

// Get unique stores
export function getStores(): string[] {
  const prices = getDemoPrices()
  return [...new Set(prices.map(p => p.store))].sort()
}

// Get unique categories
export function getCategories(): string[] {
  const prices = getDemoPrices()
  return [...new Set(prices.map(p => p.category || 'Uncategorized'))].sort()
}

// Get best prices for each product
export function getBestPrices(): Record<string, { price: number; store: string }> {
  const prices = getDemoPrices()
  const best: Record<string, { price: number; store: string }> = {}
  
  for (const p of prices) {
    if (!best[p.product_name] || p.price < best[p.product_name].price) {
      best[p.product_name] = { price: p.price, store: p.store }
    }
  }
  
  return best
}

// Calculate savings if shopping at cheapest store
export function calculateSavings(store1: string, store2: string): number {
  const prices = getDemoPrices()
  let total1 = 0
  let total2 = 0
  const commonProducts = new Set<string>()
  
  const p1 = prices.filter(p => p.store === store1)
  const p2 = prices.filter(p => p.store === store2)
  
  for (const a of p1) {
    const b = p2.find(p => p.product_name === a.product_name)
    if (b) {
      total1 += a.price
      total2 += b.price
      commonProducts.add(a.product_name)
    }
  }
  
  return commonProducts.size > 0 ? total2 - total1 : 0
}

// Get prices for a specific product
export function getPricesForProduct(productName: string): PriceEntry[] {
  return getDemoPrices().filter(p => p.product_name === productName)
}

// Get all unique product names
export function getProducts(): string[] {
  return [...new Set(getDemoPrices().map(p => p.product_name))].sort()
}
