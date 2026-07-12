/**
 * Code.gs — Google Apps Script backend for the retreat attendance app.
 * ---------------------------------------------------------------------
 * This is the ONLY layer that reads the master spreadsheet. It strips the
 * sensitive columns (보호자 / 연락처) and returns ONLY the whitelisted fields:
 *   { id, row, no, name, gender, church, className, attendance }
 *
 * Deploy:  Deploy ▸ New deployment ▸ type "Web app"
 *          - Execute as: Me
 *          - Who has access: Anyone
 *          Copy the /exec URL into the frontend's VITE_GAS_API_URL.
 *
 * CORS: GAS cannot answer a cross-origin preflight (OPTIONS). The frontend avoids
 * triggering one by POSTing a plain-text body (Content-Type: text/plain). We read
 * the raw body via e.postData.contents and JSON.parse it here. GAS then 302s to a
 * googleusercontent.com URL that DOES include Access-Control-Allow-Origin: *,
 * so the browser can read the response.
 *
 * ── SHEET LAYOUT (decoded from the real "N세M반" tabs) ──────────────────────────
 *   Row 1-4 : title / teacher (교사) — ignored
 *   Row 5-7 : 3-line merged header (No. / 이름 / 성별 / 교회 / 보호자 / 연락처 /
 *             숙소 / 출석사항(7 sessions) / 비고)
 *   Row 8.. : student rows (No. 1..N). Blank-name rows are skipped.
 *   합계 row : totals — stops parsing.
 *   Column A is a blank spacer; real data starts at column B.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── Layout configuration (1-based, as used by Sheet.getRange) ─────────────────
const TEACHER_ROW = 4; // row holding "교사" label + teacher name(s)
const DATA_START_ROW = 8; // first student row

const COL = {
  no: 2, // B
  name: 3, // C
  gender: 4, // D
  church: 5, // E
  guardian: 6, // F  ← PII, never read into output
  contact: 7, // G  ← PII, never read into output
  lodging: 8, // H
  remark: 16, // P
};

// Session key → spreadsheet column (I~O). Keys MUST match src/types SESSIONS.
const SESSION_COL = {
  d1_pm: 9, // I 첫째날 오후
  d2_am: 10, // J 둘째날 오전
  d2_nap: 11, // K 둘째날 낮잠
  d2_pm: 12, // L 둘째날 오후
  d3_am: 13, // M 세째날 오전
  d3_pm: 14, // N 세째날 오후
  d4_am: 15, // O 넷째날 오전
};

const PRESENT_MARK = "O"; // written when marking present; blank clears it.
const TOTAL_LABEL = "합계"; // No.-column value that terminates the roster.

// Only expose tabs whose name matches a class (e.g. "3세1반"). Adjust if needed.
const CLASS_TAB_PATTERN = /반/;

// ── Helpers ───────────────────────────────────────────────────────────────────
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function isPresent_(cellValue) {
  // Treat any non-empty mark ("O", "o", "0", "√", …) as present.
  return String(cellValue == null ? "" : cellValue).trim() !== "";
}

/**
 * Read the teacher name(s) for a class from TEACHER_ROW.
 * The row looks like:  [ , "교사", "이채원S", , , … ]
 * We scan from the name column onward and collect every non-empty cell,
 * so both single- and two-teacher classes are handled. Any cell that itself
 * contains multiple names (comma/slash separated) is split too.
 * @returns {string[]}
 */
function readTeachers_(sheet) {
  const row = sheet.getRange(TEACHER_ROW, 1, 1, COL.remark).getValues()[0];
  const teachers = [];
  for (let c = COL.name - 1; c < row.length; c++) {
    const v = String(row[c] == null ? "" : row[c]).trim();
    if (!v || v === "교사") continue;
    v.split(/[,/·]/).forEach((part) => {
      const name = part.trim();
      if (name) teachers.push(name);
    });
  }
  return teachers;
}

/** List sheet tabs that look like classes. */
function listClasses_() {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map((s) => s.getName())
    .filter((name) => CLASS_TAB_PATTERN.test(name));
}

/** Read all students of one class tab, projecting ONLY whitelisted fields. */
function readClass_(className) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(className);
  if (!sheet) throw new Error("반을 찾을 수 없습니다: " + className);

  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];

  // Read the whole data block once (rows DATA_START_ROW..lastRow, cols A..P).
  const numRows = lastRow - DATA_START_ROW + 1;
  const values = sheet.getRange(DATA_START_ROW, 1, numRows, COL.remark).getValues();

  const students = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i]; // 0-based within the block; row[colIndex] uses (COL - 1)
    const noVal = row[COL.no - 1];

    if (String(noVal).trim() === TOTAL_LABEL) break; // reached 합계

    const name = String(row[COL.name - 1] || "").trim();
    if (!name) continue; // skip empty roster slots

    const attendance = {};
    Object.keys(SESSION_COL).forEach((key) => {
      attendance[key] = isPresent_(row[SESSION_COL[key] - 1]);
    });

    const sheetRow = DATA_START_ROW + i;
    students.push({
      id: className + "#" + sheetRow,
      row: sheetRow,
      no: noVal,
      name: name,
      gender: String(row[COL.gender - 1] || "").trim(),
      church: String(row[COL.church - 1] || "").trim(),
      className: className,
      attendance: attendance,
      // NOTE: 보호자(row[COL.guardian-1]) and 연락처(row[COL.contact-1]) are
      // intentionally NOT included — they never leave the backend.
    });
  }
  return students;
}

// ── HTTP handlers ──────────────────────────────────────────────────────────────

/**
 * GET
 *   ?action=classes            → { ok, data: string[] }   (class tab names)
 *   ?action=class&class=3세1반  → { ok, data: { teachers: string[], students: Student[] } }
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || "classes";

    if (action === "classes") {
      return json_({ ok: true, data: listClasses_() });
    }
    if (action === "class") {
      if (!params.class) throw new Error("class 파라미터가 필요합니다.");
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(params.class);
      if (!sheet) throw new Error("반을 찾을 수 없습니다: " + params.class);
      return json_({
        ok: true,
        data: { teachers: readTeachers_(sheet), students: readClass_(params.class) },
      });
    }
    throw new Error("알 수 없는 action: " + action);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/**
 * POST { action: "setAttendance", payload: { className, row, sessionKey, present } }
 * → sets one session cell to "O" (present) or blank (absent) and returns the
 *   updated student record.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === "setAttendance") {
      const { className, row, sessionKey, present } = body.payload || {};
      const col = SESSION_COL[sessionKey];
      if (!col) throw new Error("알 수 없는 sessionKey: " + sessionKey);

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(className);
      if (!sheet) throw new Error("반을 찾을 수 없습니다: " + className);

      sheet.getRange(row, col).setValue(present ? PRESENT_MARK : "");

      // Return the freshly-read student so the client can reconcile state.
      const students = readClass_(className);
      const updated = students.find((s) => s.row === row) || null;
      return json_({ ok: true, data: updated });
    }

    throw new Error("알 수 없는 action: " + body.action);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
