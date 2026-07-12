# vbs-web — 수련회 출석 관리 시스템

대규모 수련회를 위한 웹 기반 출석 관리 시스템입니다. 기존 Google Sheet를 그대로
노출하는 대신, **Google Apps Script(GAS)** 백엔드가 시트에서 민감정보(학부모 연락처 등)를
걸러내고 **꼭 필요한 필드(이름·성별·반·출석상태)만** 프론트엔드로 전달합니다.

## 아키텍처

```
React (Vite + Tailwind)  ──GET/POST──▶  Google Apps Script (REST)  ──▶  Google Sheets (Master, PII 포함)
       │                                         │
   GitHub Pages 배포                     민감정보 필터링(화이트리스트)
```

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend/DB**: Google Apps Script Web App + Google Sheets
- **Deploy**: GitHub Pages (GitHub Actions 또는 `gh-pages`)
- **Local Dev**: Docker (선택)

## 디렉터리 구조

```
vbs-web/
├─ .github/workflows/deploy.yml   # GitHub Pages 자동 배포
├─ gas/Code.gs                    # 참조용 GAS 백엔드 코드
├─ public/
├─ src/
│  ├─ api/gasApi.js               # GAS fetch/post (CORS 처리)
│  ├─ components/                 # UI (Header, StudentCard, AttendanceList)
│  ├─ hooks/useAttendance.js      # 데이터 로딩 + Optimistic Update
│  ├─ utils/attendance.js         # 헬퍼 (그룹화, 요약 등)
│  ├─ types/index.js              # JSDoc 타입 정의
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ Dockerfile / docker-compose.yml / .dockerignore
├─ .env.example                   # .env 로 복사 후 채우기 (.env 는 커밋 금지)
└─ vite.config.js                 # base: "/vbs-web/"
```

## 시작하기

1. 환경변수 설정: `.env.example` 을 `.env` 로 복사하고 `VITE_GAS_API_URL` 을 배포된 GAS `/exec` URL 로 채웁니다.
2. 의존성 설치 및 개발 서버 실행:

```bash
npm install
npm run dev
```

### Docker로 실행 (선택)

```bash
docker compose up
# http://localhost:5173
```

## 배포 (GitHub Pages)

### 방법 A — GitHub Actions (권장)
- 저장소 **Settings ▸ Pages ▸ Build and deployment ▸ Source = GitHub Actions** 로 설정
- **Settings ▸ Secrets and variables ▸ Actions** 에 `VITE_GAS_API_URL` 시크릿 등록
- `main` 브랜치에 푸시하면 자동 빌드·배포

### 방법 B — gh-pages 수동 배포
```bash
npm run deploy   # dist 빌드 후 gh-pages 브랜치로 게시
```

> `vite.config.js` 의 `base` 는 `/vbs-web/` 입니다. 저장소 이름이 다르면 함께 수정하세요.

## 보안 원칙

- 마스터 시트의 민감정보는 **오직 GAS 서버에서만** 접근하며, 화이트리스트 필드만 응답합니다.
- API URL·서비스 계정 키 등은 코드에 하드코딩하지 않고 `.env`(로컬) / Actions Secret(배포)로 주입합니다.
- `.env`, `node_modules`, 각종 자격증명 파일은 `.gitignore` 로 제외됩니다.
