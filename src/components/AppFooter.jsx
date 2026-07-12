import { APP_META, copyrightLine } from "../constants/meta";

/**
 * Unobtrusive site footer — copyright, version, author.
 * Placed at the bottom of every screen; stays out of the way on mobile.
 */
export default function AppFooter() {
  return (
    <footer className="pointer-events-none mt-auto select-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 text-center">
      <p className="text-[10px] leading-relaxed tracking-wide text-stone-300">
        {copyrightLine()}
        <span aria-hidden="true" className="mx-1">
          ·
        </span>
        {APP_META.title} v{APP_META.version}
      </p>
      <p className="mt-0.5 text-[10px] text-stone-300/70">{APP_META.author}</p>
    </footer>
  );
}
