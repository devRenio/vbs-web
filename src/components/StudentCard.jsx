import { CheckIcon } from "./icons";

/**
 * One student row with a single present/absent toggle for the SELECTED session.
 * Unchecked === absent (there is no third "unmarked" state on the sheet).
 *
 * @param {Object} props
 * @param {import("../types").Student} props.student
 * @param {string} props.sessionKey
 * @param {boolean} props.pending  update in-flight for this (student, session)
 * @param {(student: import("../types").Student, sessionKey: string) => void} props.onToggle
 */
export default function StudentCard({ student, sessionKey, pending, onToggle }) {
  const present = !!student.attendance?.[sessionKey];

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
          {student.no}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold text-stone-900">
            {student.name}
            <span className="ml-1.5 text-xs font-normal text-stone-400">{student.gender}</span>
          </p>
          {student.church && (
            <p className="truncate text-xs text-stone-400">{student.church}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        aria-pressed={present}
        onClick={() => onToggle(student, sessionKey)}
        className={[
          "flex min-w-[76px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50",
          present
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : "bg-white text-rose-500 ring-1 ring-rose-200 hover:ring-rose-300",
        ].join(" ")}
      >
        {present ? (
          <>
            <CheckIcon className="h-4 w-4 animate-pop" />
            출석
          </>
        ) : (
          "결석"
        )}
      </button>
    </li>
  );
}
