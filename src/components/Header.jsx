import { RefreshIcon, ChevronLeftIcon, UserIcon } from "./icons";

/**
 * Sticky app header. Shows the class name + teacher badge(s) when inside a class.
 *
 * @param {Object} props
 * @param {string|null} props.className   currently selected class (or null)
 * @param {string[]} props.teachers       teacher name(s) for the class
 * @param {() => void} props.onBack        clear the class selection
 * @param {() => void} props.onRefresh
 * @param {boolean} props.loading
 */
export default function Header({ className, teachers = [], onBack, onRefresh, loading }) {
  const inClass = className != null;

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f6f5f3]/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        {inClass && (
          <button
            type="button"
            onClick={onBack}
            aria-label="반 선택으로"
            className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-500 transition active:scale-90 active:bg-black/5"
          >
            <ChevronLeftIcon />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[17px] font-bold tracking-tight text-stone-900">
              {className ?? "출석부"}
            </h1>
          </div>

          {inClass ? (
            teachers.length > 0 ? (
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {teachers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    <UserIcon />
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-stone-400">담당 교사 미지정</p>
            )
          ) : (
            <p className="mt-0.5 text-xs text-stone-500">여름성경학교 · 반을 선택하세요</p>
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="새로고침"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-500 transition active:scale-90 active:bg-black/5 disabled:opacity-40"
        >
          <RefreshIcon spinning={loading} />
        </button>
      </div>
    </header>
  );
}
