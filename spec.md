# PublicTransportTracker

## Current State
- 3 Coimbatore bus routes (Town Bus Stand to Ukkadam, RS Puram to Peelamedu, Singanallur to Gandhipuram)
- 6 buses (CBE-101 to CBE-606) with simulated GPS positions on a Leaflet map
- Admin panel to add/remove buses and routes, update bus status
- Real-time bus location simulation (every 5 seconds on frontend)
- Filter by route and status

## Requested Changes (Diff)

### Add
- 7 more bus routes covering: Saravanampatti, Vadavalli, Kuniyamuthur, Kovaipudur, Hopes College, Ganapathy, Podanur, Thudiyalur
- Bus stops data per route (list of named stops with lat/lng)
- ETA estimation: given a stop name, show the next bus arriving and its estimated minutes away
- Passenger search view: search by stop name, see ETA for next bus
- Service alerts system: admin can post alerts (title, message, severity: info/warning/critical, routeId optional), passengers see active alerts

### Modify
- seedSampleData: include all 10 routes, ~20 buses, and bus stop data
- Map view: show bus stop markers alongside bus markers

### Remove
- Nothing removed

## Implementation Plan
1. Backend: add Stop type, Alert type; add stops per route; add alerts CRUD (addAlert, getAlerts, removeAlert); extend seedSampleData with 10 routes, 20 buses, stops
2. Backend: add getStopsForRoute, getETA(stopId) returning next bus info and estimated minutes
3. Frontend: Passenger tab with stop search, ETA display, active alerts banner
4. Frontend: Admin alerts panel to post/remove service alerts
5. Frontend: Show stop markers on map (smaller icons distinct from buses)
6. Frontend: Update seed data call to populate 10 routes and 20 buses
