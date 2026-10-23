import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-liquid disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-gradient text-white shadow-glow-brand hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-danger/90",
        outline: "border border-input bg-card text-foreground hover:border-primary/40 hover:bg-accent",
        secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        link: "font-medium text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
