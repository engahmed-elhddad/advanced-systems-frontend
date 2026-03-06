import ProductImage from "./ProductImage"

// ==========================
// FETCH
// ==========================
async function getProduct(part) {

  const API_BASE =
    "https://advanced-systems-backend-production.up.railway.app"

  const res = await fetch(
    `${API_BASE}/product/${part}`,
    { cache: "no-store" }
  )

  if (!res.ok) return null

  return res.json()
}

// ==========================
// SEO METADATA
// ==========================
export async function generateMetadata({ params }) {

  const resolvedParams = await params
  const normalizedPart = resolvedParams.part.toUpperCase()

  const product = await getProduct(normalizedPart)

  if (!product || !product.part_number) {
    return {
      title: "Product Not Found | Advanced Systems",
    }
  }

  return {
    title: `${product.part_number} | ${product.condition || "Industrial"} | Advanced Systems Egypt`,
    description: `Buy ${product.part_number}. ${product.condition || ""}. ${product.availability || ""}. Industrial Automation Supplier in Egypt.`,
  }
}

// ==========================
// PAGE
// ==========================
export default async function ProductPage({ params, searchParams }) {

  const resolvedParams = await params
  const normalizedPart = resolvedParams.part.toUpperCase()

  const product = await getProduct(normalizedPart)

  if (!product || !product.part_number) {
    return (
      <div className="p-20 text-center text-2xl">
        Product not found
      </div>
    )
  }

  const isExternal = searchParams?.external === "1"

  const inStock = product.availability === "In Stock" && !isExternal

  const conditionMap = {
    "New": "https://schema.org/NewCondition",
    "Refurbished": "https://schema.org/RefurbishedCondition",
    "Used Like New": "https://schema.org/UsedCondition",
    "Used": "https://schema.org/UsedCondition"
  }

  const conditionColors = {
    "New": "bg-green-600",
    "Refurbished": "bg-blue-600",
    "Used Like New": "bg-purple-600",
    "Used": "bg-orange-600"
  }

  const conditionSchema =
    conditionMap[product.condition] || "https://schema.org/UsedCondition"

  const conditionColor =
    conditionColors[product.condition] || "bg-gray-600"

  // SEO Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.part_number,
    sku: product.part_number,
    itemCondition: conditionSchema,
    offers: {
      "@type": "Offer",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: "USD",
      ...(product.price && product.price > 0 && !isExternal
        ? { price: product.price }
        : {})
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <div className="grid md:grid-cols-2 gap-12">

        <div className="border rounded-xl p-10 bg-white shadow">
          <ProductImage part={product.part_number} />
        </div>

        <div>

          <h1 className="text-4xl font-bold mb-6">
            {product.part_number}
          </h1>

          <div className="mb-4">
            <span className={`px-4 py-2 rounded text-white text-sm font-semibold
              ${inStock ? "bg-green-600" : "bg-red-600"}`}>
              {isExternal ? "External Supplier" : product.availability || "Not in Stock"}
            </span>
          </div>

          {product.condition && !isExternal && (
            <div className="mb-6">
              <span className={`px-4 py-2 rounded text-white text-sm font-semibold ${conditionColor}`}>
                {product.condition}
              </span>
            </div>
          )}

          {!isExternal ? (
            <>
              <div className="text-3xl font-bold mb-6">
                {product.price && product.price > 0
                  ? `${product.price} USD`
                  : "Ask for Price"}
              </div>

              {product.rfq_available && (
                <a
                  href="mailto:engahmed@advancedsystems-int.com"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold"
                >
                  Request Quote
                </a>
              )}
            </>
          ) : (
            <div className="bg-gray-100 border rounded-xl p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">
                Request Quote for External Supplier
              </h2>

              <p className="mb-4 text-gray-600">
                This item is available via external supplier.  
                Submit your request and our team will provide pricing & lead time.
              </p>

              <a
                href={`mailto:engahmed@advancedsystems-int.com?subject=RFQ ${product.part_number}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold"
              >
                Send RFQ
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}