"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type RatingRow = {
  resort_slug: string;
  rating: number | null;
  updated_at: string | null;
};

const number = new Intl.NumberFormat("de-DE");
const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

function formatDate(value: string | null | undefined) {
  if (!value) return "Noch offen";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Noch offen";
  return dateFormatter.format(date);
}

function formatBudget(prefs: StoredPrefs | null) {
  if (!prefs.budgetMin && !prefs.budgetMax) return "Nicht gesetzt";
  const min = prefs.budgetMin ?? 0;
  const max = prefs.budgetMax ?? prefs.budgetMin ?? 0;
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
  return "Balanced";
}

function signalLabel(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "offen";
  if (value >= 5) return "max";
  if (value >= 4) return "hoch";
  if (value >= 2) return "mittel";
  return "egal";
}

function travelModeLabel(value: StoredPrefs["travelMode"]) {
  if (value === "train") return "Zug";
  if (value === "bus") return "Bus";
  if (value === "flight") return "Flug";
  return "Auto";
}

function rentalModeLabel(value: StoredPrefs["rentalMode"]) {
  if (value === "rent") return "Leihe vor Ort";
  return "Eigene Ausrüstung";
}

function pct(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round((value / 5) * 100)));
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

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </div>
  );
}

function ActionLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200/30 hover:bg-white/10"
    >
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-slate-400">{text}</div>
    </Link>
  );
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AccessMode>("signin");
  const [authState, setAuthState] = useState<AuthState>({ status: "idle", message: "" });
  const [helperState, setHelperState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryState, setRecoveryState] = useState<AuthState>({ status: "idle", message: "" });
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<StoredPrefs | null>(null);
  const [results, setResults] = useState<ResortDecision[]>([]);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [ratingsError, setRatingsError] = useState("");

  const getRedirectUrl = (authMode: "magic" | "recovery") => {
    if (typeof window === "undefined") return undefined;
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("auth", authMode);
    return url.toString();
  };

  const cleanAuthUrl = () => {
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

    if (changed) {
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const searchAuth = searchParams?.get("auth") ?? null;
      const authCode = searchParams?.get("code") ?? null;
      const authError = searchParams?.get("error_description") ?? searchParams?.get("error") ?? null;
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const recoveryHint = searchAuth === "recovery" || hash.includes("type=recovery");

      if (authError) {
        const message = authError.replace(/\+/g, " ");
        if (recoveryHint) {
          setShowRecoveryForm(true);
          setRecoveryState({
            status: "error",
            message: `Reset-Link konnte nicht bestätigt werden: ${message}`,
          });
        } else {
          setHelperState({ status: "error", message });
        }
        return;
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
        if (!mounted) return;
        if (error) {
          if (recoveryHint) {
            setShowRecoveryForm(true);
            setRecoveryState({
              status: "error",
              message: `Reset-Link konnte nicht bestätigt werden: ${error.message}`,
            });
          } else {
            setHelperState({ status: "error", message: error.message });
          }
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUserEmail(data.session?.user?.email ?? null);
      setUserId(data.session?.user?.id ?? null);
      if (data.session.user.email && !email) {
        setEmail(data.session.user.email);
      }
      if (recoveryHint && !data.session.user) {
        setRecoveryState({
          status: "error",
          message: "Der Reset-Link ist abgelaufen oder wurde nicht vollständig bestätigt. Fordere bitte einen neuen Link an.",
        });
      }
      if (searchAuth === "magic" && data.session.user) {
        setHelperState({ status: "success", message: "Magic-Link bestätigt. Du bist jetzt in Alpivo eingeloggt." });
      }
      if (authCode || searchAuth === "magic") {
        cleanAuthUrl();
      }
    };

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session.user?.email ?? null);
      setUserId(session.user?.id ?? null);
      if (session.user.email) {
        setEmail((current) => current || session.user.email || "");
      }
      if (event === "PASSWORD_RECOVERY") {
        setShowRecoveryForm(true);
        setRecoveryState({
          status: "success",
          message: "Passwort-Reset aktiv. Lege jetzt dein neues Alpivo-Passwort fest.",
        });
      }
      if (event === "SIGNED_IN" && typeof window !== "undefined") {
        const authHint = new URLSearchParams(window.location.search).get("auth");
        if (authHint === "magic") {
          setHelperState({ status: "success", message: "Magic-Link bestätigt. Du bist jetzt in Alpivo eingeloggt." });
          cleanAuthUrl();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
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

  useEffect(() => {
    if (!userId) {
      setRatings([]);
      setRatingsError("");
      return;
    }

    supabase
      .from("resort_ratings")
      .select("resort_slug,rating,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (error) {
          setRatingsError(error.message);
          setRatings([]);
          return;
        }
        setRatings((data ?? []) as RatingRow[]);
        setRatingsError("");
      });
  }, [userId]);

  const handleSignIn = async () => {
    setAuthState({ status: "loading", message: "" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthState({ status: "error", message: error.message });
      return;
    }
    setAuthState({ status: "success", message: "Erfolgreich angemeldet." });
  };

  const handleSignUp = async () => {
    setAuthState({ status: "loading", message: "" });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthState({ status: "error", message: error.message });
      return;
    }
    setAuthState({
      status: "success",
      message: "Account erstellt. Bitte E-Mail bestätigen, falls erforderlich.",
    });
  };

  const handleMagicLink = async () => {
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
  };

  const handlePasswordResetEmail = async () => {
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
  };

  const handlePasswordUpdate = async () => {
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
    setRecoveryState({
      status: "success",
      message: "Dein Alpivo-Passwort wurde aktualisiert. Du kannst dich damit direkt anmelden.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthState({ status: "success", message: "Abgemeldet." });
  };

  const topResults = useMemo(() => results.slice(0, 3), [results]);
  const favorite = topResults[0];
  const preferenceSignals = [
    { label: "Value", value: prefs.valueForMoney },
    { label: "Schnee", value: prefs.snowReliability },
    { label: "Ruhe", value: prefs.emptySlopes },
    { label: "Après", value: prefs.apres },
    { label: "Familie", value: prefs.family },
    { label: "Gletscher", value: prefs.summerGlacier },
  ];

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[320px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[300px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Konto</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-5xl">
              Dein Alpivo Cockpit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              Profil, Match-Verlauf, Bewertungen und die nächsten sinnvollen Schritte für deinen Ski-Trip.
            </p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Status</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {userEmail ? "Angemeldet" : "Noch nicht angemeldet"}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  {userEmail
                    `Du bist als ${userEmail} eingeloggt. Deine lokalen Match-Daten sind auf diesem Gerät verfügbar.`
                    : "Melde dich an, damit Bewertungen und spätere Speicherfunktionen sauber deinem Profil zugeordnet werden."}
                </p>
              </div>
              {userEmail ? (
                <button
                  className="button-lift rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={handleSignOut}
                >
                  Abmelden
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Aktuelles Profil"
                value={tripStyleLabel(prefs.tripStyle)}
                hint={prefs "Aus deinem letzten Match" : "Noch kein Match gestartet"}
              />
              <StatCard label="Budget" value={formatBudget(prefs)} hint="Pro Person, geschätzt" />
              <StatCard
                label="Top-Match"
                value={favorite `${favorite.matchPct}%` : "-"}
                hint={favorite.name "Noch keine Ergebnisse"}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            {showRecoveryForm (
              <div className="mb-5 rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Passwort neu setzen</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Neues Alpivo-Passwort vergeben</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Du bist über den Reset-Link drin. Vergib hier direkt ein neues Passwort für dein Konto.
                </p>

                <div className="mt-4 grid gap-3 text-sm">
                  <label className="grid gap-2 text-slate-300">
                    Neues Passwort
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                      type="password"
                      value={recoveryPassword}
                      onChange={(event) => setRecoveryPassword(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-slate-300">
                    Passwort wiederholen
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                      type="password"
                      value={recoveryPasswordConfirm}
                      onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
                    />
                  </label>

                  <button
                    className="button-lift rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                    onClick={handlePasswordUpdate}
                    disabled={recoveryState.status === "loading"}
                  >
                    {recoveryState.status === "loading" "Bitte warten..." : "Neues Passwort speichern"}
                  </button>

                  {recoveryState.message (
                    <div
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        recoveryState.status === "error"
                          "border-red-300/30 bg-red-500/10 text-red-200"
                          : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      }`}
                    >
                      {recoveryState.message}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <button
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin" "bg-sky-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
                onClick={() => setMode("signin")}
              >
                Login
              </button>
              <button
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup" "bg-sky-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
                onClick={() => setMode("signup")}
              >
                Registrieren
              </button>
              <button
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "magic" "bg-sky-200 text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
                onClick={() => setMode("magic")}
              >
                Magic Link
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <label className="grid gap-2 text-slate-300">
                E-Mail
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {mode !== "magic" (
                <label className="grid gap-2 text-slate-300">
                  Passwort
                  <input
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.05] p-4 text-xs text-slate-300">
                  Du bekommst einen sicheren Login-Link per E-Mail. Damit kommst du direkt in Alpivo rein, ohne ein Passwort
                  eingeben zu muessen.
                </div>
              )}

              <button
                className="button-lift rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                onClick={mode === "signin" handleSignIn : mode === "signup" handleSignUp : handleMagicLink}
                disabled={authState.status === "loading" || helperState.status === "loading"}
              >
                {authState.status === "loading" || helperState.status === "loading"
                  "Bitte warten..."
                  : mode === "signin"
                    "Einloggen"
                    : mode === "signup"
                      "Account erstellen"
                      : "Magic-Link senden"}
              </button>

              {authState.message (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    authState.status === "error"
                      "border-red-300/30 bg-red-500/10 text-red-200"
                      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  {authState.message}
                </div>
              ) : null}

              {helperState.message (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    helperState.status === "error"
                      "border-red-300/30 bg-red-500/10 text-red-200"
                      : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                  }`}
                >
                  {helperState.message}
                </div>
              ) : null}

              {!userEmail (
                <button
                  className="justify-self-start text-xs font-medium text-sky-100 transition hover:text-white"
                  onClick={handlePasswordResetEmail}
                  type="button"
                >
                  Passwort vergessenReset-Link für Alpivo senden
                </button>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Match-Profil</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Alpivo DNA</h2>
              </div>
              <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/quiz">
                Match anpassen
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {preferenceSignals.map((signal) => (
                <PreferenceBar key={signal.label} label={signal.label} value={signal.value} />
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="text-xs text-slate-400">Reisezeit</div>
                <div className="mt-1 text-white">
                  {formatDate(prefs.tripStartDate)} - {formatDate(prefs.tripEndDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Personen</div>
                <div className="mt-1 text-white">{prefs.peopleCount 2}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Material</div>
                <div className="mt-1 text-white">{rentalModeLabel(prefs.rentalMode)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Anreise</div>
                <div className="mt-1 text-white">{travelModeLabel(prefs.travelMode)}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Letzte Ergebnisse</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Deine Top-Matches</h2>
              </div>
              <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/results">
                Ergebnisse öffnen
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {topResults.length > 0 (
                topResults.map((result, index) => (
                  <Link
                    key={result.id}
                    href={`/resort/${encodeURIComponent(result.slug)}`}
                    className="rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-sky-200/30 hover:bg-white/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">#{index + 1}</div>
                        <div className="font-semibold text-white">{result.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {result.country}
                          {result.region ` · ${result.region}` : ""}
                          {result.pisteKm ` · ${number.format(result.pisteKm)} km` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-white">{result.matchPct}%</div>
                        <div className="text-xs text-slate-400">{result.tripStyleHint}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-300">{result.reasons.[0] "Passender Kandidat für dein Profil."}</div>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 text-sm text-slate-300">
                  Noch keine Ergebnisse gespeichert. Starte den Match, damit hier echte Empfehlungen auftauchen.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nächste Schritte</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Trip weiter planen</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ActionLink href="/quiz" title="Match neu berechnen" text="Profil, Budget, Gletscher und Fahrzeit anpassen." />
              <ActionLink href="/trips" title="Gruppentrips" text="Verfügbarkeiten, Resort-Favoriten und Gruppenkosten planen." />
              <ActionLink href="/checklist" title="Packliste öffnen" text="Vorbereitung für Skipass, Ausrüstung und Anreise." />
              <ActionLink href="/map" title="Resorts auf Karte sehen" text="Geografisch prüfen, was wirklich sinnvoll liegt." />
              <ActionLink href="/resorts" title="Resort-Bibliothek" text="Alle Gebiete nach Stil, Schnee und Budget durchgehen." />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Bewertungen</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Deine Resort-Stimmen</h2>
            {ratingsError <div className="mt-4 text-sm text-red-200">{ratingsError}</div> : null}
            <div className="mt-5 grid gap-3">
              {userEmail ? (
                ratings.length > 0 (
                  ratings.map((rating) => (
                    <Link
                      key={`${rating.resort_slug}-${rating.updated_at ""}`}
                      href={`/resort/${encodeURIComponent(rating.resort_slug)}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm hover:bg-white/10"
                    >
                      <span className="text-slate-200">{rating.resort_slug}</span>
                      <span className="font-semibold text-white">{rating.rating "-"} / 10</span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
                    Noch keine Bewertungen. Öffne ein Resort und gib deine Einschätzung ab.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
                  Melde dich an, um Bewertungen deinem Konto zuzuordnen.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </Section>
    </div>
  );
}
