import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Send } from "lucide-react";
import { toggleBalanceHidden } from "@/features/ui/uiSlice";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import AnimatedNumber from "@/components/shared/AnimatedNumber";
import Money from "@/components/shared/Money";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/cn";
import WelcomeReveal from "./WelcomeReveal";

const maskAccount = (n) => `•••• ${n.slice(-4)}`;

export default function BalanceHero({ account, userId }) {
  const dispatch = useDispatch();
  const hidden = useSelector((s) => s.ui.balanceHidden);
  const reduced = useReducedEffects();
  const lowPower = (navigator.hardwareConcurrency ?? 8) < 4;
  const showBeams = !reduced && !lowPower;

  // incoming-credit pulse: a balance only RISES when money arrives
  const prevBalance = useRef(account.balancePaise);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const rose = account.balancePaise > prevBalance.current;
    prevBalance.current = account.balancePaise;
    if (!rose || reduced) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [account.balancePaise, reduced]);

  return (
    <section
      aria-labelledby="balance-label"
      className={cn("relative h-full overflow-hidden rounded-3xl bg-hero-gradient p-7 text-white shadow-elev-3 sm:p-9", pulse && "animate-pulse-credit")}
    >
      {/* decorative circles, like the shine on a physical card */}
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
      {showBeams && <BackgroundBeams className="opacity-60" />}

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            <p id="balance-label" className="text-label uppercase text-white/90">
              Available balance
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleBalanceHidden())}
              aria-pressed={hidden}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              title={hidden ? "Show balance" : "Hide balance"}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>

          {/* Visual figure: hidden from screen readers (it counts through intermediate values) */}
          <div className={cn("transition-[filter] duration-200", hidden && "blur-private")} aria-hidden="true">
            <AnimatedNumber value={account.balancePaise} reduced={reduced}>
              {(v) => <Money paise={v} size="hero" className="text-white" />}
            </AnimatedNumber>
          </div>
          {/* …and ONE calm announcement instead */}
          <p className="sr-only" aria-live="polite">
            {hidden ? "Balance hidden" : `Available balance ${formatINR(account.balancePaise)}`}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
            <span className="font-mono tracking-wider">A/C {maskAccount(account.accountNumber)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
              {account.status === "ACTIVE" ? "Active" : account.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-brand-700 shadow-elev-2 hover:bg-white hover:brightness-95" style={{ backgroundImage: "none" }}>
            <Link to="/app/transfer">
              <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Send money
            </Link>
          </Button>
          <Button asChild variant="ghost" className="bg-white/15 text-white hover:bg-white/25 hover:text-white">
            <Link to="/app/transactions">
              View activity <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <WelcomeReveal account={account} userId={userId} />
    </section>
  );
}
