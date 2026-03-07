async function getCategoryProducts(category) {

    const API = "https://api.advancedsystems-int.com"
  
    const res = await fetch(
      `${API}/search?query=${category}`,
      { cache: "no-store" }
    )
  
    if (!res.ok) return []
  
    const data = await res.json()
  
    return data.results || []
  
  }
  
  export default async function CategoryPage({ params }) {
  
    const category = params.category.replace("-", " ")
  
    const products = await getCategoryProducts(category)
  
    return (
  
      <div className="max-w-7xl mx-auto px-6 py-16">
  
        <h1 className="text-4xl font-bold mb-8">
          {category.toUpperCase()} Industrial Parts
        </h1>
  
        <div className="grid md:grid-cols-3 gap-6">
  
          {products.map((p)=>(
  
            <a
              key={p.part_number}
              href={`/product/${p.part_number}`}
              className="border p-6 rounded hover:shadow"
            >
  
              {p.part_number}
  
            </a>
  
          ))}
  
        </div>
  
      </div>
  
    )
  
  }