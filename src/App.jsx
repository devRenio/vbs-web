import Header from "./components/Header";
import ClassPicker from "./components/ClassPicker";
import SessionPicker from "./components/SessionPicker";
import AttendanceList from "./components/AttendanceList";
import InvalidLink from "./components/InvalidLink";
import { useClasses, useAttendance } from "./hooks/useAttendance";
import { useAuth } from "./hooks/useAuth";
import { SESSIONS } from "./types";
import { useState } from "react";

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mx-auto mt-4 max-w-2xl px-4">
      <div
        role="alert"
        className="animate-rise-in flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        <span className="min-w-0 break-words">{message}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline">
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}

function Loading({ label }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-20 text-stone-400">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-indigo-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function AttendanceApp() {
  const [selectedClass, setSelectedClass] = useState(/** @type {string|null} */ (null));
  const [session, setSession] = useState(SESSIONS[0].key);

  const classesState = useClasses();
  const { students, teachers, loading, error, pending, refresh, toggle } =
    useAttendance(selectedClass);

  const inClass = selectedClass != null;

  return (
    <div className="min-h-full">
      <Header
        className={selectedClass}
        teachers={teachers}
        onBack={() => setSelectedClass(null)}
        onRefresh={inClass ? refresh : classesState.refresh}
        loading={inClass ? loading : classesState.loading}
      />

      {inClass && <SessionPicker value={session} onChange={setSession} />}

      <main className="pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
        {!inClass ? (
          <div key="classes" className="animate-fade-in">
            <ErrorBanner message={classesState.error} onRetry={classesState.refresh} />
            {classesState.loading ? (
              <Loading label="반 목록을 불러오는 중…" />
            ) : (
              <ClassPicker classes={classesState.classes} onSelect={setSelectedClass} />
            )}
          </div>
        ) : (
          <div key={selectedClass} className="animate-fade-in">
            <ErrorBanner message={error} onRetry={refresh} />
            {loading && students.length === 0 ? (
              <Loading label="출석 데이터를 불러오는 중…" />
            ) : (
              <AttendanceList
                students={students}
                sessionKey={session}
                pending={pending}
                onToggle={toggle}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { status } = useAuth();

  if (status === "checking") return <Loading label="잠시만 기다려 주세요" />;
  if (status === "denied") return <InvalidLink />;
  return <AttendanceApp />;
}
