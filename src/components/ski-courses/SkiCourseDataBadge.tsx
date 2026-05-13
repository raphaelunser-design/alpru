import DataStatusBadge, { type DataStatus } from "@/components/DataStatusBadge";
import type { SkiCourseDataStatus } from "@/lib/skiCourses";

const badgeMap: Record<SkiCourseDataStatus, { status: DataStatus; label: string }> = {
  official: { status: "verified", label: "Offizielle Quelle" },
  curated: { status: "curated", label: "Kuratierte Daten" },
  estimated: { status: "estimated", label: "Schätzung" },
  demo: { status: "demo", label: "Demo-Daten" },
  unknown: { status: "unknown", label: "Datenstand offen" },
};

type SkiCourseDataBadgeProps = {
  status: SkiCourseDataStatus;
  compact?: boolean;
  className?: string;
};

export default function SkiCourseDataBadge({ status, compact = false, className = "" }: SkiCourseDataBadgeProps) {
  const badge = badgeMap[status] ?? badgeMap.unknown;
  return <DataStatusBadge status={badge.status} label={badge.label} compact={compact} className={className} />;
}
