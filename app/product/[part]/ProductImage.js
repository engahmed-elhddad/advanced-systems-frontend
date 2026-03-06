"use client"

import { useState } from "react"

export default function ProductImage({ part }) {

  const images = [
    `/products/${part}.jpg`,
    `https://media.rs-online.com/t_large/F${part}.jpg`,
    `https://assets.new.siemens.com/siemens/assets/api/uuid/${part}/width/600`,
    `/no-image.png`
  ]

  const [index, setIndex] = useState(0)

  const handleError = () => {
    if (index < images.length - 1) {
      setIndex(index + 1)
    }
  }

  return (
    <img
      src={images[index]}
      alt={part}
      className="h-96 object-contain mx-auto"
      onError={handleError}
    />
  )
}