export default async function sitemap() {

    const API_BASE = "https://advanced-systems-backend-production.up.railway.app"
  
    try {
  
      const res = await fetch(`${API_BASE}/all-products`, {
        cache: "no-store"
      })
  
      if (!res.ok) {
        console.error("Failed to fetch products for sitemap")
        return [
          {
            url: "https://advancedsystems-int.com",
            lastModified: new Date(),
          }
        ]
      }
  
      const data = await res.json()
  
      const products = data.results || []
  
      const productUrls = products.map((item: any) => ({
        url: `https://advancedsystems-int.com/product/${item.part_number}`,
        lastModified: new Date(),
      }))
  
      const staticPages = [
        {
          url: "https://advancedsystems-int.com",
          lastModified: new Date(),
        },
        {
          url: "https://advancedsystems-int.com/search",
          lastModified: new Date(),
        }
      ]
  
      return [...staticPages, ...productUrls]
  
    } catch (error) {
  
      console.error("Sitemap generation error:", error)
  
      return [
        {
          url: "https://advancedsystems-int.com",
          lastModified: new Date(),
        }
      ]
    }
  }