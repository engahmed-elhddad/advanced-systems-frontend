"use client"

import { apiFetch } from '@/lib/api'

import { useState } from "react"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

export default function UploadImages(){

const[file,setFile] = useState(null)

const upload = async()=>{
const key = (process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "").trim()
if (!key) {
  alert("Set NEXT_PUBLIC_ADMIN_API_KEY in .env.local")
  return
}

const form = new FormData()

form.append("file",file)

await apiFetch(`${API}/admin/upload-image`,{

method:"POST",

headers:{
"api-key": key
},

body:form

})

alert("Image Uploaded")

}

return(

<div className="p-20">

<h1 className="text-2xl mb-6">
Upload Product Image
</h1>

<input type="file"
onChange={(e)=>setFile(e.target.files[0])}
/>

<button
onClick={upload}
className="bg-blue-600 text-white px-4 py-2 ml-4"
>
Upload
</button>

</div>

)

}