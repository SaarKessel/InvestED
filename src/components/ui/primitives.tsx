import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  forwardRef,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------
// Button
// ------------------------------------------------------------

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md",
    "text-sm font-semibold",
    "transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110",

        outline:
          "border border-border bg-card text-foreground hover:bg-accent hover:border-primary/40",

        ghost:
          "text-foreground hover:bg-accent hover:text-foreground",

        secondary:
          "bg-muted text-foreground hover:bg-muted/80",

        link:
          "text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        })
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

// ------------------------------------------------------------
// Card
// ------------------------------------------------------------

export const Card = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border",
      "bg-card text-card-foreground",
      "transition-shadow duration-200",

      className
    )}
    {...props}
  />
));

Card.displayName = "Card";

// ------------------------------------------------------------
// Card Header
// ------------------------------------------------------------

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1.5 p-4 pb-3",
      className
    )}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

// ------------------------------------------------------------
// Card Title
// ------------------------------------------------------------

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-base font-semibold leading-snug tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

// ------------------------------------------------------------
// Card Description
// ------------------------------------------------------------

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed text-muted-foreground",
      className
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

// ------------------------------------------------------------
// Card Content
// ------------------------------------------------------------

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-4 pt-0",
      className
    )}
    {...props}
  />
));

CardContent.displayName = "CardContent";

// ------------------------------------------------------------
// Badge
// ------------------------------------------------------------

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-md px-2 py-0.5",
    "text-xs font-semibold",
    "transition-colors duration-200",
  ],
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary",

        outline:
          "border border-border text-foreground",

        success:
          "border border-primary/20 bg-primary/10 text-primary",

        warning:
          "border border-yellow-500/20 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300",

        danger:
          "border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
      },
    },

    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({
          variant,
          className,
        })
      )}
      {...props}
    />
  );
}

// ------------------------------------------------------------
// Progress
// ------------------------------------------------------------

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      aria-label={label}
      className={cn(
        "h-3 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
        style={{
          width: `${safeValue}%`,
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------

export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "skeleton rounded-xl",
        className
      )}
    />
  );
}
