/**
 * Shown when someone opens the public Pages URL without the magic-link key.
 * No input form — coordinators share the full ?key=… link privately.
 */
export default function InvalidLink() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="animate-rise-in w-full max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-stone-200 text-2xl text-stone-500">
          🔒
        </div>
        <h1 className="text-lg font-bold text-stone-900">접근할 수 없습니다</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          이 페이지는 담당 교사에게만 공유된 링크로 접속할 수 있습니다.
          <br />
          총괄 교사에게 출석부 링크를 요청해 주세요.
        </p>
      </div>
    </div>
  );
}
