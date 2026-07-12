import { ChevronRightIcon } from "./icons";

/**
 * Grid of class tabs with large tap targets and a subtle staggered entrance.
 *
 * @param {Object} props
 * @param {string[]} props.classes
 * @param {(className: string) => void} props.onSelect
 */
export default function ClassPicker({ classes, onSelect }) {
  if (classes.length === 0) {
    return (
      <p className="px-4 py-20 text-center text-sm text-stone-400">
        표시할 반이 없습니다.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {classes.map((c, i) => (
          <li
            key={c}
            className="animate-rise-in"
            style={{ animationDelay: `${Math.min(i * 35, 400)}ms` }}
          >
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="group flex w-full items-center justify-between gap-2 rounded-2xl border border-black/5 bg-white px-4 py-5 text-left shadow-sm shadow-stone-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-300/50 active:translate-y-0 active:scale-[0.98]"
            >
              <span className="text-base font-semibold text-stone-800">{c}</span>
              <ChevronRightIcon className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
