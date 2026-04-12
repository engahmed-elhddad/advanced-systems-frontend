"use client"

import { useState } from "react"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

export default function AIDev(){

const [prompt,setPrompt] = useState("")
const [response,setResponse] = useState("")

async function askAI(){

const res = await fetch(`${API}/ai/dev`,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({prompt})

})

const data = await res.json()

setResponse(data.response)

}

return(

<div className="max-w-4xl mx-auto p-10">

<h1 className="text-3xl font-bold mb-6">

AI Developer

</h1>

<textarea
className="border w-full p-3 mb-4 h-40"
placeholder="Ask AI to build something..."
onChange={(e)=>setPrompt(e.target.value)}
/>

<button
onClick={askAI}
className="bg-blue-600 text-white px-4 py-2"
>

Generate Code

</button>

<pre className="bg-gray-100 p-4 mt-6 overflow-auto">

{response}

</pre>

</div>

)

}