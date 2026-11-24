import assert from 'node:assert/strict';
import { structuredRouteDirectory, starterRoutes } from '../src/data.js';
import { isRouteAllowedByCoverage } from '../src/coverageRules.js';

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const placeTerms = place => {
  const raw = normalize(place.name), area = normalize(place.area);
  const areaParts = String(place.area || '').split(',').map(normalize).filter(Boolean);
  const terms = [raw];
  if (/south bus terminal/.test(raw)) terms.push('cebu south bus terminal');
  if (/north bus terminal/.test(raw)) terms.push('cebu north bus terminal');
  if (/lapu lapu|mactan/.test(raw)) terms.push('lapu lapu city', 'mactan');
  if (/san fernando/.test(raw)) terms.push('san fernando');
  if (/^naga/.test(raw)) terms.push('naga city', 'naga');
  if (/talisay/.test(raw)) terms.push('talisay city', 'tabunok');
  if (/carbon/.test(raw)) terms.push('carbon market');
  if (/guadalupe/.test(raw)) terms.push('guadalupe');
  if (/colon/.test(raw)) terms.push('colon');
  if (/tabunok/.test(raw)) terms.push('tabunok');
  if (/sm city cebu/.test(raw)) terms.push('sm city cebu');
  if (/it park/.test(raw)) terms.push('cebu it park', 'it park');
  const broad = new Set(['cebu city', 'cebu province', 'mandaue city', 'lapu lapu city', 'talisay city', 'naga city', 'philippines']);
  areaParts.filter(part => !broad.has(part) && !part.includes('province')).forEach(part => terms.push(part));
  if (area && !broad.has(area) && !area.includes('cebu city') && !area.includes('province')) terms.push(area);
  return [...new Set(terms.filter(term => term && term.length >= 3))];
};
const matches = (candidate, terms) => {
  const text = normalize(candidate);
  return terms.some(term => { const value = normalize(term); return value && (text === value || text.includes(value) || value.includes(text)); });
};
const aliases = {
  'doc-01k': { 'usc downtown campus': 'Colon', 'university of cebu': 'Colon', 'metro colon': 'Colon', 'cebu metropolitan cathedral': 'Parian', 'casa gorordo museum': 'Parian' },
  'doc-04l': { 'university of the philippines cebu': 'JY Square', 'cebu provincial capitol area': 'Gorordo Avenue', 'cebu business park': 'Ayala Center Cebu' },
  'doc-06b': { 'guadalupe church': 'Guadalupe', 'cebu provincial capitol': 'Capitol Site', 'cebu doctors university hospital': 'Capitol Site', 'fuente osmena circle': 'Fuente Osmeña Circle' },
  'doc-07b': { 'banawa public market': 'Banawa', 'vicente sotto memorial medical center': 'B. Rodriguez Street', 'cebu institute of medicine': 'Fuente Osmeña Circle' },
  'doc-13c': { 'university of san carlos talamban campus': 'Talamban' },
  'doc-17b': { 'waterfront cebu city hotel': 'Cebu IT Park', 'jy square mall': 'Lahug', 'usc downtown campus': 'Colon' },
  'doc-17c': { 'jy square mall': 'Lahug', 'university of the philippines cebu': 'Lahug', 'mango square': 'Mango Avenue', 'robinsons fuente': 'Ramos' },
  'doc-42e': { 'talisay city public market': 'Poblacion, Talisay City', 'tabunok public market': 'Tabunok', 'pardo church': 'Pardo', 'cebu provincial capitol': 'Escario', 'jy square mall': 'Lahug' },
  'doc-my03': { airport: 'Mactan-Cebu International Airport' },
  'doc-mi-01a': { 'mactan shrine': 'Punta Engaño' },
  'doc-mi-02b': { 'marigondon public market': 'Marigondon' },
  'doc-mi-03a': { 'cordova public market': 'Cordova' }
};
const stopIndex = (route, place) => {
  const terms = placeTerms(place), stops = route.stopSequence || [];
  const exact = stops.findIndex(stop => matches(stop, terms));
  if (exact >= 0) return exact;
  for (const [alias, target] of Object.entries(aliases[route.id] || {})) {
    if (matches(alias, terms)) return stops.findIndex(stop => normalize(stop) === normalize(target));
  }
  return -1;
};
const cases = [
  ['Guadalupe', 'Carbon Public Market', '06B', 'doc-06b'],
  ['Banawa', 'Carbon Public Market', '07B', 'doc-07b'],
  ['Apas', 'Carbon Public Market', '17B', 'doc-17b'],
  ['Apas', 'Carbon Public Market', '17C', 'doc-17c'],
  ['Sambag II', 'SM City Cebu', '01K', 'doc-01k'],
  ['Lahug', 'SM City Cebu', '04L', 'doc-04l'],
  ['Bulacao', 'SM City Cebu', '10H', 'doc-10h'],
  ['Talamban', 'Colon', '13C', 'doc-13c'],
  ['Poblacion, Talisay City', 'Cebu IT Park', '42E', 'doc-42e'],
  ['Punta Engaño', 'Lapu-Lapu City Public Market', 'MI-01A', 'doc-mi-01a'],
  ['Marigondon', 'Mandaue City', 'MI-02B', 'doc-mi-02b'],
  ['Cordova', 'Lapu-Lapu City Public Market', 'MI-03A', 'doc-mi-03a'],
  ['SM Seaside City Cebu', 'Parkmall', 'MY01', 'doc-my01'],
  ['SM Seaside City Cebu', 'Mactan-Cebu International Airport', 'MY03', 'doc-my03'],
  ['Fuente Osmeña Circle', 'SM Seaside City Cebu', 'MY05', 'doc-my05']
];
for (const [fromName, toName, code, id] of cases) {
  const route = structuredRouteDirectory.find(item => item.id === id);
  assert.ok(route, `Missing route data for ${code}`);
  const from = { name: fromName, area: 'Cebu Province' };
  const to = { name: toName, area: 'Cebu Province' };
  const start = stopIndex(route, from), end = stopIndex(route, to);
  assert.ok(start >= 0 && end >= 0 && start !== end, `${code} did not match ${fromName} -> ${toName}`);
}
console.log(`Passed ${cases.length} direct-route matching smoke tests.`);

// Transfer smoke test: the Naga–IT Park service and 17B both list Lahug.
const nagaRoute = structuredRouteDirectory.find(item => item.id === 'doc-naga-itpark');
const carbonRoute = structuredRouteDirectory.find(item => item.id === 'doc-17b');
const nagaStart = stopIndex(nagaRoute, { name: 'Naga City Public Market', area: 'Naga City' });
const carbonEnd = stopIndex(carbonRoute, { name: 'Carbon Public Market', area: 'Cebu City' });
const sharedTransfer = nagaRoute.stopSequence.find((stop, index) => index > nagaStart && carbonRoute.stopSequence.slice(0, carbonEnd).some(other => normalize(other) === normalize(stop)));
assert.ok(['Lahug', 'Jones Avenue'].includes(sharedTransfer), 'Expected a documented shared-stop transfer from the Naga service to 17B');

// Safety check: a terminal-vicinity note is not an exact boarding stop.
const terminal = { name: 'Cebu South Bus Terminal', area: 'Cebu City' };
const sanFernando = { name: 'San Fernando Public Market', area: 'San Fernando' };
const falseDirect = structuredRouteDirectory.some(route => stopIndex(route, terminal) >= 0 && stopIndex(route, sanFernando) >= 0);
assert.equal(falseDirect, false, 'Do not invent a direct South Bus Terminal → San Fernando route');
console.log('Passed transfer and no-false-direct safety checks.');

// User-defined vehicle coverage safeguards.
const cityJeepney = structuredRouteDirectory.find(item => item.id === 'doc-01k');
assert.equal(isRouteAllowedByCoverage(cityJeepney), true, 'Cebu City traditional jeepney route should remain eligible');
const outsideCityJeepney = starterRoutes.find(item => item.id === 'route-45b-san-fernando-basak');
assert.equal(isRouteAllowedByCoverage(outsideCityJeepney), false, 'Traditional jeepney route extending outside Cebu City must be excluded');
for (const route of starterRoutes.filter(item => ['43','43D','44','44A','44C','44D','44E','45','45B','46','47'].includes(item.code))) {
  assert.equal(isRouteAllowedByCoverage(route), false, `Out-of-city route ${route.code} must not be shown as a traditional jeepney`);
}
assert.equal(isRouteAllowedByCoverage({mode:'traditional', origin:'', destination:'', stops:'Unknown'}), false, 'Traditional jeepney records with unknown endpoints must not be assumed Cebu City-only');
assert.equal(isRouteAllowedByCoverage({mode:'multicab', origin:'Carcar City', destination:'Tabunok, Talisay City', stopSequence:['Carcar City','San Fernando','Naga','Minglanilla','Talisay City','Tabunok']}), true, 'South multicab corridor Carcar–Talisay should be eligible');
assert.equal(isRouteAllowedByCoverage({mode:'multicab', origin:'Mandaue City', destination:'Danao City', stopSequence:['Mandaue City','Consolacion','Liloan','Compostela','Danao City']}), true, 'North multicab corridor Mandaue–Danao should be eligible');
assert.equal(isRouteAllowedByCoverage({mode:'multicab', origin:'Carcar City', destination:'Sibonga', stopSequence:['Carcar City','Sibonga']}), false, 'South multicab must not extend beyond Carcar');
assert.equal(isRouteAllowedByCoverage({mode:'multicab', origin:'Mandaue City', destination:'Bogo', stopSequence:['Mandaue City','Danao','Bogo']}), false, 'North multicab must not extend beyond Danao');
assert.equal(isRouteAllowedByCoverage({mode:'multicab', origin:'Naga', destination:'Talisay City', stopSequence:['Naga','Talisay City']}), false, 'South multicab must include both declared endpoints');
console.log('Passed 7 vehicle coverage boundary tests.');
