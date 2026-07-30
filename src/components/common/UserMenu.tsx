import { logoutUser } from "../../lib/auth";
import { useNavigate } from "react-router-dom";


export function UserMenu(){


const navigate = useNavigate();



async function logout(){

await logoutUser();

navigate("/login");

}



return (

<div className="flex items-center gap-2">


<button

onClick={()=>navigate("/account")}

className="rounded-xl border px-4 py-2"

>

Account

</button>



<button

onClick={logout}

className="rounded-xl border px-4 py-2 text-red-500"

>

Logout

</button>


</div>

);

}
