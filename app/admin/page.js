"use client"

import { useState } from "react"

const API = "https://api.advancedsystems-int.com"

export default function AdminPage(){

const [part,setPart] = useState("")
const [price,setPrice] = useState("")
const [quantity,setQuantity] = useState("")
const [condition,setCondition] = useState("")
const [availability,setAvailability] = useState("In Stock")

const addProduct = async()=>{

const res = await fetch(`${API}/admin/import-products`,{

method:"POST",

headers:{
"api-key":"ADVANCED_SYSTEMS_ADMIN"
}

})

alert("Product Added")

}

return(

<div className="max-w-4xl mx-auto p-10">

<h1 className="text-3xl font-bold mb-10">
Admin Panel
</h1>


{/* ADD PRODUCT */}

<div className="bg-white shadow p-6 mb-10">

<h2 className="text-xl font-bold mb-4">
Add Product
</h2>

<input
placeholder="Part Number"
className="border p-2 mb-3 w-full"
onChange={(e)=>setPart(e.target.value)}
/>

<input
placeholder="Price"
className="border p-2 mb-3 w-full"
onChange={(e)=>setPrice(e.target.value)}
/>

<input
placeholder="Quantity"
className="border p-2 mb-3 w-full"
onChange={(e)=>setQuantity(e.target.value)}
/>

<input
placeholder="Condition"
className="border p-2 mb-3 w-full"
onChange={(e)=>setCondition(e.target.value)}
/>

<button
onClick={addProduct}
className="bg-blue-600 text-white px-4 py-2"
>
Add Product
</button>

</div>

</div>

)

}