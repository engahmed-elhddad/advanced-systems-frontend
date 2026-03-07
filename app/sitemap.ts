export default async function sitemap() {

    const API_BASE =
    "https://advanced-systems-backend-production.up.railway.app"
  
    const res = await fetch(`${API_BASE}/all-products`)
  
    if (!res.ok) return []
  
    const data = await res.json()
  
    const products = data.results || []
  
    const urls = products.map((item:any) => ({
      url: `https://advanced-systems-int.com/product/${item.part_number}`,
      lastModified: new Date(),
    }))
  
    return urls
  }