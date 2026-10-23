import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Eye,
  Lock,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ───────── hero: a purely decorative preview of the product (fake numbers) ───────── */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-fade-up" aria-hidden="true">
      <div className="absolute -inset-8 rounded-[2.5rem] bg-brand-gradient opacity-25 blur-3xl" />

      {/* the balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-7 text-white shadow-elev-3">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-label uppercase text-white/90">Available balance</p>
          <p className="mt-3 font-display text-5xl font-bold tracking-tight tabular-nums">
            <span className="mr-1 text-3xl opacity-80">₹</span>10,000<span className="text-3xl opacity-80">.00</span>
          </p>
          <div className="mt-6 flex items-center justify-between text-sm text-white/90">
            <span>A/C •••• 4821</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <BadgeCheck className="h-3.5 w-3.5" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* floating activity chips */}
      <div className="absolute -left-6 top-[8.5rem] flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-elev-3 motion-reduce:animate-none animate-float sm:-left-12">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-soft text-warning">
          <ArrowUpRight className="h-4 w-4" />
        </span>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Sent to Aarav</p>
          <p className="text-sm font-bold text-debit">−₹500.00</p>
        </div>
      </div>
      <div
        className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-elev-3 motion-reduce:animate-none animate-float sm:-right-10"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
          <ArrowDownLeft className="h-4 w-4" />
        </span>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Received from Bytebank</p>
          <p className="text-sm font-bold text-credit">+₹2,500.00</p>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, title: "Instant transfers", text: "Search a name, enter an amount, confirm. The money lands in seconds, with a clear receipt for both sides.", tint: "bg-brand-50 text-brand-600" },
  { icon: TrendingUp, title: "See your money grow", text: "A live balance trajectory and simple totals show where your money came from and where it went.", tint: "bg-success-soft text-success" },
  { icon: Receipt, title: "Receipts you can print", text: "Every payment gets a unique ID and a printable receipt, with the amount written out in words.", tint: "bg-gold-soft text-warning" },
  { icon: Search, title: "Find anything fast", text: "Search by payment ID or name, filter by direction, type and date, and share the exact view with a link.", tint: "bg-info-soft text-info" },
  { icon: Eye, title: "Privacy at a tap", text: "Blur your balance with one click when someone is looking over your shoulder. Your choice is remembered.", tint: "bg-violet-soft text-violet" },
  { icon: ShieldCheck, title: "Safe by design", text: "Payments are atomic and can never be applied twice, even if you double-click or lose your connection.", tint: "bg-danger-soft text-danger" },
];

const STEPS = [
  { n: "1", title: "Create your account", text: "Enter your name, email and a password. That's it. No forms, no paperwork." },
  { n: "2", title: "Get ₹10,000 instantly", text: "Your welcome balance is waiting the moment your account exists. It is given exactly once." },
  { n: "3", title: "Send, receive, track", text: "Pay friends, watch your balance move, and open any receipt whenever you need it." },
];

const SECURITY = [
  "Every transfer is one all-or-nothing database transaction",
  "Idempotency keys make double payments impossible",
  "Sessions live in HTTP-only cookies that scripts can't read",
  "Balances are always decided by the server, never the browser",
];

export default function LandingPage() {
  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
        <div className="container relative grid items-center gap-16 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Get ₹10,000 the moment you join
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Banking that feels <span className="text-gradient">alive</span>.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Open a free Bytebank account in seconds, send money to anyone instantly, and watch every rupee move in real time. No
              paperwork. No fees. No real money at risk.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link to="/signup">
                  Open free account <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-foreground/80">
              {["₹0 fees, always", "Takes under a minute", "100% simulated"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* ───────── STATS ───────── */}
      <section aria-label="At a glance" className="container -mt-2 pb-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-elev-2 lg:grid-cols-4">
          {[
            ["₹10,000", "welcome balance"],
            ["₹0", "fees on every payment"],
            ["2 clicks", "to send money"],
            ["24 / 7", "always open"],
          ].map(([big, small]) => (
            <div key={small} className="bg-card px-6 py-7 text-center">
              <p className="font-display text-3xl font-bold text-primary">{big}</p>
              <p className="mt-1 text-sm text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className="container scroll-mt-20 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-label uppercase text-primary">Features</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">Everything a modern bank app should do</h2>
          <p className="mt-4 text-lg text-muted-foreground">Simple on the surface. Serious underneath.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, tint }) => (
            <article
              key={title}
              className="group rounded-3xl border border-border bg-card p-7 shadow-elev-1 transition-all duration-300 ease-liquid hover:-translate-y-1 hover:border-primary/30 hover:shadow-elev-3"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how" className="scroll-mt-20 bg-card py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-label uppercase text-primary">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">From zero to your first payment in 3 steps</h2>
          </div>
          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="relative rounded-3xl bg-background p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient font-display text-xl font-bold text-white shadow-glow-brand">
                  {s.n}
                </span>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── SECURITY ───────── */}
      <section id="security" className="container scroll-mt-20 py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-hero-gradient p-10 text-white shadow-elev-3 lg:p-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold">
                <Lock className="h-4 w-4" aria-hidden="true" /> Built like a real bank
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-tight">Your money logic is rock solid</h2>
              <p className="mt-4 text-lg text-white/90">
                The money is pretend, but the engineering is real. These are the same safeguards real payment systems rely on.
              </p>
            </div>
            <ul className="space-y-4">
              {SECURITY.map((t) => (
                <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="container pb-24">
        <div className="rounded-[2rem] border border-border bg-card p-10 text-center shadow-elev-2 lg:p-16">
          <h2 className="font-display text-4xl font-bold tracking-tight">Ready to see your ₹10,000?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Your account is one short form away. Pick a name, an email and a password, and you're in.
          </p>
          <Button asChild size="lg" className="mt-8 h-14 px-10 text-base">
            <Link to="/signup">
              Open my free account <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
