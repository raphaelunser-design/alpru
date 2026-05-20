import type { ExternalActionLink, ResortActionLinks } from "@/types/alpivo";

const official = (
  label: string,
  url: string,
  kind: ExternalActionLink["kind"],
  sourceName: string,
  note?: string,
): ExternalActionLink => ({
  label,
  url,
  kind,
  sourceName,
  confidence: "official",
  note,
});

export const resortActionLinks: Record<string, ResortActionLinks> = {
  obertauern: {
    officialInfo: official("Offizielle Resort-Infos", "https://www.obertauern.com/", "official", "Obertauern Tourismus"),
    skipassShop: official("Skipass offiziell kaufen", "https://obertauern.skiperformance.com/de/winter/store", "skipass_shop", "Ski amadé / Obertauern Ticketshop", "Externer offizieller Shop. Alpivo wickelt keinen Kauf ab."),
    ticketInfo: official("Skipasspreise offiziell prüfen", "https://www.obertauern.com/skigebiet-oesterreich/skipasspreise.html", "ticket_info", "Obertauern Tourismus", "Offizielle Preise und Saisoninfos vor Buchung gegenprüfen."),
    liveStatus: official("Live-Status prüfen", "https://www.obertauern.com/en/snow-report.html", "live_status", "Obertauern Tourismus"),
    webcams: official("Webcams ansehen", "https://www.ski-obertauern.at/webcams", "webcam", "Ski Obertauern"),
    pisteMap: official("Pistenplan öffnen", "https://www.obertauern.com/en/ski-area.html", "piste_map", "Obertauern Tourismus"),
    accommodationSearch: official("Unterkunft offiziell suchen", "https://www.obertauern.com/en/hotels-rooms/hotel-in-obertauern-1.html", "accommodation", "Obertauern Tourismus"),
    travelInfo: official("Anreise planen", "https://www.obertauern.com/en/service-info/getting-there.html", "travel", "Obertauern Tourismus"),
  },
  solden: {
    officialInfo: official("Offizielle Resort-Infos", "https://www.soelden.com/", "official", "Sölden Tourismus"),
    skipassShop: official("Skipass offiziell kaufen", "https://www.soelden.com/de/suchen-buchen/ski-bergbahntickets", "skipass_shop", "Sölden Tourismus", "Externe offizielle Ticketseite. Alpivo wickelt keinen Kauf ab."),
    ticketInfo: official("Skipasspreise offiziell prüfen", "https://www.soelden.com/de/suchen-buchen/ski-bergbahntickets", "ticket_info", "Sölden Tourismus"),
    liveStatus: official("Live-Status prüfen", "https://www.soelden.com/en/live-information/status", "live_status", "Sölden Tourismus"),
    webcams: official("Webcams ansehen", "https://www.soelden.com/en/live-information/livecams", "webcam", "Sölden Tourismus"),
    pisteMap: official("Pistenplan öffnen", "https://www.soelden.com/en/activities/winter/skiing-snowboarding/ski-area-information/ski-area-map-lifts-slopes", "piste_map", "Sölden Tourismus"),
    accommodationSearch: official("Unterkunft offiziell suchen", "https://www.soelden.com/en/search-book/accommodations", "accommodation", "Sölden Tourismus"),
    travelInfo: official("Anreise planen", "https://www.soelden.com/en/region-villages/getting-here", "travel", "Sölden Tourismus"),
  },
  "zell-am-see": {
    officialInfo: official("Offizielle Resort-Infos", "https://www.zellamsee-kaprun.com/", "official", "Zell am See-Kaprun Tourismus"),
    skipassShop: official("Skipass offiziell kaufen", "https://www.zellamsee-kaprun.com/de/buchen/skipaesse", "skipass_shop", "Zell am See-Kaprun Tourismus", "Externe offizielle Ticketseite. Alpivo wickelt keinen Kauf ab."),
    ticketInfo: official("Skipasspreise offiziell prüfen", "https://www.zellamsee-kaprun.com/de/buchen/skipaesse", "ticket_info", "Zell am See-Kaprun Tourismus"),
    schmittenShop: official("Schmitten-Tickets öffnen", "https://tickets.schmitten.at/", "skipass_shop", "Schmittenhöhebahn AG"),
    kitzsteinhornTicketInfo: official("Kitzsteinhorn-Tickets prüfen", "https://www.kitzsteinhorn.at/de/tickets-preise/ski-board", "ticket_info", "Kitzsteinhorn"),
    liveStatus: official("Live-Status öffnen", "https://www.zellamsee-kaprun.com/en/service/live", "live_status", "Zell am See-Kaprun Tourismus"),
    webcams: official("Webcams ansehen", "https://www.zellamsee-kaprun.com/de/service/live/webcams", "webcam", "Zell am See-Kaprun Tourismus"),
    pisteMap: official("Pistenplan öffnen", "https://www.zellamsee-kaprun.com/en/sport/winter/skimap", "piste_map", "Zell am See-Kaprun Tourismus"),
    accommodationSearch: official("Unterkunft offiziell suchen", "https://www.zellamsee-kaprun.com/de/buchen", "accommodation", "Zell am See-Kaprun Tourismus"),
    travelInfo: official("Anreise planen", "https://www.zellamsee-kaprun.com/en/service/arrival", "travel", "Zell am See-Kaprun Tourismus"),
    events: official("Events prüfen", "https://www.zellamsee-kaprun.com/en/events", "events", "Zell am See-Kaprun Tourismus"),
  },
  saalbach: {
    officialInfo: official("Offizielle Resort-Infos", "https://www.saalbach.com/", "official", "Saalbach Hinterglemm Tourismus"),
    skipassShop: official("Skipass offiziell kaufen", "https://tickets.saalbach.com/de/winter/store", "skipass_shop", "Saalbach Hinterglemm Leogang Fieberbrunn Ticketshop", "Externer offizieller Shop. Alpivo wickelt keinen Kauf ab."),
    ticketInfo: official("Skipass & Preise prüfen", "https://www.saalbach.com/en/winter/skitickets/skitickets-shlf", "ticket_info", "Saalbach Hinterglemm Tourismus"),
    liveStatus: official("Live-Status prüfen", "https://www.saalbach.com/en/live-info", "live_status", "Saalbach Hinterglemm Tourismus"),
    webcams: official("Webcams ansehen", "https://www.saalbach.com/en/live-info/livecams", "webcam", "Saalbach Hinterglemm Tourismus"),
    pisteMap: official("Pistenplan öffnen", "https://www.saalbach.com/en/winter/ski-resort/piste-map", "piste_map", "Saalbach Hinterglemm Tourismus"),
    accommodationSearch: official("Unterkunft offiziell suchen", "https://www.saalbach.com/saalbach-booking/MasterReq?AM=1&AR=1&FL=100&LG=0&MB=0&RA=2", "accommodation", "Saalbach Hinterglemm Tourismus"),
    travelInfo: official("Anreise planen", "https://www.saalbach.com/en/service/arrival", "travel", "Saalbach Hinterglemm Tourismus"),
    events: official("Events prüfen", "https://www.saalbach.com/en/events", "events", "Saalbach Hinterglemm Tourismus"),
  },
};

export const actionLinkOrder: Array<keyof ResortActionLinks> = [
  "officialInfo",
  "skipassShop",
  "ticketInfo",
  "liveStatus",
  "webcams",
  "pisteMap",
  "accommodationSearch",
  "schmittenShop",
  "kitzsteinhornTicketInfo",
  "travelInfo",
  "skiSchool",
  "rental",
  "events",
  "weather",
];

export function getResortActionLinks(slug: string | null | undefined): ResortActionLinks {
  return slug ? resortActionLinks[slug] ?? {} : {};
}

export function flattenResortActionLinks(links: ResortActionLinks, limit?: number): ExternalActionLink[] {
  const flattened = actionLinkOrder.flatMap((key) => {
    const link = links[key];
    return link ? [link] : [];
  });
  return typeof limit === "number" ? flattened.slice(0, limit) : flattened;
}
