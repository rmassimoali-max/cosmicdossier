import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CButton({
  children,
  variant = "gold",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "ghost" | "outline" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
        variant === "gold" && "halo text-primary-foreground hover:scale-[1.02]",
        variant === "outline" &&
          "border border-border bg-card/60 text-foreground hover:border-primary/60 hover:text-primary",
        variant === "ghost" && "text-muted-foreground hover:text-primary",
        className,
      )}
      style={variant === "gold" ? { background: "var(--gradient-gold)" } : undefined}
    >
      {children}
    </button>
  );
}

export function GoldLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "halo inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-lg text-primary-foreground transition-transform duration-300 hover:scale-[1.02]",
        className,
      )}
      style={{ background: "var(--gradient-gold)" }}
    >
      {children}
    </Link>
  );
}

const fieldBase =
  "w-full rounded-md border border-input bg-background/50 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/70";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[0.7rem] text-muted-foreground/70">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />;
}

export function SelectInput({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={cn(fieldBase, "appearance-none", props.className)}>
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Bar({
  label,
  value,
  max = 10,
  tone = "primary",
  caption,
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "primary" | "fire" | "earth" | "air" | "water" | "accent";
  caption?: string;
}) {
  const pct = Math.max(2, Math.min(100, (value / (max || 1)) * 100));
  const colorVar = tone === "primary" ? "var(--primary)" : `var(--${tone})`;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, backgroundColor: colorVar }}
        />
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-[0.7rem] text-foreground/80">
        {caption ?? value}
      </span>
    </div>
  );
}

export function SectionTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-5">
      {kicker ? (
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">{kicker}</p>
      ) : null}
      <h2 className="mt-2 text-3xl text-foreground">{children}</h2>
    </div>
  );
}
