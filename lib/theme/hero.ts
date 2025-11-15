export const heroTheme = {
  background: {
    gradient: "bg-linear-to-t from-amber-200 via-amber-50 to-white dark:bg-slate-950 dark:from-slate-900",
  },
  surface: {
    glass: "bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl",
    elevated: "shadow-[0_25px_80px_rgba(15,23,42,0.12)]",
  },
  border: {
    subtle: "border border-slate-100/70 dark:border-slate-800/70",
  },
  text: {
    primary: "text-slate-900 dark:text-slate-100",
    secondary: "text-slate-600 dark:text-slate-400",
    accent: "text-amber-500",
  },
  badge: {
    base: "inline-flex items-center gap-2 rounded-full border border-slate-50/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm",
  },
  button: {
    primary:
      "rounded-4xl border border-amber-300 bg-slate-50 px-8 py-4 font-sans font-bold text-slate-800 transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
    ghost:
      "text-slate-600 underline-offset-4 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
  },
} as const;

export type HeroTheme = typeof heroTheme;
