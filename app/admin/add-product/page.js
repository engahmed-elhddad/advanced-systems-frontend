"use client"

import { useState } from "react"

const API="https://api.advancedsystems-int.com"

export default function AddProduct(){

const[part,setPart]=useState("")
const[price,setPrice]=useState("")
const[quantity,setQuantity]=useState("")
const[condition,setCondition]=useState("Used")
const[availability,setAvailability]=useState("In Stock")

const submit=async()=>{

await fetch(`${API}/admin/add-product`,{

method:"POST",

headers:{
"Content-Type":"application/json",
"api-key":"ADVANCED_SYSTEMS_ADMIN"
},

body:JSON.stringify({
part_number:part,
price:parseFloat(price),
quantity:parseInt(quantity),
condition,
availability
})

})

alert("Product Saved")

}

return(

<div className="p-20 max-w-xl">

<h1 className="text-3xl mb-6">
Add Product
</h1>

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

<input
placeholder="Availability"
className="border p-2 mb-3 w-full"
onChange={(e)=>setAvailability(e.target.value)}
/>

<button
onClick={submit}
className="bg-blue-600 text-white px-6 py-2"
>
Save Product
</button>

</div>

)

}