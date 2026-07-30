import { Link } from "react-router-dom";
import { Logo } from "./Logo";

import { useTranslation } from "react-i18next";


export function Footer() {


const { t } = useTranslation();



return (

<footer className="border-t border-border/60 bg-muted/30">


<div className="container grid gap-10 py-14 md:grid-cols-4">


<div className="md:col-span-2">


<Logo />


<p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">

{t("footer_description")}

</p>


</div>





<div>


<h4 className="mb-3 text-sm font-bold">

{t("navigation")}

</h4>



<ul className="space-y-2 text-sm text-muted-foreground">


<li>

<Link to="/" className="hover:text-foreground">

{t("home")}

</Link>

</li>



<li>

<Link to="/start" className="hover:text-foreground">

{t("start")}

</Link>

</li>



<li>

<Link to="/calculator" className="hover:text-foreground">

{t("calculator")}

</Link>

</li>



<li>

<Link to="/faq" className="hover:text-foreground">

{t("faq")}

</Link>

</li>



</ul>


</div>







<div>


<h4 className="mb-3 text-sm font-bold">

{t("legal")}

</h4>



<ul className="space-y-2 text-sm text-muted-foreground">


<li>

<Link to="/privacy" className="hover:text-foreground">

{t("privacy")}

</Link>

</li>



<li>

<Link to="/terms" className="hover:text-foreground">

{t("terms")}

</Link>

</li>



<li>

<Link to="/contact" className="hover:text-foreground">

{t("contact")}

</Link>

</li>



</ul>


</div>



</div>






<div className="border-t border-border/60 py-6">


<div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">


<p>

© {new Date().getFullYear()} InvestED.

</p>



<p>

{t("educational_notice")}

</p>



</div>


</div>



</footer>


);


}
