/** Persisted after magic link, or auto-auth in installed PWA. */
export const AUTH_STORAGE_KEY = "vbs-auth";

/** URL query param for the shareable magic link, e.g. ?key=… */
export const URL_PARAM = "key";

/** Must match GAS Script Property APP_TOKEN. Required in production builds. */
export const APP_TOKEN = import.meta.env.VITE_APP_TOKEN ?? "";

/** Installed PWA / home-screen app (not a regular browser tab). */
export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    /** @type {{ standalone?: boolean }} */ (window.navigator).standalone === true
  );
}

function getStoredAuth() {
  // localStorage survives PWA relaunches; sessionStorage was the old store.
  return localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
}

/** Save auth token and migrate away from sessionStorage. */
export function persistAuth() {
  if (!APP_TOKEN) return;
  localStorage.setItem(AUTH_STORAGE_KEY, APP_TOKEN);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

/** True when this client may access student data. */
export function isClientAuthed() {
  if (!APP_TOKEN) return false;
  const stored = getStoredAuth();
  if (stored === APP_TOKEN) {
    // One-time migration from sessionStorage → localStorage.
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) persistAuth();
    return true;
  }
  return false;
}

/** Block API calls until auth has passed. */
export function assertClientAuthed() {
  if (!isClientAuthed()) {
    throw new Error("접근 권한이 없습니다.");
  }
}

/**
 * Validate ?key= from the URL, persist auth, strip key from address bar.
 * @returns {boolean}
 */
export function tryAuthFromUrl() {
  if (!APP_TOKEN) return false;

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(URL_PARAM);
  if (fromUrl !== APP_TOKEN) return false;

  persistAuth();
  params.delete(URL_PARAM);
  const rest = params.toString();
  const cleanPath =
    window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash;
  window.history.replaceState(null, "", cleanPath);
  return true;
}

/**
 * Installed PWA opens at start_url without ?key=.
 * The token is already embedded in this build — trust standalone mode as
 * proof the teacher installed the app from a prior magic-link visit.
 * @returns {boolean}
 */
export function tryAuthStandalonePwa() {
  if (!APP_TOKEN || !isStandalonePwa()) return false;
  persistAuth();
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
