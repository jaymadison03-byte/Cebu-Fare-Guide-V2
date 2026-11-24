import React,{useEffect,useMemo,useState} from "react";
import {MapContainer,TileLayer,Marker,CircleMarker,Tooltip,Polyline,useMap,useMapEvents} from "react-leaflet";
import L from "leaflet";
import {MapPin,ArrowDownUp,BusFront,Route,Calculator,ShieldCheck,Settings,Info,Search,ChevronDown,ExternalLink,Menu,X,AlertTriangle,CheckCircle2,Clock3,Database,Plus,Trash2,LogOut} from "lucide-react";
import {locations as seedLocations,modes,passengerTypes,starterRules,starterRoutes,structuredRouteDirectory} from "./data";
import {isRouteAllowedByCoverage} from "./coverageRules";

const busOperators = [
 {name:"Ceres Liner (Vallacar Transit)",area:"North",destinations:["Danao","Carmen","Catmon","Sogod","Borbon","Tabogon","Bogo","Medellin","Daanbantayan","Maya","Hagnaya","Tuburan","San Fernando","Minglanilla","Naga","Talisay","Tabunok","Carcar","Sibonga","Argao","Dalaguete","Alcoy","Boljoon","Oslob","Bato","Santander","Moalboal","Toledo","Pinamungajan","Aloguinsan","Cordova"]},
 {name:"Sugbo Transit Express (Vallacar Transit)",area:"North",destinations:["Northern Cebu"]},
 {name:"Metro Cebu Autobus Corporation",area:"North / West",destinations:["Maya","Bagay","Daanbantayan","Bogo","Polambato","Pinamungajan","Danao"]},
 {name:"White Stallion Express",area:"North",destinations:["Bagay","Daanbantayan","Medellin","Maya"]},
 {name:"3 Brothers",area:"North",destinations:["Tuburan","Borbon","Sogod","Tabogon"]},
 {name:"Julia Transport",area:"North",destinations:["Tuburan","Borbon","Sogod","Tabogon"]},
 {name:"Cebu San Sebastian Liner",area:"North",destinations:["Tuburan","Borbon","Sogod","Tabogon"]},
 {name:"CADCO Trans MPC",area:"North / East",destinations:["Catmon","Carmen","Danao","Bogo"]},
 {name:"ABC Liner",area:"North / East",destinations:["Catmon","Carmen","Danao","Bogo"]},
 {name:"Showbox",area:"South",destinations:["Carcar"]},
 {name:"New Librando Transit, Inc.",area:"South",destinations:["Badian"]},
 {name:"Sunrays Bus Lines (Jerel Transport)",area:"South",destinations:["Oslob","Samboan","Santander"]},
 {name:"Metrolink Express Liner",area:"South",destinations:["Bato","Barili"]},
 {name:"Allowie",area:"South",destinations:["Sibonga","Simala"]},
 {name:"Andrew Liner",area:"South",destinations:["Sibonga","Simala"]},
 {name:"EDC",area:"South",destinations:["Sibonga","Simala"]},
 {name:"JRK South Transport (SEPO Bus)",area:"South / West",destinations:["Sibonga","Simala","Aloguinsan","Pinamungajan"]},
 {name:"Pioneer",area:"South",destinations:["Sibonga","Simala"]},
 {name:"Skippes",area:"South",destinations:["Sibonga","Simala"]},
 {name:"Yeoman",area:"South",destinations:["Sibonga","Simala"]},
 {name:"Befel Liner",area:"South",destinations:["Carcar"]},
 {name:"Dos Hermanos",area:"South",destinations:["Carcar"]},
 {name:"Inday Jean",area:"South",destinations:["Carcar"]},
 {name:"Chan Transit",area:"South",destinations:["Dumanjug"]},
 {name:"Socorro",area:"South",destinations:["Dumanjug"]},
 {name:"Corominas / VG Corominas Transit",area:"West",destinations:["Balamban","Asturias","Tuburan","Toledo"]},
 {name:"Calvo Bus Lines (JS Calvo Transport)",area:"West",destinations:["Balamban","Toledo"]},
 {name:"Gabe Transit / Gabe Transport (JS Calvo Transport)",area:"West",destinations:["Balamban","Toledo"]},
 {name:"Jegans Bus Liner",area:"West",destinations:["Toledo","Pinamungajan"]},
 {name:"Canoneo",area:"West",destinations:["Toledo","Pinamungajan"]},
 {name:"Jhade Trans",area:"West",destinations:["Aloguinsan","Pinamungajan"]},
 {name:"MyBus (Metro Rapid Transit Services, Inc.)",area:"Metro Cebu / Mactan",destinations:["Cebu City","Mandaue","Parkmall","Mactan","Lapu-Lapu City","Airport","Talisay","Minglanilla"]},
 {name:"Sugbo Tours (Sugbo Transit Express)",area:"Mactan",destinations:["Mactan","Lapu-Lapu City","Airport","Mandaue"]}
];

const modernPujRoutes = [
 {route:"Naga – Cebu",operator:"Actros Transport Corporation",from:["Naga"],to:["Cebu City","Cebu"]},
 {route:"Naga – IT Park",operator:"Cebu Provincial Operators Transport Cooperative",from:["Naga"],to:["IT Park"]},
 {route:"Naga – IT Park",operator:"Banawa Transport Cooperative",from:["Naga"],to:["IT Park"]},
 {route:"Naga – Cebu City – IT Park",operator:"Cordova–Lapu-Lapu Metro Cebu Transport Cooperative",from:["Naga"],to:["Cebu City","IT Park"]},
 {route:"Minglanilla – IT Park",operator:"Banawa Transport Cooperative",from:["Minglanilla"],to:["IT Park"]},
 {route:"Minglanilla – IT Park",operator:"Cebu Integrated Transport Services MPC",from:["Minglanilla"],to:["IT Park"]},
 {route:"Minglanilla – USC Main – Colon",operator:"El Pardo Transport Cooperative",from:["Minglanilla"],to:["USC Main","Colon"]},
 {route:"Minglanilla – Tabunok – IT Park",operator:"Lahug Apas Transport Cooperative",from:["Minglanilla"],to:["Tabunok","IT Park"]}
];
const money=n=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(n);
const publicVehicleName=mode=>mode==="traditional"||mode==="multicab"?"Jeepney / Multicab":(modes.find(m=>m.id===mode)?.name||mode);
const publicVehicleShort=mode=>mode==="traditional"||mode==="multicab"?"Jeepney / Multicab":(modes.find(m=>m.id===mode)?.short||mode);
async function isInsideCebu(lat,lng){
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<9.2||lat>11.5||lng<123.1||lng>124.7)return false;
 const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
 if(!response.ok)throw new Error("Unable to verify location jurisdiction");
 const address=(await response.json()).address||{};
 const administrative=[address.city,address.town,address.village,address.municipality,address.county,address.state_district,address.state,address.province].filter(Boolean).join(" ").toLowerCase();
 return administrative.includes("cebu")&&!/bohol|negros|leyte/.test(administrative);
}
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
function mergeById(seed,saved){const map=new Map(seed.map(x=>[x.id,x]));saved.forEach(x=>map.set(x.id,{...map.get(x.id),...x}));return [...map.values()]}
async function geocodePlace(place){
 const area=String(place.area||"").toLowerCase().replace(/[-–—]+/g," ");
 // Municipality-centre fallback for directory entries that do not yet have individual coordinates.
 const municipalityCentres={"san fernando":{lat:10.1625,lng:123.7075},"minglanilla":{lat:10.2447,lng:123.7964},"naga":{lat:10.2089,lng:123.7581},"carcar city":{lat:10.1061,lng:123.6402},"talisay city":{lat:10.2447,lng:123.8494},"lapu lapu city":{lat:10.3103,lng:123.9494},"cordova":{lat:10.2514,lng:123.9496}};
 const key=Object.keys(municipalityCentres).find(k=>area.includes(k));
 if(key)return {...municipalityCentres[key],displayName:`${place.name}, ${place.area}, Cebu, Philippines (municipality-centre fallback)`};
 const queries=[`${place.name}, ${place.area||"Cebu Province"}, Cebu, Philippines`,`${place.area||place.name}, Cebu Province, Philippines`];
 let lastError;
 for(const query of queries){try{const res=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);if(!res.ok)throw new Error(`Location search service returned HTTP ${res.status}`);const rows=await res.json();if(rows.length)return {lat:Number(rows[0].lat),lng:Number(rows[0].lon),displayName:rows[0].display_name};}catch(e){lastError=e;}}
 throw new Error(lastError?.message||`No coordinates found for ${place.name}. Try a nearby listed landmark.`);
}
function calcFare(mode,km,discount){
 if(!Number.isFinite(km)||km<=0)return null;
 let raw=null, basis="";
 if(mode==="traditional"||mode==="multicab"){raw=14+Math.max(0,Math.ceil(km-4))*2;basis="PUJ reference rate: ₱14 for the first 4 km, plus ₱2 per succeeding km";}
 else if(mode==="modern"){raw=17+Math.max(0,Math.ceil(km-4))*2.4;basis="₱17 for the first 4 km, plus ₱2.40 per succeeding km";}
 else if(mode==="city-bus-ordinary"){if(km>5)return null;raw=15;basis="₱15 for the first 5 km; succeeding-kilometer rate not yet supplied";}
 else if(mode==="city-bus-aircon"){if(km>5)return null;raw=18;basis="₱18 for the first 5 km; succeeding-kilometer rate not yet supplied";}
 else if(mode==="provincial-bus-ordinary"){if(km>5)return null;raw=12;basis="₱12 for the first 5 km; succeeding-kilometer rate not yet supplied";}
 else if(mode==="provincial-bus-aircon"){raw=km*2.45;basis="₱2.45 per km (no fixed base band)";}
 else return null;
 const off=raw*discount/100;return {regular:round(raw),discount:round(off),total:round(raw-off),basis};
}
function FitBounds({points}){const map=useMap();React.useEffect(()=>{if(points.length>1)map.fitBounds(points.map(p=>[p.lat,p.lng]),{padding:[35,35]});else if(points.length)map.setView([points[0].lat,points[0].lng],14)},[points,map]);return null}
function MapClickHandler({enabled,onPick}){useMapEvents({click(e){if(enabled)onPick(e.latlng)}});return null}
function FocusPoint({point}){const map=useMap();React.useEffect(()=>{if(point)map.flyTo([point.lat,point.lng],15,{duration:1})},[point,map]);return null}
export default function App(){
 const [tab,setTab]=useState("calculator"),[origin,setOrigin]=useState("south-terminal"),[destination,setDestination]=useState("sm-cebu"),[mode,setMode]=useState("traditional"),[passenger,setPassenger]=useState("regular");
 const [routes,setRoutes]=useState(()=>{const saved=JSON.parse(localStorage.getItem("cfg-routes")||"null");const seed=[...starterRoutes,...structuredRouteDirectory];return saved?mergeById(seed,saved.filter(x=>!String(x.id).startsWith("sample-")&&!(["route-115","route-116"].includes(x.id)))):seed});
 const [rules,setRules]=useState(()=>JSON.parse(localStorage.getItem("cfg-rules")||"null")||starterRules);
 const [proposals,setProposals]=useState(()=>JSON.parse(localStorage.getItem("cfg-proposals")||"null")||[]);
 const [locs,setLocs]=useState(()=>{const saved=JSON.parse(localStorage.getItem("cfg-locs")||"null");return saved?mergeById(seedLocations,saved):seedLocations});
 const [route,setRoute]=useState(null),[routeStatus,setRouteStatus]=useState("idle"),[transportSearchStatus,setTransportSearchStatus]=useState("idle"),[menu,setMenu]=useState(false),[admin,setAdmin]=useState(false);
 const [pinTarget,setPinTarget]=useState(null),[gpsPosition,setGpsPosition]=useState(null),[gpsStatus,setGpsStatus]=useState("idle"),[placeQuery,setPlaceQuery]=useState("");
 const [login,setLogin]=useState(false),[password,setPassword]=useState(""),[notice,setNotice]=useState("");
 const [editRule,setEditRule]=useState(null);
 const from=locs.find(x=>x.id===origin),to=locs.find(x=>x.id===destination),selectedMode=modes.find(x=>x.id===mode),person=passengerTypes.find(x=>x.id===passenger);
 const today=new Date().toISOString().slice(0,10);
 const fare=route?.km?calcFare(mode,route.km,person?.discount||0):null;
 const normalizeRouteText=value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
 const placeTerms=place=>{
  const raw=normalizeRouteText(place?.name||"");
  const area=normalizeRouteText(place?.area||"");
  const areaParts=String(place?.area||"").split(",").map(normalizeRouteText).filter(Boolean);
  const terms=[raw];
  if(/south bus terminal/.test(raw))terms.push("cebu south bus terminal");
  if(/north bus terminal/.test(raw))terms.push("cebu north bus terminal");
  if(/lapu lapu|mactan/.test(raw))terms.push("lapu lapu city","mactan");
  if(/san fernando/.test(raw))terms.push("san fernando");
  if(/^naga/.test(raw))terms.push("naga city","naga");
  if(/talisay/.test(raw))terms.push("talisay city","tabunok");
  if(/carbon/.test(raw))terms.push("carbon market");
  if(/guadalupe/.test(raw))terms.push("guadalupe");
  if(/colon/.test(raw))terms.push("colon");
  if(/tabunok/.test(raw))terms.push("tabunok");
  if(/sm city cebu/.test(raw))terms.push("sm city cebu");
  if(/it park/.test(raw))terms.push("cebu it park","it park");
  // Use specific barangay/neighborhood parts from the area field, but never a broad city/province label.
  const broadAreas=new Set(["cebu city","cebu province","mandaue city","lapu lapu city","talisay city","naga city","philippines"]);
  areaParts.filter(part=>!broadAreas.has(part)&&!part.includes("province")).forEach(part=>terms.push(part));
  // Keep a full area phrase only when it is itself a specific locality rather than a city-wide label.
  if(area&&!broadAreas.has(area)&&!area.includes("cebu city")&&!area.includes("province"))terms.push(area);
  return [...new Set(terms.filter(x=>x&&x.length>=3))];
 };
 const routeStops=r=>Array.isArray(r.stopSequence)&&r.stopSequence.length?r.stopSequence:[r.origin,...String(r.stops||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean),r.destination].filter(Boolean);
 const textMatches=(candidate,terms)=>{
  const text=normalizeRouteText(candidate);
  if(!text)return false;
  return terms.some(term=>{
   const normalized=normalizeRouteText(term);
   if(!normalized)return false;
   // Normalize punctuation and allow a complete multi-word name to appear inside a longer directory label.
   return text===normalized||text.includes(normalized)||normalized.includes(text);
  });
 };
 // Route-specific aliases connect a listed landmark to a named stop on that route.
 // We deliberately do not infer a boarding stop from a whole city or an unsequenced barangay.
 const ROUTE_STOP_ALIASES={
  "doc-01k":{"usc downtown campus":"Colon","university of cebu":"Colon","metro colon":"Colon","cebu metropolitan cathedral":"Parian","casa gorordo museum":"Parian"},
  "doc-04l":{"university of the philippines cebu":"JY Square","cebu provincial capitol area":"Gorordo Avenue","cebu business park":"Ayala Center Cebu"},
  "doc-06b":{"guadalupe church":"Guadalupe","cebu provincial capitol":"Capitol Site","cebu doctors university hospital":"Capitol Site","fuente osmena circle":"Fuente Osmeña Circle"},
  "doc-07b":{"banawa public market":"Banawa","vicente sotto memorial medical center":"B. Rodriguez Street","cebu institute of medicine":"Fuente Osmeña Circle"},
  "doc-13c":{"university of san carlos talamban campus":"Talamban"},
  "doc-17b":{"waterfront cebu city hotel":"Cebu IT Park","jy square mall":"Lahug","usc downtown campus":"Colon"},
  "doc-17c":{"jy square mall":"Lahug","university of the philippines cebu":"Lahug","mango square":"Mango Avenue","robinsons fuente":"Ramos"},
  "doc-42e":{"talisay city public market":"Poblacion, Talisay City","tabunok public market":"Tabunok","pardo church":"Pardo","cebu provincial capitol":"Escario","jy square mall":"Lahug"},
  "doc-my03":{"airport":"Mactan-Cebu International Airport"},
  "doc-mi-01a":{"mactan shrine":"Punta Engaño"},
  "doc-mi-02b":{"marigondon public market":"Marigondon"},
  "doc-mi-03a":{"cordova public market":"Cordova"}
 };
 const stopIndex=(r,place)=>{
  const terms=placeTerms(place),stops=routeStops(r);
  const exact=stops.findIndex(stop=>textMatches(stop,terms));
  if(exact>=0)return exact;
  const aliases=ROUTE_STOP_ALIASES[r.id]||{};
  for(const [alias,target] of Object.entries(aliases)){
   if(textMatches(alias,terms)){
    const index=stops.findIndex(stop=>normalizeRouteText(stop)===normalizeRouteText(target));
    if(index>=0)return index;
   }
  }
  return -1;
 };
 const routeCoverageMatch=(r,place)=>{
  if(!place)return false;
  const terms=placeTerms(place);
  const stopMatch=routeStops(r).some(stop=>textMatches(stop,terms));
  const aliasMatch=(Array.isArray(r.aliases)?r.aliases:[]).some(alias=>textMatches(alias,terms)||terms.some(term=>textMatches(term,[alias])));
  const barangayMatch=(Array.isArray(r.barangays)?r.barangays:[]).some(barangay=>textMatches(barangay,terms)||terms.some(term=>textMatches(term,[barangay])));
  return stopMatch||aliasMatch||barangayMatch;
 };
 const allDirectoryRoutes=[...structuredRouteDirectory,...routes.filter(r=>!structuredRouteDirectory.some(x=>x.id===r.id))].filter(isRouteAllowedByCoverage);
 const matchingRoutes=(from&&to&&from.id!==to.id)?routes.filter(r=>isRouteAllowedByCoverage(r)&&r.code&&r.code!=="—"&&routeStops(r).length>1&&stopIndex(r,from)>=0&&stopIndex(r,to)>=0&&stopIndex(r,from)!==stopIndex(r,to)):[];
 const structuredMatches=(from&&to&&from.id!==to.id)?structuredRouteDirectory.filter(r=>isRouteAllowedByCoverage(r)&&stopIndex(r,from)>=0&&stopIndex(r,to)>=0&&stopIndex(r,from)!==stopIndex(r,to)):[];
 const directRouteSuggestions=[...structuredMatches,...matchingRoutes.filter(r=>!structuredRouteDirectory.some(x=>x.id===r.id))];
 // Find one-transfer journeys only where both routes share the same explicitly listed stop.
 // The transfer point must be an actual stop on both route sequences, not merely a nearby barangay.
 const transferSuggestions=(()=>{
  if(!from||!to||from.id===to.id||directRouteSuggestions.length)return [];
  const candidates=[];
  for(const first of allDirectoryRoutes){
   const firstStart=stopIndex(first,from); if(firstStart<0)continue;
   const firstStops=routeStops(first);
   for(const second of allDirectoryRoutes){
    if(first.id===second.id)continue;
    const secondEnd=stopIndex(second,to); if(secondEnd<0)continue;
    const secondStops=routeStops(second);
    for(let i=firstStart+1;i<firstStops.length;i++){
     const shared=normalizeRouteText(firstStops[i]);
     const j=secondStops.findIndex((stop,index)=>index<secondEnd&&normalizeRouteText(stop)===shared);
     if(j<0)continue;
     const transfer=firstStops[i];
     if(normalizeRouteText(transfer)===normalizeRouteText(from.name)||normalizeRouteText(transfer)===normalizeRouteText(to.name))continue;
     candidates.push({id:`${first.id}__${second.id}`,first,second,transfer,firstSegment:firstStops.slice(firstStart,i+1),secondSegment:secondStops.slice(j,secondEnd+1)});
    }
   }
  }
  const unique=new Map();
  candidates.sort((a,b)=>(a.firstSegment.length+a.secondSegment.length)-(b.firstSegment.length+b.secondSegment.length));
  for(const item of candidates){const key=`${item.first.id}|${item.second.id}|${normalizeRouteText(item.transfer)}`;if(!unique.has(key))unique.set(key,item);}
  return [...unique.values()].slice(0,5);
 })();
 // Coverage-only matches remain clearly separate from direct rides and transfer journeys.
 const corridorRoutes=(from&&to&&from.id!==to.id)?allDirectoryRoutes.filter(r=>!directRouteSuggestions.some(m=>m.id===r.id)&&(routeCoverageMatch(r,from)||routeCoverageMatch(r,to)||((r.code==="46")&&[from,to].some(p=>/\bnaga\b|\bsan fernando\b/i.test(`${p.name} ${p.area}`))))).map(r=>({...r,coverageMatchCount:Number(routeCoverageMatch(r,from))+Number(routeCoverageMatch(r,to)),corridorOnly:!routeCoverageMatch(r,from)||!routeCoverageMatch(r,to)})).sort((a,b)=>b.coverageMatchCount-a.coverageMatchCount):[];
 const displayedRouteSuggestions=directRouteSuggestions.length?directRouteSuggestions:corridorRoutes;
 const routeCodeMatches=directRouteSuggestions.filter(r=>r.mode===mode);
 const placeText=p=>normalizeRouteText(`${p?.name||""} ${p?.area||""}`);
 const modernMatches=(from&&to&&from.id!==to.id)?modernPujRoutes.filter(r=>{
  const originText=placeText(from),destinationText=placeText(to);
  const contains=(text,terms)=>terms.some(term=>text.includes(normalizeRouteText(term)));
  return contains(originText,r.from)&&contains(destinationText,r.to);
 }):[];
 const busMatches=(from&&to&&from.id!==to.id)?busOperators.filter(op=>{
  const has=(p)=>{const txt=placeText(p);return op.destinations.some(d=>{const t=normalizeRouteText(d);return t.length>2&&(txt.includes(t)||t.includes(normalizeRouteText(p?.name||"")))})};
  const originIsTerminal=/south bus terminal|north bus terminal|it park|cebu city/.test(placeText(from));
  return (has(to)&&(has(from)||originIsTerminal))||(has(from)&&has(to));
 }):[];
 const busModeIds=busMatches.some(op=>op.name.startsWith("MyBus"))?["city-bus-ordinary","city-bus-aircon"]:(busMatches.length?["provincial-bus-ordinary","provincial-bus-aircon"]:[]);
 const recommendedModeIds=[...new Set([...displayedRouteSuggestions.map(r=>r.mode),...(modernMatches.length?["modern"]:[]),...busModeIds])];
 useEffect(()=>{
  if(!from||!to||from.id===to.id){setTransportSearchStatus("idle");return;}
  // Matching is performed locally against the route directory; do not fake a delayed network search.
  setTransportSearchStatus("complete");
 },[origin,destination,directRouteSuggestions.length,transferSuggestions.length,corridorRoutes.length,modernMatches.length,busMatches.length]);
 async function selectMapPoint(lat,lng){
  const target=pinTarget;
  if(!target)return;
  try{if(!await isInsideCebu(lat,lng)){setNotice("No available fare information. Please pin a location within Cebu Province.");setPinTarget(null);setRoute({outside:true});setRouteStatus("done");return;}}catch(e){setNotice("We could not verify this map point. Please select a listed Cebu location instead.");return;}
  const id=target==="origin"?"origin-map-pin":"destination-map-pin";
  const point={id,name:target==="origin"?"Pinned starting point":"Pinned destination",area:"Cebu Province",lat,lng,category:"Pinned map point"};
  setLocs(prev=>[...prev.filter(x=>x.id!==id),point]);
  if(target==="origin")setOrigin(id);else setDestination(id);
  setRoute(null);setRouteStatus("idle");setPinTarget(null);setNotice(`${target==="origin"?"Origin":"Destination"} pinned. The other pin is preserved.`);
 }
 async function chooseLocation(which,id){
  const selected=locs.find(x=>x.id===id);if(!selected)return;
  (which==="origin"?setOrigin:setDestination)(id);setRoute(null);setRouteStatus("idle");
  if(!Number.isFinite(selected.lat)||!Number.isFinite(selected.lng)){
   setNotice(`Finding map position for ${selected.name}…`);
   try{const coords=await geocodePlace(selected);setLocs(prev=>prev.map(x=>x.id===id?{...x,...coords}:x));setNotice(`${selected.name} located on the map.`)}
   catch(e){setNotice(`Could not automatically locate ${selected.name}. You can still pin its exact position on the map.`)}
  }
 }
 function useMyLocation(){
  if(!navigator.geolocation){setGpsStatus("error");setNotice("This browser does not support GPS location.");return;}
  setGpsStatus("loading");setNotice("");
  navigator.geolocation.getCurrentPosition(pos=>{
   const {latitude,longitude,accuracy}=pos.coords;isInsideCebu(latitude,longitude).then(inside=>{if(!inside){setGpsStatus("error");setRoute({outside:true});setRouteStatus("done");setNotice("No available fare information. Your current location is outside Cebu Province.");return;}const id=`gps-${Date.now()}`;
   const point={id,name:"My current location",area:"Cebu Province",lat:latitude,lng:longitude};
   setLocs(prev=>[...prev.filter(x=>x.id!=="gps-current"&&!String(x.id).startsWith("gps-")),{...point,id:"gps-current"}]);
   setOrigin("gps-current");setGpsPosition({lat:latitude,lng:longitude,accuracy});setRoute(null);setGpsStatus("done");setNotice(`Current location found (accuracy about ${Math.round(accuracy)} m).`);}).catch(()=>{setGpsStatus("error");setNotice("We could not verify your GPS location. Please select a listed Cebu location instead.");});
  },err=>{setGpsStatus("error");setNotice(err.code===1?"Location permission was denied. Allow location access in your browser and try again.":"Unable to determine your location. Check your device location settings and try again.");},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 }
 async function findRoute(){
  if(!from||!to||from.id===to.id){setNotice("Choose two different locations.");return}
  setRouteStatus("loading");setRoute(null);setNotice("Resolving selected locations…");
  try{
   let a=from,b=to;
   if(!Number.isFinite(a.lat)||!Number.isFinite(a.lng))a={...a,...await geocodePlace(a)};
   if(!Number.isFinite(b.lat)||!Number.isFinite(b.lng))b={...b,...await geocodePlace(b)};
   const inCebuBounds=p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=9.2&&p.lat<=11.5&&p.lng>=123.1&&p.lng<=124.7;
   if(!inCebuBounds(a)||!inCebuBounds(b)){setRoute({outside:true});setRouteStatus("done");setNotice("No available fare information. Cebu Fare Guide only supports trips with both endpoints inside Cebu Province.");return;}
   // Stored directory locations are already Cebu entries. Only user-placed pins/GPS require live reverse-geocoding.
   const needsLiveCheck=p=>String(p.id).includes("map-pin")||String(p.id).startsWith("gps-");
   for(const point of [a,b]){if(needsLiveCheck(point)&&!(await isInsideCebu(point.lat,point.lng))){setRoute({outside:true});setRouteStatus("done");setNotice("No available fare information. One of the selected points is outside Cebu Province.");return;}}
   setLocs(prev=>prev.map(x=>x.id===a.id?a:x.id===b.id?b:x));
   const url=`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
   const res=await fetch(url);if(!res.ok)throw new Error("Routing service unavailable");
   const data=await res.json();if(!data.routes?.length)throw new Error("No road route found");
   const r=data.routes[0];setRoute({km:r.distance/1000,minutes:r.duration/60,coords:r.geometry.coordinates.map(([lng,lat])=>[lat,lng])});setRouteStatus("done");
  }catch(e){setRouteStatus("error");setNotice(`Route lookup failed: ${e?.message||"the routing service did not return a road route"}. Check the internet connection and try again. Distance and fare are not estimated.`);}
 }
 // Automatically request the road geometry whenever both selected points change.
 useEffect(()=>{
  if(!from||!to||from.id===to.id)return;
  const timer=setTimeout(()=>{findRoute()},350);
  return ()=>clearTimeout(timer);
 },[origin,destination]);
 function swap(){setOrigin(destination);setDestination(origin);setRoute(null)}
 function saveRules(next){setRules(next);localStorage.setItem("cfg-rules",JSON.stringify(next))}
 function saveLocs(next){setLocs(next);localStorage.setItem("cfg-locs",JSON.stringify(next))}
 function openAdmin(){setLogin(true);setPassword("");setNotice("")}
 function doLogin(e){e.preventDefault();if(password=== (import.meta.env.VITE_ADMIN_PASSWORD||"change-this-demo-password")){setAdmin(true);setLogin(false);setTab("admin");setNotice("")}else setNotice("Incorrect demo password. Configure VITE_ADMIN_PASSWORD for your own local build.");}
 function saveRoutes(next){setRoutes(next);localStorage.setItem("cfg-routes",JSON.stringify(next));}
 function saveProposals(next){setProposals(next);localStorage.setItem("cfg-proposals",JSON.stringify(next));}
 function approveProposal(id){const item=proposals.find(p=>p.id===id);if(!item)return;const approved={...item,id:`approved-${item.id}`,status:"verified",approvedAt:new Date().toISOString()};saveRules([...rules,approved]);saveProposals(proposals.map(p=>p.id===id?{...p,status:"approved"}:p));}
 const activeRule=rules.find(r=>r.mode===mode);
 const demo=!activeRule;
 return <div className="app-shell">
  <header className="topbar"><div className="brand" onClick={()=>setTab("calculator")}><div className="brand-mark"><Route size={22}/></div><div><b>Cebu Fare Guide</b><small>Know your fare before you travel.</small></div></div><nav><button className={tab==="calculator"?"nav active":"nav"} onClick={()=>setTab("calculator")}>Fare calculator</button><button className={tab==="lgu"?"nav active":"nav"} onClick={()=>setTab("lgu")}>LGU portal</button><button className={tab==="about"?"nav active":"nav"} onClick={()=>setTab("about")}>About</button>{admin&&<button className={tab==="admin"?"nav active":"nav"} onClick={()=>setTab("admin")}>Admin</button>}</nav><button className="admin-link" onClick={admin?()=>{setAdmin(false);setTab("calculator")}:openAdmin}><Settings size={16}/><span>{admin?"Sign out":"Admin"}</span></button></header>
  <main>
  {tab==="calculator"&&<><section className="hero"><div><div className="eyebrow">CEBU PROVINCE • TRANSPORT FARE REFERENCE</div><h1>Your route.<br/><em>Your fare.</em></h1><p>Choose your origin and destination to automatically find possible public transportation. Calculate road distance and fare when you need an estimate.</p></div><div className="hero-stats"><div><MapPin/><b>Point to point</b><small>Choose your stops</small></div><div><Calculator/><b>Fare breakdown</b><small>Clear calculations</small></div><div><ShieldCheck/><b>Discount aware</b><small>Eligible passengers</small></div></div></section>
  <div className="content-grid"><section className="panel search-panel"><div className="panel-heading"><div><span className="eyebrow">TRIP DETAILS</span><h2>Where are you going?</h2></div><span className="step">01 / ROUTE</span></div>
   <div className="place-search"><Search size={16}/><input value={placeQuery} onChange={e=>setPlaceQuery(e.target.value)} placeholder="Search destinations, barangays, landmarks, terminals…"/><span>{locs.filter(l=>!placeQuery||`${l.name} ${l.area} ${l.category||""}`.toLowerCase().includes(placeQuery.toLowerCase())).length} matches</span></div>
   <label className="field-label">ORIGIN</label><div className="select-wrap"><MapPin className="field-icon green"/><select value={origin} onChange={e=>chooseLocation("origin",e.target.value)}>{locs.filter(l=>l.id===origin||l.id===destination||!placeQuery||`${l.name} ${l.area} ${l.category||""}`.toLowerCase().includes(placeQuery.toLowerCase())).map(l=><option key={l.id} value={l.id}>{l.name} — {l.area}</option>)}</select><ChevronDown/></div>
   <button className="swap" onClick={swap} title="Swap origin and destination"><ArrowDownUp size={17}/></button>
   <label className="field-label">DESTINATION</label><div className="select-wrap"><MapPin className="field-icon red"/><select value={destination} onChange={e=>chooseLocation("destination",e.target.value)}>{locs.filter(l=>l.id===origin||l.id===destination||!placeQuery||`${l.name} ${l.area} ${l.category||""}`.toLowerCase().includes(placeQuery.toLowerCase())).map(l=><option key={l.id} value={l.id}>{l.name} — {l.area}</option>)}</select><ChevronDown/></div>
   <div className="recommendation-panel automatic-search-panel">
    <div className="recommendation-heading"><div><span className="eyebrow">AUTOMATIC TRANSPORTATION FINDER</span><h3>Available ways to travel</h3></div><span className="recommendation-count">{transportSearchStatus==="searching"?"Searching…":transportSearchStatus==="complete"?`${directRouteSuggestions.length} direct · ${transferSuggestions.length} transfers · ${corridorRoutes.length} route leads`:"Waiting"}</span></div>
    {!from||!to||from.id===to.id?<p className="recommendation-empty">Select two different locations. We'll automatically search for transportation once both are selected.</p>:transportSearchStatus==="searching"?<p className="recommendation-empty"><Search size={14}/> Checking route codes, vehicle types, operators, and travel directions…</p>:<>
     {directRouteSuggestions.length>0?<><div className="journey-status"><CheckCircle2 size={14}/> Direct ride options found</div><div className="journey-option-list">{directRouteSuggestions.map(r=>{const stops=routeStops(r);const fromIndex=stopIndex(r,from);const toIndex=stopIndex(r,to);const segment=fromIndex<=toIndex?stops.slice(fromIndex,toIndex+1):stops.slice(toIndex,fromIndex+1).reverse();const vehicle=publicVehicleName(r.mode);return <article className="journey-option" key={r.id}><div className="journey-option-top"><div className="journey-code">{r.code&&r.code!=="—"?r.code:"NO CODE"}</div><div className="journey-route-title"><b>{r.serviceName||`${r.origin} – ${r.destination}`}</b><small>{vehicle}{r.operator?` · ${r.operator}`:""}</small></div><span className="direct-label">Direct ride</span></div><div className="journey-stops"><div className="journey-stop"><span className="journey-dot start-dot"/><div><small>BOARD HERE</small><b>{from.name}</b></div></div><div className="journey-stop-line">{segment.slice(1,-1).length>0?<><small>PASS THROUGH</small><span>{segment.slice(1,-1).join(" → ")}</span></>:<small>Direct boarding-to-drop-off segment</small>}</div><div className="journey-stop"><span className="journey-dot end-dot"/><div><small>GET OFF HERE</small><b>{to.name}</b></div></div></div><div className="journey-option-foot"><span><CheckCircle2 size={14}/> No transfer needed</span><small>{r.status==="verified"?"Verified listing":"Route is listed; confirm current operation and exact stop with the operator"}</small></div>{r.notes&&<p className="journey-note">{r.notes}</p>}</article>})}</div></>:<div className="journey-no-direct"><b>No direct ride found in the current route directory.</b><p>We're checking ordered stops as well as route landmark aliases and barangays. Coverage-only matches are shown separately because those fields do not establish exact stop order or boarding points.</p></div>}
     {(transferSuggestions.length>0||corridorRoutes.length>0||modernMatches.length>0||busMatches.length>0)&&<div className="automatic-alternatives"><b>Other possible transportation</b>{transferSuggestions.map(j=><div className="automatic-alternative transfer-alternative" key={j.id}><strong>1 transfer · {j.first.code&&j.first.code!=="—"?j.first.code:j.first.serviceName} → {j.second.code&&j.second.code!=="—"?j.second.code:j.second.serviceName}</strong><small>Take {j.first.code&&j.first.code!=="—"?`Route ${j.first.code}`:j.first.serviceName} to {j.transfer}, then transfer to {j.second.code&&j.second.code!=="—"?`Route ${j.second.code}`:j.second.serviceName} · {j.transfer} → {to.name}</small></div>)}{corridorRoutes.map(r=><div className="automatic-alternative" key={r.id}><strong>{r.code&&r.code!=="—"?r.code:"NO PUBLISHED CODE"} · {r.serviceName||`${r.origin} – ${r.destination}`}</strong><small>{publicVehicleName(r.mode)}{r.operator?` · ${r.operator}`:""} · {r.code==="46"?"Possible south-corridor lead only; the supplied inventory lists Carcar–Tabunok but does not confirm Naga/San Fernando as stops":"One selected area appears in the documented route endpoints, aliases, or barangays; the other point is not established"}</small></div>)}{modernMatches.map(op=><div className="automatic-alternative" key={op.route+op.operator}><strong>{op.route}</strong><small>Modern PUJ · {op.operator} · Confirm boarding and drop-off points</small></div>)}{busMatches.map(op=><div className="automatic-alternative" key={op.name}><strong>{op.name}</strong><small>{op.area} · Listed corridor destinations: {op.destinations.join(", ")}</small></div>)}</div>}
     {directRouteSuggestions.length===0&&transferSuggestions.length===0&&corridorRoutes.length===0&&modernMatches.length===0&&busMatches.length===0&&<p className="recommendation-empty">No matching transportation record is available for these exact points yet. Try a nearby terminal or landmark. We won't invent a route or route code.</p>}
    </>}
   </div>
   <div className="field-label transport-label">SELECT TRANSPORT FOR FARE ESTIMATE</div><div className="mode-grid">{[{id:"jeepney-multicab",name:"Jeepney / Multicab",short:"Jeepney / Multicab",icon:"🚐"},...modes.filter(m=>m.id!=="traditional"&&m.id!=="multicab")].map(m=>{const chosen=m.id==="jeepney-multicab"?(mode==="traditional"||mode==="multicab"):mode===m.id;return <button key={m.id} className={"mode-card "+(chosen?"chosen":"")} onClick={()=>setMode(m.id==="jeepney-multicab"?"traditional":m.id)}><span>{m.icon}</span><b>{m.name}</b>{chosen&&<CheckCircle2 size={16} className="checked"/>}</button>})}</div>
   <label className="field-label">PASSENGER CATEGORY</label><div className="select-wrap"><ShieldCheck className="field-icon green"/><select value={passenger} onChange={e=>setPassenger(e.target.value)}>{passengerTypes.map(p=><option key={p.id} value={p.id}>{p.name}{p.discount?" — 20% discount (subject to eligibility)":""}</option>)}</select><ChevronDown/></div>

   <button className="primary-btn" onClick={findRoute} disabled={routeStatus==="loading"}>{routeStatus==="loading"?"Finding road route…": "Calculate road distance & fare"}<Route size={18}/></button>
   {notice&&<div className="notice"><Info size={16}/>{notice}</div>}
   <p className="fineprint">Road distance is a road-network estimate, not a confirmed public-transport route distance. Fare calculation uses the reference rates supplied for the selected vehicle. Some bus rates remain incomplete for trips beyond 5 km.</p>
  </section>
  <section className="results-column"><div className="map-card"><div className="map-top"><div><span className="eyebrow">INTERACTIVE ROUTE MAP</span><h3>{from?.name||"Origin"} <span>→</span> {to?.name||"Destination"}</h3></div><span className="map-pill"><span className="live-dot"/> Interactive</span></div><div className="map-tools"><button className={pinTarget==="origin"?"map-tool selected":"map-tool"} onClick={()=>{setPinTarget("origin");setNotice("Tap the map to place your starting point.")}}><MapPin size={15}/> Pin origin</button><button className={pinTarget==="destination"?"map-tool selected":"map-tool"} onClick={()=>{setPinTarget("destination");setNotice("Tap the map to place your destination.")}}><MapPin size={15}/> Pin destination</button><button className="map-tool gps-tool" onClick={useMyLocation} disabled={gpsStatus==="loading"}><span className="gps-icon">◎</span>{gpsStatus==="loading"?"Finding you…":"Use my GPS"}</button></div>{pinTarget&&<div className="map-instruction">Tap anywhere on the map to set the {pinTarget}. <button onClick={()=>setPinTarget(null)}>Cancel</button></div>}<MapContainer center={[10.3157,123.8854]} zoom={11} scrollWheelZoom={true} className="map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapClickHandler enabled={!!pinTarget} onPick={p=>selectMapPoint(p.lat,p.lng)}/><FocusPoint point={gpsPosition}/>{locs.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.id!==from?.id&&p.id!==to?.id&&p.id!=="gps-current").map(p=><CircleMarker key={p.id} center={[p.lat,p.lng]} radius={5} pathOptions={{color:"#2563eb",weight:1,fillColor:"#60a5fa",fillOpacity:.8}}><Tooltip>{p.name} — {p.area}{p.category?` · ${p.category}`:""}</Tooltip></CircleMarker>)}{from&&Number.isFinite(from.lat)&&Number.isFinite(from.lng)&&<Marker position={[from.lat,from.lng]} />}{to&&Number.isFinite(to.lat)&&Number.isFinite(to.lng)&&<Marker position={[to.lat,to.lng]} />}{gpsPosition&&<Marker position={[gpsPosition.lat,gpsPosition.lng]}/>}{[from,to].every(p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng))&&<FitBounds points={[from,to]}/ >}{route?.coords&&<Polyline positions={route.coords} pathOptions={{color:"#16836d",weight:5}}/>}</MapContainer><div className="map-hint">{locs.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)).length} directory points currently have map coordinates. Blue dots mark these landmarks; select another drop point to locate it and highlight it on the map. Hover or tap a dot to see its name and category.</div></div>
   <div className="result-card"><div className="result-head"><div><span className="eyebrow">YOUR FARE SUMMARY</span><h3>Trip estimate</h3></div><span className="mode-tag">{selectedMode?.icon} {publicVehicleShort(mode)}</span></div>
   {!route&&<div className="empty-result"><div className="empty-icon"><Route size={25}/></div><b>Your route details will appear here</b><span>Choose your origin, destination and transport type, then calculate.</span></div>}
   {route?.outside&&<div className="unavailable"><AlertTriangle size={19}/><div><b>No available fare information</b><p>Cebu Fare Guide only supports trips with both the origin and destination inside Cebu Province. Please choose Cebu locations.</p></div></div>}
   {route&&!route.outside&&<><div className="metrics"><div><span>DISTANCE</span><strong>{route.km.toFixed(1)} <small>KM</small></strong></div><div><span>EST. DRIVE TIME</span><strong>{Math.round(route.minutes)} <small>MIN</small></strong></div></div>
   {fare?<><div className="fare-breakdown"><div className="fare-total"><span>Estimated passenger fare</span><strong>{money(fare.total)}</strong></div><div className="break-row"><span>Calculated regular fare</span><b>{money(fare.regular)}</b></div><div className="break-row discount"><span>{person.name} discount ({person.discount}%)</span><b>−{money(fare.discount)}</b></div><div className="break-row"><span>Passenger pays</span><b>{money(fare.total)}</b></div></div><div className="notice"><ShieldCheck size={15}/> Calculation basis: {fare.basis}. These are user-provided reference rates and have not been independently certified.</div><div className="journey-recommendations"><div className="journey-recommendations-heading"><div><span className="eyebrow">YOUR SUGGESTED JOURNEY</span><h3>Direct ride options</h3></div><span className="journey-status"><CheckCircle2 size={14}/> Route match</span></div>{directRouteSuggestions.length>0?<div className="journey-option-list">{directRouteSuggestions.map(r=>{const stops=routeStops(r);const fromIndex=stopIndex(r,from);const toIndex=stopIndex(r,to);const segment=fromIndex<=toIndex?stops.slice(fromIndex,toIndex+1):stops.slice(toIndex,fromIndex+1).reverse();const vehicle=publicVehicleName(r.mode);return <article className="journey-option" key={r.id}><div className="journey-option-top"><div className="journey-code">{r.code&&r.code!=="—"?r.code:"NO CODE"}</div><div className="journey-route-title"><b>{r.serviceName||`${r.origin} – ${r.destination}`}</b><small>{vehicle}{r.operator?` · ${r.operator}`:""}</small></div><span className="direct-label">Direct route listed</span></div><div className="journey-stops"><div className="journey-stop"><span className="journey-dot start-dot"/><div><small>BOARD HERE</small><b>{from.name}</b></div></div><div className="journey-stop-line">{segment.slice(1,-1).length>0?<><small>PASS THROUGH</small><span>{segment.slice(1,-1).join(" → ")}</span></>:<small>Direct boarding-to-drop-off segment</small>}</div><div className="journey-stop"><span className="journey-dot end-dot"/><div><small>GET OFF HERE</small><b>{to.name}</b></div></div></div><div className="journey-option-foot"><span><CheckCircle2 size={14}/> Both selected points appear along this route</span><small>{r.status==="verified"?"Verified listing":"Current operation and exact stop location still need confirmation"}</small></div>{r.notes&&<p className="journey-note">{r.notes}</p>}</article>})}</div>:<div className="journey-no-direct"><b>No direct ride is listed for these exact points yet.</b><p>Try a nearby terminal, landmark, or major stop. The other vehicle suggestions may help identify a possible connection, but we won't label them as a direct ride.</p></div>}</div></>:<div className="unavailable"><AlertTriangle size={19}/><div><b>Fare cannot yet be calculated for this distance or vehicle</b><p>The succeeding-kilometer rate for this bus category has not been provided, or no reference rate is available for this vehicle. The road distance is still shown; no missing rate is invented.</p></div></div>}
   
   {busMatches.length>0&&<div className="route-code-match"><div className="route-code-match-heading"><BusFront size={17}/><b>Bus operators serving this corridor</b></div><div className="bus-operator-list">{busMatches.map(op=><div key={op.name}><span>{op.name}</span><small>{op.area} · Listed destinations: {op.destinations.join(", ")}</small></div>)}</div></div>}
   <div className="result-foot"><span><Info size={14}/> Fare depends on actual operator route and fare matrix.</span><span>Updated data required</span></div></>}
   </div></section></div>
  <section className="trust-strip"><div><ShieldCheck/><b>Transparent fares</b><span>See the calculation basis</span></div><div><Database/><b>Verified data first</b><span>No invented fare quotations</span></div><div><MapPin/><b>Cebu-wide ambition</b><span>Expand location coverage systematically</span></div></section></>}

  {tab==="lgu"&&<LGUPortal proposals={proposals} saveProposals={saveProposals}/>}
  {tab==="about"&&<section className="panel info-page"><span className="eyebrow">ABOUT THE PROJECT</span><h2>Helping Cebu commuters make informed trips.</h2><p>Cebu Fare Guide is a fare-information project designed to help passengers understand route distance, applicable fare rules and eligible discounts.</p><div className="warning"><AlertTriangle/> This build includes a broad Cebu drop-point directory and user-supplied route listings. Some map coordinates and route alignments still require verification, and no fare matrix is certified. It must not be treated as an official fare quotation or a substitute for the posted fare guide.</div><h3>What is included</h3><ul><li>Point-to-point route lookup using road routing data.</li><li>Transportation categories: traditional jeepneys within Cebu City; multicabs limited to Talisay–Carcar in the south and Mandaue–Danao in the north; modern PUJ and buses follow their documented routes.</li><li>Passenger categories with configurable 20% discount handling.</li><li>Administrator screen for local starter data management.</li></ul><h3>Data and service notes</h3><p>Map tiles and road routing use OpenStreetMap-based public services. Availability, terms and rate limits apply. A production release should use a dependable routing provider, authoritative Cebu route inventory, and verified LTFRB/operator fare schedules.</p></section>}
  {tab==="admin"&&admin&&<AdminPanel rules={rules} locations={locs} routes={routes} proposals={proposals} saveRules={saveRules} saveLocs={saveLocs} saveRoutes={saveRoutes} saveProposals={saveProposals} approveProposal={approveProposal}/>}
  </main><footer><b>Cebu Fare Guide</b><span>Independent fare-information prototype • Not an LTFRB product</span><span>© {new Date().getFullYear()} Cebu Fare Guide</span></footer>
  {login&&<div className="modal-backdrop"><form className="modal" onSubmit={doLogin}><button type="button" className="modal-close" onClick={()=>setLogin(false)}><X/></button><div className="brand-mark"><Settings/></div><h2>Administrator access</h2><p>Enter the locally configured demo password. Do not deploy with the default password.</p><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" autoFocus/><button className="primary-btn">Sign in <ExternalLink size={16}/></button><small>Default local demo password: change-this-demo-password</small></form></div>}
 </div>
}
function RouteFinder({routes}){
 const [query,setQuery]=useState(""),[filter,setFilter]=useState("all");
 const shown=routes.filter(r=>isRouteAllowedByCoverage(r)&&(filter==="all"||(filter==="jeepney-multicab"?(r.mode==="traditional"||r.mode==="multicab"):r.mode===filter))&&[r.code,r.origin,r.destination,r.stops,r.operator].join(" ").toLowerCase().includes(query.toLowerCase()));
 return <section className="panel route-page"><div className="panel-heading"><div><span className="eyebrow">CEBU PUBLIC TRANSPORT</span><h2>Find a route by code</h2><p className="muted">Search jeepney / multicab, modern jeepney, and bus routes.</p></div><span className="mode-tag">{routes.length} entries</span></div>
 <div className="route-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter route code (e.g. 01K, 45B) or destination"/></div>
 <div className="route-filters"><button className={filter==="all"?"filter-active":""} onClick={()=>setFilter("all")}>All vehicles</button><button className={filter==="jeepney-multicab"?"filter-active":""} onClick={()=>setFilter("jeepney-multicab")}>🚐 Jeepney / Multicab</button>{modes.filter(m=>m.id!=="traditional"&&m.id!=="multicab").map(m=><button key={m.id} className={filter===m.id?"filter-active":""} onClick={()=>setFilter(m.id)}>{m.icon} {m.name}</button>)}</div>
 <div className="route-list">{shown.length?shown.map(r=><article className="route-item" key={r.id}><div className="route-code">{r.code}</div><div className="route-info"><b>{publicVehicleName(r.mode)}</b><p>{r.origin&&r.destination?`${r.origin} → ${r.destination}`:"Origin and destination not yet confirmed"}</p>{r.stops&&<small>Major stops: {r.stops}</small>}{r.operator&&<small>Operator: {r.operator}</small>}</div><span className={"status-chip "+(r.status==="verified"?"verified":"pending")}>{r.status==="verified"?"Verified":"Needs verification"}</span></article>):<div className="empty-result"><b>No matching routes found</b><span>Try another code, destination, or vehicle type.</span></div>}</div>
 <div className="notice"><Info size={16}/> Routes and codes are transcribed from user-provided listings. Entries are marked unverified until current alignments, operators, and official route records are confirmed.</div>
 </section>
}
function LGUPortal({proposals,saveProposals}){
 const [form,setForm]=useState({lgu:"",mode:"traditional",routeCode:"",origin:"",destination:"",baseFare:"",baseKm:"",perKm:"",effectiveDate:"",reference:""});
 const [fileName,setFileName]=useState(""); const [message,setMessage]=useState("");
 const set=(key,value)=>setForm(old=>({...old,[key]:value}));
 function submit(e){e.preventDefault();if(!form.lgu.trim()||form.baseFare===""||form.baseKm===""||form.perKm===""||!form.reference.trim()||!form.effectiveDate){setMessage("Please complete the LGU, fare-rate fields, effective date, and source/approval reference.");return;}const item={...form,id:`proposal-${Date.now()}`,baseFare:Number(form.baseFare),baseKm:Number(form.baseKm),perKm:Number(form.perKm),label:`${form.lgu} — ${modes.find(m=>m.id===form.mode)?.name}`,status:"pending",submittedAt:new Date().toISOString(),attachment:fileName,notes:"Submitted by LGU for administrator review."};saveProposals([...proposals,item]);setMessage("Fare schedule submitted for review. It will not be used in the public calculator until approved.");setForm({lgu:"",mode:"traditional",routeCode:"",origin:"",destination:"",baseFare:"",baseKm:"",perKm:"",effectiveDate:"",reference:""});setFileName("");}
 async function importCSV(file){if(!file)return;const content=await file.text();const lines=content.trim().split(/\r?\n/);if(lines.length<2){setMessage("The CSV file has no data rows.");return;}const headers=lines[0].split(",").map(x=>x.trim().toLowerCase());const idx=k=>headers.indexOf(k);const imported=lines.slice(1).filter(line=>line.trim()).map((line,i)=>{const cells=line.split(",");const read=k=>idx(k)>=0?(cells[idx(k)]||"").trim().replace(/^"|"$/g,""):"";return {id:`csv-${Date.now()}-${i}`,lgu:read("lgu"),mode:read("mode")||"traditional",routeCode:read("route_code"),origin:read("origin"),destination:read("destination"),baseFare:read("base_fare")===""?NaN:Number(read("base_fare")),baseKm:read("base_km")===""?NaN:Number(read("base_km")),perKm:read("per_km")===""?NaN:Number(read("per_km")),effectiveDate:read("effective_date"),reference:read("reference"),label:`${read("lgu")} — ${read("mode")}`,status:"pending",submittedAt:new Date().toISOString(),attachment:file.name,notes:"Imported from LGU CSV submission."};}).filter(x=>x.lgu&&x.effectiveDate&&x.reference&&Number.isFinite(x.baseFare)&&Number.isFinite(x.baseKm)&&Number.isFinite(x.perKm));if(!imported.length){setMessage("No valid rows found. Check the template headers and required values.");return;}saveProposals([...proposals,...imported]);setFileName(file.name);setMessage(`${imported.length} fare row(s) submitted for review. None will be used until approved.`);}
 return <section className="panel admin-page lgu-page"><div className="panel-heading"><div><span className="eyebrow">LOCAL GOVERNMENT SUBMISSIONS</span><h2>LGU Fare Portal</h2><p className="muted">Submit proposed local fare schedules for review and publication.</p></div><span className="mode-tag">Submission portal demo</span></div><div className="warning"><AlertTriangle/> This is a working local prototype, not a live authenticated LGU account system. Submissions are saved only in this browser. Do not upload confidential documents.</div><form onSubmit={submit} className="lgu-form"><h3>Submit a fare schedule</h3><div className="form-grid"><label>City / Municipality<input required placeholder="e.g. Cebu City" value={form.lgu} onChange={e=>set("lgu",e.target.value)}/></label><label>Vehicle type<select value={form.mode} onChange={e=>set("mode",e.target.value)}>{modes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>Route code (if applicable)<input placeholder="e.g. 01K" value={form.routeCode} onChange={e=>set("routeCode",e.target.value)}/></label><label>Origin<input placeholder="Route origin" value={form.origin} onChange={e=>set("origin",e.target.value)}/></label><label>Destination<input placeholder="Route destination" value={form.destination} onChange={e=>set("destination",e.target.value)}/></label><label>Base fare (₱)<input required type="number" min="0" step="0.01" value={form.baseFare} onChange={e=>set("baseFare",e.target.value)}/></label><label>Base distance (km)<input required type="number" min="0" step="0.1" value={form.baseKm} onChange={e=>set("baseKm",e.target.value)}/></label><label>Additional fare per km (₱)<input required type="number" min="0" step="0.01" value={form.perKm} onChange={e=>set("perKm",e.target.value)}/></label><label>Proposed effective date<input required type="date" value={form.effectiveDate} onChange={e=>set("effectiveDate",e.target.value)}/></label><label>Reference / approval details<input required placeholder="Ordinance, resolution, LTFRB order, etc." value={form.reference} onChange={e=>set("reference",e.target.value)}/></label></div><label className="upload-label">Upload CSV fare schedule (optional)<input type="file" accept=".csv,text/csv" onChange={e=>importCSV(e.target.files?.[0])}/><small>CSV columns: lgu, mode, route_code, origin, destination, base_fare, base_km, per_km, effective_date, reference. Each valid row is submitted separately as pending.</small></label>{fileName&&<p className="success-text">Processed: {fileName}</p>}<a className="secondary-btn" href="/LGU_FARE_IMPORT_TEMPLATE.csv" download>Download CSV template</a><button className="primary-btn">Submit fare schedule for review <ShieldCheck size={17}/></button>{message&&<div className="notice"><Info size={16}/>{message}</div>}</form><h3>Your local submissions</h3>{proposals.length?<div className="table-wrap"><table><thead><tr><th>LGU</th><th>Vehicle</th><th>Route</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{proposals.map(p=><tr key={p.id}><td>{p.lgu}</td><td>{modes.find(m=>m.id===p.mode)?.name}</td><td>{p.routeCode||`${p.origin}–${p.destination}`}</td><td>{new Date(p.submittedAt).toLocaleDateString()}</td><td><span className={`status-chip ${p.status==="approved"?"verified":"pending"}`}>{p.status}</span></td></tr>)}</tbody></table></div>:<p className="muted">No submissions have been made in this browser yet.</p>}</section>
}
function AdminPanel({rules,locations,routes,proposals,saveRules,saveLocs,saveRoutes,saveProposals,approveProposal}){
 const [draft,setDraft]=useState(null),[newLoc,setNewLoc]=useState({name:"",area:"",lat:"",lng:""}),[msg,setMsg]=useState("");
 const [newRoute,setNewRoute]=useState({code:"",mode:"traditional",origin:"",destination:"",stops:"",operator:"",status:"unverified"});
 function update(id,key,value){saveRules(rules.map(r=>r.id===id?{...r,[key]:value}:r))}
 function addLocation(e){e.preventDefault();if(!newLoc.name||!newLoc.area||!newLoc.lat||!newLoc.lng)return;saveLocs([...locations,{...newLoc,id:"loc-"+Date.now(),lat:Number(newLoc.lat),lng:Number(newLoc.lng)}]);setNewLoc({name:"",area:"",lat:"",lng:""});setMsg("Location added to this browser's local storage.");}
 return <section className="panel admin-page"><div className="panel-heading"><div><span className="eyebrow">CONTROL CENTER</span><h2>Administrator dashboard</h2></div><span className="mode-tag">Local demo</span></div><div className="warning"><AlertTriangle/> Changes are stored only in this browser. This is not a secure multi-user production admin system. Configure a backend and secure authentication before public deployment.</div><h3>LGU fare submissions</h3><p className="muted">Review proposed rates and supporting references. Approval here is a prototype workflow; verify the competent authority's approval before publishing a rate as official.</p><div className="table-wrap"><table><thead><tr><th>LGU</th><th>Vehicle</th><th>Route</th><th>Base fare</th><th>Rate/km</th><th>Status</th><th>Action</th></tr></thead><tbody>{proposals.length?proposals.map(p=><tr key={p.id}><td>{p.lgu}</td><td>{modes.find(m=>m.id===p.mode)?.name}</td><td>{p.routeCode||`${p.origin}–${p.destination}`}</td><td>{money(Number(p.baseFare))}</td><td>{money(Number(p.perKm))}</td><td>{p.status}</td><td>{p.status==="pending"?(p.reference?<><button className="secondary-btn" onClick={()=>approveProposal(p.id)}>Approve</button> <button className="icon-btn" onClick={()=>saveProposals(proposals.map(x=>x.id===p.id?{...x,status:"rejected"}:x))}>Reject</button></>:<span>Reference required</span>) : "—"}</td></tr>):<tr><td colSpan="7">No LGU submissions yet.</td></tr>}</tbody></table></div><h3>Fare rules</h3><p className="muted">Only approved/verified fare rules are used in the public calculator. Confirm every rule against an applicable official schedule.</p><div className="table-wrap"><table><thead><tr><th>Mode</th><th>Base fare ₱</th><th>Base KM</th><th>₱ / KM</th><th>Status</th></tr></thead><tbody>{rules.map(r=><tr key={r.id}><td>{r.label}</td><td><input type="number" min="0" step=".01" value={r.baseFare} onChange={e=>update(r.id,"baseFare",Number(e.target.value))}/></td><td><input type="number" min="0" step=".1" value={r.baseKm} onChange={e=>update(r.id,"baseKm",Number(e.target.value))}/></td><td><input type="number" min="0" step=".01" value={r.perKm} onChange={e=>update(r.id,"perKm",Number(e.target.value))}/></td><td><select value={r.status} onChange={e=>update(r.id,"status",e.target.value)}><option value="unverified">Unverified</option><option value="verified">Verified</option><option value="unavailable">Unavailable</option></select></td></tr>)}</tbody></table></div><h3>Route code directory</h3><p className="muted">Enter the exact code as text (for example, 01K). Only mark a route verified after checking reliable route information.</p><div className="table-wrap"><table><thead><tr><th>Code</th><th>Vehicle</th><th>Origin</th><th>Destination</th><th>Status</th><th></th></tr></thead><tbody>{routes.map(r=><tr key={r.id}><td><b>{r.code}</b></td><td>{modes.find(m=>m.id===r.mode)?.name}</td><td>{r.origin||"—"}</td><td>{r.destination||"—"}</td><td><select value={r.status} onChange={e=>saveRoutes(routes.map(x=>x.id===r.id?{...x,status:e.target.value}:x))}><option value="unverified">Unverified</option><option value="verified">Verified</option></select></td><td><button className="icon-btn" onClick={()=>saveRoutes(routes.filter(x=>x.id!==r.id))}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div><form className="add-location" onSubmit={e=>{e.preventDefault();if(!newRoute.code.trim())return;saveRoutes([...routes,{...newRoute,id:"route-"+Date.now(),code:newRoute.code.trim().toUpperCase()}]);setNewRoute({code:"",mode:"traditional",origin:"",destination:"",stops:"",operator:"",status:"unverified"});setMsg("Route code added to this browser's local storage.");}}><h3><Plus size={18}/> Add a route code</h3><div className="form-grid"><input placeholder="Route code (e.g. 01K)" value={newRoute.code} onChange={e=>setNewRoute({...newRoute,code:e.target.value})}/><select value={newRoute.mode} onChange={e=>setNewRoute({...newRoute,mode:e.target.value})}>{modes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><input placeholder="Origin" value={newRoute.origin} onChange={e=>setNewRoute({...newRoute,origin:e.target.value})}/><input placeholder="Destination" value={newRoute.destination} onChange={e=>setNewRoute({...newRoute,destination:e.target.value})}/><input placeholder="Major stops (optional)" value={newRoute.stops} onChange={e=>setNewRoute({...newRoute,stops:e.target.value})}/><input placeholder="Operator (optional)" value={newRoute.operator} onChange={e=>setNewRoute({...newRoute,operator:e.target.value})}/></div><button className="secondary-btn">Save route code</button></form><h3>Location directory</h3><div className="table-wrap"><table><thead><tr><th>Location</th><th>Area</th><th>Coordinates</th><th></th></tr></thead><tbody>{locations.map(l=><tr key={l.id}><td>{l.name}</td><td>{l.area}</td><td>{l.lat.toFixed(4)}, {l.lng.toFixed(4)}</td><td><button className="icon-btn" onClick={()=>saveLocs(locations.filter(x=>x.id!==l.id))}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div><form className="add-location" onSubmit={addLocation}><h3><Plus size={18}/> Add a location</h3><div className="form-grid"><input placeholder="Location name" value={newLoc.name} onChange={e=>setNewLoc({...newLoc,name:e.target.value})}/><input placeholder="City / municipality / barangay" value={newLoc.area} onChange={e=>setNewLoc({...newLoc,area:e.target.value})}/><input type="number" step="any" placeholder="Latitude" value={newLoc.lat} onChange={e=>setNewLoc({...newLoc,lat:e.target.value})}/><input type="number" step="any" placeholder="Longitude" value={newLoc.lng} onChange={e=>setNewLoc({...newLoc,lng:e.target.value})}/></div><button className="secondary-btn">Save location</button>{msg&&<p className="success-text">{msg}</p>}</form><button className="secondary-btn" onClick={()=>{const blob=new Blob([JSON.stringify({locations,rules,routes,proposals},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cebu-fare-guide-data.json";a.click();URL.revokeObjectURL(a.href)}}>Export data backup</button></section>
}