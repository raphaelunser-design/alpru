import type { SupportedLocale } from "@/lib/i18n";

type HomeCopy = {
  hero: {
    badge: string;
    kicker: string;
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
    stats: Array<[string, string]>;
  };
  values: Array<[string, string]>;
  how: {
    kicker: string;
    title: string;
    intro: string;
    steps: Array<[string, string, string]>;
  };
  example: {
    kicker: string;
    title: string;
    intro: string;
    label: string;
    resort: string;
    subtitle: string;
    scoreLabel: string;
    reasonsTitle: string;
    reasons: string[];
    warningTitle: string;
    warning: string;
    costsTitle: string;
    costs: Array<[string, string]>;
    total: string;
    note: string;
  };
  cta: {
    kicker: string;
    title: string;
    text: string;
    button: string;
  };
};

export const homeCopy = {
  de: {
    hero: {
      badge: "Beta-Version · Alpine Skigebiete · Kosten & Wetter als Orientierung",
      kicker: "Ski-Trip-Entscheidungsmaschine",
      title: "Finde dein perfektes Skigebiet.",
      subtitle:
        "Alpivo vergleicht Skigebiete nach Budget, Anreise, Wetter, Kosten und deinen persönlichen Präferenzen, damit du schneller die beste Ski-Entscheidung triffst.",
      primary: "Match starten",
      secondary: "So funktioniert's",
      stats: [
        ["Kosten", "Skipass, Anreise, Essen, Unterkunft"],
        ["Wetter", "Schnee, Berg/Tal, Saisongefühl"],
        ["Score", "Stärken, Schwächen, Empfehlung"],
      ],
    },
    values: [
      ["Budget realistisch einschätzen", "Skipass, Unterkunft, Anreise und Essen transparent pro Person kalkulieren."],
      ["Nicht nur die großen Resorts", "Alpivo bewertet auch kleinere Skigebiete fair nach Preis-Leistung, Entfernung und Reiseziel."],
      ["Besser entscheiden", "Du bekommst nicht nur Ergebnisse, sondern eine begründete Empfehlung mit Score."],
    ],
    how: {
      kicker: "So funktioniert's",
      title: "In 3 Schritten zu deinem Ski-Match",
      intro: "Der Einstieg bleibt bewusst kurz. Die Details entstehen erst im Ergebnis, wenn sie wirklich bei der Entscheidung helfen.",
      steps: [
        ["01", "Präferenzen wählen", "Sag Alpivo, was dir wichtig ist: Budget, Entfernung, Après-Ski, Pisten, Wetter, Off-Piste und Erfahrungslevel."],
        ["02", "Skigebiete vergleichen", "Alpivo kombiniert deine Angaben mit Kosten-, Wetter- und Resortdaten."],
        ["03", "Beste Option finden", "Du erhältst eine verständliche Empfehlung mit Score, Stärken, Schwächen und Kostenübersicht."],
      ],
    },
    example: {
      kicker: "USP sichtbar",
      title: "Keine Liste. Eine begründete Entscheidung.",
      intro:
        "Alpivo zeigt nicht nur, welches Skigebiet weit oben steht. Du siehst, warum es passt, wo der Haken liegt und welche Kosten pro Person realistisch werden können.",
      label: "Dein Top-Match",
      resort: "Saalbach-Hinterglemm",
      subtitle: "Beispiel für Gruppen mit Budget- und Après-Ski-Fokus",
      scoreLabel: "von 100",
      reasonsTitle: "Warum es passt",
      reasons: ["Kurze Anreise", "Starkes Après-Ski", "Gute Schneesicherheit", "Viele Pistenkilometer"],
      warningTitle: "Achtung",
      warning: "Höhere Kosten in der Hauptsaison.",
      costsTitle: "Kosten p. P. Beispiel",
      costs: [
        ["Skipass", "285 €"],
        ["Unterkunft", "360 €"],
        ["Anreise", "65 €"],
        ["Essen & Trinken", "120 €"],
      ],
      total: "Gesamt",
      note: "Beispielrechnung: tatsächliche Werte hängen von Zeitraum, Personenanzahl und Auswahl ab.",
    },
    cta: {
      kicker: "Bereit für den Match",
      title: "Starte mit wenigen Fragen. Die Details kommen danach.",
      text: "Alpivo führt dich von Präferenzen zu einem klaren Ergebnis, statt dich direkt mit allen Filtern zu überladen.",
      button: "Match starten",
    },
  },
  en: {
    hero: {
      badge: "Beta version · Alpine ski resorts · Costs & weather as guidance",
      kicker: "Ski trip decision engine",
      title: "Find your perfect ski resort.",
      subtitle:
        "Alpivo compares ski resorts by budget, travel time, weather, costs and your personal preferences, so you can make the right ski decision faster.",
      primary: "Start match",
      secondary: "How it works",
      stats: [
        ["Costs", "Lift pass, travel, food, accommodation"],
        ["Weather", "Snow, mountain/valley, season feel"],
        ["Score", "Strengths, downsides, recommendation"],
      ],
    },
    values: [
      ["Estimate your budget realistically", "Calculate lift pass, accommodation, travel and food transparently per person."],
      ["Not just the big resorts", "Alpivo also rates smaller ski areas fairly by value, distance and trip fit."],
      ["Decide with confidence", "You get more than results: a reasoned recommendation with a score."],
    ],
    how: {
      kicker: "How it works",
      title: "Your ski match in 3 steps",
      intro: "The entry stays intentionally short. Details appear in the result when they actually help the decision.",
      steps: [
        ["01", "Choose preferences", "Tell Alpivo what matters: budget, distance, après-ski, slopes, weather, off-piste and experience level."],
        ["02", "Compare resorts", "Alpivo combines your input with cost, weather and resort data."],
        ["03", "Find the best option", "You receive a clear recommendation with score, strengths, downsides and cost overview."],
      ],
    },
    example: {
      kicker: "USP in action",
      title: "Not a list. A reasoned decision.",
      intro: "Alpivo does not only show which resort ranks high. You see why it fits, what to watch out for and what costs per person may look like.",
      label: "Your top match",
      resort: "Saalbach-Hinterglemm",
      subtitle: "Example for groups focused on budget and après-ski",
      scoreLabel: "out of 100",
      reasonsTitle: "Why it fits",
      reasons: ["Short travel time", "Strong après-ski", "Good snow reliability", "Many piste kilometres"],
      warningTitle: "Watch out",
      warning: "Higher costs in peak season.",
      costsTitle: "Example cost p. p.",
      costs: [
        ["Lift pass", "€285"],
        ["Accommodation", "€360"],
        ["Travel", "€65"],
        ["Food & drinks", "€120"],
      ],
      total: "Total",
      note: "Example calculation: actual values depend on dates, group size and selected options.",
    },
    cta: {
      kicker: "Ready for your match",
      title: "Start with a few questions. The details come later.",
      text: "Alpivo guides you from preferences to a clear result instead of overwhelming you with every filter upfront.",
      button: "Start match",
    },
  },
  fr: {
    hero: {
      badge: "Version bêta · Stations alpines · Coûts & météo à titre indicatif",
      kicker: "Moteur de décision pour séjour ski",
      title: "Trouvez votre station de ski idéale.",
      subtitle:
        "Alpivo compare les stations selon le budget, l'accès, la météo, les coûts et vos préférences personnelles pour décider plus vite.",
      primary: "Lancer le match",
      secondary: "Comment ça marche",
      stats: [
        ["Coûts", "Forfait, trajet, repas, hébergement"],
        ["Météo", "Neige, montagne/vallée, saison"],
        ["Score", "Forces, limites, recommandation"],
      ],
    },
    values: [
      ["Estimer le budget réaliste", "Calculer forfait, hébergement, trajet et repas de façon transparente par personne."],
      ["Pas seulement les grandes stations", "Alpivo évalue aussi les petits domaines selon le rapport qualité-prix, la distance et le type de séjour."],
      ["Mieux décider", "Vous recevez une recommandation expliquée avec un score, pas seulement une liste."],
    ],
    how: {
      kicker: "Comment ça marche",
      title: "Votre match ski en 3 étapes",
      intro: "L'entrée reste volontairement courte. Les détails apparaissent dans le résultat lorsqu'ils aident vraiment à décider.",
      steps: [
        ["01", "Choisir vos préférences", "Indiquez ce qui compte: budget, distance, après-ski, pistes, météo, hors-piste et niveau."],
        ["02", "Comparer les stations", "Alpivo combine vos réponses avec les données de coûts, météo et stations."],
        ["03", "Trouver la meilleure option", "Vous obtenez une recommandation claire avec score, forces, limites et aperçu des coûts."],
      ],
    },
    example: {
      kicker: "USP visible",
      title: "Pas une liste. Une décision expliquée.",
      intro: "Alpivo montre pourquoi une station convient, quels sont les points d'attention et quels coûts par personne sont réalistes.",
      label: "Votre meilleur match",
      resort: "Saalbach-Hinterglemm",
      subtitle: "Exemple pour groupes axés budget et après-ski",
      scoreLabel: "sur 100",
      reasonsTitle: "Pourquoi ça convient",
      reasons: ["Trajet court", "Après-ski fort", "Bonne fiabilité neige", "Beaucoup de kilomètres de pistes"],
      warningTitle: "Attention",
      warning: "Coûts plus élevés en haute saison.",
      costsTitle: "Exemple de coûts p. p.",
      costs: [
        ["Forfait", "285 €"],
        ["Hébergement", "360 €"],
        ["Trajet", "65 €"],
        ["Repas & boissons", "120 €"],
      ],
      total: "Total",
      note: "Calcul d'exemple: les valeurs réelles dépendent des dates, du nombre de personnes et des options choisies.",
    },
    cta: {
      kicker: "Prêt pour le match",
      title: "Commencez avec quelques questions. Les détails viennent ensuite.",
      text: "Alpivo vous mène des préférences à un résultat clair sans vous surcharger de filtres au départ.",
      button: "Lancer le match",
    },
  },
  nl: {
    hero: {
      badge: "Bètaversie · Alpiene skigebieden · Kosten & weer als indicatie",
      kicker: "Beslismachine voor skitrips",
      title: "Vind jouw perfecte skigebied.",
      subtitle:
        "Alpivo vergelijkt skigebieden op budget, reistijd, weer, kosten en jouw persoonlijke voorkeuren, zodat je sneller de beste keuze maakt.",
      primary: "Match starten",
      secondary: "Zo werkt het",
      stats: [
        ["Kosten", "Skipas, reis, eten, verblijf"],
        ["Weer", "Sneeuw, berg/dal, seizoensbeeld"],
        ["Score", "Sterktes, nadelen, aanbeveling"],
      ],
    },
    values: [
      ["Budget realistisch inschatten", "Bereken skipas, verblijf, reis en eten transparant per persoon."],
      ["Niet alleen de grote resorts", "Alpivo beoordeelt ook kleinere gebieden eerlijk op waarde, afstand en reisdoel."],
      ["Beter beslissen", "Je krijgt niet alleen resultaten, maar een onderbouwde aanbeveling met score."],
    ],
    how: {
      kicker: "Zo werkt het",
      title: "In 3 stappen naar je ski-match",
      intro: "De start blijft bewust kort. Details verschijnen pas in het resultaat wanneer ze helpen bij de keuze.",
      steps: [
        ["01", "Voorkeuren kiezen", "Vertel Alpivo wat belangrijk is: budget, afstand, après-ski, pistes, weer, off-piste en niveau."],
        ["02", "Skigebieden vergelijken", "Alpivo combineert jouw input met kosten-, weer- en resortdata."],
        ["03", "Beste optie vinden", "Je krijgt een duidelijke aanbeveling met score, sterktes, nadelen en kostenoverzicht."],
      ],
    },
    example: {
      kicker: "USP zichtbaar",
      title: "Geen lijst. Een onderbouwde beslissing.",
      intro: "Alpivo laat niet alleen zien welk gebied hoog scoort. Je ziet waarom het past, waar de aandachtspunten liggen en welke kosten realistisch zijn.",
      label: "Jouw topmatch",
      resort: "Saalbach-Hinterglemm",
      subtitle: "Voorbeeld voor groepen met budget- en après-ski-focus",
      scoreLabel: "van 100",
      reasonsTitle: "Waarom het past",
      reasons: ["Korte reistijd", "Sterke après-ski", "Goede sneeuwzekerheid", "Veel pistekilometers"],
      warningTitle: "Let op",
      warning: "Hogere kosten in het hoogseizoen.",
      costsTitle: "Voorbeeldkosten p.p.",
      costs: [
        ["Skipas", "€285"],
        ["Verblijf", "€360"],
        ["Reis", "€65"],
        ["Eten & drinken", "€120"],
      ],
      total: "Totaal",
      note: "Voorbeeldberekening: werkelijke waarden hangen af van periode, aantal personen en gekozen opties.",
    },
    cta: {
      kicker: "Klaar voor je match",
      title: "Start met een paar vragen. De details komen daarna.",
      text: "Alpivo leidt je van voorkeuren naar een helder resultaat zonder je direct met alle filters te overladen.",
      button: "Match starten",
    },
  },
} satisfies Record<SupportedLocale, HomeCopy>;
