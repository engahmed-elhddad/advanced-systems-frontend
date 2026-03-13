// ==========================
// GET REPLACEMENT PARTS
// ==========================
async function getReplacement(part) {

    const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"
  
    const res = await fetch(
      `${API}/product/${encodeURIComponent(part)}`,
      { cache: "no-store" }
    )
  
    const data = await res.json()
  
    return data?.replacement_parts || []
  
  }
  
  
  // ==========================
  // PAGE
  // ==========================
  export default async function ReplacementPage({ params }) {
  
    const { part: rawPart } = await params
    const part = rawPart.toUpperCase()
  
    const replacements = await getReplacement(part)
  
    return (
  
      <div className="max-w-6xl mx-auto px-6 py-16">
  
        <h1 className="text-3xl font-bold mb-8">
          Replacement Parts for {part}
        </h1>
  
        {replacements.length === 0 ? (
  
          <p className="text-gray-600">
            No replacement parts found for this industrial component.
          </p>
  
        ) : (
  
          <ul className="space-y-3">
  
            {replacements.slice(0,20).map((p)=>(
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