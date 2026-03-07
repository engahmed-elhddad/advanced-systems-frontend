import ProductImage from "./Product-Image"


// ==========================
// FETCH PRODUCT
// ==========================
async function getProduct(part) {

  const API_BASE = "https://api.advancedsystems-int.com"

  try {

    const normalized = part
      .replace(/\s+/g, "")
      .toUpperCase()

    const res = await fetch(
      `${API_BASE}/product/${encodeURIComponent(normalized)}`,
      {
        cache: "no-store"
      }
    )

    if (!res.ok) {

      return {
        part_number: normalized,
        brand: "Industrial",
        category: "Industrial Component",
        description: `${normalized} industrial automation spare part`,
        availability: "Available on Request",
        images: []
      }

    }

    const data = await res.json()

    if (data?.part_number) return data
    if (data?.product) return data.product
    if (data?.data) return data.data

    return data

  } catch (error) {

    return {
      part_number: part,
      brand: "Industrial",
      category: "Industrial Component",
      description: `${part} industrial automation spare part`,
      availability: "Available on Request",
      images: []
    }

  }

}


// ==========================
// NORMALIZE PART
// ==========================
function normalizePart(params) {

  if (!params?.part) return ""

  if (Array.isArray(params.part)) {
    return params.part[0].toUpperCase()
  }

  return params.part.toUpperCase()

}


// ==========================
// SEO METADATA
// ==========================
export async function generateMetadata({ params }) {

  const part = normalizePart(params)

  const product = await getProduct(part)

  const title =
    `${product.part_number} | ${product.brand || "Industrial"} | Advanced Systems`

  const description =
    `${product.part_number} industrial automation spare part supplied by Advanced Systems Egypt.`

  return {

    title,
    description,

    alternates: {
      canonical: `https://advancedsystems-int.com/product/${part}`
    },

    openGraph: {
      title,
      description,
      url: `https://advancedsystems-int.com/product/${part}`,
      siteName: "Advanced Systems",
      type: "website"
    }

  }

}


// ==========================
// PAGE
// ==========================
export default async function ProductPage({ params, searchParams = {} }) {

  const part = normalizePart(params)

  const product = await getProduct(part)

  const isExternal =
    searchParams && searchParams.external === "1"

  const availability =
    product?.availability || "Available on Request"

  const inStock =
    availability === "In Stock" && !isExternal

  const manufacturer =
    product?.brand || "Industrial"

  const description =
    product?.description ||
    `${part} industrial automation spare part supplied by Advanced Systems.`

  const image =
    product?.images && product.images.length > 0
      ? product.images[0]
      : null


  // ==========================
  // PRODUCT SCHEMA
  // ==========================
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part,
    brand: manufacturer,
    description: description,
    sku: part,
    offers: {
      "@type": "Offer",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    }
  }


  return (

    <div className="max-w-7xl mx-auto px-6 py-16">

      {/* SEO SCHEMA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema)
        }}
      />

      <div className="grid md:grid-cols-2 gap-12">

        <div className="border rounded-xl p-10 bg-white shadow">

          <ProductImage
            part={part}
            apiImage={image}
          />

        </div>

        <div>

          <h1 className="text-4xl font-bold mb-4">
            {part} Industrial Automation Spare Part
          </h1>

          <div className="text-gray-600 mb-2">
            Manufacturer: <strong>{manufacturer}</strong>
          </div>

          {product?.category && (
            <div className="text-gray-600 mb-4">
              Category: {product.category}
            </div>
          )}

          <div className="mb-4">

            <span
              className={`px-4 py-2 rounded text-white text-sm font-semibold ${
                inStock ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {availability}
            </span>

          </div>

          <p className="text-gray-700 mb-6">
            {description}
          </p>


{/* ==========================
   RELATED PARTS
========================== */}

{product?.related_parts?.length > 0 && (

<div className="mt-10">

<h2 className="text-xl font-bold mb-4">
Related Parts
</h2>

<ul className="space-y-2">

{product.related_parts.slice(0,5).map((p)=>(
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

</div>

)}


{/* ==========================
   CROSS REFERENCE
========================== */}

{product?.cross_reference?.length > 0 && (

<div className="mt-10">

<h2 className="text-xl font-bold mb-4">
Cross Reference
</h2>

<ul className="space-y-2">

{product.cross_reference.slice(0,5).map((p)=>(
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

</div>

)}


          {product?.datasheet && (

            <div className="mt-8">

              <a
                href={product.datasheet}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gray-800 hover:bg-black text-white px-6 py-3 rounded font-semibold"
              >

                View Datasheet

              </a>

            </div>

          )}


          {inStock ? (

            <div className="text-3xl font-bold mt-6">

              {product?.price
                ? `${product.price} USD`
                : "Ask for Price"}

            </div>

          ) : (

            <div className="bg-gray-100 border rounded-xl p-6 shadow mt-6">

              <h2 className="text-xl font-semibold mb-4">
                Request Quote
              </h2>

              <p className="mb-4 text-gray-600">
                Advanced Systems can source this product through our global supplier network.
              </p>

              <a
                href={`mailto:eng.ahmed@advancedsystems-int.com?subject=RFQ ${part}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold"
              >
                Request Quote
              </a>

            </div>

          )}

        </div>

      </div>

    </div>

  )

}