import React from "react"

async function fetchProduct(productId: string) {

  const res = await fetch(`/api/products/${productId}`)

  if (!res.ok) {
    throw new Error("Failed to fetch product")
  }

  return res.json()
}

export default async function ProductDetails({ productId }: { productId: string }) {

  const product = await fetchProduct(productId)

  return (

    <div className="flex flex-col md:flex-row gap-10 items-start">

      <div className="w-full md:w-1/2 flex justify-center bg-gray-100 rounded-xl p-4">

        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-contain h-80 w-full rounded-xl"
        />

      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-5">

        <h1 className="text-3xl font-bold">
          {product.name}
        </h1>

        <p className="text-gray-600">
          {product.description}
        </p>

      </div>

    </div>

  )
}