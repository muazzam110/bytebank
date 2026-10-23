import { Link, Outlet } from "react-router-dom";
import { ArrowDownLeft, Check, ShieldCheck, Zap } from "lucide-react";
import BrandMark from "@/components/shared/BrandMark";

const PERKS = [
  { icon: Zap, text: "₹10,000 welcome balance, instantly" },
  { icon: ShieldCheck, text: "Payments that can never be applied twice" },
  { icon: Check, text: "Printable receipts for every transaction" },
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" aria-label="Bytebank home" className="w-fit">
          <BrandMark />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elev-3 sm:p-10">
            <Outlet />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Simulated bank · No real money</p>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-hero-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/10" aria-hidden="true" />

        <BrandMark light className="relative" />

        <div className="relative space-y-8">
          <h2 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight">
            Your money,
            <br />
            beautifully in motion.
          </h2>
          <ul className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-lg font-medium text-white/95">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative w-fit rounded-2xl bg-white p-4 text-foreground shadow-elev-3 motion-reduce:animate-none animate-float" aria-hidden="true">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
              <ArrowDownLeft className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Welcome deposit</p>
              <p className="text-lg font-bold text-credit">+₹10,000.00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
