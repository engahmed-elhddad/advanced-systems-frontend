"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {

  const [part, setPart] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const API_BASE = "https://advanced-systems-backend-production.up.railway.app"

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)

    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase()
        ? <span key={i} className="bg-yellow-200 font-semibold">{p}</span>
        : p
    )
  }

  const getStockColor = (availability: string) => {
    if (!availability) return "bg-gray-400"
    if (availability.toLowerCase().includes("in stock")) return "bg-green-500"
    if (availability.toLowerCase().includes("external")) return "bg-blue-500"
    if (availability.toLowerCase().includes("out")) return "bg-red-500"
    return "bg-gray-400"
  }

  useEffect(() => {

    if (part.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {

      try {

        setLoading(true)

        const res = await fetch(`${API_BASE}/search?part=${part}`)
        if (!res.ok) throw new Error("API error")

        const data = await res.json()

        setResults(data.results || [])
        setShowDropdown(true)
        setSelectedIndex(-1)

      } catch (err) {

        console.log("Search failed:", err)
        setResults([])
        setShowDropdown(false)

      } finally {

        setLoading(false)

      }

    }, 300)

    return () => clearTimeout(timer)

  }, [part])

  useEffect(() => {

    function handleClickOutside(e: any) {

      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {

        setShowDropdown(false)

      }

    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => document.removeEventListener("mousedown", handleClickOutside)

  }, [])

  const navigateToProduct = (item: any) => {

    const isExternal =
      item.availability?.toLowerCase().includes("external")

    if (isExternal) {

      router.push(`/product/${item.part_number}?external=1`)

    } else {

      router.push(`/product/${item.part_number}`)

    }

    setShowDropdown(false)
    setPart("")

  }

  const handleKeyDown = (e: any) => {

    if (e.key === "ArrowDown") {

      e.preventDefault()

      setSelectedIndex(prev =>
        prev < results.length - 1 ? prev + 1 : prev
      )

    }

    if (e.key === "ArrowUp") {

      e.preventDefault()

      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : prev
      )

    }

    if (e.key === "Enter") {

      e.preventDefault()

      if (selectedIndex >= 0 && results[selectedIndex]) {

        navigateToProduct(results[selectedIndex])

      } else if (results.length > 0) {

        navigateToProduct(results[0])

      } else if (part.trim()) {

        router.push(`/product/${part.trim()}`)

      }

    }

    if (e.key === "Escape") {

      setShowDropdown(false)

    }

  }

  return (

    <div className="min-h-screen bg-gray-100 text-gray-900">

      <section className="relative z-10 bg-gradient-to-r from-gray-900 to-blue-900 text-white py-28 px-6 text-center">

        <h1 className="text-5xl font-bold mb-6">

          Advanced Systems

        </h1>

        <p className="text-xl max-w-2xl mx-auto mb-10">

          Industrial Trading & Automation Solutions  
          New • Refurbished • Tested & Certified Equipment

        </p>

        <div
          ref={wrapperRef}
          className="relative max-w-xl mx-auto z-[9999]"
        >

          <input
            type="text"
            placeholder="Enter Part Number (e.g. 315-2AH14-0AB0)"
            value={part}
            onChange={(e) => setPart(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 rounded text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {showDropdown && (

            <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white rounded-xl shadow-2xl z-[9999] max-h-96 overflow-y-auto border">

              {loading && (

                <div className="px-4 py-4 text-gray-500 text-sm">

                  Searching...

                </div>

              )}

              {!loading && results.length === 0 && (

                <div className="px-4 py-4 text-gray-500 text-sm">

                  No results found

                </div>

              )}

              {!loading && results.map((item, index) => (

                <div
                  key={index}
                  onClick={() => navigateToProduct(item)}
                  className={`px-4 py-4 cursor-pointer border-b transition
                  ${index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >

                  <div className="font-semibold text-gray-900">

                    {highlightMatch(item.part_number, part)}

                  </div>

                  <div className="mt-2">

                    <span className={`text-xs text-white px-3 py-1 rounded ${getStockColor(item.availability)}`}>

                      {item.availability}

                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </div>

  )

}