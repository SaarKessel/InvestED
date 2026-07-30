import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/primitives";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";



const NAV_LINKS = [
  { to: "/", key: "home" },
  { to: "/calculator", key: "calculator" },
  { to: "/scenarios", key: "scenarios" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
];



export function Navbar() {


const { t } = useTranslation();


const { theme, toggleTheme } = useTheme();


const [mobileOpen,setMobileOpen] = useState(false);



return (

<header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">

<div className="container flex h-16 items-center justify-between">


<Link to="/" className="shrink-0">
<Logo />
</Link>



<nav className="hidden items-center gap-1 md:flex">

{NAV_LINKS.map((link)=>(

<NavLink

key={link.to}

to={link.to}

end={link.to === "/"}

className={({isActive})=>

cn(

"rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",

isActive && "bg-accent text-foreground"

)

}

>

{t(link.key)}

</NavLink>

))}

</nav>



<div className="flex items-center gap-2">


<Button
variant="ghost"
size="icon"
onClick={toggleTheme}
>

{theme === "dark"
?
<Sun className="h-5 w-5"/>
:
<Moon className="h-5 w-5"/>
}

</Button>



<Link to="/start">

<Button size="sm">

{t("start")}

</Button>

</Link>



<Button

variant="ghost"

size="icon"

className="md:hidden"

onClick={()=>setMobileOpen(!mobileOpen)}

>

{mobileOpen
?
<X className="h-5 w-5"/>
:
<Menu className="h-5 w-5"/>
}

</Button>



</div>

</div>





{mobileOpen && (

<nav className="container flex flex-col gap-1 border-t py-3 md:hidden">

{NAV_LINKS.map((link)=>(

<NavLink

key={link.to}

to={link.to}

onClick={()=>setMobileOpen(false)}

className="rounded-lg px-3 py-2"

>

{t(link.key)}

</NavLink>

))}

</nav>

)}



</header>

);

}
