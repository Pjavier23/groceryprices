// lib/usda.ts
// USDA FoodData Central API — free, no key required for basic queries
// https://fdc.nal.usda.gov/api-spec/fdc_api.html

export type USDAFood = {
  fdcId: number
  description: string
  brandName?: string
  brandOwner?: string
  category?: string
  servingSize?: number
  servingSizeUnit?: string
  nutrients: Record<string, number>
  foodCategory?: string
}

/**
 * Search USDA FoodData Central for a food item
 */
export async function searchFoods(query: string, pageSize = 25): Promise<USDAFood[]> {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Branded,Foundation,SR Legacy`,
      { headers: { 'User-Agent': 'GroceryPrices/1.0' } }
    )
    if (!res.ok) return []
    
    const data = await res.json()
    return (data.foods || []).map((f: any) => ({
      fdcId: f.fdcId,
      description: f.description,
      brandName: f.brandName,
      brandOwner: f.brandOwner,
      category: f.foodCategory,
      servingSize: f.servingSize,
      servingSizeUnit: f.servingSizeUnit,
      foodCategory: f.foodCategory,
      nutrients: (f.foodNutrients || []).reduce((acc: Record<string, number>, n: any) => {
        if (n.nutrientName && n.value) acc[n.nutrientName] = n.value
        return acc
      }, {}),
    }))
  } catch (err) {
    console.error('USDA search failed:', err)
    return []
  }
}

/**
 * Get detailed info for a specific food by FDC ID
 */
export async function getFood(fdcId: number): Promise<USDAFood | null> {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=DEMO_KEY`,
      { headers: { 'User-Agent': 'GroceryPrices/1.0' } }
    )
    if (!res.ok) return null
    const f = await res.json()
    return {
      fdcId: f.fdcId,
      description: f.description,
      brandName: f.brandName,
      brandOwner: f.brandOwner,
      category: f.foodCategory,
      servingSize: f.servingSize,
      servingSizeUnit: f.servingSizeUnit,
      foodCategory: f.foodCategory,
      nutrients: (f.foodNutrients || []).reduce((acc: Record<string, number>, n: any) => {
        if (n.nutrientName && n.value) acc[n.nutrientName] = n.value
        return acc
      }, {}),
    }
  } catch (err) {
    console.error('USDA fetch failed:', err)
    return null
  }
}

/**
 * Get nutrition info for common grocery items by category
 */
export async function getNutritionForProduct(product: string): Promise<{
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sugar?: number
} | null> {
  const foods = await searchFoods(product, 3)
  if (!foods.length) return null
  
  const food = foods[0]
  const get = (name: string) => {
    const key = Object.keys(food.nutrients).find(k => k.toLowerCase().includes(name.toLowerCase()))
    return key ? food.nutrients[key] : undefined
  }

  return {
    calories: get('Energy') || get('Calories'),
    protein: get('Protein'),
    fat: get('Total lipid') || get('Fat'),
    carbs: get('Carbohydrate') || get('Carbs'),
    fiber: get('Fiber'),
    sugar: get('Sugars'),
  }
}
