import { SESSIONS } from "../types";
import { sessionsByDay } from "../utils/attendance";

/**
 * Day-grouped, horizontally-scrollable session selector. Sticky under the header.
 *
 * @param {Object} props
 * @param {string} props.value            selected session key
 * @param {(sessionKey: string) => void} props.onChange
 */
export default function SessionPicker({ value, onChange }) {
  const days = sessionsByDay(SESSIONS);

  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+4rem)] z-10 border-b border-black/5 bg-[#f6f5f3]/85 backdrop-blur-md">
      <div className="no-scrollbar mx-auto max-w-2xl overflow-x-auto px-4 py-2.5">
        <div className="flex items-stretch gap-2">
          {days.map(({ day, sessions }, di) => (
            <div key={day} className="flex shrink-0 items-center gap-2">
              {di > 0 && <span className="h-6 w-px bg-black/10" aria-hidden="true" />}
              <div className="shrink-0">
                <p className="mb-1 pl-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  {day}
                </p>
                <div className="flex gap-1.5">
                  {sessions.map((s) => {
                    const active = s.key === value;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => onChange(s.key)}
                        aria-pressed={active}
                        className={[
                          "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95",
                          active
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                            : "bg-white text-stone-600 ring-1 ring-black/5 hover:ring-black/10",
                        ].join(" ")}
                      >
                        {s.part}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
