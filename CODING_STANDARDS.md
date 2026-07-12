# TransitOps — Coding & Documentation Standard

Read this once before writing any function. The whole point is: **when something
breaks at 2am during the hackathon, you should be able to find the bug from the
error message alone — no digging.**

---

## 1. Function Numbering

Every function/method gets a unique ID: `FN-<module>-<number>`

Module codes:
- `AUTH` — login/signup/RBAC
- `VEH`  — vehicle registry
- `DRV`  — driver management
- `TRP`  — trip dispatcher (the core logic)
- `MNT`  — maintenance
- `FUEL` — fuel & expenses
- `RPT`  — reports/analytics
- `CFG`  — settings/RBAC config

Example: `FN-TRP-03` = 3rd function in the Trip module.

Keep a running list at the top of each controller file so numbers never collide.

---

## 2. The Comment Block (mandatory on every function)

Every function — backend controller, model method, or frontend handler — starts
with this exact block:

```js
/**
 * FN-TRP-03 — dispatchTrip
 * ------------------------------------------------------------------
 * WHAT IT DOES : Moves a trip from Draft -> Dispatched. Validates cargo
 *                 weight, vehicle/driver availability, and license status
 *                 before flipping vehicle & driver to "On Trip".
 * PAGE          : Trip Dispatcher (Screen 4)
 * INPUT         : req.params.tripId (string, Mongo ObjectId)
 * OUTPUT        : 200 -> { trip, vehicle, driver } (updated docs)
 * SIDE EFFECTS  : Writes to Trip, Vehicle, Driver collections.
 *                 Vehicle.status -> "On Trip"
 *                 Driver.status  -> "On Trip"
 * THROWS        : 400 [FN-TRP-03] "Cargo weight exceeds vehicle capacity"
 *                 400 [FN-TRP-03] "Vehicle is not Available"
 *                 400 [FN-TRP-03] "Driver is not Available"
 *                 400 [FN-TRP-03] "Driver license expired"
 *                 404 [FN-TRP-03] "Trip not found"
 * ------------------------------------------------------------------
 */
```

Rules for filling it in:
- **WHAT IT DOES** — 1-3 lines, plain English, no jargon.
- **PAGE** — the exact screen name from the wireframes (Screen 1-8) so anyone
  can jump straight to the UI that triggers this function.
- **INPUT / OUTPUT** — literal shape, not just types. If it returns JSON,
  show the JSON shape.
- **SIDE EFFECTS** — anything written to the DB or that changes another
  entity's state. This is the #1 thing that causes hard-to-find bugs
  (e.g. "why did the driver status change?!") so never skip it.
- **THROWS** — list every error this function can raise, with the *exact*
  message text used in code. If you add a new validation later, add the
  line here too — keep them in sync.

---

## 3. Error Message Format (mandatory, everywhere)

Every thrown/returned error MUST follow this exact template:

```
[FN-<ID>] <ShortContext>: <human readable message>
```

Example:
```js
throw new AppError(400, "[FN-TRP-03] dispatchTrip: Cargo weight (700kg) exceeds vehicle capacity (500kg)");
```

Why: when this string shows up in a toast on the frontend or in a server log,
you instantly know **which function** broke and **which file** to open —
no stack-trace archaeology mid-demo.

Frontend must display this raw string in the error toast/box (see wireframe
Screen 4's red validation box) — don't swallow or rewrite it.

---

## 4. Central Error Handler Contract

All controllers throw an `AppError(statusCode, message)`. One Express
error-handling middleware (`FN-CORE-01` in `middleware/errorHandler.js`)
catches everything and responds:

```json
{
  "success": false,
  "error": "[FN-TRP-03] dispatchTrip: Cargo weight exceeds vehicle capacity"
}
```

Never `res.status(500).send(err)` raw anywhere else in the code — always
throw and let the central handler format it consistently.

---

## 5. File Header (top of every file)

```js
// =====================================================================
// FILE: controllers/tripController.js
// MODULE: TRP (Trip Dispatcher — Screen 4)
// FUNCTIONS IN THIS FILE:
//   FN-TRP-01  createTrip        - create a Draft trip
//   FN-TRP-02  listTrips         - get trips for Live Board
//   FN-TRP-03  dispatchTrip      - Draft -> Dispatched
//   FN-TRP-04  completeTrip      - Dispatched -> Completed
//   FN-TRP-05  cancelTrip        - Dispatched -> Cancelled
// =====================================================================
```
This table doubles as your file's table of contents — update it whenever
you add/remove a function.

---

## 6. Frontend (React) — same idea, JSDoc style

```js
/**
 * FN-TRP-UI-02 — handleDispatch
 * ------------------------------------------------------------------
 * WHAT IT DOES : Calls POST /api/trips/:id/dispatch, shows validation
 *                 error inline (red box) if the API rejects it.
 * PAGE          : Trip Dispatcher (Screen 4)
 * INPUT         : tripId (string) — from selected trip in Live Board
 * OUTPUT        : none (updates local state: trip status, error message)
 * SIDE EFFECTS  : Refetches trip list on success (FN-TRP-UI-01)
 * THROWS        : Displays whatever "[FN-TRP-xx] ..." string comes back
 *                 from the API in the red validation box.
 * ------------------------------------------------------------------
 */
```

---

## 7. Quick checklist before you commit a function
- [ ] Has an FN-ID that's in the file header table
- [ ] Comment block filled in completely (no "TODO" left in WHAT IT DOES)
- [ ] Every `throw` uses the `[FN-xx] context: message` format
- [ ] Side effects on OTHER collections/entities are listed
- [ ] Matches an actual screen name from Screens 0-8
