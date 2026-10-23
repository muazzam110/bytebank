import animate from "tailwindcss-animate";

// CSS-variable colors that support opacity modifiers (bg-primary/10 etc.)
const rgb = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        // ── semantic tokens used by the shadcn components ──
        border: rgb("border"),
        input: rgb("input"),
        ring: rgb("ring"),
        background: rgb("background"),
        foreground: rgb("foreground"),
        primary: { DEFAULT: rgb("primary"), foreground: rgb("primary-foreground") },
        secondary: { DEFAULT: rgb("secondary"), foreground: rgb("secondary-foreground") },
        destructive: { DEFAULT: rgb("destructive"), foreground: rgb("destructive-foreground") },
        muted: { DEFAULT: rgb("muted"), foreground: rgb("muted-foreground") },
        accent: { DEFAULT: rgb("accent"), foreground: rgb("accent-foreground") },
        popover: { DEFAULT: rgb("popover"), foreground: rgb("popover-foreground") },
        card: { DEFAULT: rgb("card"), foreground: rgb("card-foreground") },

        // ── brand: electric indigo-violet (trust of blue + energy of violet) ──
        brand: {
          50: "#F1EEFF",
          100: "#E4DEFF",
          200: "#C9BEFF",
          300: "#A898FF",
          400: "#8467FF",
          500: "#6D4DFA",
          600: "#5B3DF5",
          700: "#4A2ED6",
          800: "#3A24A8",
          900: "#2A1A78",
        },
        // ── meaning colors (all checked for WCAG AA on white) ──
        success: { DEFAULT: "#047857", soft: "#D1FAE5", strong: "#10B981" }, // growth, money IN
        warning: { DEFAULT: "#B45309", soft: "#FEF3C7", strong: "#F59E0B" }, // money OUT, caution
        danger: { DEFAULT: "#BE123C", soft: "#FFE4E6", strong: "#F43F5E" }, // errors, suspension only
        info: { DEFAULT: "#0F766E", soft: "#CCFBF1", strong: "#14B8A6" }, // welcome / neutral info
        violet: { DEFAULT: "#7E22CE", soft: "#F3E8FF", strong: "#A855F7" }, // admin area
        gold: { DEFAULT: "#FFB020", soft: "#FFF4D6" }, // delight accents
        credit: "#047857",
        debit: "#B45309",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        display: ["Sora", '"Inter Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        label: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" }],
        "hero-figure": ["clamp(2.5rem, 6vw, 3.75rem)", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-figure": ["clamp(2.25rem, 5vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        "stat-figure": ["1.75rem", { lineHeight: "2rem", letterSpacing: "-0.01em", fontWeight: "700" }],
        "row-figure": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgb(16 24 64 / 0.05), 0 1px 3px rgb(16 24 64 / 0.06)",
        "elev-2": "0 4px 14px rgb(16 24 64 / 0.08), 0 2px 4px rgb(16 24 64 / 0.04)",
        "elev-3": "0 18px 40px rgb(60 40 160 / 0.18), 0 4px 10px rgb(16 24 64 / 0.06)",
        "glow-brand": "0 8px 24px rgb(91 61 245 / 0.35)",
        "glow-success": "0 8px 24px rgb(16 185 129 / 0.30)",
        "glow-danger": "0 8px 24px rgb(244 63 94 / 0.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #5B3DF5 0%, #7C4DFF 100%)", // white text >= 4.8:1 everywhere
        "hero-gradient":
          "radial-gradient(circle at 100% 0%, rgba(255,176,32,0.30), transparent 38%), radial-gradient(circle at 0% 100%, rgba(236,72,153,0.28), transparent 42%), linear-gradient(135deg, #2E1A9E 0%, #4A2ED6 50%, #6D2BC4 100%)", // white text >= 5.2:1 (white/90 >= 4.6:1) everywhere
        "success-gradient": "linear-gradient(135deg, #059669 0%, #10B981 100%)",
        "cta-gradient": "linear-gradient(120deg, #2E1A9E 0%, #4A2ED6 50%, #6D2BC4 100%)",
      },
      transitionTimingFunction: { liquid: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-credit": {
          "0%": { boxShadow: "0 0 0 0 rgb(16 185 129 / 0.55)" },
          "100%": { boxShadow: "0 0 0 28px rgb(16 185 129 / 0)" },
        },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "pulse-credit": "pulse-credit 1.2s cubic-bezier(0.22, 1, 0.36, 1) 1",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [animate],
};
