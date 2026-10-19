// Adapted from EasyUI StretchSwitch (MIT, (c) 2026 Suraj Maurya) — InvestED
// tokens, RTL-aware thumb travel, real switch semantics, reduced motion.
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/easyui/motion";

export interface StretchSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /** Accessible name (visible label stays the caller's job). */
  "aria-label"?: string;
  /** Thumb travel direction; default ltr. */
  dir?: "ltr" | "rtl";
  className?: string;
}

const TRACK_WIDTH = 36;
const THUMB_SIZE = 14;
const TRACK_PADDING = 2;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

export function StretchSwitch({
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  dir = "ltr",
  className,
  ...aria
}: StretchSwitchProps) {
  const [isOn, setIsOn] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const current = isControlled ? checked : isOn;
  const systemReduced = useReducedMotion();

  const sign = dir === "rtl" ? -1 : 1;
  const x = useMotionValue(current ? sign * TRAVEL : 0);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const target = current ? sign * TRAVEL : 0;
    if (systemReduced) {
      x.set(target);
      return;
    }
    const controls = animate(x, target, motionTransitions.springSnappy as never);
    return () => controls.stop();
  }, [current, sign, x, systemReduced]);

  const stretch = !systemReduced && isPressed;
  const scaleX = useTransform(x, () => (stretch ? 1.18 : 1));
  const scaleY = useTransform(x, () => (stretch ? 0.86 : 1));

  const handleToggle = () => {
    if (disabled) return;
    const next = !current;
    if (!isControlled) setIsOn(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={current}
      disabled={disabled}
      onClick={handleToggle}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={cn(
        "inline-flex h-[18px] w-9 shrink-0 cursor-pointer items-center rounded-full border px-0.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-30",
        current ? "border-primary bg-primary" : "border-border bg-muted",
        className
      )}
      {...aria}
    >
      <motion.span
        style={{ x, scaleX, scaleY, width: THUMB_SIZE, height: THUMB_SIZE }}
        className={cn("rounded-full shadow-sm", current ? "bg-primary-foreground" : "bg-muted-foreground")}
      />
    </button>
  );
}
