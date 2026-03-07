async function getCross(part){

    const API="https://api.advancedsystems-int.com"
    
    const res=await fetch(
    `${API}/product/${part}`,
    {cache:"no-store"}
    )
    
    if(!res.ok) return null
    
    return res.json()
    
    }
    
    export default async function CrossPage({params}){
    
    const part=params.part.toUpperCase()
    
    const data=await getCross(part)
    
    const cross=data?.cross_reference || []
    
    return(
    
    <div className="max-w-7xl mx-auto px-6 py-16">
    
    <h1 className="text-4xl font-bold mb-6">
    {part} Replacement & Alternatives
    </h1>
    
    <p className="text-gray-600 mb-10">
    Looking for replacement or equivalent parts for {part}.
    Below are compatible industrial automation alternatives.
    </p>
    
    <div className="grid md:grid-cols-3 gap-6">
    
    {cross.map((c,i)=>(
    <a
    key={i}
    href={`/product/${c.alternative_part}`}
    className="border p-6 rounded-lg hover:shadow"
    >
    
    <div className="font-bold mb-2">
    {c.alternative_part}
    </div>
    
    <div className="text-sm text-gray-500">
    {c.alternative_brand}
    </div>
    
    </a>
    ))}
    
    </div>
    
    </div>
    
    )
    
    }