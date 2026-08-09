// components/ui/DynamicBadge.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DynamicBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
  showZero?: boolean;
  animation?: "bounce" | "pulse" | "slide" | "scale";
  size?: "sm" | "md" | "lg";
}

/**
 * Dynamic Badge Component
 * Displays a badge with count and smooth animations
 */
export function DynamicBadge({
  count,
  maxCount = 99,
  className = "",
  showZero = false,
  animation = "scale",
  size = "md",
}: DynamicBadgeProps) {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Format count (e.g., 99+)
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  // Size classes
  const sizeClasses = {
    sm: "text-[8px] px-1.5 py-0.5 min-w-[16px] h-4",
    md: "text-[10px] px-2 py-0.5 min-w-[20px] h-5",
    lg: "text-xs px-2.5 py-1 min-w-[24px] h-6",
  };

  // Animation variants
  const animationVariants = {
    scale: {
      initial: { scale: 0 },
      animate: { scale: 1 },
      exit: { scale: 0 },
    },
    bounce: {
      initial: { scale: 0, y: -10 },
      animate: { scale: 1, y: 0 },
      exit: { scale: 0, y: -10 },
    },
    slide: {
      initial: { x: 10, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 10, opacity: 0 },
    },
    pulse: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 },
    },
  };

  return (
    <AnimatePresence>
      <motion.span
        key={count}
        variants={animationVariants[animation]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className={`
          inline-flex items-center justify-center
          font-semibold leading-none text-white
          bg-linear-to-r from-red-500 to-red-600
          rounded-full shadow-lg
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {displayCount}
      </motion.span>
    </AnimatePresence>
  );
}
