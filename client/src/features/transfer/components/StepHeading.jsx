import { useEffect, useRef } from "react";

// Moves keyboard/screen-reader focus to the new step's heading when a step mounts
export default function StepHeading({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className="font-display text-2xl font-semibold tracking-tight outline-none">
      {children}
    </h2>
  );
}
