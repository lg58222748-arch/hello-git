---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-tutorial-2026-05-18/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-bmad-tutorial-2026-05-18/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-bmad-tutorial-2026-05-18/addendum.md
  - _bmad-output/brainstorming/brainstorming-session-2026-05-18-2206.md
workflowType: 'architecture'
project_name: 'bmad-tutorial'
user_name: 'seunwoo'
date: '2026-05-19'
lastStep: 8
status: 'complete'
completedAt: '2026-05-19'
---

# Architecture Decision Document

> n=1, BMad 튜토리얼 실습 목적. PRD 결정 사항을 토대로 **Next.js (frontend) + FastAPI (backend) + Supabase (Postgres)** 위에서의 구체적 결정을 기록한다.

> **버전 정책:** 본 문서는 도구 명령(`create-next-app`, `uv add`)이 설치 시점에 끌어오는 최신 안정 버전을 신뢰한다. 명시적 버전 핀(pin)은 두지 않으며, 실제 스토리 실행 시점에 잠금 파일(`uv.lock`, `package-lock.json`)이 사실상의 SoT가 된다. *[ASSUMPTION] 2026-05-19 기준.*

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (PRD §5):**
- **F1 (FR1.1–1.5):** 항목 CRUD + 순서 변경 + 60자 상한
- **F2 (FR2.1–2.4):** V 체크 토글, 즉시 시각 반영, 위치 유지
- **F3 (FR3.1–3.3):** 클라이언트 로컬 자정 리셋, 다음 접속 시 지연 감지, 이력 미저장
- **F4 (FR4.1–4.4):** Today 화면이 랜딩, 빈 상태 안내

아키텍처 관점에서 이는 **단일 리소스 `items` + 단일 벌크 리셋 + 인증 없음**으로 축약된다.

**Non-Functional Requirements (PRD §6):**
- **NFR1 (스택):** Next.js / FastAPI / Supabase 핀
- **NFR2 (영속성):** Supabase Postgres
- **NFR3 (응답 속도):** 페이지 1초 / 액션 300ms — 낙관적 UI 미적용 상태에서는 빡빡한 제약
- **NFR4 (단순성):** Today 외 추가 라우트 최소화
- **NFR5 (반응형):** 데스크톱 + 모바일 브라우저
- **NFR6 (온라인 전제):** 네트워크 부재 시 명확한 상태 표시

**Scale & Complexity:**
- n=1, 인증 없음, 멀티테넌시 없음
- 단일 테이블 데이터 모델, 평균 < 10 행
- 실시간/비동기 작업 없음
- **복잡도: low**
- **주 도메인: 분리형 풀스택 웹**
- **컴포넌트 수: 3 (Next.js / FastAPI / Supabase)**

### Technical Constraints & Dependencies
- Supabase 접근은 service-role key로만 (RLS 미사용 — n=1 + 인증 없음)
- FastAPI는 Supabase 위의 의도된 중간 계층 (학습 목적)
- 리셋 기준 시계 = 클라이언트 로컬 시간 (FR3.1)
- 한글/이모지 포함 60자 검증은 grapheme 기준이어야 한다 (FR1.5)

### Cross-Cutting Concerns Identified
- **시간/날짜 처리:** 자정 판정 (클라이언트 timezone), 마지막 동기화 일자 추적
- **네트워크 실패 표면화:** NFR6에 따른 사용자 가시화
- **유니코드 길이:** `Intl.Segmenter` 기반 grapheme 카운터
- **CORS:** FastAPI는 Next.js origin 허용 (로컬 dev 시 `localhost:3000`)

---

## Starter Template Evaluation

### Primary Technology Domain
**분리형 풀스택 웹** — Next.js(표현) + FastAPI(API/비즈니스 로직) + Supabase(영속성).

### Starter Options Considered
세 계층을 한 번에 묶는 단일 스타터는 결국 선택지를 좁힌다(Next.js+Supabase 직결 스타터는 FastAPI를 끼우지 못함; T3/Blitz는 ORM과 Auth 가정을 강제함). **각 계층 공식 CLI 분리 사용**이 BMad 학습 의도(각 조각을 직접 보는 것)에 가장 부합.

### Selected Starter: 계층별 공식 CLI

**Initialization Commands:**

```bash
# Frontend
npx create-next-app@latest frontend --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"

# Backend
mkdir backend && cd backend
uv init
uv add fastapi[standard] uvicorn pydantic-settings supabase python-dateutil
uv add --dev pytest httpx pytest-asyncio

# Database
# Supabase 웹 대시보드에서 신규 프로젝트 생성 → URL + service_role key 캡처 → backend/.env
# 초기 스키마는 supabase/migrations/0001_init.sql 적용
```

**Architectural Decisions Provided by Starter:**

| 영역 | 결정 |
|---|---|
| Frontend 언어 | TypeScript (Next.js 기본) |
| Backend 언어 | Python 3.12+ via uv |
| Styling | Tailwind CSS |
| Build (FE) | Next.js (Turbopack dev) |
| Build (BE) | 인터프리터, 빌드 없음 |
| Test (FE) | Vitest + Testing Library (Story 1.1에서 추가) |
| Test (BE) | pytest + httpx |
| FE 코드 구조 | App Router (`src/app/`) |
| BE 코드 구조 | 단일 FastAPI 앱 + 라우터 분리 |
| Dev 명령 | `npm run dev` / `uv run fastapi dev main.py` |

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (구현 차단):**
- 데이터 모델 (단일 `items` 테이블 + `app_state`)
- API 계약 (Next.js ↔ FastAPI)
- 자정 리셋 구현 (클라이언트 감지 + 서버 적용)
- Supabase 접근 패턴 (service-role key는 백엔드만)

**Important (아키텍처 형태 결정):**
- Pydantic 스키마, ID 전략(uuid), 순서 전략(정수 position)
- 에러 응답 모양
- CORS 정책

**Deferred (V1.x):**
- 프로덕션 배포 타깃
- 관측성/로깅 도구
- 자정 리셋의 timezone/DST 엣지 테스트
- 설정 화면(데이터 초기화)

### Data Architecture

**DB:** Supabase Postgres (managed). RLS 미사용 — 단일 사용자 + 서비스 키 경유.

**Initial Schema (`supabase/migrations/0001_init.sql`):**

```sql
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  text        text not null check (char_length(text) <= 60),
  checked     boolean not null default false,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index items_position_idx on public.items (position);

create table public.app_state (
  id              integer primary key default 1 check (id = 1),
  last_seen_date  date not null
);
insert into public.app_state (id, last_seen_date) values (1, current_date)
  on conflict (id) do nothing;
```

**왜 두 테이블?** `items`는 데이터, `app_state`는 "마지막으로 본 날" 1행 상태(자정 리셋 감지용). 단일 행은 `check (id = 1)`로 강제. localStorage 대안은 멀티 기기/브라우저 사용 시 깨지므로 기각.

**Validation Strategy (3-layer):**
- **DB:** `check (char_length(text) <= 60)` — 최종 가드
- **API:** Pydantic `Field(max_length=60)` — DB 왕복 전 빠른 실패
- **UI:** `Intl.Segmenter` 기반 grapheme 카운터 + `<input maxLength>` — UX 피드백

**Migration:** 초기 스키마 1회는 `supabase/migrations/0001_init.sql` 수동 적용. 이후 변경은 Supabase CLI `db diff`/`db push`. *[ASSUMPTION] 단일 개발자, 가벼운 운영.*

**Caching:** 없음. 페이지 로드당 단일 `GET /items` (< 10 행).

### Authentication & Security

- **인증:** 없음 (PRD 결정)
- **인가:** 없음
- **키 관리:** service-role key는 `backend/.env`에만, gitignore 됨. 브라우저로 절대 노출하지 않는다.
- **CORS:** dev `http://localhost:3000`; production은 배포 시점에 한 origin 명시.
- **OQ7 (URL-only 접근 통제):** 프로덕션 배포 시 추측 어려운 도메인/서브도메인 사용. 이 자체가 유일한 접근 통제 — n=1 한정 수용 리스크. 본 문서에 명시 기록.

### API & Communication Patterns

**Style:** REST + JSON. FastAPI 자동 OpenAPI `/docs`.

**Endpoints:**

```
GET    /items                     # position 오름차순
POST   /items                     # {text} → 201 Item
PATCH  /items/{id}                # {text?, checked?} → 200 Item
DELETE /items/{id}                # → 204
POST   /items/reorder             # {ids: [uuid...]} → 200 [Item]
POST   /reset-if-new-day          # {client_date: "YYYY-MM-DD"} → 200 {reset: bool, items: [Item]}
```

**Response shape:**
- 성공: 리소스 그대로 (envelope 없음)
- 에러: `{ "detail": "..." }` (FastAPI 기본)

**자정 리셋 구현 (FR3.1/3.2 해소):**

```
[Client - 페이지 로드/focus]
  → resetCheck.ts: 현재 로컬 날짜 계산
  → POST /reset-if-new-day { client_date }

[Server]
  → app_state.last_seen_date 조회
  → client_date > last_seen_date 이면:
       UPDATE items SET checked = false, updated_at = now()
       UPDATE app_state SET last_seen_date = client_date
       return { reset: true, items: [...] }
  → 아니면 return { reset: false, items: [...] }
```

- **클라이언트 lazy 감지 + 서버 적용**: 서버 cron은 사용자 timezone을 모르므로 사용 불가 (FR3.1 클라이언트 시계 기준). 클라이언트가 "내가 보는 날짜는 X"를 알리면 서버는 그 진실을 받아들여 1회만 적용 (멱등성 — Story 3.2 AC와 일치).
- 페이지 첫 로드 + `visibilitychange` 이벤트(탭 다시 활성화 시)에 호출. 인터벌 폴링 없음.

**Supabase + FastAPI 중복 정당화 (OQ8 해소):**
- **리셋 로직의 단일 seam.** 벌크 unchecked는 서버에 있어야 자연스럽고, Next.js에서 직접 Supabase 호출하면 흩어진다.
- **service-role key가 브라우저로 나가지 않음.** 인증 없는 모델에서 가장 깨끗한 보안 구조.
- **학습 표면.** Pydantic + 라우터 + 의존성 주입이 본 튜토리얼의 학습 표적.
- 대안 (Next.js Server Actions + Supabase 직결, Supabase Edge Function)도 합리적이지만 **학습 목적**으로 기각.

**Error handling 표준:**
- 4xx: 클라이언트 오류 (검증, 미존재)
- 5xx: FastAPI 기본 500 핸들러 — 별도 wrapping 없음
- 프론트는 `error.detail`을 banner/toast로 노출, 절대 silent swallow 금지

**Rate limiting:** 없음 (n=1).

### Frontend Architecture

- **프레임워크:** Next.js App Router
- **상태 관리:** React state + `useReducer`. 전역 라이브러리(Redux/Zustand) 없음. SWR/TanStack Query도 초기 미도입 — 재요청 dedup이 아플 때 SWR 추가.
- **API 계층:** 모든 호출은 `src/lib/api.ts` 단일 모듈 경유
- **컴포넌트 구조:** Feature-flat — `src/components/today/`에 Today 조각 모음. `app/page.tsx`는 Server Component shell, `ItemList`만 Client Component
- **라우팅:** `/` 단일 라우트
- **DnD:** `@dnd-kit/sortable` (활발히 유지보수, 가벼움)

**OQ6 (낙관적 UI vs NFR3 300ms) 해소:**
- **V1:** 낙관적 UI **미적용**. 정직한 spinner/disabled + 네트워크 왕복 대기. NFR3 300ms 가드는 측정 후 위반 시 V1.1에서 체크 토글부터 낙관적으로 전환.
- **트리거:** 실사용 측정에서 액션 응답 중앙값 > 300ms이거나 사용자(=본인) 체감 불만 명시 발생 시. 가장 단순한 첫 적용 대상은 체크 토글 (롤백이 토글 1회면 충분).
- Open Item으로 PRD §8에 보존.

### Infrastructure & Deployment

**Local dev (V1 타깃):**
- Frontend `:3000` (`npm run dev`)
- Backend `:8000` (`uv run fastapi dev main.py` — 자동 reload + Swagger)
- DB: Supabase managed

**Production (V1.x, 보류):**
- Frontend: Vercel
- Backend: Fly.io 또는 Railway (FastAPI 컨테이너)
- DB: 동일 Supabase 프로젝트
- 배포 도메인은 OQ7 정책상 추측 어려운 이름 사용

**Env:**
- `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOW_ORIGIN`
- `frontend/.env.local`: `NEXT_PUBLIC_API_BASE_URL`
- `.env*` 절대 커밋 금지 — `.env.example`만 커밋

**Monitoring/Logging:** 콘솔 로그만 V1.
**CI/CD:** V1 없음.

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase 프로젝트 + 초기 스키마 (Story 1.1)
2. Backend scaffold + `GET /items` (Story 1.1)
3. Frontend scaffold + 리스트 렌더 (Story 1.1)
4. `POST /items` + AddItemForm (Story 1.2)
5. `PATCH /items/{id}` (checked) + 체크 토글 (Story 1.5)
6. 시각 구분 + 위치 유지 (Story 1.6)
7. 영속성 검증 (Story 1.7)
8. 수정·삭제·드래그·길이 가드 (Story 2.1–2.4)
9. `POST /reset-if-new-day` + resetCheck.ts (Story 3.1–3.3)

**Cross-Component Dependencies:**
- 모든 프론트 동작 → `src/lib/api.ts`
- 모든 백엔드 DB 접근 → `backend/db.py`
- 리셋 엔드포인트 → `app_state` 테이블 존재 필요 → 초기 스키마에 포함

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Postgres:**
- 테이블: `snake_case` 복수형 (`items`)
- 컬럼: `snake_case` (`created_at`, `last_seen_date`)
- PK: `id` (uuid)

**REST API:**
- 경로: 복수 리소스 (`/items`), 액션은 kebab-case (`/reset-if-new-day`)
- 경로 파라미터: `{id}`
- JSON 필드: `snake_case` (DB와 동일 — 변환 계층 없음)

**Backend (Python):**
- 모듈/파일: `snake_case`
- 함수: `snake_case` (`list_items`)
- Pydantic 모델: `PascalCase` (`Item`, `ItemCreate`, `ItemUpdate`)
- 상수: `UPPER_SNAKE_CASE`

**Frontend (TS/React):**
- 컴포넌트: `PascalCase` (`ItemRow.tsx`)
- 비-컴포넌트 모듈: `camelCase` (`api.ts`)
- 훅: `useXxx`
- 타입/인터페이스: `PascalCase`
- **JSON-to-TS 경계:** API가 `snake_case`이므로 TS 타입도 `snake_case` 유지. camelCase 변환 계층 두지 않음 — 한 가지 버그 카테고리 제거.

### Structure Patterns

**Backend:** `main.py` → 라우터 import. 라우터 1개당 1 파일. 비즈니스 로직은 V1에서 라우터 핸들러 내부 (이른 추상화 금지).

**Frontend:**
- App Router (`src/app/`)
- 기능 폴더 (`src/components/today/`)
- 단일 API 모듈 (`src/lib/api.ts`)
- 타입 (`src/types/`)
- 테스트는 컴포넌트 옆 `Component.test.tsx`

### Format Patterns

- 날짜: 페이로드는 ISO 8601 (`2026-05-19T12:34:56Z`)
- 리셋 엔드포인트 입력만 `"YYYY-MM-DD"` (클라이언트 로컬 날짜)
- Boolean: JSON `true`/`false`
- 응답 envelope 없음

**Error response:**
```json
{ "detail": "Item not found" }
```

### Communication Patterns

- **Frontend → Backend:** `src/lib/api.ts` 통해서만 fetch
- **Backend → Supabase:** `backend/db.py`의 client factory 통해서만
- 네트워크 에러는 사용자에게 가시화 (NFR6)

### Process Patterns

- **에러:** 백엔드 `HTTPException`, 프론트 `ApiError` 던지고 UI에서 banner — silent swallow 금지
- **로딩:** 액션 버튼은 in-flight 동안 disabled + spinner. 페이지 로드는 SSR 초기 페치 → 첫 페인트 spinner 없음
- **글로벌 오버레이 없음**

### Enforcement Guidelines

**모든 AI 에이전트는 반드시:**
- 전 구간 `snake_case` 일관 (DB → API → TS 타입)
- 백엔드 DB 접근은 `backend/db.py` 경유
- 프론트 백엔드 호출은 `src/lib/api.ts` 경유
- Supabase 키 프론트 코드 노출 금지

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-tutorial/
├── README.md
├── .gitignore
├── _bmad-output/                  # BMad artifacts (기존)
│
├── backend/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── .env.example
│   ├── .env                       # gitignored
│   ├── main.py                    # FastAPI 앱 + CORS + 라우터 등록
│   ├── db.py                      # Supabase client factory
│   ├── settings.py                # pydantic-settings (env 로드)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── items.py               # /items 5개 엔드포인트
│   │   └── reset.py               # /reset-if-new-day
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── item.py                # Item / ItemCreate / ItemUpdate / ResetRequest / ResetResponse
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_items.py
│       └── test_reset.py
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .env.local.example
│   ├── .env.local                 # gitignored
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           # Today (server component shell, 초기 fetch)
│       │   └── globals.css
│       ├── components/
│       │   └── today/
│       │       ├── ItemList.tsx   # Client, dnd-kit, 메인 인터랙티브 영역
│       │       ├── ItemRow.tsx    # 단일 항목 (체크/수정/삭제)
│       │       ├── AddItemForm.tsx
│       │       └── EmptyState.tsx
│       ├── lib/
│       │   ├── api.ts             # 모든 HTTP 호출
│       │   ├── resetCheck.ts      # 자정 감지 + /reset-if-new-day 호출
│       │   └── graphemeLen.ts     # Intl.Segmenter 기반 60자 카운터
│       └── types/
│           └── item.ts
│
└── supabase/
    └── migrations/
        └── 0001_init.sql
```

### Architectural Boundaries

- **API:** 6개 엔드포인트가 유일한 공개 표면
- **DB:** Supabase는 service-role key 가진 백엔드만 접근. 프론트 직결 금지
- **FE 컴포넌트:** `app/page.tsx`는 server shell, `ItemList`만 클라이언트
- **HTTP 지식:** 프론트는 `lib/api.ts` 한 곳만

### Requirements to Structure Mapping

| FR | Backend | Frontend |
|---|---|---|
| FR1.1 추가 | `POST /items` (`routers/items.py`) | `AddItemForm.tsx` |
| FR1.2 수정 | `PATCH /items/{id}` | `ItemRow.tsx` (편집 모드) |
| FR1.3 삭제 | `DELETE /items/{id}` | `ItemRow.tsx` (삭제 액션) |
| FR1.4 정렬 | `POST /items/reorder` | `ItemList.tsx` + `@dnd-kit/sortable` |
| FR1.5 60자 | DB check + `Field(max_length=60)` | `graphemeLen.ts` |
| FR2.1–2.3 토글 | `PATCH /items/{id}` `{checked}` | `ItemRow.tsx` |
| FR2.4 위치 유지 | (없음 — 정렬 비변경) | `ItemList.tsx` 클라이언트 렌더 |
| FR3.1/3.2 리셋 | `POST /reset-if-new-day` | `resetCheck.ts` (load + visibilitychange) |
| FR3.3 이력 미저장 | reset 시 별도 테이블 쓰기 없음 | — |
| FR4.1 랜딩 | — | `app/page.tsx` |
| FR4.2/4.3 한 화면 | — | `components/today/*` |
| FR4.4 빈 상태 | — | `EmptyState.tsx` |
| NFR3 페이지 1초 | SSR 초기 페치 (단일 쿼리) | server component shell |
| NFR6 오프라인 표시 | — | `api.ts` catch → 상태 표시 |

### Integration Points

- **Internal:** Frontend → Backend (HTTP/JSON via `lib/api.ts`); Backend → Supabase (`db.py`)
- **External:** Supabase (managed Postgres) — 유일한 외부 서비스
- **Data flow:**
  1. URL 접속 → server component → `GET /items` → 초기 렌더
  2. 클라이언트 hydrate → `resetCheck.ts` 호출 → 리셋되었으면 refetch
  3. 사용자 액션 → `lib/api.ts` → FastAPI → Supabase → 응답 → React 상태 업데이트

---

## Architecture Validation Results

### Coherence Validation ✅
- 스택 3계층 결정이 서로 충돌하지 않음
- `snake_case` 전 구간 일관 → cross-boundary 매핑 버그 카테고리 제거
- service-role key 격리가 "인증 없음" 모델과 정합

### Requirements Coverage Validation ✅
- PRD §5의 모든 FR이 엔드포인트/컴포넌트로 매핑됨 (위 표)
- NFR2 영속성 → Supabase
- NFR3 페이지 1초 → SSR 초기 페치로 spinner-less 1차 페인트
- NFR3 액션 300ms → 낙관적 UI 미적용으로 위반 가능 — V1.1 트리거 명시
- NFR4 단순성 → 단일 라우트
- NFR5 반응형 → Tailwind 책임
- NFR6 온라인 전제 → 네트워크 실패 표면화 정책
- **OQ6 해소** (낙관적 UI 미적용 + 재검토 트리거)
- **OQ7 부분 해소** (URL 추측 난이도 수용)
- **OQ8 해소** (Supabase+FastAPI 정당화 3가지 명시)

### Implementation Readiness Validation ✅
- 초기 스키마 SQL 작성됨
- 엔드포인트 6개 모양 정의됨
- 폴더 구조 끝까지 명세됨
- Story 1.1 즉시 착수 가능

### Gap Analysis Results

**Critical Gaps:** 없음.

**Important Gaps:**
- 프로덕션 CORS origin은 배포 시점에 결정 (의도적 보류)
- 스토리별 상세 테스트 케이스는 아직 (epics/stories 재생성 단계에서)

**Nice-to-Have Gaps:**
- CI 파이프라인 없음 (n=1 수용)
- 구조화 로깅 없음 (V1 수용)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** high

**Key Strengths:**
- PRD 의도와 정합 (n=1, 단순, 학습 목적)
- 명명 통일이 LLM 구현 버그 한 카테고리를 제거
- 자정 리셋 seam이 명시적이라 OQ8 정당화가 자연스러움

**Areas for Future Enhancement:**
- NFR3 측정 후 낙관적 UI 부분 도입
- 프로덕션 배포 구성 (Vercel + Fly/Railway)
- DST/timezone 엣지 테스트 보강

### Implementation Handoff

**AI Agent Guidelines:**
- 전 구간 `snake_case`
- 백엔드 DB 접근은 `backend/db.py` 경유
- 프론트 HTTP는 `src/lib/api.ts` 경유
- Supabase 키 프론트 노출 금지
- 기능 질문은 PRD, 기술 질문은 본 문서를 SoT로

**First Implementation Priority:**
**Story 1.1** — Supabase 프로젝트 생성 + `0001_init.sql` 적용 + `backend/` 스캐폴드(`uv init` + FastAPI hello + `GET /items` 빈 배열 반환) + `frontend/` 스캐폴드(`create-next-app` + `app/page.tsx`가 "첫 항목을 추가해보세요" 노출). 스모크 테스트: 백엔드 `pytest`가 `GET /items` → `[]`를, 프론트는 빈 상태 안내가 화면에 보이는지 확인.
