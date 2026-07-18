import { useEffect, useState } from "react";

/**
 * Bottom sheet for editing a student's remark (비고).
 * One remark per student — applies across all sessions/days.
 *
 * @param {Object} props
 * @param {import("../types").Student} props.student
 * @param {boolean} props.open
 * @param {boolean} props.pending
 * @param {() => void} props.onClose
 * @param {(remark: string) => Promise<void>} props.onSave
 */
export default function RemarkSheet({ student, open, pending, onClose, onSave }) {
  const [text, setText] = useState(student.remark ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText(student.remark ?? "");
  }, [open, student.remark]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(text.trim());
      onClose();
    } catch {
      // error surfaced by parent hook
    } finally {
      setSaving(false);
    }
  }

  const busy = pending || saving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="remark-title"
        className="animate-rise-in w-full max-w-2xl rounded-t-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 id="remark-title" className="text-sm font-bold text-stone-800">
            비고 · {student.name}
          </h2>
          <p className="text-xs text-stone-400">일차와 관계없이 학생별로 저장됩니다</p>
        </div>

        <div className="px-4 py-3">
          <textarea
            autoFocus
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메모를 입력하세요"
            className="w-full resize-none rounded-xl border border-black/10 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex gap-2 border-t border-stone-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-stone-600 active:bg-stone-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
