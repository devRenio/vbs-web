/**
 * queue.js — a tiny serial task queue.
 *
 * Why: Google Apps Script serializes writes to a spreadsheet (LockService /
 * implicit cell locks) and enforces per-user rate limits. If a teacher taps
 * many attendance toggles quickly, firing all the POSTs concurrently invites
 * 429s and lock contention. Running writes ONE AT A TIME (optionally with a
 * minimum gap between them) keeps us comfortably under GAS limits while the
 * optimistic UI still feels instant.
 *
 * Reads are NOT queued — only mutations should use this.
 */

/**
 * @param {Object} [opts]
 * @param {number} [opts.minGap=0]  minimum ms between the *start* of consecutive tasks
 */
export function createSerialQueue({ minGap = 0 } = {}) {
  /** @type {Promise<unknown>} */
  let tail = Promise.resolve();
  let lastStart = 0;
  let size = 0;

  /**
   * Enqueue a task. Returns a promise that resolves/rejects with the task result.
   * A failing task does NOT break the chain for subsequent tasks.
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  function enqueue(task) {
    size++;
    const run = tail.then(async () => {
      if (minGap > 0) {
        const wait = lastStart + minGap - Date.now();
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      }
      lastStart = Date.now();
      try {
        return await task();
      } finally {
        size--;
      }
    });
    // Keep the chain alive even if this task rejects.
    tail = run.catch(() => {});
    return run;
  }

  return {
    enqueue,
    get size() {
      return size;
    },
  };
}
