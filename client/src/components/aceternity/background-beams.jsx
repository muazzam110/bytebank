import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const BASE_PATH = "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875";
const BEAMS = Array.from({ length: 6 }, (_, i) => ({
  shift: `translate(${i * 14} ${i * 8})`,
  duration: 8 + (i % 3) * 2,
  delay: i * 1.5,
}));

export function BackgroundBeams({ className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);

  // Perf guard: animate only while the hero is actually on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-0", className)}>
      {visible && (
        <svg className="h-full w-full" viewBox="0 0 696 316" preserveAspectRatio="xMidYMid slice" fill="none">
          {BEAMS.map((b, i) => (
            <g key={i} transform={b.shift}>
              <path d={BASE_PATH} stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
              <path d={BASE_PATH} stroke={`url(#beam-${i})`} strokeWidth="0.6" />
            </g>
          ))}
          <defs>
            {BEAMS.map((b, i) => (
              <motion.linearGradient
                key={i}
                id={`beam-${i}`}
                gradientUnits="userSpaceOnUse"
                initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
                animate={{ x1: ["0%", "100%"], x2: ["0%", "95%"], y1: ["0%", "100%"], y2: ["0%", "93%"] }}
                transition={{ duration: b.duration, delay: b.delay, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
              >
                <stop stopColor="#FFFFFF" stopOpacity="0" />
                <stop stopColor="#FFFFFF" />
                <stop offset="32.5%" stopColor="#FFD166" />
                <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
              </motion.linearGradient>
            ))}
          </defs>
        </svg>
      )}
    </div>
  );
}
