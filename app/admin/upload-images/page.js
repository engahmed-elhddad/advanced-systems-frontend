"use client"

import { useState } from "react"

const API = "https://api.advancedsystems-int.com"

export default function UploadImages(){

const[file,setFile] = useState(null)

const upload = async()=>{

const form = new FormData()

form.append("file",file)

await fetch(`${API}/admin/upload-image`,{

method:"POST",

headers:{
"api-key":"ADVANCED_SYSTEMS_ADMIN"
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