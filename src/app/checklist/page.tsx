"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";

type TravelMode = "car" | "train" | "bus" | "flight";
type TripType = "day" | "overnight";
type RentalMode = "own" | "rent";

type ChecklistSettings = {
  rental: RentalMode;
  travel: TravelMode;
  tripType: TripType;
};

type LocalChecklistItem = {
  id: string;
  label: string;
  detail: string;
};

type ChecklistState = {
  settings: ChecklistSettings;
  checked: Record<string, boolean>;
  customItems: LocalChecklistItem[];
  deletedDefaultKeys: Record<string, boolean>;
  renamedDefaults: Record<string, string>;
};

type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
};

type ChecklistSection = {
  title: string;
  kicker: string;
  items: ChecklistItem[];
};

type ChecklistDbRow = {
  id: string;
  trip_id: string | null;
  user_id: string;
  label: string;
  detail: string;
  is_checked: boolean;
  is_default: boolean;
  default_key: string | null;
  sort_order: number;
  is_deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type DisplayItem = {
  id: string;
  rowId: string | null;
  defaultKey: string | null;
  label: string;
  detail: string;
  isChecked: boolean;
  isDefault: boolean;
  isRemote: boolean;
};

const STORAGE_KEY = "pistematch_checklist_v2";

const DEFAULT_STATE: ChecklistState = {
  settings: {
    rental: "own",
    travel: "car",
    tripType: "day",
  },
  checked: {},
  customItems: [],
  deletedDefaultKeys: {},
  renamedDefaults: {},
};

const BASE_ITEMS: ChecklistItem[] = [
  { id: "base-pass", label: "Skipass / Ticket", detail: "Digital speichern und offline griffbereit haben." },
  { id: "base-id", label: "Ausweis / Reisepass", detail: "Wichtig für Verleih, Hotel und Notfall." },
  { id: "base-helmet", label: "Helm", detail: "Vor Abfahrt auf Sitz und Verschluss prüfen." },
  { id: "base-goggles", label: "Skibrille", detail: "Passendes Glas für Wetter und Sicht einpacken." },
  { id: "base-gloves", label: "Handschuhe", detail: "Trockenes Ersatzpaar lohnt sich bei Kälte." },
  { id: "base-jacket", label: "Skijacke + Hose", detail: "Wasserfest, warm und mit Taschen für Ticket." },
  { id: "base-layer", label: "Baselayer / Funktionswäsche", detail: "Atmungsaktiv, keine Baumwolle direkt auf der Haut." },
  { id: "base-socks", label: "Skisocken", detail: "Ein gutes Paar pro Skitag einplanen." },
  { id: "base-sunscreen", label: "Sonnenschutz + Lippenpflege", detail: "Auch bei Wolken durch Höhenlage relevant." },
  { id: "base-wallet", label: "Portemonnaie / Notfallkontakt", detail: "Karte, etwas Bargeld und ICE-Kontakt." },
  { id: "base-water", label: "Wasser + Snack", detail: "Kleine Energie-Reserve für Liftpausen." },
];

const RENTAL_ITEMS: ChecklistItem[] = [
  { id: "rental-booking", label: "Verleih reserviert", detail: "Bestätigung und Abholzeit speichern." },
  { id: "rental-id", label: "Ausweis für Verleih", detail: "Viele Shops brauchen ein Dokument als Sicherheit." },
  { id: "rental-insurance", label: "Versicherung geprüft", detail: "Kurz klären, ob Bruch/Diebstahl abgedeckt ist." },
];

const CAR_ITEMS: ChecklistItem[] = [
  { id: "car-winter-tires", label: "Winterreifen / Schneeketten", detail: "Gerade bei Schneefall und Passstraßen wichtig." },
  { id: "car-scraper", label: "Eiskratzer + Frostschutz", detail: "Morgens spart das echte Zeit." },
  { id: "car-parking", label: "Parkticket / Kleingeld", detail: "Park-App oder Bargeld vorab bereithalten." },
  { id: "car-charger", label: "Ladekabel / Powerbank", detail: "Navigation und Skipass-QR brauchen Akku." },
  { id: "car-route", label: "Route + Wetterlage", detail: "Stau, Sperren und Schneefall vor Abfahrt checken." },
];

const TRAIN_ITEMS: ChecklistItem[] = [
  { id: "train-tickets", label: "Zugtickets / Reservierung", detail: "Tickets offline speichern." },
  { id: "train-transfer", label: "Letzte Meile geplant", detail: "Bus, Taxi oder Shuttle vom Bahnhof." },
  { id: "train-luggage", label: "Ski-Gepäck organisiert", detail: "Board/Ski-Regeln der Bahn checken." },
  { id: "train-timing", label: "Abfahrtszeiten gespeichert", detail: "Rückfahrt und letzte Verbindung notieren." },
];

const BUS_ITEMS: ChecklistItem[] = [
  { id: "bus-tickets", label: "Bustickets / Reservierung", detail: "QR-Code und Haltestelle sichern." },
  { id: "bus-transfer", label: "Shuttle geplant", detail: "Letzte Meter bis Lift oder Unterkunft klären." },
  { id: "bus-luggage", label: "Gepäck-Regeln gecheckt", detail: "Ski/Board vorher anmelden, falls nötig." },
  { id: "bus-timing", label: "Abfahrtszeiten gespeichert", detail: "Rückfahrt nicht erst am Lift suchen." },
];

const FLIGHT_ITEMS: ChecklistItem[] = [
  { id: "flight-ticket", label: "Flugticket / Bordkarte", detail: "Boarding-Pass offline speichern." },
  { id: "flight-baggage", label: "Ski-Equipment gebucht", detail: "Sportgepäck muss oft separat angemeldet werden." },
  { id: "flight-transfer", label: "Airport-Transfer geplant", detail: "Shuttle, Mietwagen oder Bahnverbindung." },
  { id: "flight-docs", label: "Dokumente griffbereit", detail: "Ausweis, Buchungen und Notfallnummern." },
];

const OVERNIGHT_ITEMS: ChecklistItem[] = [
  { id: "overnight-booking", label: "Unterkunft bestätigt", detail: "Adresse, Check-in und Parkplatz sichern." },
  { id: "overnight-toiletries", label: "Hygiene-Set", detail: "Kompakt, aber mit Blasenpflaster." },
  { id: "overnight-charger", label: "Ladekabel / Adapter", detail: "Handy, Uhr, Kamera und Powerbank." },
  { id: "overnight-clothes", label: "Wechselkleidung", detail: "Trockenes Outfit für Abend und Heimreise." },
  { id: "overnight-sleep", label: "Schlafsachen", detail: "Auch bei kurzer Reise nicht vergessen." },
];

function readState(): ChecklistState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("pistematch_checklist_v1");
    const prefsRaw = window.localStorage.getItem("alpivo_quiz_prefs");
    const prefs = prefsRaw ? JSON.parse(prefsRaw) : null;

    const fallback: ChecklistSettings = {
      rental: prefs.rentalMode === "rent" || prefs.needRental ? "rent" : "own",
      travel:
        prefs.travelMode === "train" || prefs.travelMode === "bus" || prefs.travelMode === "flight"
          ? prefs.travelMode
          : "car",
      tripType: prefs.tripType === "weekend" ? "overnight" : "day",
    };

    if (!raw) return { ...DEFAULT_STATE, settings: fallback };

    const parsed = JSON.parse(raw);
    const parsedSettings = parsed.settings ?? {};
    return {
      settings: {
        rental: parsedSettings.rental ?? fallback.rental,
        travel: parsedSettings.travel ?? fallback.travel,
        tripType: parsedSettings.tripType ?? fallback.tripType,
      },
      checked: parsed.checked ?? {},
      customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
      deletedDefaultKeys: parsed.deletedDefaultKeys ?? {},
      renamedDefaults: parsed.renamedDefaults ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function createLocalStorageStore() {
  const listeners = new Set<() => void>();
  let currentState: ChecklistState = readState();

  const notify = () => listeners.forEach((listener) => listener());

  return {
    getSnapshot: () => currentState,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (typeof window === "undefined") return () => listeners.delete(listener);

      const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
          currentState = readState();
          notify();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    set: (value: ChecklistState) => {
      currentState = value;
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      notify();
    },
  };
}

const checklistStore = createLocalStorageStore();

function modeLabel(value: TravelMode) {
  if (value === "car") return "Auto";
  if (value === "train") return "Zug";
  if (value === "bus") return "Bus";
  return "Flug";
}

function buildSections(settings: ChecklistSettings): ChecklistSection[] {
  const travelItems =
    settings.travel === "car"
      ? CAR_ITEMS
      : settings.travel === "train"
        ? TRAIN_ITEMS
        : settings.travel === "bus"
          ? BUS_ITEMS
          : FLIGHT_ITEMS;

  return [
    { title: "Basis", kicker: "Immer dabei", items: BASE_ITEMS },
    { title: "Ski / Board Verleih", kicker: "Nur wenn du leihst", items: settings.rental === "rent" ? RENTAL_ITEMS : [] },
    { title: "Anreise", kicker: modeLabel(settings.travel), items: travelItems },
    { title: "Übernachtung", kicker: "Weekend / Skiurlaub", items: settings.tripType === "overnight" ? OVERNIGHT_ITEMS : [] },
  ];
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function ChipButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`button-lift min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-sky-200 bg-sky-200 text-slate-950 shadow-[0_12px_30px_rgba(125,211,252,0.18)]"
          : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-white/20 hover:bg-white/[0.1]"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function ChecklistPage() {
  const state = useSyncExternalStore(checklistStore.subscribe, checklistStore.getSnapshot, () => DEFAULT_STATE);
  const [toast, setToast] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [remoteRows, setRemoteRows] = useState<ChecklistDbRow[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const sections = useMemo(() => buildSections(state.settings), [state.settings]);
  const defaultItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const remoteMode = Boolean(userId);

  useEffect(() => {
    setTripId(new URLSearchParams(window.location.search).get("tripId"));
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setRemoteRows([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setRemoteLoading(true);
      let query = supabase
        .from("ski_trip_checklist_items")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      query = tripId ? query.eq("trip_id", tripId) : query.is("trip_id", null);

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        setToast("Checkliste konnte nicht aus Alpivo geladen werden.");
        setRemoteLoading(false);
        return;
      }

      const rows = ((data ?? []) as ChecklistDbRow[]).map((row) => ({
        ...row,
        is_deleted: Boolean(row.is_deleted),
      }));
      const existingDefaultKeys = new Set(rows.map((row) => row.default_key).filter(Boolean));
      const missingDefaults = defaultItems.filter((item) => !existingDefaultKeys.has(item.id));

      if (missingDefaults.length) {
        const { data: inserted, error: insertError } = await supabase
          .from("ski_trip_checklist_items")
          .insert(
            missingDefaults.map((item, index) => ({
              trip_id: tripId,
              user_id: userId,
              label: item.label,
              detail: item.detail,
              is_checked: Boolean(state.checked[item.id]),
              is_default: true,
              default_key: item.id,
              sort_order: (rows.length + index + 1) * 10,
            }))
          )
          .select("*");

        if (insertError) {
          setToast("Standardpunkte konnten nicht synchronisiert werden.");
        } else if (!cancelled) {
          setRemoteRows([...rows, ...((inserted ?? []) as ChecklistDbRow[])]);
        }
      } else {
        setRemoteRows(rows);
      }

      if (!cancelled) setRemoteLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [defaultItems, state.checked, tripId, userId]);

  const remoteByDefaultKey = useMemo(() => {
    return new Map(remoteRows.filter((row) => row.default_key).map((row) => [row.default_key, row]));
  }, [remoteRows]);

  const displaySections: ChecklistSection[] = useMemo(() => {
    if (!remoteMode) {
      return sections.map((section) => ({
        ...section,
        items: section.items
          .filter((item) => !state.deletedDefaultKeys[item.id])
          .map((item) => ({ ...item, label: state.renamedDefaults[item.id] ?? item.label })),
      }));
    }

    return sections.map((section) => ({
      ...section,
      items: section.items.flatMap((item) => {
        const row = remoteByDefaultKey.get(item.id);
        if (row?.is_deleted) return [];
        return [
          {
            id: item.id,
            label: row?.label ?? item.label,
            detail: row?.detail ?? item.detail,
          },
        ];
      }),
    }));
  }, [remoteByDefaultKey, remoteMode, sections, state.deletedDefaultKeys, state.renamedDefaults]);

  const displayItemsById = useMemo(() => {
    const map = new Map<string, DisplayItem>();
    for (const item of defaultItems) {
      if (remoteMode) {
        const row = remoteByDefaultKey.get(item.id);
        if (row?.is_deleted) continue;
        map.set(item.id, {
          id: item.id,
          rowId: row?.id ?? null,
          defaultKey: item.id,
          label: row?.label ?? item.label,
          detail: row?.detail ?? item.detail,
          isChecked: Boolean(row?.is_checked),
          isDefault: true,
          isRemote: true,
        });
      } else if (!state.deletedDefaultKeys[item.id]) {
        map.set(item.id, {
          id: item.id,
          rowId: null,
          defaultKey: item.id,
          label: state.renamedDefaults[item.id] ?? item.label,
          detail: item.detail,
          isChecked: Boolean(state.checked[item.id]),
          isDefault: true,
          isRemote: false,
        });
      }
    }
    return map;
  }, [defaultItems, remoteByDefaultKey, remoteMode, state.checked, state.deletedDefaultKeys, state.renamedDefaults]);

  const customItems: DisplayItem[] = useMemo(() => {
    if (remoteMode) {
      return remoteRows
        .filter((row) => !row.is_default && !row.is_deleted)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => ({
          id: row.id,
          rowId: row.id,
          defaultKey: null,
          label: row.label,
          detail: row.detail,
          isChecked: row.is_checked,
          isDefault: false,
          isRemote: true,
        }));
    }

    return state.customItems.map((item) => ({
      id: item.id,
      rowId: null,
      defaultKey: null,
      label: item.label,
      detail: item.detail,
      isChecked: Boolean(state.checked[item.id]),
      isDefault: false,
      isRemote: false,
    }));
  }, [remoteMode, remoteRows, state.checked, state.customItems]);

  const allVisibleItems = [
    ...displaySections.flatMap((section) => section.items.map((item) => displayItemsById.get(item.id)).filter(Boolean) as DisplayItem[]),
    ...customItems,
  ];
  const completed = allVisibleItems.filter((item) => item.isChecked).length;
  const progress = allVisibleItems.length ? Math.round((completed / allVisibleItems.length) * 100) : 0;
  const remaining = Math.max(0, allVisibleItems.length - completed);

  const updateSettings = (updates: Partial<ChecklistSettings>) => {
    checklistStore.set({ ...state, settings: { ...state.settings, ...updates } });
  };

  async function patchRemoteRow(rowId: string, patch: Partial<ChecklistDbRow>) {
    setRemoteRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
    const { error } = await supabase
      .from("ski_trip_checklist_items")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", rowId);
    if (error) setToast("Änderung konnte nicht gespeichert werden.");
  }

  const toggleItem = async (item: DisplayItem) => {
    if (item.isRemote && item.rowId) {
      await patchRemoteRow(item.rowId, { is_checked: !item.isChecked });
      return;
    }
    checklistStore.set({ ...state, checked: { ...state.checked, [item.id]: !state.checked[item.id] } });
  };

  const addCustomItem = async () => {
    const label = newLabel.trim();
    if (!label) return;
    if (label.length > 180) {
      setToast("Der Punkt ist zu lang.");
      return;
    }

    if (remoteMode && userId) {
      const maxOrder = Math.max(0, ...remoteRows.map((row) => row.sort_order ?? 0));
      const { data, error } = await supabase
        .from("ski_trip_checklist_items")
        .insert({
          trip_id: tripId,
          user_id: userId,
          label,
          detail: "Eigener Punkt",
          is_checked: false,
          is_default: false,
          sort_order: maxOrder + 10,
        })
        .select("*")
        .single();
      if (error || !data) {
        setToast("Eigener Punkt konnte nicht gespeichert werden.");
        return;
      }
      setRemoteRows((current) => [...current, data as ChecklistDbRow]);
    } else {
      const id = `custom-${crypto.randomUUID()}`;
      checklistStore.set({
        ...state,
        customItems: [...state.customItems, { id, label, detail: "Eigener Punkt" }],
      });
    }

    setNewLabel("");
    setToast("Punkt hinzugefügt.");
  };

  const deleteItem = async (item: DisplayItem) => {
    if (!window.confirm(`"${item.label}" aus deiner Checkliste entfernen`)) return;

    if (item.isRemote && item.rowId) {
      await patchRemoteRow(item.rowId, { is_deleted: true });
      setToast("Punkt entfernt.");
      return;
    }

    if (item.isDefault && item.defaultKey) {
      checklistStore.set({
        ...state,
        deletedDefaultKeys: { ...state.deletedDefaultKeys, [item.defaultKey]: true },
        checked: { ...state.checked, [item.id]: false },
      });
    } else {
      checklistStore.set({
        ...state,
        customItems: state.customItems.filter((entry) => entry.id !== item.id),
        checked: { ...state.checked, [item.id]: false },
      });
    }
    setToast("Punkt entfernt.");
  };

  const startEdit = (item: DisplayItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const saveEdit = async (item: DisplayItem) => {
    const label = editingLabel.trim();
    if (!label) return;

    if (item.isRemote && item.rowId) {
      await patchRemoteRow(item.rowId, { label });
    } else if (item.isDefault && item.defaultKey) {
      checklistStore.set({
        ...state,
        renamedDefaults: { ...state.renamedDefaults, [item.defaultKey]: label },
      });
    } else {
      checklistStore.set({
        ...state,
        customItems: state.customItems.map((entry) => (entry.id === item.id ? { ...entry, label } : entry)),
      });
    }

    setEditingId(null);
    setEditingLabel("");
    setToast("Punkt umbenannt.");
  };

  const resetChecks = async () => {
    if (remoteMode) {
      const visibleRemoteIds = allVisibleItems.map((item) => item.rowId).filter(Boolean) as string[];
      setRemoteRows((current) => current.map((row) => (visibleRemoteIds.includes(row.id) ? { ...row, is_checked: false } : row)));
      await Promise.all(visibleRemoteIds.map((id) => supabase.from("ski_trip_checklist_items").update({ is_checked: false }).eq("id", id)));
    } else {
      checklistStore.set({ ...state, checked: {} });
    }
    setToast("Haken zurückgesetzt.");
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-5 px-4 py-6 md:gap-6 md:px-6 md:py-10">
      <section className="animate-rise overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow-[0_24px_70px_rgba(2,6,23,0.35)]">
        <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 md:tracking-[0.28em]">Trip Readiness</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Reise-Checkliste</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Pack- und Planungsansicht für deinen Ski-Trip. Du kannst Standardpunkte abhaken, umbenennen, entfernen und eigene Punkte ergänzen.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs leading-relaxed text-slate-400">
              {remoteMode
                ? remoteLoading
                  ? "Synchronisierung mit deinem Alpivo-Konto läuft..."
                  : tripId
                    ? "Tripbezogen gespeichert. Entfernte Standardpunkte bleiben für diesen Trip ausgeblendet."
                    : "In deinem Alpivo-Konto gespeichert. Ohne Trip-Link gilt die Liste als persönliche Standardliste."
                : "Nicht eingeloggt: Änderungen bleiben lokal auf diesem Gerät. Login speichert sie dauerhaft in Alpivo."}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200/20 bg-sky-200/10 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-sky-100/75">Bereit</div>
                <div className="mt-1 text-5xl font-semibold leading-none text-white">{progress}%</div>
              </div>
              <div className="text-right text-sm text-sky-50">
                <div>{completed} erledigt</div>
                <div className="text-sky-100/70">{remaining} offen</div>
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-sky-200 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.1]"
              onClick={resetChecks}
            >
              Haken zurücksetzen
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 p-5 md:grid-cols-3 md:p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-semibold text-white">Ausrüstung</div>
            <div className="mt-3 grid gap-2">
              <ChipButton active={state.settings.rental === "own"} onClick={() => updateSettings({ rental: "own" })}>
                Eigene Ski / Schuhe
              </ChipButton>
              <ChipButton active={state.settings.rental === "rent"} onClick={() => updateSettings({ rental: "rent" })}>
                Vor Ort leihen
              </ChipButton>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-semibold text-white">Anreise</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["car", "train", "bus", "flight"] as const).map((mode) => (
                <ChipButton key={mode} active={state.settings.travel === mode} onClick={() => updateSettings({ travel: mode })}>
                  {modeLabel(mode)}
                </ChipButton>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-semibold text-white">Trip-Typ</div>
            <div className="mt-3 grid gap-2">
              <ChipButton active={state.settings.tripType === "day"} onClick={() => updateSettings({ tripType: "day" })}>
                Tagestrip
              </ChipButton>
              <ChipButton active={state.settings.tripType === "overnight"} onClick={() => updateSettings({ tripType: "overnight" })}>
                Mit Unterkunft
              </ChipButton>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-rise rounded-2xl border border-white/10 bg-slate-950/48 p-4 shadow-[0_18px_52px_rgba(2,6,23,0.28)] md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-white placeholder:text-slate-500 md:text-sm"
            placeholder="Eigenen Punkt hinzufügen, z. B. Powerbank einpacken"
            value={newLabel}
            maxLength={180}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addCustomItem();
            }}
          />
          <button
            type="button"
            className="button-lift min-h-12 rounded-xl bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
            onClick={addCustomItem}
          >
            Punkt hinzufügen
          </button>
        </div>
      </section>

      <div className="grid gap-5">
        {displaySections.map((section) =>
          section.items.length ? (
            <section
              key={section.title}
              className="animate-rise rounded-2xl border border-white/10 bg-slate-950/48 p-4 shadow-[0_18px_52px_rgba(2,6,23,0.28)] md:p-5"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{section.kicker}</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{section.title}</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                  {section.items.filter((item) => displayItemsById.get(item.id)?.isChecked).length}/{section.items.length}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {section.items.map((item) => {
                  const displayItem = displayItemsById.get(item.id);
                  if (!displayItem) return null;
                  return (
                    <ChecklistRow
                      key={displayItem.id}
                      item={displayItem}
                      editing={editingId === displayItem.id}
                      editingLabel={editingLabel}
                      onEditingLabelChange={setEditingLabel}
                      onToggle={() => toggleItem(displayItem)}
                      onEdit={() => startEdit(displayItem)}
                      onSaveEdit={() => saveEdit(displayItem)}
                      onCancelEdit={() => setEditingId(null)}
                      onDelete={() => deleteItem(displayItem)}
                    />
                  );
                })}
              </div>
            </section>
          ) : null
        )}

        {customItems.length ? (
          <section className="animate-rise rounded-2xl border border-white/10 bg-slate-950/48 p-4 shadow-[0_18px_52px_rgba(2,6,23,0.28)] md:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Individuell</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Eigene Punkte</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
                {customItems.filter((item) => item.isChecked).length}/{customItems.length}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {customItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  editing={editingId === item.id}
                  editingLabel={editingLabel}
                  onEditingLabelChange={setEditingLabel}
                  onToggle={() => toggleItem(item)}
                  onEdit={() => startEdit(item)}
                  onSaveEdit={() => saveEdit(item)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteItem(item)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <AnimatePresence>{toast ? <Toast message={toast} /> : null}</AnimatePresence>
    </div>
  );
}

function ChecklistRow({
  item,
  editing,
  editingLabel,
  onEditingLabelChange,
  onToggle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  item: DisplayItem;
  editing: boolean;
  editingLabel: string;
  onEditingLabelChange: (value: string) => void;
  onToggle: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group rounded-2xl border px-3 py-3 transition md:px-4 ${
        item.isChecked
          ? "border-emerald-200/25 bg-emerald-200/10"
          : "border-white/10 bg-white/[0.045] hover:border-sky-200/25 hover:bg-white/[0.075]"
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <button type="button" className="flex min-w-0 items-start gap-3 text-left" onClick={onToggle}>
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
              item.isChecked
                ? "border-emerald-200 bg-emerald-200 text-slate-950"
                : "border-white/20 bg-slate-950/40 text-transparent group-hover:border-sky-200"
            }`}
          >
            <CheckIcon />
          </span>
          <span className="min-w-0">
            {editing ? (
              <input
                className="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-base font-medium text-white md:text-sm"
                value={editingLabel}
                maxLength={180}
                onChange={(event) => onEditingLabelChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <span className={`block text-sm font-semibold leading-snug ${item.isChecked ? "text-emerald-50" : "text-white"}`}>
                {item.label}
              </span>
            )}
            <span className="mt-1 block text-xs leading-relaxed text-slate-400">{item.detail}</span>
          </span>
        </button>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {editing ? (
            <>
              <button
                type="button"
                className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                onClick={onCancelEdit}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="min-h-10 rounded-lg bg-sky-200 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-white"
                onClick={onSaveEdit}
              >
                Speichern
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                onClick={onEdit}
              >
                Umbenennen
              </button>
              <button
                type="button"
                className="min-h-10 rounded-lg border border-rose-200/20 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-300/10"
                onClick={onDelete}
              >
                Löschen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
