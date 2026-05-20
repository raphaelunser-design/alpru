import { formatShortDate, getTripMemberName, type SkiTripMemberRecord } from "@/lib/tripPlanner";

type ParticipantListProps = {
  members: SkiTripMemberRecord[];
  highlightMemberId: string | null;
};

function roleChip(role: SkiTripMemberRecord["role"]) {
  return role === "admin"
    ? "border-sky-200/25 bg-sky-200/10 text-sky-50"
    : "border-white/10 bg-white/[0.06] text-slate-100";
}

function statusLabel(status: SkiTripMemberRecord["status"]) {
  if (status === "invited") return "eingeladen";
  if (status === "open") return "offen";
  return "aktiv";
}

export default function ParticipantList({ members, highlightMemberId }: ParticipantListProps) {
  return (
    <div className="grid gap-3">
      {members.map((member) => (
        <div
          key={member.id}
          className={`rounded-lg border p-3 ${
            member.id === highlightMemberId
              ? "border-sky-200/25 bg-sky-200/[0.08]"
              : "border-white/10 bg-white/[0.05]"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{getTripMemberName(member)}</div>
              <div className="mt-1 text-xs text-slate-400">
                {member.email ?? "ohne Mail"}
                {member.joinedAt ? ` · dabei seit ${formatShortDate(member.joinedAt.slice(0, 10))}` : ""}
              </div>
              {member.isDemo ? (
                <div className="mt-2 text-xs text-amber-100">
                  Beispiel-Profil: {String(member.demoProfile?.note ?? "Gruppenprofil für die lokale Planung")}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              {member.isDemo ? (
                <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2.5 py-1 text-[11px] text-amber-50">
                  Beispiel
                </span>
              ) : null}
              <span className={`rounded-full border px-2.5 py-1 text-[11px] ${roleChip(member.role)}`}>{member.role}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-200">
                {statusLabel(member.status)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
