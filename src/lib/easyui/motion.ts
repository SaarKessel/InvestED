import type { Transition } from "framer-motion";

/**
 * Motion tokens adapted from EasyUI (MIT, (c) 2026 Suraj Maurya).
 * Soft, physical, immediate, controlled. Used by the EasyUI-derived
 * components in src/components/ui/easyui/.
 */
export const motionTransitions = {
  /** Gentle fluid transitions (tabs, accordions, dialog fades). */
  springGentle: { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as Transition,
  /** Smooth standard motion for cards. */
  springSmooth: { type: "spring", stiffness: 200, damping: 28, mass: 0.85 } as Transition,
  /** Snappy responsive feedback (buttons, hover indicators). */
  springSnappy: { type: "spring", stiffness: 380, damping: 30, mass: 0.5 } as Transition,
  /** Morphing shared layout (layoutId dialogs, sliding pills). */
  springMorph: { type: "spring", stiffness: 220, damping: 32, mass: 1.0 } as Transition,
  /** Responsive bounce physics (tiny satisfying overshoot). */
  springResponsive: { type: "spring", stiffness: 320, damping: 24, mass: 0.7 } as Transition,
  /** Soft spring for follow / smoothing defaults. */
  springSoft: { type: "spring", stiffness: 150, damping: 22, mass: 0.9 } as Transition,
  /** Subtle ease for property transitions (color, opacity). */
  easeSoft: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as Transition,
  /** Snappy ease for fast property transitions. */
  easeFast: { duration: 0.2, ease: [0.2, 0, 0, 1] } as Transition,
};
