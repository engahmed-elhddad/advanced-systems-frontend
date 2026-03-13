"use client"

import { useState } from "react"

export default function DevConsole(){

const [password,setPassword] = useState("")
const [authorized,setAuthorized] = useState(false)

const [prompt,setPrompt] = useState("")
const [result,setResult] = useState("")

const ADMIN_PASSWORD = "advanced_admin"

function login(){

if(password === ADMIN_PASSWORD){

setAuthorized(true)

}else{

alert("Wrong password")

}

}

async function runAI(){

const res = await fetch("http://127.0.0.1:8000/ai/dev",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
prompt:prompt
})

})

const data = await res.json()

setResult(JSON.stringify(data,null,2))

}

if(!authorized){

return(

<div style={{padding:"40px"}}>

<h1>Admin Login</h1>

<input
type="password"
placeholder="Enter admin password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{padding:"10px",marginRight:"10px"}}
/>

<button
onClick={login}
style={{
padding:"10px 20px",
background:"black",
color:"white"
}}
>

Login

</button>

</div>

)

}

return(

<div style={{padding:"40px"}}>

<h1 style={{fontSize:"28px",marginBottom:"20px"}}>

AI Developer Console

</h1>

<textarea
value={prompt}
onChange={(e)=>setPrompt(e.target.value)}
placeholder="Describe what you want to build..."
style={{
width:"100%",
height:"150px",
padding:"10px",
marginBottom:"20px"
}}
/>

<button
onClick={runAI}
style={{
padding:"10px 20px",
background:"black",
color:"white"
}}
>

Run AI

</button>

<pre style={{
marginTop:"30px",
background:"#eee",
padding:"20px"
}}>

{result}

</pre>

</div>

)

}