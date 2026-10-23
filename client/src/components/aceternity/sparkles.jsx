import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Initialise the particles engine ONCE for the whole app
let enginePromise;
const initEngine = () =>
  (enginePromise ??= initParticlesEngine(async (engine) => {
    await loadSlim(engine);
  }));

export function SparklesCore({
  id = "sparkles",
  className,
  particleColor = "#FFE29A",
  particleDensity = 40,
  minSize = 0.6,
  maxSize = 1.6,
  speed = 1,
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initEngine().then(() => setReady(true));
  }, []);
  if (!ready) return null;

  return (
    <Particles
      id={id}
      className={className}
      options={{
        background: { color: { value: "transparent" } },
        fullScreen: { enable: false, zIndex: 1 },
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          color: { value: particleColor },
          number: { value: particleDensity },
          shape: { type: "circle" },
          size: { value: { min: minSize, max: maxSize } },
          move: { enable: true, speed: { min: 0.1, max: speed }, direction: "none", outModes: { default: "out" } },
          opacity: {
            value: { min: 0.1, max: 1 },
            animation: { enable: true, speed: 2 * speed, sync: false, startValue: "random" },
          },
        },
      }}
    />
  );
}
