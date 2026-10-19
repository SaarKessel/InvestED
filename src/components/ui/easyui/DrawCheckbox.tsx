// Adapted from EasyUI DrawCheckbox (MIT, (c) 2026 Suraj Maurya) — InvestED
// design tokens and reduced-motion support. Real checkbox input underneath,
// so keyboard and screen-reader behavior stays native.
import { forwardRef, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DrawCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const DrawCheckbox = forwardRef<HTMLInputElement, DrawCheckboxProps>(
  ({ className, label, description, checked, defaultChecked, disabled, id, onChange, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isChecked, setIsChecked] = useState(defaultChecked || false);
    const systemReduced = useReducedMotion();

    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : isChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setIsChecked(e.target.checked);
      onChange?.(e);
    };

    return (
      <div className={cn("flex select-none items-start gap-2.5", disabled && "cursor-not-allowed opacity-30", className)}>
        <div className="relative mt-0.5 flex items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={currentChecked}
            disabled={disabled}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <motion.div
            onClick={() => {
              if (disabled) return;
              document.getElementById(inputId)?.click();
            }}
            initial={false}
            animate={{
              scale: currentChecked && !systemReduced ? [0.9, 1.04, 1] : 1,
              backgroundColor: currentChecked ? "hsl(var(--primary))" : "hsl(var(--card))",
              borderColor: currentChecked ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}
            transition={{ duration: systemReduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] border peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
            aria-hidden="true"
          >
            {currentChecked && (
              <motion.svg
                viewBox="0 0 16 16"
                width="12"
                height="12"
                fill="none"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary-foreground"
                initial={systemReduced ? { opacity: 1 } : { pathLength: 0, scale: 0.6, opacity: 0 }}
                animate={{ pathLength: 1, scale: 1, opacity: 1 }}
                transition={{ duration: systemReduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.path
                  d="M3.5 8.5 L6.5 11.5 L12.5 5"
                  initial={systemReduced ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: systemReduced ? 0 : 0.28, ease: [0.65, 0, 0.35, 1] }}
                />
              </motion.svg>
            )}
          </motion.div>
        </div>
        {(label || description) && (
          <label htmlFor={inputId} className="cursor-pointer text-sm leading-snug">
            {label && <span className="block font-medium">{label}</span>}
            {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
          </label>
        )}
      </div>
    );
  }
);
DrawCheckbox.displayName = "DrawCheckbox";
