/**
 * Central JSDoc type definitions + shared constants.
 *
 * We use plain JavaScript, but these @typedef blocks give editors full
 * IntelliSense without a TypeScript build step.
 *
 * SECURITY NOTE:
 * The Google Apps Script backend is the ONLY place that reads the master sheet.
 * It strips the sensitive columns (보호자 / 연락처) and returns ONLY the
 * whitelisted fields below. The frontend never receives PII.
 *
 * SHEET SHAPE (decoded from the real "N세M반" tabs):
 *  - Attendance is NOT a single status per student. Each student has a matrix
 *    of 7 fixed sessions across the 4-day retreat. A cell is "present" (O) or blank.
 */

/**
 * The 7 fixed attendance sessions, in sheet column order (I~O).
 * `key` is the stable identifier shared with the GAS backend.
 * The backend maps each key to its spreadsheet column.
 * @type {ReadonlyArray<{ key: string, day: string, part: string }>}
 */
export const SESSIONS = Object.freeze([
  { key: "d1_pm", day: "첫째날", part: "오후" },
  { key: "d2_am", day: "둘째날", part: "오전" },
  { key: "d2_nap", day: "둘째날", part: "낮잠" },
  { key: "d2_pm", day: "둘째날", part: "오후" },
  { key: "d3_am", day: "세째날", part: "오전" },
  { key: "d3_pm", day: "세째날", part: "오후" },
  { key: "d4_am", day: "넷째날", part: "오전" },
]);

/** @type {Record<string, { day: string, part: string, label: string }>} */
export const SESSION_MAP = Object.freeze(
  Object.fromEntries(
    SESSIONS.map((s) => [s.key, { day: s.day, part: s.part, label: `${s.day} ${s.part}` }])
  )
);

/**
 * A single student record as returned by the GAS backend.
 * Contains NO parent contact / PII fields.
 *
 * @typedef {Object} Student
 * @property {string} id          Stable unique id, `${className}#${row}`. Used as React key.
 * @property {number} row         1-based sheet row number (used by the backend to target the cell).
 * @property {number|string} no   Roster number (No. column).
 * @property {string} name        Student name.
 * @property {"남" | "여" | string} gender  Gender.
 * @property {string} church      Church (교회) — non-sensitive context, optional to display.
 * @property {string} className   Class name = sheet tab name (e.g. "3세1반").
 * @property {Record<string, boolean>} attendance  Map of session key → present?.
 * @property {string} remark        Free-text note (비고 column) — not tied to any session/day.
 */

/**
 * Payload sent to update a student's remark (비고).
 *
 * @typedef {Object} RemarkUpdate
 * @property {string} className
 * @property {number} row
 * @property {string} remark
 */

/**
 * Payload sent to update one student's attendance for one session.
 *
 * @typedef {Object} AttendanceUpdate
 * @property {string} className
 * @property {number} row
 * @property {string} sessionKey   One of SESSIONS[].key
 * @property {boolean} present
 */

/**
 * Standard envelope returned by the GAS backend.
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} ok
 * @property {T} [data]
 * @property {string} [error]
 */

export {};
