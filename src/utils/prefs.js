import { SESSIONS } from "../types";

const CLASS_KEY = "vbs-last-class";
const SESSION_KEY = "vbs-last-session";

/** @returns {string|null} */
export function getLastClass() {
  return sessionStorage.getItem(CLASS_KEY);
}

/** @param {string|null} className */
export function setLastClass(className) {
  if (className) sessionStorage.setItem(CLASS_KEY, className);
  else sessionStorage.removeItem(CLASS_KEY);
}

/** @returns {string|null} */
export function getLastSession() {
  return sessionStorage.getItem(SESSION_KEY);
}

/** @param {string} sessionKey */
export function setLastSession(sessionKey) {
  sessionStorage.setItem(SESSION_KEY, sessionKey);
}

/** Restore a saved session key, or fall back to the first session. */
export function resolveSession(sessionKey) {
  if (sessionKey && SESSIONS.some((s) => s.key === sessionKey)) return sessionKey;
  return SESSIONS[0].key;
}
