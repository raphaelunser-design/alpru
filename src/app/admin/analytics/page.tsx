import AdminAnalyticsClient from "@/components/admin/AdminAnalyticsClient";
import Section from "@/components/Section";

export default function AdminAnalyticsPage() {
  return (
    <Section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin · Traffic</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Analytics und Nutzung</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          First-party Page Views, Top-Seiten und letzte Aktivitäten ohne externe Trackinganbieter.
        </p>
      </div>
      <AdminAnalyticsClient />
    </Section>
  );
}
