/** Session storage key — set only after a valid ?key= magic link. */
export const AUTH_STORAGE_KEY = "vbs-auth";

/** URL query param for the shareable magic link, e.g. ?key=… */
export const URL_PARAM = "key";

/** Must match GAS Script Property APP_TOKEN. Required in production builds. */
export const APP_TOKEN = import.meta.env.VITE_APP_TOKEN ?? "";

/** True when this browser session was opened via the magic link. */
export function isClientAuthed() {
  if (!APP_TOKEN) return false;
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === APP_TOKEN;
}

/** Block API calls until the magic-link gate has passed. */
export function assertClientAuthed() {
  if (!isClientAuthed()) {
    throw new Error("접근 권한이 없습니다.");
  }
}

/**
 * Validate ?key= from the URL, persist to sessionStorage, strip from address bar.
 * @returns {boolean}
 */
export function tryAuthFromUrl() {
  if (!APP_TOKEN) return false;

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(URL_PARAM);
  if (fromUrl !== APP_TOKEN) return false;

  sessionStorage.setItem(AUTH_STORAGE_KEY, APP_TOKEN);
  params.delete(URL_PARAM);
  const rest = params.toString();
  const cleanPath =
    window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash;
  window.history.replaceState(null, "", cleanPath);
  return true;
}

/** Append server token to GET query params (validated by GAS assertToken_). */
export function withTokenParam(params) {
  if (APP_TOKEN) params.set("token", APP_TOKEN);
  return params;
}

/** Append server token to POST JSON body. */
export function withTokenBody(obj) {
  if (APP_TOKEN) return { ...obj, token: APP_TOKEN };
  return obj;
}

/** Full shareable link for coordinators (teacher chat). */
export function buildShareableUrl() {
  if (!APP_TOKEN || typeof window === "undefined") return "";
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, "/");
  return `${base}?${URL_PARAM}=${encodeURIComponent(APP_TOKEN)}`;
}
