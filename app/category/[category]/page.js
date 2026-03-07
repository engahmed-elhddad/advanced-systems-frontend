async function getCategoryProducts(category){

    const API = "https://api.advancedsystems-int.com"
    
    const res = await fetch(
    `${API}/search?query=${category}`,
    {cache:"no-store"}
    )
    
    if(!res.ok) return []
    
    const data = await res.json()
    
    return data.results || []
    
    }
    
    export default async function CategoryPage({params}){
    
    const category = params.category.replace("-", " ")
    
    const products = await getCategoryProducts(category)
    
    return(
    
    <div className="max-w-7xl mx-auto px-6 py-16">
    
    <h1 className="text-4xl font-bold mb-10">
    {category.toUpperCase()} Industrial Automation Parts
    </h1>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    
    {products.map((p)=>(
    <a
    key={p.part_number}
    href={`/product/${p.part_number}`}
    className="border p-6 rounded-lg hover:shadow"
    >
    
    <div className="font-bold">
    {p.part_number}
    </div>
    
    </a>
    ))}
    
    </div>
    
    </div>
    
    )
    
    }