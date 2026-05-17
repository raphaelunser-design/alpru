"use client";

import Link from "next/link";
import { buildTripRoute, tripWorkspaceTabs, type TripWorkspaceView } from "@/lib/tripPlanner";

type TripNavigationProps = {
  tripId: string;
  activeView: TripWorkspaceView;
};

export default function TripNavigation({ tripId, activeView }: TripNavigationProps) {
  return (
    <div className="nav-scroll overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-[1.35rem] border border-white/12 bg-slate-950/62 p-2 shadow-[0_18px_54px_rgba(2,6,23,0.2)]">
        {tripWorkspaceTabs.map((tab) => {
          const active = tab.view === activeView;
          return (
            <Link
              key={tab.view}
              href={buildTripRoute(tripId, tab.view)}
              className={`min-h-11 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${
                active
                  ? "bg-[linear-gradient(135deg,#075fd8,#0ea5e9)] text-white shadow-[0_16px_36px_rgba(14,165,233,0.24)]"
                  : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
