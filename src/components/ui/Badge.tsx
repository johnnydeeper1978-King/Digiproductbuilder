import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Badge({ children, tone }: { children: ReactNode; tone?: "accent" | "soon" }) {
  return <span className={cn("badge", tone === "accent" && "badge-accent", tone === "soon" && "badge-soon")}>{children}</span>;
}
