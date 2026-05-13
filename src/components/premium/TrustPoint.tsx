import MetricChip, { MetricIcon, type MetricIconName } from "@/components/premium/MetricChip";

type TrustPointProps = {
  icon: MetricIconName;
  title: string;
  text: string;
  compact?: boolean;
};

export default function TrustPoint({ icon, title, text, compact = false }: TrustPointProps) {
  if (compact) {
    return <MetricChip icon={icon} label={text} value={title} variant="glass" />;
  }

  return (
    <article className="rounded-3xl border border-white/12 bg-white/[0.065] p-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.22)] backdrop-blur-xl">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-400/14 text-sky-100">
        <MetricIcon name={icon} />
      </div>
      <h3 className="mt-4 text-base font-extrabold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </article>
  );
}
