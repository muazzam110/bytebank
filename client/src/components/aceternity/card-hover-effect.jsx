import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { cn } from "@/lib/cn";

export function HoverEffect({ items, getKey, renderItem, className }) {
  const [hovered, setHovered] = useState(null);
  const reduced = useReducedEffects();

  if (reduced) {
    // no sliding plate: a plain hover/focus background
    return (
      <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
        {items.map((item) => (
          <li key={getKey(item)} className="rounded-2xl hover:bg-primary/5 focus-within:bg-primary/5">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {items.map((item) => {
        const key = getKey(item);
        return (
          <li
            key={key}
            className="relative"
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(key)}
            onBlur={() => setHovered(null)} // keyboard focus = same effect
          >
            <AnimatePresence>
              {hovered === key && (
                <motion.span
                  layoutId="recipient-hover-plate" // the SAME element glides between cards
                  className="absolute inset-0 rounded-2xl bg-primary/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.1 } }}
                />
              )}
            </AnimatePresence>
            <div className="relative z-10">{renderItem(item)}</div>
          </li>
        );
      })}
    </ul>
  );
}
