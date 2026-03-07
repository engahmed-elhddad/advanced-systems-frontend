const API = "https://api.advancedsystems-int.com"

export default async function sitemap() {

  const res = await fetch(`${API}/search?query=6`, {
    cache: "no-store"
  })

  const data = await res.json()

  const products = data.results || []

  const urls = products.map((p:any)=>({
    url: `https://advancedsystems-int.com/product/${p.part_number}`,
    lastModified: new Date()
  }))

  return [

    {
      url: "https://advancedsystems-int.com",
      lastModified: new Date()
    },

    ...urls

  ]

}