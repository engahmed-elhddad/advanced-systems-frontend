"use client"

import { useState } from "react"

export default function ProductImage({ part }) {
  const [src, setSrc] = useState(`/products/${part}.jpg`)

  return (
    <img
      src={src}
      alt={part}
      className="h-96 object-contain mx-auto"
      onError={() => setSrc("/no-image.png")}
    />
  )
}