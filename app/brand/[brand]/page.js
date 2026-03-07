async function getBrand(brand){

  const res = await fetch(
  `https://api.advancedsystems-int.com/brand/${brand}`,
  {cache:"no-store"}
  )
  
  return res.json()
  
  }
  
  export default async function BrandPage({params}){
  
  const brand = params.brand
  
  const data = await getBrand(brand)
  
  return(
  
  <div className="max-w-6xl mx-auto p-16">
  
  <h1 className="text-4xl font-bold mb-6">
  {brand} Industrial Automation
  </h1>
  
  <p className="mb-10 text-gray-600">
  {data.description}
  </p>
  
  <h2 className="text-2xl font-bold mb-4">
  Product Categories
  </h2>
  
  <ul>
  
  {data.categories.map((c)=>(
  <li key={c}>{c}</li>
  ))}
  
  </ul>
  
  </div>
  
  )
  
  }