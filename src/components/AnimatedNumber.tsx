import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 0.6, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;

    if (prev !== value) {
      setFlash(value > prev ? "up" : "down");
      setTimeout(() => setFlash(null), 600);
    }

    const controls = animate(motionValue, value, {
      duration,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
  }, [value, duration, motionValue]);

  return (
    <motion.span
      className={className}
      style={{
        color: flash === "up" ? "hsl(142 60% 50%)" : flash === "down" ? "hsl(0 62% 55%)" : undefined,
        transition: "color 0.3s ease",
      }}
    >
      {display}
    </motion.span>
  );
}
