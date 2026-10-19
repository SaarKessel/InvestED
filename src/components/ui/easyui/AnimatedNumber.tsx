// Adapted from EasyUI AnimatedNumber (MIT, (c) 2026 Suraj Maurya) — forced
// LTR digit order (numbers stay LTR inside Hebrew UI), token colors and
// automatic reduced-motion support added.
import { useEffect } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  /** Numeric value to animate to. */
  value: number;
  /** Number of decimal places (default: 0). */
  decimals?: number;
  /** Prepend text or currency symbol (e.g. "$", "+"). */
  prefix?: string;
  /** Append text (e.g. "%"). */
  suffix?: string;
  /** Spring stiffness. */
  stiffness?: number;
  /** Spring damping. */
  damping?: number;
  /** Spring mass. */
  mass?: number;
  /** Format with thousands grouping (e.g. "1,250"). Default true. */
  useGrouping?: boolean;
  /** Compact notation (e.g. 1.2M, 45K). */
  compact?: boolean;
  /** Custom class name. */
  className?: string;
}

function DigitColumn({
  digit,
  stiffness = 160,
  damping = 18,
  mass = 0.8,
}: {
  digit: string;
  stiffness?: number;
  damping?: number;
  mass?: number;
}) {
  const isNumber = !isNaN(parseInt(digit, 10));
  const numValue = isNumber ? parseInt(digit, 10) : 0;

  const spring = useSpring(numValue, { stiffness, damping, mass });
  const y = useTransform(spring, (current) => `${-current * 10}%`);

  useEffect(() => {
    spring.set(numValue);
  }, [spring, numValue]);

  if (!isNumber) {
    return <span className="inline-block">{digit}</span>;
  }

  return (
    <div className="relative inline-block h-[1.15em] w-[0.58em] overflow-hidden text-center leading-[1.15em]">
      <motion.div style={{ y }} className="flex select-none flex-col">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div key={n} className="flex h-[1.15em] items-center justify-center">
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function formatAnimatedNumber(
  val: number,
  { decimals = 0, useGrouping = true, compact = false }: { decimals?: number; useGrouping?: boolean; compact?: boolean } = {}
): string {
  if (!Number.isFinite(val)) return "—";
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(val);
  }
  const fixed = Math.abs(val).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  let formattedInt = intPart;
  if (useGrouping) {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  const sign = val < 0 ? "-" : "";
  return decPart !== undefined ? `${sign}${formattedInt}.${decPart}` : `${sign}${formattedInt}`;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  stiffness = 170,
  damping = 22,
  mass = 0.6,
  useGrouping = true,
  compact = false,
  className,
}: AnimatedNumberProps) {
  const systemReduced = useReducedMotion();
  const reduced = systemReduced ?? false;

  const formattedStr = formatAnimatedNumber(value, { decimals, useGrouping, compact });

  // Reduced motion: no rolling digits, just the final value.
  if (reduced) {
    return (
      <span dir="ltr" className={cn("inline-block tabular-nums tracking-tight", className)}>
        {prefix}
        {formattedStr}
        {suffix}
      </span>
    );
  }

  const chars = formattedStr.split("");

  return (
    <span
      dir="ltr"
      className={cn("inline-flex select-none items-baseline tabular-nums tracking-tight", className)}
      aria-label={`${prefix}${formattedStr}${suffix}`}
    >
      {prefix && <span className="me-0.5">{prefix}</span>}
      <span className="inline-flex items-baseline overflow-hidden" aria-hidden="true">
        {chars.map((char, index) => (
          <DigitColumn
            key={`${index}-${char === "," || char === "." || char === "-" ? char : "num"}`}
            digit={char}
            stiffness={stiffness}
            damping={damping}
            mass={mass}
          />
        ))}
      </span>
      {suffix && <span className="ms-0.5">{suffix}</span>}
    </span>
  );
}
