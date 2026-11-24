// User-defined service boundaries for Cebu Fare Guide.
// These rules are recommendation safeguards, not claims that a route is currently operating.
const normalize = value => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const routePlaces = route => [
  route?.origin,
  ...(Array.isArray(route?.stopSequence) ? route.stopSequence : String(route?.stops ?? "").split(/[;,]/)),
  route?.destination
].map(normalize).filter(Boolean);
const containsPlace = (text, names) => names.some(name => {
  const needle = normalize(name);
  return text === needle || text.includes(` ${needle} `) || text.startsWith(`${needle} `) || text.endsWith(` ${needle}`);
});

// A traditional jeepney listing is eligible only if no stop explicitly places
// the route outside Cebu City. Ambiguous records are excluded rather than guessed.
const outsideCebuCity = [
  "Mandaue", "Consolacion", "Liloan", "Compostela", "Danao", "Carmen", "Catmon", "Sogod", "Borbon", "Tabogon", "Bogo", "Medellin", "Daanbantayan",
  "Lapu-Lapu", "Mactan", "Cordova", "Talisay", "Tabunok", "Minglanilla", "Naga", "San Fernando", "Carcar", "Sibonga", "Argao", "Dalaguete", "Alcoy", "Boljoon", "Oslob", "Bato", "Santander", "Moalboal", "Dumanjug", "Barili", "Toledo", "Pinamungajan", "Aloguinsan", "Balamban", "Asturias", "Tuburan"
];

const isEndpointPair = (places, firstNames, secondNames) => {
  if (places.length < 2) return false;
  const first = places[0], last = places[places.length - 1];
  return (containsPlace(first, firstNames) && containsPlace(last, secondNames)) ||
    (containsPlace(last, firstNames) && containsPlace(first, secondNames));
};

export function isRouteAllowedByCoverage(route) {
  if (!route) return false;
  const mode = normalize(route.mode);
  const places = routePlaces(route);
  if (mode === "traditional") {
    if (!normalize(route.origin) || !normalize(route.destination)) return false;
    return !places.some(place => containsPlace(place, outsideCebuCity));
  }
  if (mode === "multicab") {
    const south = isEndpointPair(places, ["Carcar", "Carcar City"], ["Talisay", "Talisay City", "Tabunok"]);
    const north = isEndpointPair(places, ["Mandaue", "Mandaue City"], ["Danao", "Danao City"]);
    if (!south && !north) return false;
    // Do not permit a multicab listing to extend beyond its declared corridor.
    const beyondSouth = ["Sibonga", "Argao", "Dalaguete", "Alcoy", "Boljoon", "Oslob", "Bato", "Santander"];
    const beyondNorth = ["Carmen", "Catmon", "Sogod", "Borbon", "Tabogon", "Bogo", "Medellin", "Daanbantayan"];
    return south ? !places.some(place => containsPlace(place, beyondSouth)) : !places.some(place => containsPlace(place, beyondNorth));
  }
  return true;
}
