"use client"

import { useState } from "react"

export default function AdminPage(){

const [csv,setCsv]=useState(null)
const [zip,setZip]=useState(null)
const [image,setImage]=useState(null)

const API="https://api.advancedsystems-int.com"


// =======================
// CSV IMPORT
// =======================

const uploadCSV=async()=>{

if(!csv) return alert("Select CSV")

const formData=new FormData()
formData.append("file",csv)

await fetch(`${API}/admin/import-products`,{
method:"POST",
body:formData
})

alert("CSV Imported")

}


// =======================
// ZIP IMPORT
// =======================

const uploadZIP=async()=>{

if(!zip) return alert("Select ZIP")

const formData=new FormData()
formData.append("file",zip)

await fetch(`${API}/admin/bulk-import`,{
method:"POST",
body:formData
})

alert("ZIP Import Completed")

}


// =======================
// IMAGE UPLOAD
// =======================

const uploadImage=async()=>{

if(!image) return alert("Select Image")

const formData=new FormData()
formData.append("file",image)

await fetch(`${API}/admin/upload-image`,{
method:"POST",
body:formData
})

alert("Image Uploaded")

}


return(

<div className="max-w-2xl mx-auto p-16">

<h1 className="text-3xl font-bold mb-10">
Admin Product Import
</h1>


{/* CSV */}

<div className="mb-10">

<h2 className="text-xl font-semibold mb-4">
Import CSV
</h2>

<input type="file"
accept=".csv"
onChange={(e)=>setCsv(e.target.files[0])}
/>

<button
onClick={uploadCSV}
className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
>
Upload
</button>

</div>


{/* ZIP */}

<div className="mb-10">

<h2 className="text-xl font-semibold mb-4">
Bulk Import ZIP
</h2>

<input type="file"
accept=".zip"
onChange={(e)=>setZip(e.target.files[0])}
/>

<button
onClick={uploadZIP}
className="ml-4 bg-green-600 text-white px-4 py-2 rounded"
>
Upload
</button>

</div>


{/* IMAGE */}

<div className="mb-10">

<h2 className="text-xl font-semibold mb-4">
Upload Product Image
</h2>

<input type="file"
onChange={(e)=>setImage(e.target.files[0])}
/>

<button
onClick={uploadImage}
className="ml-4 bg-purple-600 text-white px-4 py-2 rounded"
>
Upload
</button>

</div>

</div>

)

}