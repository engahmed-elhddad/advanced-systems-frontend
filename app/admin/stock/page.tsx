"use client"

import { useEffect, useState } from "react"

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.advancedsystems-int.com"

export default function StockPage(){

const [offers,setOffers] = useState([])

useEffect(()=>{

fetch(`${API}/admin/stock-dashboard`,{
headers:{
"api-key":"ADVANCED_SYSTEMS_ADMIN"
}
})
.then(res=>res.json())
.then(data=>setOffers(data.offers))

},[])

async function deleteOffer(id:number){

const res = await fetch(`${API}/admin/delete-offer?offer_id=${id}`,{

method:"DELETE",

headers:{
"api-key":"ADVANCED_SYSTEMS_ADMIN"
}

})

if(res.ok){
setOffers(prev => prev.filter((o:any) => o.offer_id !== id))
}

}

return(

<div className="max-w-6xl mx-auto p-10">

<h1 className="text-3xl font-bold mb-10">
Stock Manager
</h1>

<table className="w-full border">

<thead className="bg-gray-200">

<tr>

<th className="p-3">Part Number</th>
<th className="p-3">Condition</th>
<th className="p-3">Price</th>
<th className="p-3">Qty</th>
<th className="p-3">Action</th>

</tr>

</thead>

<tbody>

{offers.map((o:any)=>(

<tr key={o.offer_id} className="border-t">

<td className="p-3">{o.part_number}</td>

<td className="p-3">{o.condition}</td>

<td className="p-3">${o.price}</td>

<td className="p-3">{o.quantity}</td>

<td className="p-3">

<button
onClick={()=>deleteOffer(o.offer_id)}
className="bg-red-500 text-white px-3 py-1"
>

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}