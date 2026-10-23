import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

// Counts from the value currently SHOWN to the new value, only when the value CHANGES.
// First paint renders instantly. `children` is a render function: (number) => JSX
export default function AnimatedNumber({ value, reduced = false, duration = 0.8, children }) {
  const [display, setDisplay] = useState(value);
  const shown = useRef(value);

  useEffect(() => {
    if (shown.current === value) return;
    if (reduced) {
      shown.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1], // ease-liquid
      onUpdate: (v) => {
        shown.current = v;
        setDisplay(Math.round(v));
      },
      onComplete: () => {
        shown.current = value;
        setDisplay(value);
      },
    });
    return () => controls.stop();
  }, [value, reduced, duration]);

  return children(display);
}
