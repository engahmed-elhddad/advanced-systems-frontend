"use client"

import { useState } from "react"

export default function SearchBar() {

  const [query,setQuery] = useState("")
  const [results,setResults] = useState([])

  async function search(q){

    setQuery(q)

    if(q.length < 2){
      setResults([])
      return
    }

    const res = await fetch(
      `https://api.advancedsystems-int.com/autocomplete?query=${q}`
    )

    const data = await res.json()

    setResults(data.results || [])

  }

  return(

    <div className="relative w-full max-w-xl">

      <input
        value={query}
        onChange={(e)=>search(e.target.value)}
        placeholder="Search part number..."
        className="w-full border rounded px-4 py-3"
      />

      {results.length > 0 && (

        <div className="absolute bg-white border w-full mt-1 rounded shadow">

          {results.map((r)=> (

            <a
              key={r.part_number}
              href={`/product/${r.part_number}`}
              className="block px-4 py-2 hover:bg-gray-100"
            >

              {r.part_number}

            </a>

          ))}

        </div>

      )}

    </div>

  )

}