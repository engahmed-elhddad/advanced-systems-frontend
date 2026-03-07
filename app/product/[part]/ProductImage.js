"use client"

import { useState } from "react"

export default function ProductImage({ part, apiImage }) {

  const normalized = part ? part.toUpperCase() : ""

  const imageSources = [

    // 🔹 Image from our backend
    apiImage,

    // 🔹 Local images
    `/products/${normalized}.jpg`,

    // 🔹 Siemens catalog images
    `https://cache.industry.siemens.com/dl/files/${normalized}.jpg`,

    // 🔹 RS Components
    `https://media.rs-online.com/t_large/${normalized}.jpg`,

    // 🔹 Farnell
    `https://www.element14.com/productimages/standard/en_GB/${normalized}.jpg`,

    // 🔹 placeholder
    `/no-image.png`
  ]

  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const handleError = () => {

    if (index < imageSources.length - 1) {
      setIndex(index + 1)
    }

  }

  return (

    <div className="flex items-center justify-center h-96">

      {loading && (
        <div className="animate-pulse w-64 h-64 bg-gray-200 rounded" />
      )}

      <img
        src={imageSources[index]}
        alt={normalized}
        loading="lazy"
        className={`h-96 object-contain mx-auto ${loading ? "hidden" : "block"}`}
        onLoad={() => setLoading(false)}
        onError={handleError}
      />

    </div>

  )
}