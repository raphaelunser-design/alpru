import AdminUsersClient from "@/components/admin/AdminUsersClient";
import Section from "@/components/Section";

export default function AdminUsersPage() {
  return (
    <Section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin · Nutzer</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Accounts und Beta-Tester</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Übersicht über registrierte Profile, Rollen, Feedback und letzte Aktivität.
        </p>
      </div>
      <AdminUsersClient />
    </Section>
  );
}
