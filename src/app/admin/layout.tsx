import Link from "next/link";
import AdminGate from "@/components/AdminGate";
import GlassCard from "@/components/GlassCard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-6">
          <GlassCard className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-slate-200">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin</span>
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <Link className="hover:text-white" href="/admin">
              Übersicht
            </Link>
            <Link className="hover:text-white" href="/admin/resorts">
              Resorts
            </Link>
            <Link className="hover:text-white" href="/admin/prices">
              Preise
            </Link>
            <Link className="hover:text-white" href="/admin/content">
              Content
            </Link>
            <Link className="hover:text-white" href="/admin/media">
              Media
            </Link>
            <Link className="hover:text-white" href="/admin/feedback">
              Feedback
            </Link>
            <Link className="hover:text-white" href="/resorts">
              Zur Site
            </Link>
          </GlassCard>
        </div>
        {children}
      </div>
    </AdminGate>
  );
}
