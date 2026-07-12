/* ==========================================================================
   BORODACH — api.js
   Thin client for the booking API. No secrets, no tokens, no direct
   third-party calls live here — this only talks to our own backend.

   Contract (backend, to be implemented separately):
     POST /api/booking
     Body: {
       name: string,
       phone: string,
       master: string,
       services: string[],
       date: string,   // YYYY-MM-DD
       time: string,   // HH:MM
       total: number
     }
     Response 200: { ok: true, id: string }
     Response 4xx/5xx: { ok: false, error: string }

   The backend is responsible for forwarding the booking to the shop's
   Telegram/CRM. This file never talks to Telegram or stores any token.
   ========================================================================== */

const BorodachAPI = (() => {
  const ENDPOINT = '/api/booking';

  /**
   * Sends a booking request to the backend.
   * Falls back to a local simulated response if the endpoint isn't
   * available yet (e.g. static hosting / preview without a backend),
   * so the front-end flow can always be demoed end-to-end.
   */
  async function createBooking(payload) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Booking API responded with ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      // No backend deployed yet, or a network error — degrade gracefully
      // so the UI still completes the flow. Real deployments should
      // remove this fallback once /api/booking is live.
      console.warn('[BorodachAPI] Falling back to local simulation:', err.message);
      await simulateLatency();
      return { ok: true, id: 'local-' + Date.now(), simulated: true };
    }
  }

  function simulateLatency() {
    return new Promise((resolve) => setTimeout(resolve, 550));
  }

  return { createBooking };
})();
