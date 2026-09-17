import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Card({ children, hover, className, style }:
  { children: ReactNode; hover?: boolean; className?: string; style?: CSSProperties }) {
  return <div className={cn("card", hover && "card-hover", className)} style={style}>{children}</div>;
}
