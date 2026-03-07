// ==========================
// GET COMPATIBLE PARTS
// ==========================

async function getCompatible(part) {

    const API = "https://api.advancedsystems-int.com"
  
    const res = await fetch(
      `${API}/product/${encodeURIComponent(part)}`,
      { cache: "no-store" }
    )
  
    const data = await res.json()
  
    return data?.compatible_modules || []
  
  }
  
  
  // ==========================
  // PAGE
  // ==========================
  
  export default async function CompatiblePage({ params }) {
  
    const part = params.part.toUpperCase()
  
    const compatible = await getCompatible(part)
  
    return (
  
      <div className="max-w-6xl mx-auto px-6 py-16">
  
        <h1 className="text-3xl font-bold mb-8">
          Compatible Modules for {part}
        </h1>
  
        {compatible.length === 0 ? (
  
          <p className="text-gray-600">
            No compatible modules found for this industrial part.
          </p>
  
        ) : (
  
          <ul className="space-y-3">
  
            {compatible.slice(0,20).map((p)=>(
              <li key={p}>
                <a
                  href={`/product/${p}`}
                  className="text-blue-600 hover:underline"
                >
                  {p}
                </a>
              </li>
            ))}
  
          </ul>
  
        )}
  
      </div>
  
    )
  
  }