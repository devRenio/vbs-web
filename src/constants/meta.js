import pkg from "../../package.json";

/** App metadata — single source for footer, HTML meta, etc. */
export const APP_META = {
  title: "출석부",
  event: "여름성경학교",
  version: pkg.version,
  author: "서울양천교회 공은호",
  repo: "https://github.com/devRenio/vbs-web",
};

/** e.g. "© 2026 여름성경학교" */
export function copyrightLine(year = new Date().getFullYear()) {
  return `© ${year} ${APP_META.event}`;
}
