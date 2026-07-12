/**
 * gasApi.js
 * ---------
 * Resilient client for the Google Apps Script (GAS) Web App that fronts the
 * master sheet. It layers three safeguards on top of plain fetch so the app
 * keeps working when GAS gets flaky or hits its usage limits:
 *
 *   1. RETRIES      — transient failures (429 rate-limit, 5xx, network,
 *                     timeout) are retried with exponential backoff + jitter
 *                     (see utils/retry.js).
 *   2. FALLBACK      — you can configure MULTIPLE GAS deployment URLs. If the
 *                     primary keeps failing, the client transparently tries the
 *                     next one. Handy when one deployment is throttled/quota-capped
 *                     or you push a bad version and want a hot standby.
 *   3. WRITE QUEUE   — attendance writes are serialized (one at a time, with a
 *                     small gap) to avoid GAS lock contention and 429s while the
 *                     optimistic UI still feels instant (see utils/queue.js).
 *
 * The GAS layer strips all sensitive fields (보호자 / 연락처) and returns only
 * { id, row, no, name, gender, church, className, attendance } to the browser.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CORS & GAS gotchas (read before editing!):
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. GAS Web Apps can't answer a cross-origin OPTIONS *preflight*. Avoid triggering one.
 * 2. A request stays a "simple request" (no preflight) only with Content-Type
 *    text/plain / x-www-form-urlencoded / multipart, and no custom headers. So we
 *    POST JSON as a *string* with `Content-Type: text/plain;charset=utf-8`; GAS does
 *    `JSON.parse(e.postData.contents)`.
 * 3. Do NOT add headers like Authorization / X-Requested-With — they force a preflight.
 * 4. GAS 302-redirects to script.googleusercontent.com (sends CORS *); fetch follows it.
 */

import { fetchWithRetry, RetryError } from "../utils/retry";
import { createSerialQueue } from "../utils/queue";

/**
 * Configured GAS endpoints, in priority order.
 * Provide one or more URLs (comma/whitespace/newline separated) via
 * VITE_GAS_API_URL, and optional extras via VITE_GAS_API_FALLBACK_URLS.
 * @type {string[]}
 */
const ENDPOINTS = [
  import.meta.env.VITE_GAS_API_URL,
  import.meta.env.VITE_GAS_API_FALLBACK_URLS,
]
  .filter(Boolean)
  .flatMap((v) => String(v).split(/[\s,]+/))
  .map((s) => s.trim())
  .filter(Boolean);

// Tuning (overridable via env; sensible defaults otherwise).
const RETRIES = Number(import.meta.env.VITE_GAS_RETRIES ?? 3);
const TIMEOUT = Number(import.meta.env.VITE_GAS_TIMEOUT_MS ?? 15000);
// Serialize writes with a small gap to stay under GAS rate limits.
const WRITE_MIN_GAP = Number(import.meta.env.VITE_GAS_WRITE_MIN_GAP_MS ?? 350);

if (ENDPOINTS.length === 0) {
  console.warn(
    "[gasApi] No GAS URL configured. Copy .env.example to .env and set VITE_GAS_API_URL."
  );
}

// Remember which endpoint worked last so we start there next time (sticky failover).
let preferredIndex = 0;

const writeQueue = createSerialQueue({ minGap: WRITE_MIN_GAP });

/** Build a URL with an optional query string appended to an endpoint. */
function withQuery(endpoint, params) {
  const qs = params ? `?${params.toString()}` : "";
  return `${endpoint}${qs}`;
}

/** @template T @param {Response} res @returns {Promise<T>} */
async function parseBody(res) {
  /** @type {import("../types").ApiResponse<T>} */
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "GAS 백엔드 오류");
  return body.data;
}

/**
 * Core request: try each configured endpoint (starting from the last good one),
 * each with its own retry budget. Only fall through to the next endpoint on
 * transient/exhausted failures; a definitive GAS error (ok:false) is returned
 * to the caller without pointless failover.
 *
 * @template T
 * @param {(endpoint: string) => { url: string, init: RequestInit }} build
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<T>}
 */
async function request(build, { signal } = {}) {
  if (ENDPOINTS.length === 0) throw new Error("GAS URL이 설정되지 않았습니다.");

  let lastError;
  for (let hop = 0; hop < ENDPOINTS.length; hop++) {
    const idx = (preferredIndex + hop) % ENDPOINTS.length;
    const endpoint = ENDPOINTS[idx];
    const { url, init } = build(endpoint);

    try {
      const res = await fetchWithRetry(url, { redirect: "follow", ...init }, {
        retries: RETRIES,
        timeout: TIMEOUT,
        signal,
        onRetry: ({ attempt, delay, reason }) =>
          console.warn(
            `[gasApi] 재시도 ${attempt}/${RETRIES} (${reason}) — ${Math.round(delay)}ms 후`
          ),
      });
      const data = await parseBody(res);
      preferredIndex = idx; // stick to the endpoint that just worked
      return data;
    } catch (err) {
      // Deliberate cancellation is final — don't fail over.
      if (err?.name === "AbortError" && signal?.aborted) throw err;

      lastError = err;
      const transient = err instanceof RetryError;
      const hasNextEndpoint = hop < ENDPOINTS.length - 1;
      if (transient && hasNextEndpoint) {
        console.warn(`[gasApi] 엔드포인트 #${idx} 실패, 다음 엔드포인트로 폴백합니다.`);
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("모든 GAS 엔드포인트 요청에 실패했습니다.");
}

/**
 * Fetch the list of class tab names.
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<string[]>}
 */
export function fetchClasses({ signal } = {}) {
  return request(
    (endpoint) => ({
      url: withQuery(endpoint, new URLSearchParams({ action: "classes" })),
      init: { method: "GET" },
    }),
    { signal }
  );
}

/**
 * Fetch one class: its teacher(s) and students.
 * @param {string} className
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<{ teachers: string[], students: import("../types").Student[] }>}
 */
export function fetchClass(className, { signal } = {}) {
  return request(
    (endpoint) => ({
      url: withQuery(endpoint, new URLSearchParams({ action: "class", class: className })),
      init: { method: "GET" },
    }),
    { signal }
  );
}

/**
 * Set one student's attendance for one session.
 * Writes go through the serial queue so concurrent taps don't hammer GAS.
 * @param {import("../types").AttendanceUpdate} update
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<import("../types").Student>}  the updated student record
 */
export function setAttendance(update, { signal } = {}) {
  return writeQueue.enqueue(() =>
    request(
      (endpoint) => ({
        url: withQuery(endpoint),
        init: {
          method: "POST",
          // text/plain keeps this a "simple request" → no CORS preflight (see note above).
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "setAttendance", payload: update }),
        },
      }),
      { signal }
    )
  );
}
