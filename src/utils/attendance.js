import { SESSION_MAP } from "../types";

/**
 * Present count / total for a session across a class.
 * @param {import("../types").Student[]} students
 * @param {string} sessionKey
 */
export function summarizeSession(students, sessionKey) {
  const total = students.length;
  const present = students.filter((s) => s.attendance?.[sessionKey]).length;
  return { total, present, absent: total - present };
}

/**
 * Human-readable label for a session key (e.g. "둘째날 오전").
 * @param {string} sessionKey
 */
export function sessionLabel(sessionKey) {
  return SESSION_MAP[sessionKey]?.label ?? sessionKey;
}

/**
 * Group sessions by day for a tidy segmented picker.
 * @returns {Array<{ day: string, sessions: Array<{ key: string, part: string }> }>}
 */
export function sessionsByDay(sessions) {
  const order = [];
  const map = new Map();
  for (const s of sessions) {
    if (!map.has(s.day)) {
      map.set(s.day, []);
      order.push(s.day);
    }
    map.get(s.day).push({ key: s.key, part: s.part });
  }
  return order.map((day) => ({ day, sessions: map.get(day) }));
}
