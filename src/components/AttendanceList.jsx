import StudentCard from "./StudentCard";
import { summarizeSession, sessionLabel } from "../utils/attendance";

/**
 * Roster for the selected class + session, with a live present/total summary bar.
 *
 * @param {Object} props
 * @param {import("../types").Student[]} props.students
 * @param {string} props.sessionKey
 * @param {Set<string>} props.pending    "row#sessionKey" or "row#remark" keys in flight
 * @param {(student: import("../types").Student, sessionKey: string) => void} props.onToggle
 * @param {(student: import("../types").Student, remark: string) => Promise<void>} props.onSaveRemark
 */
export default function AttendanceList({ students, sessionKey, pending, onToggle, onSaveRemark }) {
  if (students.length === 0) {
    return <p className="px-4 py-20 text-center text-sm text-stone-400">학생이 없습니다.</p>;
  }

  const s = summarizeSession(students, sessionKey);
  const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Summary card */}
      <div className="mb-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-stone-200/50">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-stone-700">{sessionLabel(sessionKey)}</h2>
          <p className="text-sm text-stone-500">
            <span className="text-lg font-bold text-emerald-600">{s.present}</span>
            <span className="mx-0.5 text-stone-300">/</span>
            {s.total}명 출석
          </p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Roster */}
      <ul
        key={sessionKey}
        className="animate-fade-in divide-y divide-stone-100 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm shadow-stone-200/50"
      >
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            sessionKey={sessionKey}
            pending={pending.has(`${student.row}#${sessionKey}`)}
            remarkPending={pending.has(`${student.row}#remark`)}
            onToggle={onToggle}
            onSaveRemark={onSaveRemark}
          />
        ))}
      </ul>
    </div>
  );
}
