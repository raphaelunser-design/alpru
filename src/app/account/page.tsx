"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import GlassCard from "@/components/GlassCard";
import ScoreRing from "@/components/ScoreRing";
import AppShell from "@/components/premium/AppShell";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import TrustPoint from "@/components/premium/TrustPoint";
import { getAlpivoTopMatches } from "@/data/resorts";
import { isOwnerAdminEmail } from "@/lib/adminShared";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
import { buildMatchPayload, buildResortQuery, MATCH_PREF_DEFAULTS } from "@/lib/matching/matchPayload";
import { supabase } from "@/lib/supabase";
import { getChecklistReadiness, type ChecklistReadinessState } from "@/lib/tripState";
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
  preferences: {
    preferences: Partial<StoredPrefs> | null;
    filters: Record<string, unknown> | null;
    exclusions: { lastResults?: ResortDecision[]; lastExcludedCount?: number } | null;
    updated_at: string | null;
  } | null;
  user: {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  };
  feedback: FeedbackRow[];
  error?: string;
};

type AccountUser = AccountPayload["user"];

type AccountPatchResponse = {
  profile?: Profile | null;
  preferences?: AccountPayload["preferences"];
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
  tripStyle: MATCH_PREF_DEFAULTS.tripStyle,
  budgetMin: MATCH_PREF_DEFAULTS.budgetMin,
  budgetMax: MATCH_PREF_DEFAULTS.budgetMax,
  peopleCount: MATCH_PREF_DEFAULTS.peopleCount,
  tripStartDate: MATCH_PREF_DEFAULTS.tripStartDate,
  tripEndDate: MATCH_PREF_DEFAULTS.tripEndDate,
  apres: MATCH_PREF_DEFAULTS.apres,
  emptySlopes: MATCH_PREF_DEFAULTS.emptySlopes,
  snowReliability: MATCH_PREF_DEFAULTS.snowReliability,
  valueForMoney: MATCH_PREF_DEFAULTS.valueForMoney,
  family: MATCH_PREF_DEFAULTS.family,
  panorama: MATCH_PREF_DEFAULTS.panorama,
  summerGlacier: MATCH_PREF_DEFAULTS.summerGlacier,
  rentalMode: MATCH_PREF_DEFAULTS.rentalMode,
  travelMode: MATCH_PREF_DEFAULTS.travelMode,
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

function computeReadinessScore(prefs: StoredPrefs | null, resultCount: number, isLoggedIn: boolean) {
  if (!prefs) return isLoggedIn ? 35 : 18;
  let score = isLoggedIn ? 24 : 12;
  if (prefs.budgetMin || prefs.budgetMax) score += 16;
  if (prefs.tripStartDate && prefs.tripEndDate) score += 16;
  if (prefs.peopleCount > 0) score += 10;
  if (prefs.apres + prefs.snowReliability + prefs.valueForMoney + prefs.family + prefs.panorama > 0) score += 20;
  if (resultCount > 0) score += 14;
  return Math.max(0, Math.min(100, score));
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

function readStoredJson(key: string, storage: Storage) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function compactAccountResults(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).map((result) => {
    const row = result && typeof result === "object" ? (result as Partial<ResortDecision>) : {};
    return {
      id: String(row.id || ""),
      slug: String(row.slug || ""),
      name: String(row.name || ""),
      country: String(row.country || ""),
      region: typeof row.region === "string" ? row.region : null,
      matchPct: Number.isFinite(Number(row.matchPct)) ? Number(row.matchPct) : 0,
      budgetStatus: typeof row.budgetStatus === "string" ? row.budgetStatus : null,
      tripStyleHint: typeof row.tripStyleHint === "string" ? row.tripStyleHint : null,
      pisteKm: Number.isFinite(Number(row.pisteKm)) ? Number(row.pisteKm) : null,
      reasons: Array.isArray(row.reasons) ? row.reasons.filter((item): item is string => typeof item === "string").slice(0, 3) : [],
    };
  }).filter((result) => result.id && result.slug && result.name);
}

function demoAccountResults(): ResortDecision[] {
  return getAlpivoTopMatches().slice(0, 3).map((resort) => ({
    id: resort.slug,
    slug: resort.slug,
    name: resort.name,
    country: resort.country,
    region: resort.region,
    matchPct: resort.score,
    budgetStatus: "green",
    tripStyleHint: resort.vibeLabel,
    pisteKm: Number(resort.pisteKm.match(/\d+/)?.[0] ?? 0),
    reasons: resort.reasons,
  })) as ResortDecision[];
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <MetricChip icon="data" value={value} label={`${label} · ${hint}`} variant="glass" />
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

function DnaRadar({ prefs }: { prefs: StoredPrefs }) {
  const axes = [
    { label: "Schnee", value: prefs.snowReliability },
    { label: "Budget", value: prefs.valueForMoney },
    { label: "Après", value: prefs.apres },
    { label: "Anreise", value: prefs.travelMode === "car" ? 4 : 3 },
    { label: "Ruhe", value: prefs.emptySlopes },
    { label: "Panorama", value: prefs.panorama },
  ];
  const center = 110;
  const radius = 76;
  const points = axes
    .map((axis, index) => {
      const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
      const distance = radius * (Math.max(0, Math.min(5, axis.value || 0)) / 5);
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");
  const grid = [0.35, 0.68, 1].map((scale) =>
    axes
      .map((_, index) => {
        const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
        return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
      })
      .join(" ")
  );

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/44 p-4">
      <svg viewBox="0 0 220 220" className="mx-auto h-56 w-full max-w-72" role="img" aria-label="Alpivo DNA Radar">
        {grid.map((polygon) => (
          <polygon key={polygon} points={polygon} fill="none" stroke="rgba(226,232,240,0.16)" strokeWidth="1" />
        ))}
        {axes.map((axis, index) => {
          const angle = -Math.PI / 2 + (index / axes.length) * Math.PI * 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          const labelX = center + Math.cos(angle) * (radius + 18);
          const labelY = center + Math.sin(angle) * (radius + 18);
          return (
            <g key={axis.label}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(226,232,240,0.16)" strokeWidth="1" />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="fill-slate-300 text-[10px] font-bold">
                {axis.label}
              </text>
            </g>
          );
        })}
        <polygon points={points} fill="rgba(110,231,183,0.28)" stroke="#6ee7b7" strokeWidth="2" />
        {points.split(" ").map((point) => {
          const [x, y] = point.split(",");
          return <circle key={point} cx={x} cy={y} r="3.5" fill="#7dd3fc" />;
        })}
      </svg>
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

const accountBenefits = [
  "Alpivo DNA speichern",
  "letzte Matches sichern",
  "Favoriten speichern",
  "Bewertungen abgeben",
  "Gruppentrips verwalten",
];

function sessionUserFromSession(session: Session | null): AccountUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    created_at: session.user.created_at ?? null,
    last_sign_in_at: session.user.last_sign_in_at ?? null,
  };
}

export default function AccountPage() {
  const accountRequestRef = useRef(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [mode, setMode] = useState<AccessMode>("signin");
  const [authState, setAuthState] = useState<AuthState>({ status: "idle", message: "" });
  const [helperState, setHelperState] = useState<AuthState>({ status: "idle", message: "" });
  const [profileState, setProfileState] = useState<AuthState>({ status: "idle", message: "" });
  const [accountSaveState, setAccountSaveState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryState, setRecoveryState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [sessionUser, setSessionUser] = useState<AccountUser | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [prefs, setPrefs] = useState<StoredPrefs | null>(null);
  const [results, setResults] = useState<ResortDecision[]>([]);
  const [checklistReadiness, setChecklistReadinessState] = useState<ChecklistReadinessState | null>(null);

  async function authHeaders(token?: string | null): Promise<Record<string, string>> {
    if (token) return { Authorization: `Bearer ${token}` };
    const { data } = await supabase.auth.getSession();
    const sessionToken = data.session?.access_token ?? "";
    return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
  }

  function applySessionShell(session: Session | null) {
    const nextUser = sessionUserFromSession(session);
    setSessionUser(nextUser);
    if (session?.user?.email) setEmail((current) => current || session.user.email || "");
    if (nextUser && !displayNameInput) setDisplayNameInput(nextUser.email?.split("@")[0] || "");
  }

  async function loadAccount(token?: string | null, options: { showSpinner?: boolean } = {}) {
    const requestId = accountRequestRef.current + 1;
    accountRequestRef.current = requestId;
    const showSpinner = options.showSpinner ?? true;
    if (showSpinner) setAccountLoading(true);

    try {
      const headers = await authHeaders(token);
      if (requestId !== accountRequestRef.current) return null;
      if (!headers.Authorization) {
        setAccount(null);
        setSessionUser(null);
        setAccountLoading(false);
        return null;
      }

      const { response, body } = await fetchJsonWithTimeout<AccountPayload>("/api/account/profile", { headers, cache: "no-store" }, 12000);
      if (requestId !== accountRequestRef.current) return null;
      if (!response.ok || !body) {
        setAccount(null);
        setAccountLoading(false);
        return null;
      }

      setAccount(body);
      setSessionUser(body.user);
      if (body.preferences?.preferences) {
        setPrefs({ ...defaultPrefs, ...body.preferences.preferences });
      }
      if (body.preferences?.exclusions?.lastResults?.length) {
        setResults(body.preferences.exclusions.lastResults);
      }
      setDisplayNameInput(body.profile?.display_name || body.user.email?.split("@")[0] || "");
      setEmail((current) => current || body.user.email || "");
      setAccountLoading(false);

      return body;
    } catch (error) {
      if (requestId === accountRequestRef.current) {
        setAccount(null);
        setAccountLoading(false);
        setHelperState({
          status: "error",
          message: error instanceof Error ? error.message : "Konto konnte nicht geladen werden.",
        });
      }
      return null;
    }
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
        const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          setHelperState({ status: "error", message: error.message });
          setAccountLoading(false);
          return;
        }
        applySessionShell(data.session);
      }

      if (!mounted) return;
      const { data } = await supabase.auth.getSession();
      applySessionShell(data.session);
      const loaded = await loadAccount(data.session?.access_token ?? null);
      if (searchAuth === "magic" && loaded) {
        setHelperState({ status: "success", message: "Magic-Link bestätigt. Du bist jetzt in Alpivo eingeloggt." });
      }
      if (authCode || searchAuth === "magic") cleanAuthUrl();
    }

    initializeAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      applySessionShell(session);
      if (event === "PASSWORD_RECOVERY") {
        setShowRecoveryForm(true);
        setRecoveryState({ status: "success", message: "Passwort-Reset aktiv. Lege jetzt dein neues Alpivo-Passwort fest." });
        void loadAccount(session?.access_token ?? null, { showSpinner: false });
        return;
      }
      if (event === "SIGNED_OUT") {
        accountRequestRef.current += 1;
        setAccount(null);
        setSessionUser(null);
        setAccountLoading(false);
      }
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

    const syncReadiness = () => setChecklistReadinessState(getChecklistReadiness());
    syncReadiness();
    window.addEventListener("alpivo-local-state-change", syncReadiness);
    return () => window.removeEventListener("alpivo-local-state-change", syncReadiness);
  }, []);

  async function handleSignIn() {
    setAuthState({ status: "loading", message: "" });
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAuthState({ status: "error", message: error.message });
      return;
    }
    applySessionShell(data.session);
    setAuthState({ status: "success", message: "Erfolgreich angemeldet." });
    await loadAccount(data.session?.access_token ?? null);
  }

  async function handleSignUp() {
    setAuthState({ status: "loading", message: "" });
    const { data, error } = await supabase.auth.signUp({
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
    applySessionShell(data.session);
    setAuthState({
      status: "success",
      message: "Account erstellt. Falls Supabase E-Mail-Bestätigung verlangt, bestätige bitte den Link in deiner Mail.",
    });
    await loadAccount(data.session?.access_token ?? null);
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
    const { data } = await supabase.auth.getSession();
    applySessionShell(data.session);
    await loadAccount(data.session?.access_token ?? null);
  }

  async function handleProfileSave() {
    setProfileState({ status: "loading", message: "" });
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error("Bitte erneut einloggen, bevor du dein Profil speicherst.");
      const { response, body } = await fetchJsonWithTimeout<AccountPatchResponse>(
        "/api/account/profile",
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({ displayName: displayNameInput }),
        },
        12000
      );
      if (!response.ok) throw new Error(body?.error || "Profil konnte nicht gespeichert werden.");
      setAccount((current) => (current && body?.profile ? { ...current, profile: body.profile } : current));
      setProfileState({ status: "success", message: "Profil gespeichert." });
    } catch (error) {
      setProfileState({
        status: "error",
        message: error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.",
      });
    }
  }

  async function handleAccountSnapshotSave() {
    setAccountSaveState({ status: "loading", message: "" });
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error("Bitte erneut einloggen, bevor du deine Alpivo DNA speicherst.");

      const storedPrefs = readStoredJson("alpivo_quiz_prefs", window.localStorage);
      const localPrefs = storedPrefs ?? prefs ?? defaultPrefs;
      const localFilters = readStoredJson("alpivo_results_filters", window.localStorage) ?? {};
      const storedResults =
        readStoredJson("alpivo_results", window.localStorage) ??
        readStoredJson("ski_results", window.sessionStorage) ??
        results;
      const compactResults = compactAccountResults(storedResults);

      if (!storedPrefs && !prefs && compactResults.length === 0) {
        throw new Error("Es gibt noch keinen lokalen Match, der gespeichert werden kann.");
      }

      const preferences = buildMatchPayload(localPrefs);
      const filters = buildResortQuery(localFilters);
      const { response, body } = await fetchJsonWithTimeout<AccountPatchResponse>(
        "/api/account/profile",
        {
          method: "PATCH",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify({
            preferences,
            filters,
            exclusions: {
              lastResults: compactResults,
              lastExcludedCount: compactResults.length,
            },
          }),
        },
        15000
      );

      if (!response.ok) throw new Error(body?.error || "Alpivo DNA konnte nicht im Konto gespeichert werden.");
      setPrefs({ ...defaultPrefs, ...preferences });
      if (compactResults.length) setResults(compactResults as ResortDecision[]);
      setAccount((current) =>
        current
          ? {
              ...current,
              profile: body?.profile ?? current.profile,
              preferences: body?.preferences ?? current.preferences,
            }
          : current
      );
      setAccountSaveState({ status: "success", message: "Alpivo DNA und letzte Matches im Konto gespeichert." });
      await loadAccount(undefined, { showSpinner: false });
    } catch (error) {
      setAccountSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Alpivo DNA konnte nicht gespeichert werden.",
      });
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    accountRequestRef.current += 1;
    setAccount(null);
    setSessionUser(null);
    setAccountLoading(false);
    setAuthState({ status: "success", message: "Abgemeldet." });
  }

  const profile = account?.profile ?? null;
  const user = account?.user ?? sessionUser;
  const isLoggedIn = Boolean(user);
  const isAdmin = profile?.role === "admin" || isOwnerAdminEmail(user?.email);
  const displayPrefs = prefs ?? defaultPrefs;
  const demoResults = useMemo(() => demoAccountResults(), []);
  const topResults = useMemo(() => (results.length ? results : demoResults).slice(0, 3), [demoResults, results]);
  const isDemoTopResults = results.length === 0;
  const favorite = topResults[0];
  const readinessScore = checklistReadiness?.percent ?? computeReadinessScore(prefs, topResults.length, isLoggedIn);
  const greetingName = profile?.display_name || user?.email || "Alpivo Tester";
  const preferenceSignals = [
    { label: "Value", value: displayPrefs.valueForMoney },
    { label: "Schnee", value: displayPrefs.snowReliability },
    { label: "Ruhe", value: displayPrefs.emptySlopes },
    { label: "Après", value: displayPrefs.apres },
    { label: "Familie", value: displayPrefs.family },
    { label: "Gletscher", value: displayPrefs.summerGlacier },
  ];

  if (!accountLoading && !isLoggedIn) {
    return (
      <AppShell>
        <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
          <div className="mx-auto grid w-full max-w-[1480px] gap-6">
            <PageHeader
              eyebrow="Alpivo Cockpit"
              title="Dein Alpivo Cockpit."
              subtitle="Starte lokal als Gast oder logge dich ein, damit DNA, Feedback, Top-Matches und Trips dauerhaft zusammenbleiben."
              actions={
                <Link
                  href="/quiz"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                >
                  Match starten
                </Link>
              }
            />

          <section className="grid gap-4 md:grid-cols-3">
            <TrustPoint icon="shield" title="Gastmodus klar" text="Ohne Login bleibt dein Match lokal in diesem Browser." />
            <TrustPoint icon="data" title="Speichern nach Login" text="Mit Konto werden DNA, Feedback und Top-Matches deinem Profil zugeordnet." />
            <TrustPoint icon="lock" title="Keine leeren Werte" text="Offene Bereiche erscheinen als klare Empty States statt als technische Platzhalter." />
          </section>

          <GlassCard className="p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Gastmodus</p>
                <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                  Match starten, speichern, später weiterplanen.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Ohne Login bleibt dein Match lokal im Browser. Mit Konto werden DNA, Feedback und Top-Matches deinem Profil zugeordnet.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <ActionLink href="/quiz" title="Match speichern" text="Starte den Match und sichere ihn danach im Konto." />
                  <ActionLink href="/trips" title="Freunde einladen" text="Plane Gruppentrips, sobald dein Board aktiv ist." />
                  <ActionLink href="/feedback" title="Feedback geben" text="Melde Bugs, Design-Hinweise oder fehlende Daten." />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
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
                  <button className="justify-self-start text-xs font-medium text-sky-100 transition hover:text-white" onClick={handlePasswordResetEmail} type="button">
                    Passwort vergessen? Reset-Link senden
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1480px] gap-6">
          <PageHeader
            eyebrow="Alpivo Cockpit"
            title={isLoggedIn ? `Willkommen, ${greetingName}.` : "Dein Alpivo Cockpit."}
            subtitle="Profil, Feedback, Ski-DNA, Top-Matches und nächste Schritte an einem ruhigen Ort."
            actions={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quiz"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                >
                  Match starten
                </Link>
                <Link
                  href="/checklist"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.065] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  Checkliste
                </Link>
              </div>
            }
          />

          <section className="grid gap-4 lg:grid-cols-4">
            <MetricChip icon="shield" value={isLoggedIn ? profile?.role === "admin" ? "Admin" : "Beta Nutzer" : "Gast"} label="Status" variant="glass" />
            <MetricChip icon="data" value={`${topResults.length}`} label={isDemoTopResults ? "Eure Top-Matches" : "gespeicherte Top-Matches"} variant="glass" />
            <MetricChip icon="vibe" value={tripStyleLabel(displayPrefs.tripStyle)} label="Alpivo DNA" variant="glass" />
            <MetricChip icon="time" value={formatShortDate(displayPrefs.tripStartDate)} label="nächster Zeitraum" variant="glass" />
          </section>

        {!accountLoading && !isLoggedIn ? (
          <GlassCard className="p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Warum ein Konto?</p>
                <h2 className="mt-3 max-w-[19.5rem] text-2xl font-semibold text-white sm:max-w-2xl md:text-3xl">
                  Dein persönliches Ski-Trip-Cockpit.
                </h2>
                <p className="mt-3 max-w-[19.5rem] text-sm leading-7 text-slate-300 sm:max-w-2xl">
                  Ohne Konto funktioniert der Match lokal. Mit Konto bleiben Profil, Favoriten, Matches und Gruppentrips verfügbar.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {accountBenefits.map((benefit) => (
                  <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-3 text-sm font-semibold text-white">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Accountstatus</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {accountLoading && isLoggedIn ? "Konto wird geladen" : accountLoading ? "Gast-Cockpit wird geöffnet" : isLoggedIn ? "Eingeloggt und bereit" : "Dein Cockpit wartet"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {isLoggedIn
                    ? "Danke, dass du Alpivo testest. Deine Feedbacks und Aktivitäten werden deinem Konto zugeordnet."
                    : "Als Gast nutzt du dein Cockpit lokal auf diesem Gerät. Mit Login bleiben Matches, Favoriten und Trips dauerhaft gespeichert."}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/72 p-2 shadow-[0_18px_54px_rgba(2,6,23,0.24)]">
                  <ScoreRing value={readinessScore} size="sm" label="Readiness" />
                </div>
                {isAdmin ? (
                  <span className="rounded-xl border border-sky-200/25 bg-sky-200/12 px-4 py-2 text-sm font-semibold text-sky-100">
                    Admin-Berechtigung
                  </span>
                ) : null}
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="button-lift rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                  >
                    Zum Adminbereich
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

            {isLoggedIn ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Rolle" value={profile?.role === "admin" ? "Admin" : "Beta Nutzer"} hint="Rechte in Alpivo" />
                <StatCard label="Erstellt" value={formatShortDate(profile?.created_at || user?.created_at)} hint="Account-Anlage" />
                <StatCard label="Aktivität" value={formatDate(profile?.last_seen_at || user?.last_sign_in_at, "Noch offen")} hint="Letzter bekannter Kontakt" />
                <StatCard label="Top-Match" value={favorite ? `${favorite.matchPct}%` : "Noch offen"} hint={favorite?.name ?? "Starte zuerst einen Match"} />
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ActionLink href="/quiz" title="Match starten" text="Erstelle dein erstes persönliches Alpivo Ergebnis." />
                <ActionLink href="/trips" title="Tripboard ansehen" text="Sieh, wie Gruppentrips später organisiert werden." />
                <ActionLink href="/feedback" title="Feedback geben" text="Melde Bugs, Design-Hinweise oder fehlende Daten." />
              </div>
            )}
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

            {isLoggedIn ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Aktive Sitzung</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Du bist angemeldet</h3>
                <p className="mt-2 break-all text-sm text-slate-300">{user?.email || "E-Mail wird geladen"}</p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {accountLoading ? "Profil, Feedback und gespeicherte Match-Daten laden im Hintergrund." : "Profil und Kontoübersicht sind verfügbar."}
                </p>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="mt-4 inline-flex rounded-xl border border-sky-200/25 bg-sky-200/12 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-200/18"
                  >
                    Zum Adminbereich
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
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
                  <button className="justify-self-start text-xs font-medium text-sky-100 transition hover:text-white" onClick={handlePasswordResetEmail} type="button">
                    Passwort vergessen? Reset-Link senden
                  </button>
                </div>
              </>
            )}
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
                    <div className="mt-1 text-white">{isAdmin ? "Admin" : "Nutzer"}</div>
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
              <div className="flex flex-wrap gap-2">
                {isLoggedIn ? (
                  <button
                    className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                    type="button"
                    onClick={handleAccountSnapshotSave}
                    disabled={accountSaveState.status === "loading"}
                  >
                    {accountSaveState.status === "loading" ? "Speichert..." : "DNA speichern"}
                  </button>
                ) : null}
                <Link className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/quiz">
                  Match anpassen
                </Link>
              </div>
            </div>
            {accountSaveState.message ? (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  accountSaveState.status === "error"
                    ? "border-red-300/30 bg-red-500/10 text-red-200"
                    : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                }`}
              >
                {accountSaveState.message}
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <DnaRadar prefs={displayPrefs} />
              <div className="grid gap-3">
                {preferenceSignals.map((signal) => (
                  <PreferenceBar key={signal.label} label={signal.label} value={signal.value} />
                ))}
              </div>
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
                <h2 className="mt-2 text-xl font-semibold text-white">{isDemoTopResults ? "Eure Top-Matches" : "Deine Top-Matches"}</h2>
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
                  Noch keine Matches im Cockpit. Starte den Match, damit hier echte Empfehlungen auftauchen.
                </div>
              )}
              {isDemoTopResults ? (
                <div className="rounded-xl border border-sky-200/15 bg-sky-200/[0.08] px-4 py-3 text-xs leading-5 text-sky-50">
                  Startpunkt: Diese Empfehlungen kommen aus dem zentralen Alpivo Pilotdatensatz. Nach einem Wizard-Match werden deine lokalen Ergebnisse hier ersetzt.
                </div>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nächste Schritte</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ski-Trip weiter planen</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionLink href="/quiz" title="Match starten" text="Budget, Fahrstil und Anreise neu gewichten." />
            <ActionLink href="/trips" title="Gruppentrips" text="Verfügbarkeiten, Favoriten und Kosten planen." />
            <ActionLink
              href="/checklist"
              title="Checkliste"
              text={
                checklistReadiness
                  ? `${checklistReadiness.completed}/${checklistReadiness.total} erledigt, naechster Schritt: ${checklistReadiness.nextTask}`
                  : "Packliste und Vorbereitung abhaken."
              }
            />
            <ActionLink href="/map" title="Karte" text="Resorts räumlich vergleichen." />
          </div>
        </GlassCard>
        </div>
      </main>
    </AppShell>
  );
}
