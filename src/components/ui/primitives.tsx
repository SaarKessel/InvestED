import { type ButtonHTMLAttributes, type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";


// ------------------------------------------------------------
// Button
// ------------------------------------------------------------

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-xl",
    "text-sm font-semibold",
    "transition-all duration-300",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "active:scale-[0.98]"
  ],
  {
    variants:{
      variant:{

        default:
          "gradient-brand text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",

        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:border-primary/40",

        ghost:
          "text-foreground hover:bg-accent",

        secondary:
          "bg-muted text-foreground hover:bg-muted/80",

        link:
          "text-primary underline-offset-4 hover:underline"

      },

      size:{
        default:
          "h-11 px-6",

        sm:
          "h-9 px-4 text-xs",

        lg:
          "h-14 px-8 text-base",

        icon:
          "h-10 w-10"
      }

    },

    defaultVariants:{
      variant:"default",
      size:"default"
    }
  }
);



export interface ButtonProps
extends ButtonHTMLAttributes<HTMLButtonElement>,
VariantProps<typeof buttonVariants>{}



export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
(
{
className,
variant,
size,
...props
},
ref
)=>(

<button
ref={ref}
className={
cn(
buttonVariants({
variant,
size,
className
})
)
}
{...props}
/>

)

);


Button.displayName="Button";




// ------------------------------------------------------------
// Card
// ------------------------------------------------------------


export const Card = forwardRef<
HTMLDivElement,
HTMLAttributes<HTMLDivElement>
>(
(
{
className,
...props
},
ref
)=>(

<div

ref={ref}

className={
cn(
"rounded-3xl border border-border card-premium text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
className
)
}

{...props}

/>

)

);


Card.displayName="Card";





export const CardHeader =
forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>

(
(
{
className,
...props
},
ref
)=>(

<div
ref={ref}
className={
cn(
"flex flex-col gap-2 p-6 pb-3",
className
)
}
{...props}
/>

)

);


CardHeader.displayName="CardHeader";





export const CardTitle =
forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>

(
(
{
className,
...props
},
ref
)=>(

<h3
ref={ref}

className={
cn(
"font-display text-xl font-bold leading-snug tracking-tight",
className
)
}

{...props}

/>

)

);


CardTitle.displayName="CardTitle";





export const CardDescription =
forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>

(
(
{
className,
...props
},
ref
)=>(

<p

ref={ref}

className={
cn(
"text-sm leading-relaxed text-muted-foreground",
className
)
}

{...props}

/>

)

);


CardDescription.displayName="CardDescription";





export const CardContent =
forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>

(
(
{
className,
...props
},
ref
)=>(

<div

ref={ref}

className={
cn(
"p-6 pt-0",
className
)
}

{...props}

/>

)

);


CardContent.displayName="CardContent";





// ------------------------------------------------------------
// Badge
// ------------------------------------------------------------


const badgeVariants=cva(

"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",

{

variants:{

variant:{


default:
"bg-primary/10 text-primary border border-primary/20",


outline:
"border border-border text-muted-foreground",


success:
"bg-primary/10 text-primary",


warning:
"bg-yellow-500/10 text-yellow-600",


danger:
"bg-red-500/10 text-red-600"

}

},

defaultVariants:{
variant:"default"
}

}

);





export interface BadgeProps
extends HTMLAttributes<HTMLSpanElement>,
VariantProps<typeof badgeVariants>{}





export function Badge({
className,
variant,
...props
}:BadgeProps){

return (

<span

className={
cn(
badgeVariants({
variant,
className
})
)
}

{...props}

/>

);

}






// ------------------------------------------------------------
// Progress
// ------------------------------------------------------------


export function Progress(
{
value,
className
}:
{
value:number;
className?:string;
}

){

return (

<div

className={
cn(
"h-3 w-full overflow-hidden rounded-full bg-muted",
className
)
}

>

<div

className="
h-full rounded-full gradient-brand transition-all duration-700 ease-out
shadow-md
"

style={{
width:`${Math.min(100,Math.max(0,value))}%`
}}

/>

</div>

);

}




// ------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------


export function Skeleton({
className
}:{
className?:string
}){

return (

<div

className={
cn(
"skeleton rounded-xl",
className
)
}

/>

);

}
