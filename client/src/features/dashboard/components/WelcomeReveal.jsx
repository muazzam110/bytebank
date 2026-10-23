import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { markWelcomeSeen } from "@/features/ui/uiSlice";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { SparklesCore } from "@/components/aceternity/sparkles";

const TEN_MINUTES = 10 * 60 * 1000;

// Sparkles for ≤ 2 s, ONCE, only when the account is brand new
export default function WelcomeReveal({ account, userId }) {
  const dispatch = useDispatch();
  const reduced = useReducedEffects();
  const alreadySeen = useSelector((s) => s.ui.welcomeSeenFor.includes(userId));
  const [show, setShow] = useState(false);

  const isNew = Date.now() - new Date(account.createdAt).getTime() < TEN_MINUTES;
  const eligible = isNew && !alreadySeen;

  useEffect(() => {
    if (!eligible) return;
    if (reduced) {
      // no animation, but still count it as seen
      dispatch(markWelcomeSeen(userId));
      return;
    }
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false); // unmount → no lingering particles
      dispatch(markWelcomeSeen(userId));
    }, 2000);
    return () => clearTimeout(timer);
  }, [eligible, reduced, userId, dispatch]);

  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <SparklesCore id="welcome-sparkles" className="h-full w-full" particleDensity={40} particleColor="#9DB6FF" />
    </div>
  );
}
