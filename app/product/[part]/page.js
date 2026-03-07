import ProductImage from "./Product-Image"

// ==========================
// FETCH PRODUCT
// ==========================
async function getProduct(part) {

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.advancedsystems-int.com"

  try {

    const res = await fetch(
      `${API_BASE}/product/${part}`,
      { cache: "no-store" }
    )

    if (!res.ok) {
      console.log("API STATUS ERROR:", res.status)
      return null
    }

    const data = await res.json()

    console.log("API RESPONSE:", data)

    // لو رجع مباشرة
    if (data?.part_number) return data

    // لو nested
    if (data?.product) return data.product

    if (data?.data) return data.data

    return data

  } catch (error) {

    console.error("API ERROR:", error)

    return null

  }

}

// ==========================
// SEO METADATA
// ==========================
export async function generateMetadata({ params }) {

  const part = params?.part ? params.part.toUpperCase() : ""

  const product = await getProduct(part)
  console.log("PART:", part)
  console.log("PRODUCT RESPONSE:", product)

  if (!product) {

    return {
      title: `${part} Industrial Automation Part | Advanced Systems`,
      description:
        `${part} industrial automation component available through Advanced Systems supplier network.`
    }

  }

  return {
    title: `${product.part_number} | ${product.brand || "Industrial"} | Advanced Systems`,
    description: `${product.part_number} industrial automation spare part supplied by Advanced Systems Egypt.`
  }

}

// ==========================
// PAGE
// ==========================
export default async function ProductPage({ params, searchParams = {} }) {

  const part = params?.part ? params.part.toUpperCase() : ""

  const product = await getProduct(part)
  console.log("PART:", part)
  console.log("PRODUCT RESPONSE:", product)

  if (!product || !product.part_number) {

    return (
      <div className="p-20 text-center text-xl">
        Product temporarily unavailable
      </div>
    )

  }

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

  return (

    <div className="max-w-7xl mx-auto px-6 py-16">

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

          {product?.datasheet && (

            <div className="mb-6">

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

            <div className="text-3xl font-bold mb-6">

              {product?.price
                ? `${product.price} USD`
                : "Ask for Price"}

            </div>

          ) : (

            <div className="bg-gray-100 border rounded-xl p-6 shadow">

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