async function getBrandProducts(brand) {

    const API = "https://api.advancedsystems-int.com"
  
    const res = await fetch(
      `${API}/search?query=${brand}`,
      { cache: "no-store" }
    )
  
    if (!res.ok) return []
  
    const data = await res.json()
  
    return data.results || []
  
  }
  
  export default async function BrandPage({ params }) {
  
    const brand = params.brand.replace("-", " ")
  
    const products = await getBrandProducts(brand)
  
    return (
  
      <div className="max-w-7xl mx-auto px-6 py-16">
  
        <h1 className="text-4xl font-bold mb-8">
          {brand.toUpperCase()} Industrial Automation Parts
        </h1>
  
        <div className="grid md:grid-cols-3 gap-6">
  
          {products.map((p)=>(
  
            <a
              key={p.part_number}
              href={`/product/${p.part_number}`}
              className="border p-6 rounded hover:shadow"
            >
  
              <div className="font-semibold">
                {p.part_number}
              </div>
  
            </a>
  
          ))}
  
        </div>
  
      </div>
  
    )
  
  }