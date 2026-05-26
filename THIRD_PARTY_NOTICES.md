# Third-Party Notices

This demo uses the following open-source projects, open data, and public API services.

## Open-Source Software

### Leaflet

- Purpose: Browser map rendering.
- Usage: Loaded from `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` and `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`.
- Project: https://leafletjs.com/
- Source: https://github.com/Leaflet/Leaflet
- License: BSD 2-Clause License.
- Copyright: Copyright (c) 2010-2026, Volodymyr Agafonkin; Copyright (c) 2010-2011, CloudMade.

Leaflet license text: https://github.com/Leaflet/Leaflet/blob/main/LICENSE

### Nominatim

- Purpose: Place search/geocoding via `https://nominatim.openstreetmap.org/search`.
- Project: https://nominatim.org/
- Source: https://github.com/osm-search/Nominatim
- License for the open-source geocoder: GPL, with Python source under GPL-3.0-or-later and other files under GPL-2.0.
- Public service usage policy: https://operations.osmfoundation.org/policies/nominatim/

The public `nominatim.openstreetmap.org` service is provided by OpenStreetMap Foundation infrastructure and is subject to the Nominatim usage policy. Production use should move this behind a controlled backend or a dedicated geocoding provider.

### GraphHopper

- Purpose: Optional real road route calculation via the GraphHopper Directions API.
- Project: https://www.graphhopper.com/
- Source: https://github.com/graphhopper/graphhopper
- License for the open-source routing engine: Apache License 2.0.
- Attribution: https://www.graphhopper.com/attribution/

This demo does not bundle GraphHopper server code. Users may optionally call the hosted GraphHopper Directions API with their own API key stored in browser `localStorage`.

### Bangumi Server/API Project

- Purpose: Anime subject search via `https://api.bgm.tv/v0/search/subjects`.
- Project: https://bgm.tv/
- API project: https://github.com/bangumi/api
- Server source: https://github.com/bangumi/server
- License for the open-source server repository: AGPL-3.0.

This demo uses the public Bangumi API and does not bundle Bangumi server code.

## Open Data and Content Sources

### OpenStreetMap

- Purpose: Map tiles, map attribution, and geocoding data used through Leaflet tile layers and Nominatim.
- Project: https://www.openstreetmap.org/
- Copyright and license: https://www.openstreetmap.org/copyright
- Data license: Open Data Commons Open Database License (ODbL).

The map keeps the visible Leaflet attribution control: `© OpenStreetMap`.

### Anitabi

- Purpose: Anime pilgrimage point data and screenshot metadata via the Anitabi public API.
- Project: https://anitabi.cn/
- API endpoints used:
  - `https://api.anitabi.cn/bangumi/{subjectID}/lite`
  - `https://api.anitabi.cn/bangumi/{subjectID}/points/detail?haveImage=true`
- Content license noted by the demo: CC BY-NC-SA 4.0.

This repository is a non-commercial technical demo. Any commercial use, advertising, affiliate links, paid subscriptions, ticketing, hotel booking, or similar monetization should first obtain explicit authorization from Anitabi and any relevant content rights holders.

## CDN and Hosted Services

### unpkg

- Purpose: CDN delivery for Leaflet static assets.
- Service: https://unpkg.com/

unpkg is a package CDN, not application logic bundled into this repository. The underlying package used by this demo is Leaflet, listed above.
