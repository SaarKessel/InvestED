// Adapted from EasyUI HamburgerMenu (MIT, (c) 2026 Suraj Maurya) — token
// colors, caller-owned accessible label (bilingual) and reduced motion.
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/easyui/motion";

export interface HamburgerMenuProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Current opened/closed state. */
  isOpen: boolean;
  /** State change callback. */
  onChange: (isOpen: boolean) => void;
  /** Icon box size in px. Default 24. */
  size?: number;
}

export function HamburgerMenu({ isOpen, onChange, size = 24, disabled = false, className, ...props }: HamburgerMenuProps) {
  const systemReduced = useReducedMotion();
  const lineSpacing = size * 0.28;
  const strokeWidth = Math.max(2, size * 0.08);
  const transition = systemReduced ? { duration: 0 } : motionTransitions.springSnappy;

  const line = (position: "top" | "middle" | "bottom") => {
    const animate =
      position === "top"
        ? { y: isOpen ? 0 : -lineSpacing, rotate: isOpen ? 45 : 0 }
        : position === "middle"
          ? { opacity: isOpen ? 0 : 1, scaleX: isOpen ? 0.3 : 1 }
          : { y: isOpen ? 0 : lineSpacing, rotate: isOpen ? -45 : 0 };
    return (
      <motion.span
        style={{ width: size, height: strokeWidth }}
        className="absolute rounded-full bg-current"
        animate={animate}
        transition={transition}
      />
    );
  };

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isOpen)}
      disabled={disabled}
      aria-expanded={isOpen}
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center rounded-xl p-2 transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <div style={{ width: size, height: size }} className="pointer-events-none relative flex flex-col items-center justify-center">
        {line("top")}
        {line("middle")}
        {line("bottom")}
      </div>
    </button>
  );
}
