"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { supabase } from "@/lib/supabase";
import type { ResortDecision, TripStyle } from "@/lib/resortSignals";

type AuthState = {
  status: "idle" | "loading" | "error" | "success";
  message: string;
};

type AccessMode = "signin" | "signup" | "magic";
type ProfileRole = "user" | "admin";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
};

type FeedbackRow = {
  id: string;
  category: string | null;
  feedback_type: string | null;
  message: string;
  page_path: string | null;
  page_url: string | null;
  status: string;
  rating: number | null;
  created_at: string;
};

type AccountPayload = {
  profile: Profile | null;
  user: {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  };
  feedback: FeedbackRow[];
  error?: string;
};

type StoredPrefs = {
  tripStyle: TripStyle;
  budgetMin: number;
  budgetMax: number;
  peopleCount: number;
  tripStartDate: string | null;
  tripEndDate: string | null;
  apres: number;
  emptySlopes: number;
  snowReliability: number;
  valueForMoney: number;
  family: number;
  panorama: number;
  summerGlacier: number;
  rentalMode: "own" | "rent";
  travelMode: "car" | "train" | "bus" | "flight";
};

const number = new Intl.NumberFormat("de-DE");
const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });
const shortDateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

const defaultPrefs: StoredPrefs = {
  tripStyle: "balanced",
  budgetMin: 0,
  budgetMax: 0,
  peopleCount: 2,
  tripStartDate: null,
  tripEndDate: null,
  apres: 0,
  emptySlopes: 0,
  snowReliability: 0,
  valueForMoney: 0,
  family: 0,
  panorama: 0,
  summerGlacier: 0,
  rentalMode: "own",
  travelMode: "car",
};

function formatDate(value: string | null | undefined, fallback = "Noch offen") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return dateFormatter.format(date);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "Noch offen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Noch offen";
  return shortDateFormatter.format(date);
}

function formatBudget(prefs: StoredPrefs | null) {
  if (!prefs || (!prefs.budgetMin && !prefs.budgetMax)) return "Nicht gesetzt";
  const min = prefs.budgetMin || 0;
  const max = prefs.budgetMax || prefs.budgetMin || 0;
  return `${number.format(min)} - ${number.format(max)} EUR p. P.`;
}

function tripStyleLabel(style: TripStyle | undefined) {
  if (style === "budget") return "Smart Budget";
  if (style === "apres") return "Après & Crew";
  if (style === "family") return "Family Calm";
  if (style === "sport") return "Big Mountain";
  if (style === "premium") return "Premium Alpine";
  if (style === "quiet") return "Quiet Escape";
  if (style === "powder") return "Powder";
  if (style === "glacier") return "Summer Glacier";
  if (style === "offpiste") return "Off-Piste";
  return "Balanced";
}

function signalLabel(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return "offen";
  if (value >= 5) return "max";
  if (value >= 4) return "hoch";
  if (value >= 2) return "mittel";
  return "egal";
}

function pct(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round((value / 5) * 100)));
}

function feedbackTypeLabel(value: string | null | undefined) {
  if (value === "bug") return "Bug";
  if (value === "idea" || value === "feature") return "Idee";
  if (value === "design") return "Design";
  return "Feedback";
}

function statusLabel(value: string) {
  if (value === "reviewed") return "Geprüft";
  if (value === "planned") return "Geplant";
  if (value === "done") return "Erledigt";
  if (value === "archived") return "Archiviert";
  return "Neu";
}

function getRedirectUrl(authMode: "magic" | "recovery") {
  if (typeof window === "undefined") return undefined;
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("auth", authMode);
  return url.toString();
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div>
    </div>
  );
}

function PreferenceBar({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{signalLabel(value)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-sky-200" style={{ width: `${pct(value)}%` }} />
      </div>
    </div>
  );
}

function ActionLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200/30 hover:bg-white/10"
    >
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{text}</div>
    </Link>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [mode, setMode] = useState<AccessMode>("signin");
  const [authState, setAuthState] = useState<AuthState>({ status: "idle", message: "" });
  const [helperState, setHelperState] = useState<AuthState>({ status: "idle", message: "" });
  const [profileState, setProfileState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryState, setRecoveryState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [prefs, setPrefs] = useState<StoredPrefs | null>(null);
  const [results, setResults] = useState<ResortDecision[]>([]);

  async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadAccount(redirectAdmin = false) {
    setAccountLoading(true);
    const headers = await authHeaders();
    if (!headers.Authorization) {
      setAccount(null);
      setAccountLoading(false);
      return null;
    }

    const response = await fetch("/api/account/profile", { headers });
    const body = (await response.json().catch(() => null)) as AccountPayload | null;
    if (!response.ok || !body) {
      setAccount(null);
      setAccountLoading(false);
      return null;
    }

    setAccount(body);
    setDisplayNameInput(body.profile?.display_name || body.user.email?.split("@")[0] || "");
    setEmail((current) => current || body.user.email || "");
    setAccountLoading(false);

    if (redirectAdmin && body.profile?.role === "admin") {
      router.push("/admin");
    }

    return body;
  }

  function cleanAuthUrl() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const param of ["auth", "code", "error", "error_code", "error_description"]) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    if (url.hash.includes("access_token") || url.hash.includes("refresh_token") || url.hash.includes("type=recovery")) {
      url.hash = "";
      changed = true;
    }
    if (changed) window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const searchParams = new URLSearchParams(window.location.search);
      const searchAuth = searchParams.get("auth");
      const authCode = searchParams.get("code");
      const authError = searchParams.get("error_description") || searchParams.get("error");
      const recoveryHint = searchAuth === "recovery" || window.location.hash.includes("type=recovery");

      if (authError) {
        const message = authError.replace(/\+/g, " ");
        if (recoveryHint) {
          setShowRecoveryForm(true);
          setRecoveryState({ status: "error", message: `Reset-Link konnte nicht bestätigt werden: ${message}` });
        } else {
          setHelperState({ status: "error", message });
        }
      }

      if (recoveryHint) {
        setShowRecoveryForm(true);
        setRecoveryState({
          status: "success",
          message: "Recovery-Link erkannt. Vergib jetzt direkt in Alpivo ein neues Passwort.",
        });
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          setHelperState({ status: "error", message: error.message });
          setAccountLoading(false);
          return;
        }
      }

      if (!mounted) return;
      const loaded = await loadAccount(searchAuth === "magic");
      if (searchAuth === "magic" && loaded) {
        setHelperState({ status: "success", message: "Magic-Link bestätigt. Du bist jetzt in Alpivo eingeloggt." });
      }
      if (authCode || searchAuth === "magic") cleanAuthUrl();
    }

    initializeAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) setEmail((current) => current || session.user.email || "");
      if (event === "PASSWORD_RECOVERY") {
        setShowRecoveryForm(true);
        setRecoveryState({ status: "success", message: "Passwort-Reset aktiv. Lege jetzt dein neues Alpivo-Passwort fest." });
      }
      loadAccount(event === "SIGNED_IN");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const rawPrefs = window.localStorage.getItem("alpivo_quiz_prefs");
    if (rawPrefs) {
      try {
        setPrefs(JSON.parse(rawPrefs) as StoredPrefs);
      } catch {
        setPrefs(null);
      }
    }

    const rawResults = window.localStorage.getItem("alpivo_results") || window.sessionStorage.getItem("ski_results");
    if (rawResults) {
      try {
        setResults(JSON.parse(rawResults) as ResortDecision[]);
      } catch {
        setResults([]);
      }
    }
  }, []);

  async function handleSignIn() {
    setAuthState({ status: "loading", message: "" });
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAuthState({ status: "error", message: error.message });
      return;
    }
    setAuthState({ status: "success", message: "Erfolgreich angemeldet." });
    await loadAccount(true);
  }

  async function handleSignUp() {
    setAuthState({ status: "loading", message: "" });
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayNameInput.trim() || undefined,
        },
        emailRedirectTo: getRedirectUrl("magic"),
      },
    });
    if (error) {
      setAuthState({ status: "error", message: error.message });
      return;
    }
    setAuthState({
      status: "success",
      message: "Account erstellt. Falls Supabase E-Mail-Bestätigung verlangt, bestätige bitte den Link in deiner Mail.",
    });
    await loadAccount(true);
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setHelperState({ status: "error", message: "Bitte zuerst deine E-Mail eintragen." });
      return;
    }

    setHelperState({ status: "loading", message: "" });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getRedirectUrl("magic"),
      },
    });

    if (error) {
      setHelperState({ status: "error", message: error.message });
      return;
    }

    setHelperState({
      status: "success",
      message: "Magic-Link gesendet. Öffne die E-Mail und bestätige den Login für Alpivo.",
    });
  }

  async function handlePasswordResetEmail() {
    if (!email.trim()) {
      setHelperState({ status: "error", message: "Bitte zuerst deine E-Mail eintragen." });
      return;
    }

    setHelperState({ status: "loading", message: "" });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getRedirectUrl("recovery"),
    });

    if (error) {
      setHelperState({ status: "error", message: error.message });
      return;
    }

    setHelperState({
      status: "success",
      message: "Reset-Link gesendet. Darüber kannst du dein Alpivo-Passwort direkt neu setzen.",
    });
  }

  async function handlePasswordUpdate() {
    if (recoveryPassword.length < 8) {
      setRecoveryState({ status: "error", message: "Das neue Passwort sollte mindestens 8 Zeichen haben." });
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryState({ status: "error", message: "Die beiden Passwort-Felder stimmen nicht überein." });
      return;
    }

    setRecoveryState({ status: "loading", message: "" });
    const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
    if (error) {
      setRecoveryState({ status: "error", message: error.message });
      return;
    }

    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
    setShowRecoveryForm(false);
    cleanAuthUrl();
    setRecoveryState({ status: "success", message: "Dein Alpivo-Passwort wurde aktualisiert." });
    await loadAccount(false);
  }

  async function handleProfileSave() {
    setProfileState({ status: "loading", message: "" });
    const headers = await authHeaders();
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ displayName: displayNameInput }),
    });
    const body = (await response.json().catch(() => null)) as { profile?: Profile; error?: string } | null;
    if (!response.ok) {
      setProfileState({ status: "error", message: body?.error || "Profil konnte nicht gespeichert werden." });
      return;
    }
    setAccount((current) => (current && body?.profile ? { ...current, profile: body.profile } : current));
    setProfileState({ status: "success", message: "Profil gespeichert." });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAccount(null);
    setAccountLoading(false);
    setAuthState({ status: "success", message: "Abgemeldet." });
  }

  const profile = account?.profile ?? null;
  const user = account?.user ?? null;
  const isLoggedIn = Boolean(user);
  const displayPrefs = prefs ?? defaultPrefs;
  const topResults = useMemo(() => results.slice(0, 3), [results]);
  const favorite = topResults[0];
  const greetingName = profile?.display_name || user?.email || "Alpivo Tester";
  const preferenceSignals = [
    { label: "Value", value: displayPrefs.valueForMoney },
    { label: "Schnee", value: displayPrefs.snowReliability },
    { label: "Ruhe", value: displayPrefs.emptySlopes },
    { label: "Après", value: displayPrefs.apres },
    { label: "Familie", value: displayPrefs.family },
    { label: "Gletscher", value: displayPrefs.summerGlacier },
  ];

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[330px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[310px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Alpivo Konto</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-5xl">
              {isLoggedIn ? `Willkommen, ${greetingName}.` : "Dein Alpivo Cockpit."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
              Verwalte dein Profil, deine Beta-Rückmeldungen und deine letzten Ski-Matches an einem ruhigen Ort.
            </p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Accountstatus</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {accountLoading ? "Session wird geprüft" : isLoggedIn ? "Eingeloggt und bereit" : "Noch nicht eingeloggt"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {isLoggedIn
                    ? "Danke, dass du Alpivo testest. Deine Feedbacks und Aktivitäten werden deinem Konto zugeordnet."
                    : "Erstelle einen Account, damit Feedback, Gruppenplanung und spätere Favoriten sauber gespeichert bleiben."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="button-lift rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                  >
                    Admin öffnen
                  </Link>
                ) : null}
                {isLoggedIn ? (
                  <button
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    onClick={handleSignOut}
                  >
                    Abmelden
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Rolle" value={profile?.role === "admin" ? "Admin" : isLoggedIn ? "Beta Nutzer" : "Gast"} hint="Rechte in Alpivo" />
              <StatCard label="Erstellt" value={formatShortDate(profile?.created_at || user?.created_at)} hint="Account-Anlage" />
              <StatCard label="Aktivität" value={formatDate(profile?.last_seen_at || user?.last_sign_in_at, "Noch offen")} hint="Letzter bekannter Kontakt" />
              <StatCard label="Top-Match" value={favorite ? `${favorite.matchPct}%` : "-"} hint={favorite?.name ?? "Noch kein Match"} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            {showRecoveryForm ? (
              <div className="mb-5 rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Passwort neu setzen</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Neues Alpivo-Passwort vergeben</h3>
                <div className="mt-4 grid gap-3 text-sm">
                  <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" type="password" placeholder="Neues Passwort" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} />
                  <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" type="password" placeholder="Passwort wiederholen" value={recoveryPasswordConfirm} onChange={(event) => setRecoveryPasswordConfirm(event.target.value)} />
                  <button className="button-lift rounded-xl bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60" onClick={handlePasswordUpdate} disabled={recoveryState.status === "loading"}>
                    {recoveryState.status === "loading" ? "Bitte warten..." : "Neues Passwort speichern"}
                  </button>
                </div>
                {recoveryState.message ? <div className="mt-3 text-xs text-slate-200">{recoveryState.message}</div> : null}
              </div>
            ) : null}

            <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
              {(["signin", "signup", "magic"] as AccessMode[]).map((item) => (
                <button
                  key={item}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mode === item ? "bg-sky-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
                  }`}
                  onClick={() => setMode(item)}
                >
                  {item === "signin" ? "Login" : item === "signup" ? "Registrieren" : "Magic Link"}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              {mode === "signup" ? (
                <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" placeholder="Anzeigename, z. B. Raphael" value={displayNameInput} onChange={(event) => setDisplayNameInput(event.target.value)} />
              ) : null}
              <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" type="email" placeholder="E-Mail" value={email} onChange={(event) => setEmail(event.target.value)} />
              {mode !== "magic" ? (
                <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" type="password" placeholder="Passwort" value={password} onChange={(event) => setPassword(event.target.value)} />
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-xs leading-5 text-slate-300">
                  Du bekommst einen sicheren Login-Link per E-Mail. Das ist für Beta-Tester oft der bequemste Einstieg.
                </div>
              )}
              <button
                className="button-lift rounded-xl bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                onClick={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleMagicLink}
                disabled={authState.status === "loading" || helperState.status === "loading"}
              >
                {authState.status === "loading" || helperState.status === "loading"
                  ? "Bitte warten..."
                  : mode === "signin"
                    ? "Einloggen"
                    : mode === "signup"
                      ? "Account erstellen"
                      : "Magic-Link senden"}
              </button>
              {authState.message ? <div className={`rounded-xl border p-3 text-xs ${authState.status === "error" ? "border-red-300/30 bg-red-500/10 text-red-200" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"}`}>{authState.message}</div> : null}
              {helperState.message ? <div className={`rounded-xl border p-3 text-xs ${helperState.status === "error" ? "border-red-300/30 bg-red-500/10 text-red-200" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"}`}>{helperState.message}</div> : null}
              {!isLoggedIn ? (
                <button className="justify-self-start text-xs font-medium text-sky-100 transition hover:text-white" onClick={handlePasswordResetEmail} type="button">
                  Passwort vergessen? Reset-Link senden
                </button>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Profil</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Accountdaten</h2>
              </div>
              <Link href="/feedback" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Feedback geben
              </Link>
            </div>
            {isLoggedIn ? (
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm text-slate-300">
                  Anzeigename
                  <input className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50" value={displayNameInput} onChange={(event) => setDisplayNameInput(event.target.value)} />
                </label>
                <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">E-Mail</div>
                    <div className="mt-1 break-all text-white">{profile?.email || user?.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Rolle</div>
                    <div className="mt-1 text-white">{profile?.role === "admin" ? "Admin" : "Nutzer"}</div>
                  </div>
                </div>
                <button className="button-lift justify-self-start rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60" onClick={handleProfileSave} disabled={profileState.status === "loading"}>
                  {profileState.status === "loading" ? "Speichert..." : "Profil speichern"}
                </button>
                {profileState.message ? <div className={`text-xs ${profileState.status === "error" ? "text-red-200" : "text-emerald-200"}`}>{profileState.message}</div> : null}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-slate-300">
                Nach dem Login erscheint hier dein Profil mit Rolle, Aktivität und Feedback-Historie.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Beta Feedback</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Rückmeldungen</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {account?.feedback.length || 0} Einträge
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {isLoggedIn && account?.feedback.length ? (
                account.feedback.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-2.5 py-1 text-sky-100">
                        {feedbackTypeLabel(item.feedback_type || item.category)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-slate-300">
                        {statusLabel(item.status)}
                      </span>
                      <span className="text-slate-500">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-100">{item.message}</p>
                    <div className="mt-2 text-xs text-slate-500">{item.page_path || item.page_url || "Ohne Seitenkontext"}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-slate-300">
                  {isLoggedIn ? "Noch kein Feedback gespeichert." : "Logge dich ein, damit Feedback eindeutig deinem Account zugeordnet wird."}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Alpivo DNA</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Dein Match-Profil</h2>
              </div>
              <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/quiz">
                Match anpassen
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {preferenceSignals.map((signal) => (
                <PreferenceBar key={signal.label} label={signal.label} value={signal.value} />
              ))}
            </div>
            <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-500">Budget</div>
                <div className="mt-1 text-white">{formatBudget(prefs)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Profil</div>
                <div className="mt-1 text-white">{tripStyleLabel(displayPrefs.tripStyle)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Reisezeit</div>
                <div className="mt-1 text-white">{formatShortDate(displayPrefs.tripStartDate)} - {formatShortDate(displayPrefs.tripEndDate)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Personen</div>
                <div className="mt-1 text-white">{displayPrefs.peopleCount || 2}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Letzte Ergebnisse</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Top-Matches</h2>
              </div>
              <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/results">
                Ergebnisse öffnen
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {topResults.length ? (
                topResults.map((result, index) => (
                  <Link key={result.id} href={`/resort/${encodeURIComponent(result.slug)}`} className="rounded-xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-sky-200/30 hover:bg-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">#{index + 1}</div>
                        <div className="font-semibold text-white">{result.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {result.country}
                          {result.region ? ` · ${result.region}` : ""}
                          {result.pisteKm ? ` · ${number.format(result.pisteKm)} km` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-white">{result.matchPct}%</div>
                        <div className="text-xs text-slate-400">{result.tripStyleHint}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs leading-5 text-slate-300">{result.reasons?.[0] ?? "Passender Kandidat für dein Profil."}</div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-slate-300">
                  Noch keine Ergebnisse gespeichert. Starte den Match, damit hier echte Empfehlungen auftauchen.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nächste Schritte</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ski-Trip weiter planen</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionLink href="/quiz" title="Match starten" text="Budget, Fahrstil und Anreise neu gewichten." />
            <ActionLink href="/trips" title="Gruppentrips" text="Verfügbarkeiten, Favoriten und Kosten planen." />
            <ActionLink href="/checklist" title="Checkliste" text="Packliste und Vorbereitung abhaken." />
            <ActionLink href="/map" title="Karte" text="Resorts räumlich vergleichen." />
          </div>
        </GlassCard>
      </Section>
    </div>
  );
}
