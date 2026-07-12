// =====================================================================
// FILE: pages/TripDispatcher.jsx
// MODULE: TRP-UI (Trip Dispatcher — Screen 4)
// FUNCTIONS IN THIS FILE:
//   FN-TRP-UI-01  fetchTrips      - load Live Board data
//   FN-TRP-UI-02  handleCreate    - submit "CREATE TRIP" form
//   FN-TRP-UI-03  handleDispatch  - dispatch a Draft trip
//   FN-TRP-UI-04  handleCancel    - cancel a Dispatched trip
// =====================================================================

import { useState, useEffect } from "react";

// Base API path — adjust if your backend runs on a different port/proxy
const API_BASE = "/api/trips";

export default function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
  });
  // Holds the raw "[FN-xx] ..." string from the backend so it displays
  // verbatim in the red validation box (matches Screen 4 wireframe).
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  /**
   * FN-TRP-UI-01 — fetchTrips
   * ------------------------------------------------------------------
   * WHAT IT DOES : Loads all trips from the backend to populate the
   *                 "LIVE BOARD" list on the right side of Screen 4.
   * PAGE          : Trip Dispatcher (Screen 4)
   * INPUT         : none
   * OUTPUT        : none (sets local state `trips`)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state with "[FN-TRP-UI-01] ..." on
   *                 network failure — shown in the red box.
   * ------------------------------------------------------------------
   */
  async function fetchTrips() {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTrips(data.trips);
    } catch (err) {
      setError(`[FN-TRP-UI-01] fetchTrips: ${err.message}`);
    }
  }

  /**
   * FN-TRP-UI-02 — handleCreate
   * ------------------------------------------------------------------
   * WHAT IT DOES : Submits the "CREATE TRIP" form -> POST /api/trips.
   *                 On success, clears the form and refreshes the
   *                 Live Board (FN-TRP-UI-01).
   * PAGE          : Trip Dispatcher (Screen 4) — "CREATE TRIP" form
   * INPUT         : none (reads from `form` state)
   * OUTPUT        : none (updates `trips`, clears `form`, or sets `error`)
   * SIDE EFFECTS  : Creates a Trip document on the backend (FN-TRP-01)
   * THROWS        : sets `error` with the exact "[FN-TRP-01] ..." string
   *                 the backend returns (e.g. missing fields).
   * ------------------------------------------------------------------
   */
  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm({
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeightKg: "",
        plannedDistanceKm: "",
      });
      fetchTrips();
    } catch (err) {
      // err.message already contains the "[FN-TRP-01] ..." tag from the
      // backend — display it as-is, don't rewrite it.
      setError(err.message);
    }
  }

  /**
   * FN-TRP-UI-03 — handleDispatch
   * ------------------------------------------------------------------
   * WHAT IT DOES : Calls POST /api/trips/:id/dispatch. Shows the exact
   *                 backend validation error (e.g. capacity exceeded)
   *                 in the red box if rejected — this is the box shown
   *                 in the Screen 4 wireframe.
   * PAGE          : Trip Dispatcher (Screen 4) — "Dispatch" button
   * INPUT         : tripId (string)
   * OUTPUT        : none (refreshes `trips` on success, sets `error` on failure)
   * SIDE EFFECTS  : Backend flips vehicle & driver to "On Trip" (FN-TRP-03)
   * THROWS        : sets `error` with "[FN-TRP-03] ..." string from backend
   * ------------------------------------------------------------------
   */
  async function handleDispatch(tripId) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${tripId}/dispatch`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchTrips();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-TRP-UI-04 — handleCancel
   * ------------------------------------------------------------------
   * WHAT IT DOES : Calls POST /api/trips/:id/cancel for a Dispatched trip.
   * PAGE          : Trip Dispatcher (Screen 4) — "Cancel" button
   * INPUT         : tripId (string)
   * OUTPUT        : none (refreshes `trips` on success, sets `error` on failure)
   * SIDE EFFECTS  : Backend restores vehicle & driver to "Available" (FN-TRP-05)
   * THROWS        : sets `error` with "[FN-TRP-05] ..." string from backend
   * ------------------------------------------------------------------
   */
  async function handleCancel(tripId) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${tripId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchTrips();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>4. Trip Dispatcher</h1>

      <form onSubmit={handleCreate}>
        <input
          placeholder="Source"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
        <input
          placeholder="Destination"
          value={form.destination}
          onChange={(e) => setForm({ ...form, destination: e.target.value })}
        />
        <input
          placeholder="Cargo Weight (kg)"
          type="number"
          value={form.cargoWeightKg}
          onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
        />
        <input
          placeholder="Planned Distance (km)"
          type="number"
          value={form.plannedDistanceKm}
          onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })}
        />
        <button type="submit">Create Trip</button>
      </form>

      {/* Matches the red validation box in the Screen 4 wireframe —
          always shows the raw "[FN-xx] ..." string, never a generic message */}
      {error && (
        <div style={{ border: "1px solid red", color: "red", padding: 8, margin: "8px 0" }}>
          {error}
        </div>
      )}

      <ul>
        {trips.map((trip) => (
          <li key={trip._id}>
            {trip.tripCode} — {trip.source} → {trip.destination} — {trip.status}
            {trip.status === "Draft" && (
              <button onClick={() => handleDispatch(trip._id)}>Dispatch</button>
            )}
            {trip.status === "Dispatched" && (
              <button onClick={() => handleCancel(trip._id)}>Cancel</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
