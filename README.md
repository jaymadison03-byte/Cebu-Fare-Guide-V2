# Cebu Fare Guide — Website starter (V1)

A responsive React website prototype for point-to-point route lookup in Cebu. It includes an OpenStreetMap map, road-distance lookup, transport choices, passenger categories, a fare-result panel, and a local-only admin data editor. The project is configured for GitHub Pages and has a Capacitor Android wrapper configuration for a later Android build.

## Important: what this version is and is not

This is a **working prototype foundation**, not a finished official Cebu fare service. The sample directory contains six landmarks only, not every city, municipality, barangay, terminal, or route in Cebu. Fare rules are marked `unverified` or `unavailable`, and the app intentionally refuses to show a payable fare until an administrator marks a rule as verified. Do not mark sample rules verified without checking the exact current official fare matrix, vehicle class, route, effective date, and discount applicability.

The road distance returned by the public OSRM demo service is a **driving route**, not necessarily the actual public-transport route or billable distance. Driving time is not a public transport timetable. Replace demo services with appropriately licensed/reliable services before a public launch.

The admin screen currently uses browser local storage and a demonstration password. It is **not secure**, is not shared between users, and does not create a real administrator account. Do not use it for public administration. A production admin account requires Supabase Auth (or another backend), server-side role checks, secure row-level security policies, and audit logs.

## Run the website locally

Requirements: Node.js 20 LTS (or a compatible current LTS) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Publish through GitHub Pages

1. Sign in to GitHub and create a **public repository** named `cebu-fare-guide` (or another name you prefer).
2. Download and extract this ZIP file on your computer.
3. Open the extracted `cebu-fare-guide` folder. Make sure `.github/workflows/deploy.yml` is included (hidden folders may be hidden by your file manager).
4. Upload all files and folders to the root of the GitHub repository, then commit to the `main` branch. Alternatively, use GitHub Desktop to publish the folder.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. Open the **Actions** tab and wait for “Deploy Cebu Fare Guide to GitHub Pages” to finish successfully.
7. GitHub will show the website URL under **Settings → Pages**. It will normally be `https://YOUR-USERNAME.github.io/cebu-fare-guide/`.

Every push to `main` will trigger a new deployment. No GitHub token or password should be shared in chat.

## Android build (later)

Install Android Studio and the Android SDK first. Then run:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Run `npx cap add android` only once. Build and test the Android app in Android Studio. App signing, privacy policy, store listing, permissions review, and release testing are still required.

## Supabase backend starter

A starting database schema is in `supabase/schema.sql`. It defines locations, transport modes, routes, fare rules, and user profiles. It is not yet connected to the frontend. Before enabling shared public data, create a Supabase project, configure authentication, implement admin-only write policies, and test the policies. Never put a Supabase service-role key in browser code.

## What is required to call this a complete Cebu-wide service

- Complete official geographic directory for every Cebu city/municipality and barangay, with validated coordinates.
- Actual public-transport routes and stop sequences for each operator and vehicle class.
- Current official fare matrices and local/operator-specific fare schedules, with source document, effective dates, and verification status.
- Legal review of the student, senior citizen, and PWD discount rules for each transport mode and trip type. The prototype shows a 20% category selection, but production eligibility, covered charges, proof requirements, and rounding must follow current law and regulations.
- Secure backend/admin accounts, data audit trail, reporting process, privacy policy, monitoring, and backups.

## Project structure

```text
cebu-fare-guide/
├── .github/workflows/deploy.yml
├── src/                 # React application and styles
├── supabase/schema.sql  # Backend schema starter
├── DATA_IMPORT_TEMPLATE.csv
├── capacitor.config.json
├── index.html
├── package.json
└── vite.config.js
```

## Route code finder (added in v2)
The website now includes a Route codes page with search by route code or destination and filters for traditional jeepneys, modern jeepneys, buses, and multicabs. Route codes are stored as text so codes such as `01K` retain their leading zero. The local demo admin can add route records and set their verification status. Route records are saved only in the current browser's local storage and are included in the JSON backup export.

The initial codes `01K`, `45B`, `45`, and `46` are placeholders supplied as examples, not verified route listings. Their origins, destinations, stops, operators, and actual vehicle assignments must be checked before publication. Use `ROUTE_IMPORT_TEMPLATE.csv` as a starting point for collecting verified data. Do not mark a route as verified without a reliable source.

## LGU fare submission prototype (V3)

The web prototype now includes an **LGU Portal** where a city or municipality can enter a proposed fare schedule or import multiple rows from `LGU_FARE_IMPORT_TEMPLATE.csv`. Each submission is stored as `pending` in the current browser's local storage. The administrator dashboard lists submissions and provides an approve/reject review step. Only approved/verified rules matching the selected vehicle and LGU area are eligible for the fare calculator; pending proposals never calculate a fare.

Fare schedule fields include LGU, vehicle type, route code (optional), origin, destination, base fare, base distance, additional rate per kilometre, proposed effective date, and a source/approval reference. The current calculator uses the road-network distance returned by OSRM as an input estimate. It is **not** a confirmed public-transport route distance or official fare quote.

### Important prototype limitations

- The LGU Portal is not yet protected by individual LGU accounts. It is a local demonstration form, not a secure multi-user service.
- Data is saved in browser `localStorage`; it does not synchronize between LGU users, administrator devices, or public visitors.
- CSV import is a basic comma-separated import. Use the supplied template and avoid commas inside field values.
- A selected CSV is parsed into pending rows; it is not retained as an uploaded supporting document. Enter a source/approval reference. A production system should store supporting documents in protected storage and log who submitted/reviewed each record.
- The approval action in this prototype is not a legal determination. The production administrator must verify the competent authority's approval and supporting documents before publishing a fare as official.
- The updated `supabase/schema.sql` adds LGU organizations, LGU profile roles, fare submissions, and separate published fare rules as a foundation. Secure authentication, admin-only review policies, protected file storage, and frontend/backend integration still need to be completed before public deployment.

### Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`).


## V4 interactive map and GPS

- The map supports zooming, panning, and selecting a point by tapping/clicking the map.
- Use **Pin origin** or **Pin destination**, then click/tap the map to set that trip point.
- Use **Use my GPS** to request the device/browser's current location and set it as the origin. The map moves to the detected position.
- GPS requires the user to grant browser location permission and generally requires a secure context (HTTPS or localhost).
- Map-selected and GPS coordinates are temporary selections in the current browser session; they are not added to the permanent location directory.
- The route line still uses OSRM road routing and is not a confirmed public-transport route.


## V5 expanded Cebu directory and map pins
- Imported the supplied Cebu Province drop-point directory into the selectable place list.
- Added route stops, LGU names, user-provided route codes and provincial corridors as unverified directory entries.
- Map coordinates for directory entries without known coordinates are resolved on demand using OpenStreetMap Nominatim; if lookup fails, users can pin the exact map location manually.
- Fixed map pin replacement: origin and destination use separate stable pin records, so placing the destination no longer deletes the origin.
- Existing browser data is merged with the expanded seed directory so prior saved admin entries are retained.
- Route listings are transcribed from user input and must be verified before publication as authoritative.


## V9 update
- Route code information is shown in the fare result after a fare calculation; the standalone Route Codes navigation tab has been removed. Bus route codes remain unavailable for now.
- Map pins and GPS points are checked using OpenStreetMap reverse geocoding before being accepted. Trips with an endpoint outside Cebu Province show “No available fare information.”
- The geographic check uses a Cebu-area bounding box followed by reverse-geocoded administrative names; map service availability and data quality can affect verification.

## V10 — transport recommendations by origin and destination
- Added a Recommended for this trip panel that updates when the passenger selects an origin and destination.
- Matching jeepney, modern jeepney, and multicab route codes are shown as transport choices when the supplied route directory contains a matching corridor.
- Added the bus operators and destination corridors supplied by the project owner, grouped by North, South, West, and Metro Cebu/Mactan service areas.
- Bus recommendations are limited to operators whose supplied destination list matches the selected corridor. MyBus/Sugbo Tours matches are presented as city-bus options; other listed operators are presented as provincial-bus options.
- The selected recommended transport can be used for the fare estimate. The full route code/operator information is also shown in the trip result.
- These are recommendations based on the supplied directory, not confirmation of live schedules, current operations, exact boarding points, or an operator's complete route alignment. Confirm with the operator before travel.

## V11 route directory additions
- Added the supplied southern Cebu traditional jeepney codes 43, 43D, 44, 44A, 44C, 44D, 44E, 45, 45B, 46, and 47.
- Added the supplied Naga/Minglanilla modern PUJ corridors and their named transport cooperatives to the trip recommendation panel.
- These entries remain marked unverified; confirm actual alignment, service availability, and current operator assignment before treating recommendations as official.

## V12 update
- Kept the searchable destination field directly below “Where are you going?” and clarified its search hint and live match count.
- Fixed the road-route validation flow for locations already in the Cebu directory: these are checked locally against the Cebu coordinate bounds instead of depending on Nominatim reverse geocoding. Live jurisdiction checks remain for GPS and manually placed map pins.
- Added municipality-centre coordinate fallbacks for directory locations in San Fernando, Minglanilla, Naga, Carcar, and Talisay when an individual drop point has no coordinates. These are approximate map points, not exact stop coordinates.
- Route lookup errors now include the underlying stage/error message instead of always blaming the internet connection.
- Existing user-provided route and operator records remain unverified until checked against current operator/LTFRB information.


## V13 update
- Improved route-code matching so terminal locations can match their city/municipality corridor, and routes can match in either direction.
- Added aliases for Mactan / Lapu-Lapu and common terminal labels to reduce false “no matching route code” messages.
- Explicitly retained Lapu-Lapu City (Mactan Island) and Cordova within the Cebu Province location/geocoding coverage, with approximate centre fallbacks only when a directory entry has no coordinates.
- Route-code entries remain user-provided and unverified unless marked otherwise; a match is a directory match, not proof of current operation.

## V15 — structured route-to-stop matching
- Imported the Metro Cebu initial route directory supplied by the project owner as structured route records, preserving ordered stop sequences, route codes/service names, vehicle types, operator notes, barangays, landmarks, and verification warnings.
- Added Cebu City PUJ codes 01K, 04L, 06B, 07B, 10H, 13C, 17B, and 17C; modern PUJ services Naga–IT Park and Minglanilla–IT Park plus code 42E; MyBus MY01–MY05; and Mactan/Lapu-Lapu/Cordova codes MI-01A, MI-02B, and MI-03A.
- Replaced broad whole-description text matching with ordered-stop matching for direct route suggestions. A route is considered a direct match only when both selected points can be matched to distinct stops in that route record.
- Corridor leads are displayed separately from direct route matches. They are not represented as confirmed direct trips and may require a transfer or operator confirmation.
- Services without a published route code are displayed by their documented service name rather than being assigned an invented code.
- Retained operator and alignment verification notes. The supplied document's caution that route operation, exact alignment, and current stops must be confirmed remains in effect.
- The app's road distance is still not the same as a transit route distance; the route directory is used for public-transport suggestions only.


## V16 passenger journey result update

The fare result now uses a passenger-first direct journey card. When both selected locations match a route sequence, it displays the route code (or NO CODE when no code is published), service name, vehicle type, operator, boarding point, drop-off point, and intermediate listed stops in travel order. It distinguishes a route listed in the directory from a currently verified operating service.

When no direct route matches, the result uses plain language and does not label corridor leads as direct rides. Fare estimates remain separate from route matching and retain their existing reference-rate disclaimers.

## V17 – Automatic Transportation Finder

V17 automatically searches the route directory whenever a passenger selects two different locations. The passenger no longer needs to press the fare-calculation button to see transport suggestions.

- Direct route matches are shown first with route code (or an explicit no-published-code label), vehicle type, operator, boarding point, drop-off point, and intermediate route stops.
- Direct matches are identified only when both selected locations match the route's ordered stop sequence in the same travel direction.
- Other corridor records and operator listings are displayed separately as possible transportation leads, not as confirmed direct rides.
- The road-distance and fare calculation remains a separate optional action because it uses road routing and fare reference rules, not proof of public-transport operation.
- Missing route codes, fare values, and operating confirmations are not invented.

This remains a directory-based recommendation prototype. It does not yet guarantee live vehicle availability, real-time arrivals, or verified transfer itineraries.

## V18 — route coverage-aware matching correction

- Route matching now checks the ordered stop sequence, route landmark aliases, and specific barangay/neighborhood values supplied in each structured route record.
- Specific locality parts in a location's `area` field are considered, while broad city/province labels are excluded to reduce false matches.
- Direct rides are still shown only when both selected points match distinct entries in the ordered stop sequence. The order is used to display the intermediate stops.
- If aliases or barangay data indicate that a route may cover one or both selected areas but the ordered stop sequence cannot establish the exact boarding/drop-off pair, the route is displayed under **Other possible transportation** as a coverage lead. It is not mislabeled as a confirmed direct ride.
- Route operation and alignment statuses remain unchanged; existing unverified route records are not promoted to verified status.

## V25 vehicle coverage limits

- Traditional jeepney recommendations are restricted to routes that remain within Cebu City. Records with unknown endpoints or explicit stops outside Cebu City are not shown as public traditional-jeepney options.
- Multicab is a separate vehicle category. South Cebu multicab coverage is limited to Carcar–Talisay; North Cebu multicab coverage is limited to Mandaue–Danao.
- The same limits apply to direct rides, transfer suggestions, corridor suggestions, and the public route-code directory.
- Modern jeepneys and buses continue to follow their own documented route records.
- Do not classify a route as a multicab unless its vehicle type is known. The app will not automatically convert uncertain traditional-vehicle records into multicab records.
