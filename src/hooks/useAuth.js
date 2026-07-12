import { useEffect, useState } from "react";
import {
  APP_TOKEN,
  isClientAuthed,
  tryAuthFromUrl,
} from "../utils/auth";

/**
 * Magic-link gate: only browsers that opened ?key=<token> may see student names
 * and trigger GAS reads/writes. No passcode typing — coordinators share one link.
 */
export function useAuth() {
  const isConfigured = Boolean(APP_TOKEN);
  const [status, setStatus] = useState(/** @type {"checking" | "authed" | "denied"} */ ("checking"));

  useEffect(() => {
    if (!isConfigured) {
      setStatus("denied");
      return;
    }

    if (isClientAuthed() || tryAuthFromUrl()) {
      setStatus("authed");
      return;
    }

    setStatus("denied");
  }, []);

  return { isConfigured, status };
}

export { buildShareableUrl } from "../utils/auth";
