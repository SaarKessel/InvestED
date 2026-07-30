import { useState } from "react";

import { registerUser } from "../lib/auth";

import { useNavigate } from "react-router-dom";


export function RegisterPage(){


const navigate=useNavigate();


const [email,setEmail]=useState("");

const [password,setPassword]=useState("");



async function register(){


await registerUser(

email,

password

);


navigate("/dashboard");


}



return (

<div className="min-h-screen flex items-center justify-center">


<div className="rounded-2xl bg-white p-8 shadow">


<h1 className="text-3xl font-bold mb-5">

Create Account 🚀

</h1>



<input

className="border p-3 rounded-xl mb-3"

placeholder="Email"

value={email}

onChange={e=>setEmail(e.target.value)}

/>



<input

className="border p-3 rounded-xl mb-3"

placeholder="Password"

type="password"

value={password}

onChange={e=>setPassword(e.target.value)}

/>



<button

onClick={register}

className="bg-green-600 text-white px-5 py-3 rounded-xl"

>

Create Account

</button>


</div>

</div>

);


}

