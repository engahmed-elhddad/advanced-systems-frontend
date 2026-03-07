const API = "https://api.advancedsystems-int.com"

export default async function sitemap() {

  const res = await fetch(`${API}/discover/6ES7315-2AH14-0AB0`)

  const data = await res.json()

  const urls = data.parts.map((p:string)=>({
    url:`https://advancedsystems-int.com/product/${p}`,
    lastModified:new Date()
  }))

  return [
    {
      url:"https://advancedsystems-int.com",
      lastModified:new Date()
    },
    ...urls
  ]

}