import { useEffect, useRef, useState } from "react";
import {
  getLastClass,
  getLastSession,
  resolveSession,
  setLastClass,
  setLastSession,
} from "../utils/prefs";

/**
 * Remembers the teacher's last class + attendance session in sessionStorage.
 * On reopen (same browser tab/session), jumps straight back to where they left off.
 *
 * @param {string[]} classes
 * @param {boolean} classesLoading
 */
export function useLastSelection(classes, classesLoading) {
  const [selectedClass, setSelectedClass] = useState(/** @type {string|null} */ (null));
  const [session, setSession] = useState(() => resolveSession(getLastSession()));
  const restoredRef = useRef(false);

  // Restore last class once the class list is available.
  useEffect(() => {
    if (classesLoading || restoredRef.current) return;
    restoredRef.current = true;
    const last = getLastClass();
    if (last && classes.includes(last)) setSelectedClass(last);
  }, [classesLoading, classes]);

  useEffect(() => {
    setLastClass(selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    setLastSession(session);
  }, [session]);

  return { selectedClass, setSelectedClass, session, setSession };
}
