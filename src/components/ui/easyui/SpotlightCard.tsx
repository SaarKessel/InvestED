// Adapted from EasyUI SpotlightCard (MIT, (c) 2026 Suraj Maurya) — InvestED
// tokens, pointer glow disabled under reduced motion.
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightSize?: number;
  className?: string;
}

export function SpotlightCard({ children, spotlightSize = 350, className, ...props }: SpotlightCardProps) {
  const systemReduced = useReducedMotion();
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (systemReduced || !cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const backgroundGradient = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.08), transparent 80%)`;
  const borderGradient = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.18), transparent 80%)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(-1000);
        mouseY.set(-1000);
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/40",
        className
      )}
      {...props}
    >
      {!systemReduced && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: borderGradient }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: backgroundGradient }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
