import { AlpivoLogo } from "@/components/premium/BrandLogo";

type LogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export default function Logo({ href = "/", compact = false, className = "" }: LogoProps) {
  return <AlpivoLogo href={href} compact={compact} className={className || "text-slate-950"} />;
}
