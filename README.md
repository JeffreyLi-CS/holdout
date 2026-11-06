# Holdout

A private, offline progress bar for calories you **don't** eat. Everything stays on your device in IndexedDB. No accounts, no server, no tracking.

## How it counts

| You log | Effect |
| --- | --- |
| Skip a craving (small 150 / regular 225 / large 400) | Calories go **on hold** (striped) and snacks lock for a while |
| Lock runs out | Held calories are **banked** for good |
| Eat a snack while locked | Hold is lost **and** the snack is subtracted |
| Eat a snack while unlocked | Snack is subtracted, no lock |
| Meal out (small 300 / regular 500 / large 1,000) | Subtracted |
| Meal from home | No change (logged for the record) |

Lock lengths default to 1h / 1h 30m / 2h. Each lock you finish in a row makes the next one 25% longer, up to double. A snack resets that. Both can be changed in Settings. You can't log another skip while a lock is running, and any entry can be undone (toast) or deleted (History). Everything is recomputed from the entry log in `src/domain/rules.ts`.

The default goal is 50,000 kcal, which is about 14 lb at 3,500 kcal per lb. For the full 50 lb, set the goal to 175,000 in Settings.

## Commands

```sh
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ at http://127.0.0.1:4173 (service worker active)
npm test
npm run icons      # regenerate PNG icons in public/
```

The service worker runs only in the production build, so test offline and update behaviour with `build` + `preview`.

## Project layout

```
src/data/       types, Dexie database, DataStore interface, backup parsing
src/domain/     calorie rules (pure, unit tested)
src/hooks/      live queries, clock
src/components/ shell, navigation, UI primitives, toasts, update prompt
src/pages/      Today, History, Settings
```

All reads and writes go through the `DataStore` interface in `src/data/store.ts`, so a sync backend can replace it later. Entry IDs are UUIDs for the same reason.

## iPhone

Dev servers listen on `127.0.0.1` only, so the iPhone can't reach them yet.

Installing to the Home Screen with offline support needs a **trusted HTTPS origin**. Safari won't register a service worker over plain HTTP on a LAN address or with an untrusted certificate. Put a trusted key and cert at `certs/key.pem` and `certs/cert.pem` (for example from `mkcert`, with its root CA installed and trusted on the iPhone under Settings → General → About → Certificate Trust Settings) and Vite will serve HTTPS automatically. `certs/` is gitignored.

Data lives per origin. Install from a stable hostname (such as your Mac's `.local` name), not a raw IP that can change, or the installed app will start empty. Use Export in Settings for backups.

Updates: a new build shows "A new version is ready". Nothing reloads until you tap Update. Every tap is saved immediately, so updating never loses data.
