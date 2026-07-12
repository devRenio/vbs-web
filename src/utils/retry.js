/**
 * retry.js — a small, dependency-free `fetch` wrapper with automatic retries.
 *
 * Why this exists:
 *   Google Apps Script Web Apps are convenient but fragile under load. They can
 *   return transient failures that a simple retry usually clears:
 *     - 429 Too Many Requests           (per-user / per-script rate limits, quotas)
 *     - 500 / 502 / 503 / 504           (transient GAS or Google infra hiccups)
 *     - network errors (fetch throws TypeError: "Failed to fetch")
 *     - our own request timeout          (venue Wi-Fi stalls)
 *
 * Strategy: exponential backoff with full jitter, capped, honoring `Retry-After`
 * when the server provides it. Non-retryable failures (e.g. 400/404) fail fast.
 */

/** @param {number} ms */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Marker error so callers can distinguish "we gave up" from other throws. */
export class RetryError extends Error {
  /** @param {string} message @param {{ attempts: number, lastError?: unknown }} info */
  constructor(message, { attempts, lastError } = {}) {
    super(message);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// HTTP statuses that are worth retrying (transient).
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Decide whether an error/response is worth retrying.
 * @param {{ error?: unknown, status?: number }} ctx
 */
function isRetryable({ error, status }) {
  if (typeof status === "number") return RETRYABLE_STATUS.has(status);
  if (error) {
    // AbortError from a *timeout* is retryable; an external cancel is not (handled by caller).
    if (error.name === "TimeoutError") return true;
    // fetch network failures surface as TypeError.
    if (error.name === "TypeError") return true;
  }
  return false;
}

/**
 * Parse a `Retry-After` header (seconds or HTTP-date) into milliseconds.
 * @param {Response} res
 * @returns {number | null}
 */
function retryAfterMs(res) {
  const raw = res.headers.get("Retry-After");
  if (!raw) return null;
  const secs = Number(raw);
  if (!Number.isNaN(secs)) return secs * 1000;
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

/**
 * Compute a backoff delay with full jitter.
 * @param {number} attempt 0-based retry index
 * @param {number} base    base delay ms
 * @param {number} max     max delay ms
 */
function backoffDelay(attempt, base, max) {
  const exp = Math.min(max, base * 2 ** attempt);
  return Math.random() * exp; // full jitter avoids thundering-herd retries
}

/**
 * fetch() with timeout + automatic retries for transient failures.
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {Object} [opts]
 * @param {number} [opts.retries=3]       max retry attempts (in addition to the first try)
 * @param {number} [opts.baseDelay=600]   base backoff ms
 * @param {number} [opts.maxDelay=8000]   max backoff ms
 * @param {number} [opts.timeout=15000]   per-attempt timeout ms
 * @param {AbortSignal} [opts.signal]     external cancellation (not retried)
 * @param {(info: { attempt: number, delay: number, reason: string }) => void} [opts.onRetry]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
  url,
  init = {},
  { retries = 3, baseDelay = 600, maxDelay = 8000, timeout = 15000, signal, onRetry } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // If the caller cancelled, stop immediately (do not retry a deliberate abort).
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    // Per-attempt timeout, combined with the caller's signal.
    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(new DOMException("Timeout", "TimeoutError")), timeout);
    const onExternalAbort = () => timeoutCtrl.abort(new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const res = await fetch(url, { ...init, signal: timeoutCtrl.signal });

      if (res.ok) return res;

      // Non-OK: retry only transient statuses.
      if (attempt < retries && isRetryable({ status: res.status })) {
        const wait = retryAfterMs(res) ?? backoffDelay(attempt, baseDelay, maxDelay);
        onRetry?.({ attempt: attempt + 1, delay: wait, reason: `HTTP ${res.status}` });
        await sleep(wait);
        continue;
      }
      // Non-retryable or out of attempts.
      throw new Error(`요청 실패: ${res.status} ${res.statusText}`);
    } catch (error) {
      // A deliberate external abort is final.
      if (error?.name === "AbortError" && signal?.aborted) throw error;

      lastError = error;
      const canRetry = attempt < retries && isRetryable({ error });
      if (!canRetry) {
        // Surface the underlying error unless it was purely transient exhaustion.
        if (error instanceof Error && !isRetryable({ error })) throw error;
        break;
      }
      const wait = backoffDelay(attempt, baseDelay, maxDelay);
      onRetry?.({
        attempt: attempt + 1,
        delay: wait,
        reason: error?.name === "TimeoutError" ? "timeout" : "network",
      });
      await sleep(wait);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  throw new RetryError("네트워크가 불안정합니다. 잠시 후 다시 시도해 주세요.", {
    attempts: retries + 1,
    lastError,
  });
}
