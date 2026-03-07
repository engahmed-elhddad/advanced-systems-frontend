"use client"

import { useState, useEffect } from "react"

export default function ProductImage({ part, apiImage }) {

  const normalized = part ? part.toUpperCase() : ""

  const imageSources = [

    // backend image
    apiImage,

    // local image
    `/products/${normalized}.jpg`,

    // Siemens catalog
    `https://cache.industry.siemens.com/dl/files/${normalized}.jpg`,

    // RS Components
    `https://media.rs-online.com/t_large/${normalized}.jpg`,

    // Farnell
    `https://www.element14.com/productimages/standard/en_GB/${normalized}.jpg`,

    // fallback
    `/no-image.png`

  ].filter(Boolean)

  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // reset image when part changes
  useEffect(() => {

    setIndex(0)
    setLoading(true)

  }, [part])

  const handleError = () => {

    setIndex(prev => {

      if (prev < imageSources.length - 1) {
        return prev + 1
      }

      return prev

    })

  }

  return (

    <div className="flex items-center justify-center h-96">

      {loading && (
        <div className="animate-pulse w-64 h-64 bg-gray-200 rounded" />
      )}

      <img
        key={index}
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