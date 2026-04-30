import type { HTMLAttributes, ReactNode } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className: string;
};

export default function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div {...props} className={`glass-card animate-rise ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
