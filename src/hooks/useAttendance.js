import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClasses, fetchClass, setAttendance } from "../api/gasApi";

/** Small mount-guard so we never setState after unmount. */
function useMounted() {
  const ref = useRef(true);
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);
  return ref;
}

/**
 * useClasses — loads the list of class tab names once.
 * @returns {{ classes: string[], loading: boolean, error: string|null, refresh: () => void }}
 */
export function useClasses() {
  const [classes, setClasses] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const mounted = useMounted();

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClasses({ signal });
        if (mounted.current) setClasses(data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (mounted.current) setError(err?.message ?? "반 목록을 불러오지 못했습니다.");
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [mounted]
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  return { classes, loading, error, refresh: () => load() };
}

/**
 * useAttendance — loads students for the selected class and exposes a
 * `toggle(student, sessionKey)` action.
 *
 * ── OPTIMISTIC UPDATE (zero-latency UX) ─────────────────────────────────────
 * Teachers tap check buttons rapidly on flaky venue Wi-Fi. Waiting for the GAS
 * round-trip (1-3s) would feel broken, so `toggle` updates local state first,
 * then syncs in the background and rolls back on failure:
 *   1. flip the session's present flag locally (instant UI feedback)
 *   2. POST to GAS in the background
 *   3. on success, reconcile with the returned server record
 *   4. on failure, ROLL BACK and surface an error to retry
 * ────────────────────────────────────────────────────────────────────────────
 *
 * @param {string|null} className
 */
export function useAttendance(className) {
  const [students, setStudents] = useState(/** @type {import("../types").Student[]} */ ([]));
  const [teachers, setTeachers] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  // "row#sessionKey" entries that currently have an in-flight update.
  const [pending, setPending] = useState(/** @type {Set<string>} */ (new Set()));
  const mounted = useMounted();

  const load = useCallback(
    async (signal) => {
      if (!className) {
        setStudents([]);
        setTeachers([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClass(className, { signal });
        if (mounted.current) {
          setStudents(data.students ?? []);
          setTeachers(data.teachers ?? []);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (mounted.current) setError(err?.message ?? "출석 데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [className, mounted]
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const toggle = useCallback(
    /**
     * @param {import("../types").Student} student
     * @param {string} sessionKey
     */
    async (student, sessionKey) => {
      if (!className) return;
      const next = !student.attendance?.[sessionKey];
      const pendKey = `${student.row}#${sessionKey}`;

      // (1) optimistic local flip
      setStudents((prev) =>
        prev.map((s) =>
          s.row === student.row
            ? { ...s, attendance: { ...s.attendance, [sessionKey]: next } }
            : s
        )
      );
      setPending((prev) => new Set(prev).add(pendKey));

      try {
        // (2) background sync
        const updated = await setAttendance({
          className,
          row: student.row,
          sessionKey,
          present: next,
        });
        // (3) reconcile with server truth
        if (mounted.current && updated) {
          setStudents((prev) => prev.map((s) => (s.row === updated.row ? updated : s)));
        }
      } catch (err) {
        // (4) roll back
        if (mounted.current) {
          setStudents((prev) =>
            prev.map((s) =>
              s.row === student.row
                ? { ...s, attendance: { ...s.attendance, [sessionKey]: !next } }
                : s
            )
          );
          setError(err?.message ?? "출석 저장에 실패했습니다. 다시 시도해 주세요.");
        }
      } finally {
        if (mounted.current) {
          setPending((prev) => {
            const n = new Set(prev);
            n.delete(pendKey);
            return n;
          });
        }
      }
    },
    [className, mounted]
  );

  return { students, teachers, loading, error, pending, refresh: () => load(), toggle };
}
