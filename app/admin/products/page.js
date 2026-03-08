"use client"

import { useEffect, useState } from "react"

const API = "https://api.advancedsystems-int.com"

export default function Products() {

  const [products, setProducts] = useState([])

  useEffect(() => {

    fetch(`${API}/admin/products`, {
      headers: {
        "api-key": "ADVANCED_SYSTEMS_ADMIN"
      }
    })
      .then(res => res.json())
      .then(data => setProducts(data.products))

  }, [])

  return (

    <div className="p-20">

      <h1 className="text-3xl mb-10">
        Products Manager
      </h1>

      <table className="w-full border">

        <thead>

          <tr className="border-b bg-gray-200">
            <th className="p-3">Part Number</th>
            <th className="p-3">Price</th>
            <th className="p-3">Quantity</th>
            <th className="p-3">Condition</th>
          </tr>

        </thead>

        <tbody>

          {products.map(p => (

            <tr key={p.part_number} className="border-b">

              <td className="p-3">{p.part_number}</td>
              <td className="p-3">{p.price}</td>
              <td className="p-3">{p.quantity}</td>
              <td className="p-3">{p.condition}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}