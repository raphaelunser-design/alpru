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
      <div className="flex min-w-max gap-2 rounded-xl border border-white/10 bg-white/[0.05] p-1.5">
        {tripWorkspaceTabs.map((tab) => {
          const active = tab.view === activeView;
          return (
            <Link
              key={tab.view}
              href={buildTripRoute(tripId, tab.view)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active "bg-sky-200 text-slate-950" : "text-slate-200 hover:bg-white/[0.08] hover:text-white"
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

