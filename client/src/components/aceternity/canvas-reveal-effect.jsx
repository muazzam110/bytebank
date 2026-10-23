import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const BRAND_TO_FUCHSIA = [
  [91, 61, 245],
  [217, 70, 239],
];
const mix = (a, b, t) => Math.round(a + (b - a) * t);

// Fills its (relatively positioned) parent with dots that reveal when `active` is true.
// It only runs a frame loop WHILE animating, so an idle canvas costs nothing.
export function CanvasRevealEffect({ active, colors = BRAND_TO_FUCHSIA, dotSize = 2, gap = 7, duration = 600, className }) {
  const canvasRef = useRef(null);
  const s = useRef({ progress: 0, target: 0, last: 0, raf: 0, dots: [], width: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const { dots, width, progress } = s.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    const [r1, g1, b1] = colors[0];
    const [r2, g2, b2] = colors[1] ?? colors[0];
    for (const d of dots) {
      const local = Math.min(1, Math.max(0, (progress - d.delay) / 0.5)); // each dot has its own start time
      if (local <= 0) continue;
      const t = width ? d.x / width : 0;
      ctx.fillStyle = `rgba(${mix(r1, r2, t)},${mix(g1, g2, t)},${mix(b1, b2, t)},${local * 0.35})`;
      ctx.fillRect(d.x, d.y, dotSize, dotSize);
    }
    ctx.restore();
  }, [colors, dotSize]);

  const build = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent) return;
    const { width, height } = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    const dots = [];
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) dots.push({ x, y, delay: Math.random() * 0.5 });
    }
    s.current.dots = dots;
    s.current.width = width;
    draw();
  }, [gap, draw]);

  const tick = useCallback(
    (now) => {
      const st = s.current;
      const dt = now - (st.last || now);
      st.last = now;
      const dir = Math.sign(st.target - st.progress);
      st.progress = Math.min(1, Math.max(0, st.progress + dir * (dt / duration)));
      draw();
      if (st.progress !== st.target) st.raf = requestAnimationFrame(tick);
      else {
        st.raf = 0;
        st.last = 0;
      }
    },
    [duration, draw]
  );

  useEffect(() => {
    const st = s.current;
    st.target = active ? 1 : 0;
    if (!st.raf && st.progress !== st.target) {
      st.last = 0;
      st.raf = requestAnimationFrame(tick);
    }
  }, [active, tick]);

  useEffect(() => {
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvasRef.current.parentElement);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.current.raf);
      s.current.raf = 0;
    };
  }, [build]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}
