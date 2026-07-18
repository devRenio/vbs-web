import { useEffect, useState } from "react";
import {
  APP_TOKEN,
  isClientAuthed,
  tryAuthFromUrl,
  tryAuthStandalonePwa,
} from "../utils/auth";

/**
 * Magic-link gate + installed-PWA auto-auth.
 * Browser: needs ?key= once → stored in localStorage.
 * Home-screen app: opens without ?key= but runs in standalone display mode → auto-auth.
 */
export function useAuth() {
  const isConfigured = Boolean(APP_TOKEN);
  const [status, setStatus] = useState(/** @type {"checking" | "authed" | "denied"} */ ("checking"));

  useEffect(() => {
    if (!isConfigured) {
      setStatus("denied");
      return;
    }

    if (isClientAuthed() || tryAuthFromUrl() || tryAuthStandalonePwa()) {
      setStatus("authed");
      return;
    }

    setStatus("denied");
  }, [isConfigured]);

  return { isConfigured, status };
}

export { buildShareableUrl } from "../utils/auth";
