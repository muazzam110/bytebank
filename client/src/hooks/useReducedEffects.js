import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const QUERY = "(prefers-reduced-motion: reduce)";

// true if the OS asks for reduced motion OR the user turned on "Reduce effects" in the app
export function useReducedEffects() {
  const appPref = useSelector((s) => s.ui.reduceEffects);
  const [osPref, setOsPref] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setOsPref(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return appPref || osPref;
}
