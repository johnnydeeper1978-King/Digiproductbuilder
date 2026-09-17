import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";
interface Common { variant?: Variant; size?: Size; className?: string; }

export function Button({
  variant = "primary", size = "md", className, ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)} {...rest} />
  );
}

export function ButtonLink({
  to, state, variant = "primary", size = "md", className, children,
}: Common & { to: string; state?: unknown; children: ReactNode }) {
  return (
    <Link to={to} state={state} className={cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}>
      {children}
    </Link>
  );
}
