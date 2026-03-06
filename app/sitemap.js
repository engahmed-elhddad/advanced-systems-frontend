export default async function sitemap() {

    const API_BASE =
      "https://advanced-systems-backend-production.up.railway.app"
  
    const res = await fetch(`${API_BASE}/search?part=`)
  
    if (!res.ok) return []
  
    const data = await res.json()
  
    const products = data.results || []
  
    const urls = products.map((item) => ({
      url: `https://advanced-systems-frontend.vercel.app/product/${item.part_number}`,
      lastModified: new Date(),
    }))
  
    return urls
  }