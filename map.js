const status = document.getElementById("status");
const camera = { center: [13.554, 47.251], zoom: 12.3, pitch: 52, bearing: -9 };
const pisteColor = ["match", ["get", "difficulty"], ["novice", "easy"], "#087bdd",
  "intermediate", "#cf2946", ["advanced", "expert", "freeride"], "#172234", "#6753a3"];
const width = ["interpolate", ["linear"], ["zoom"], 10, 1.5, 13, 3, 16, 5];
const outlineWidth = ["interpolate", ["linear"], ["zoom"], 10, 3.5, 13, 5, 16, 7];
const empty = { type: "FeatureCollection", features: [] };

function startMap() {
  const map = new maplibregl.Map({
    container: "map", ...camera, zoom: startZoom(), maxPitch: 75,
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        dem: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
          encoding: "terrarium", tileSize: 256, maxzoom: 14, attribution: "Terrain: Mapzen / AWS Open Data" },
        satellite: { type: "raster", tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg"],
          tileSize: 256, maxzoom: 14, attribution: "Sentinel-2 cloudless by EOX" },
        pistes: { type: "geojson", data: empty, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' },
        lifts: { type: "geojson", data: empty },
        stations: { type: "geojson", data: empty },
      },
      terrain: { source: "dem", exaggeration: 1.25 },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#e1edf8" } },
        { id: "satellite", type: "raster", source: "satellite",
          paint: { "raster-saturation": -0.85, "raster-opacity": 0.56, "raster-brightness-min": 0.48 } },
        { id: "relief", type: "hillshade", source: "dem",
          paint: { "hillshade-shadow-color": "#283f5e", "hillshade-highlight-color": "#f5fbff", "hillshade-exaggeration": 0.55 } },
        { id: "piste-outline", type: "line", source: "pistes", layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#ffffff", "line-width": outlineWidth } },
        { id: "piste-lines", type: "line", source: "pistes", layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": pisteColor, "line-width": width } },
        { id: "lift-lines", type: "line", source: "lifts",
          paint: { "line-color": "#253c51", "line-width": 2.5, "line-dasharray": [2, 2] } },
        { id: "lift-stations", type: "circle", source: "stations", minzoom: 13,
          paint: { "circle-radius": 3, "circle-color": "#253c51", "circle-stroke-color": "#fff", "circle-stroke-width": 1.2 } },
        { id: "piste-labels", type: "symbol", source: "pistes", minzoom: 13,
          layout: { "symbol-placement": "line", "text-field": ["to-string", ["coalesce", ["get", "ref"], ""]],
            "text-font": ["Open Sans Regular"], "text-size": 12, "symbol-spacing": 160 },
          paint: { "text-color": "#142943", "text-halo-color": "#fff", "text-halo-width": 2 } },
      ],
    },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  map.addControl(new maplibregl.ScaleControl(), "bottom-left");
  document.getElementById("reset").addEventListener("click", () => map.easeTo({ ...camera, zoom: startZoom() }));
  bindToggle("winter", (on) => {
    map.setPaintProperty("satellite", "raster-saturation", on ? -0.85 : 0);
    map.setPaintProperty("satellite", "raster-opacity", on ? 0.56 : 1);
    map.setPaintProperty("satellite", "raster-brightness-min", on ? 0.48 : 0);
  });
  bindToggle("lifts", (on) => {
    for (const layer of ["lift-lines", "lift-stations"]) map.setLayoutProperty(layer, "visibility", on ? "visible" : "none");
  });
  const village = document.createElement("span");
  village.className = "village";
  village.textContent = "Obertauern";
  new maplibregl.Marker({ element: village }).setLngLat([13.557, 47.2485]).addTo(map);

  const selectableLayers = ["piste-lines", "lift-lines", "lift-stations"];
  map.on("click", (event) => {
    const hit = map.queryRenderedFeatures([
      [event.point.x - 6, event.point.y - 6],
      [event.point.x + 6, event.point.y + 6],
    ], { layers: selectableLayers })[0];
    if (!hit) return;
    const { name, ref, difficulty } = hit.properties;
    const isPiste = hit.layer.id === "piste-lines";
    const levels = { novice: "Sehr leicht", easy: "Leicht", intermediate: "Mittel",
      advanced: "Schwer", expert: "Sehr schwer", freeride: "Freeride" };
    const detail = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = [ref, name].filter(Boolean).join(" · ") || (isPiste ? "Piste" : "Lift");
    detail.append(title);
    if (isPiste) {
      const level = document.createElement("div");
      level.textContent = levels[difficulty] ?? "Schwierigkeit ohne Angabe";
      detail.append(level);
    }
    new maplibregl.Popup().setLngLat(event.lngLat).setDOMContent(detail).addTo(map);
  });

  map.once("load", async () => {
    try {
      const bounds = "47.224,13.507,47.278,13.603";
      const query = `[out:json][timeout:12];(way["piste:type"="downhill"](${bounds});way["aerialway"](${bounds});node["aerialway"="station"](${bounds}););out geom;`;
      const sources = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];
      const elements = await Promise.any(sources.map(async (url) => {
        const response = await fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(22000) });
        if (!response.ok) throw new Error("Geodaten nicht verfügbar");
        const data = await response.json();
        if (!data.elements?.length) throw new Error("Leerer Datensatz");
        return data.elements;
      }));
      const pistes = [];
      const lifts = [];
      const stations = [];
      for (const element of elements) {
        const tags = element.tags ?? {};
        const properties = {
          name: tags["piste:name"] ?? tags.name,
          ref: tags["piste:ref"] ?? tags.ref,
          difficulty: tags["piste:difficulty"],
        };
        if (element.type === "node") {
          stations.push({ type: "Feature", properties, geometry: { type: "Point", coordinates: [element.lon, element.lat] } });
        } else if (element.geometry?.length >= 2) {
          const geometry = { type: "LineString", coordinates: element.geometry.map(({ lon, lat }) => [lon, lat]) };
          const target = tags["piste:type"] === "downhill" ? pistes : lifts;
          target.push({ type: "Feature", properties, geometry });
        }
      }
      if (!pistes.length) throw new Error("Keine Pisten im Datensatz");
      map.getSource("pistes").setData({ ...empty, features: pistes });
      map.getSource("lifts").setData({ ...empty, features: lifts });
      map.getSource("stations").setData({ ...empty, features: stations });
      status.textContent = "Piste oder Lift antippen für Details.";
    } catch {
      status.textContent = "Pistendaten konnten nicht geladen werden.";
    }
  });
}

function startZoom() {
  return innerWidth < 650 ? camera.zoom - 0.65 : camera.zoom;
}

function bindToggle(id, update) {
  const button = document.getElementById(id);
  button.addEventListener("click", () => {
    const on = button.getAttribute("aria-pressed") !== "true";
    update(on);
    button.setAttribute("aria-pressed", String(on));
  });
}

try {
  startMap();
} catch {
  status.textContent = "Die 3D-Ansicht benötigt einen Browser mit WebGL.";
}
