import { useState } from "react";
import { CheckIcon, NoteIcon } from "./icons";
import RemarkSheet from "./RemarkSheet";

/**
 * One student row: attendance toggle for the selected session + per-student remark.
 *
 * @param {Object} props
 * @param {import("../types").Student} props.student
 * @param {string} props.sessionKey
 * @param {boolean} props.pending
 * @param {boolean} props.remarkPending
 * @param {(student: import("../types").Student, sessionKey: string) => void} props.onToggle
 * @param {(student: import("../types").Student, remark: string) => Promise<void>} props.onSaveRemark
 */
export default function StudentCard({
  student,
  sessionKey,
  pending,
  remarkPending,
  onToggle,
  onSaveRemark,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const present = !!student.attendance?.[sessionKey];
  const hasRemark = Boolean(student.remark?.trim());

  return (
    <>
      <li className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
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

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label={`${student.name} 비고`}
              onClick={() => setSheetOpen(true)}
              className={[
                "relative grid h-10 w-10 place-items-center rounded-xl transition active:scale-95",
                hasRemark
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-stone-50 text-stone-400 ring-1 ring-stone-200/80",
              ].join(" ")}
            >
              <NoteIcon />
              {hasRemark && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </button>

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
          </div>
        </div>
      </li>

      <RemarkSheet
        student={student}
        open={sheetOpen}
        pending={remarkPending}
        onClose={() => setSheetOpen(false)}
        onSave={(remark) => onSaveRemark(student, remark)}
      />
    </>
  );
}
