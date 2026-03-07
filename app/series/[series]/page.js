async function getSeriesProducts(series){

    const API="https://api.advancedsystems-int.com"
    
    const res=await fetch(
    `${API}/search?query=${series}`,
    {cache:"no-store"}
    )
    
    if(!res.ok) return []
    
    const data=await res.json()
    
    return data.results || []
    
    }
    
    export default async function SeriesPage({params}){
    
    const series=params.series.replace("-", " ")
    
    const products=await getSeriesProducts(series)
    
    return(
    
    <div className="max-w-7xl mx-auto px-6 py-16">
    
    <h1 className="text-4xl font-bold mb-6">
    {series.toUpperCase()} Industrial Automation Series
    </h1>
    
    <p className="text-gray-600 mb-10">
    Industrial automation components from the {series} series including PLC modules, drives, sensors and control systems.
    </p>
    
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