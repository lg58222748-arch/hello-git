---
title: 'Story 1.1 — Next.js + FastAPI + Supabase 빈 빌드 가능 상태 확보'
type: 'feature'
created: '2026-05-19'
status: 'in-progress'
baseline_commit: 'NO_VCS'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture.md'
  - '{project-root}/supabase/migrations/0001_init.sql'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 1의 이후 모든 스토리가 같은 기반 위에서 구현되려면, Next.js + FastAPI + Supabase 3계층이 각각 동작하고 서로 연결된 "빈 빌드 가능 상태"가 먼저 필요하다. 현재는 `supabase/migrations/0001_init.sql`만 존재하고 앱 코드가 없다.

**Approach:** 두 단계로 진행한다. **Phase A**에서 `backend/`(`uv init` + FastAPI + 빈 배열 반환 `GET /items` 스텁)와 `frontend/`(`create-next-app` + `lib/api.ts` 골격 + 빈 상태를 표시하는 SSR `page.tsx`)를 만들어 양쪽 서버가 독립적으로 기동 + 통신되는 상태를 확보한다. **Phase B**에서 `backend/db.py` Supabase client factory를 도입하고 `GET /items`를 실제 Supabase 쿼리로 교체한다. Supabase 콘솔 작업(프로젝트 생성, `0001_init.sql` 실행, 키 캡처)은 사용자가 수행하고 에이전트는 코드/문서만 담당한다.

## Boundaries & Constraints

**Always:**
- `architecture.md`의 파일 구조(`backend/`, `frontend/src/`, `supabase/`)와 명명(`snake_case` 전 구간) 그대로 따른다.
- `frontend/`의 모든 HTTP는 `src/lib/api.ts` 한 모듈 경유. `backend/`의 모든 Supabase 접근은 `backend/db.py` 한 모듈 경유.
- 환경 변수: `backend/.env`(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOW_ORIGIN=http://localhost:3000`), `frontend/.env.local`(`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`). 실제 값 파일은 gitignored, `.env.example` / `.env.local.example`만 커밋.
- CORS 미들웨어가 `localhost:3000`을 허용한다.
- `Item` TS 타입과 Pydantic 모델 모두 `snake_case` 필드: `id, text, checked, position, created_at, updated_at`.
- 페이지가 빈 배열일 때 "첫 항목을 추가해보세요" 안내를 SSR로 표시 (Story 1.4의 EmptyState 분리 전 골격 형태).
- 백엔드 미기동 시 프론트가 "백엔드 연결 실패" 류 메시지를 표시 (silent fail 금지).

**Ask First:**
- 사용자가 `uv`를 먼저 설치해야 한다 (`where uv` 미발견). 설치 미완료 상태면 에이전트는 HALT.
- Phase B 진입 시 사용자가 Supabase 프로젝트 URL + service-role key를 제공해야 한다. 미제공 시 Phase B를 보류하고 Phase A 결과만 커밋.

**Never:**
- `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_ANON_KEY`를 `frontend/` 어디에도 두지 않는다. `NEXT_PUBLIC_*` 접두로도 노출 금지.
- camelCase 변환 계층(DB→API→TS 사이) 도입 금지.
- `app/page.tsx` 외 라우트 추가 금지 (NFR4).
- Story 1.2 이후의 기능(`POST /items`, AddItemForm, 체크 토글 등) 선구현 금지. 본 스토리는 골격만.
- 낙관적 UI 코드 선도입 금지.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 백엔드 스모크 (Phase A) | `pytest` 실행, DB 의존 없음 | `GET /items` → `200 []` | N/A |
| 백엔드 스모크 (Phase B) | `pytest` 실행, Supabase 미연결 | `db.py` 의존성을 `[]` 반환 가짜로 오버라이드, `200 []` 통과 | 라이브 호출 금지 |
| 프론트 빈 페이지 (Phase A) | 백엔드 기동, 항목 0개 | SSR로 빈 상태 안내 한 줄 노출, 라우트는 `/` 하나 | N/A |
| 백엔드 미기동 | 프론트 페이지 로드, 백엔드 다운 | 에러 메시지 표시 (silent fail 금지) | `lib/api.ts` 에서 throw, `page.tsx` 에서 catch 후 메시지 렌더 |
| Phase B 연결 | Supabase 비어 있음 | `GET /items` → `200 []` (Supabase `items` 테이블 0행) | Supabase 인증 실패 시 500 + `{detail}` |

</frozen-after-approval>

## Code Map

- `backend/pyproject.toml` -- `uv init` 산출물, `[project]` 메타 + deps (`fastapi[standard]`, `uvicorn`, `pydantic-settings`, `supabase`, `python-dateutil`, dev: `pytest httpx pytest-asyncio`)
- `backend/main.py` -- FastAPI 앱 + CORS 미들웨어 + 라우터 등록
- `backend/settings.py` -- pydantic-settings 기반 env 로더 (`Settings` 클래스, `.env` 로드)
- `backend/db.py` -- Supabase client factory (Phase B에서 추가/완성), `get_supabase() -> Client`
- `backend/routers/__init__.py` + `backend/routers/items.py` -- `GET /items` 한 엔드포인트만 (Phase A: 빈 배열 리터럴, Phase B: Supabase 쿼리)
- `backend/schemas/__init__.py` + `backend/schemas/item.py` -- Pydantic `Item` 모델 (snake_case 필드)
- `backend/tests/conftest.py` + `backend/tests/test_items.py` -- `test_list_items_returns_empty_array_initially`
- `backend/.env.example` + `backend/.gitignore` -- env 누출 가드
- `frontend/` -- `npx create-next-app@latest` 산출물 (`--typescript --tailwind --app --eslint --src-dir --import-alias "@/*"`)
- `frontend/src/types/item.ts` -- `Item` TS 타입 (snake_case 필드)
- `frontend/src/lib/api.ts` -- `listItems(): Promise<Item[]>` + `ApiError` 표면화 + `NEXT_PUBLIC_API_BASE_URL` 사용
- `frontend/src/app/page.tsx` -- Server Component, `listItems()` 호출 → 빈 배열이면 안내 노출, 에러면 메시지 표시
- `frontend/.env.local.example` -- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `_bmad-output/implementation-artifacts/notes-story-1-1.md` -- 사용 버전(잠금 파일 기반) 기록

## Tasks & Acceptance

**Execution (Phase A — Next.js + FastAPI 스캐폴드):**
- [ ] `backend/` -- `uv init` + `uv add` 명령 실행 (architecture.md의 정확한 deps 목록 따라서). `uv.lock` 생성 확인.
- [ ] `backend/settings.py` -- pydantic-settings `Settings` 클래스. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOW_ORIGIN` 필드. Phase A에서는 미설정 허용(`Optional[str] = None`).
- [ ] `backend/schemas/item.py` -- `Item` Pydantic 모델 (id: UUID, text: str, checked: bool, position: int, created_at: datetime, updated_at: datetime — 전부 snake_case).
- [ ] `backend/routers/items.py` -- `router = APIRouter(prefix="/items")` + `GET /` 핸들러. Phase A에서는 `return []` 리터럴.
- [ ] `backend/main.py` -- FastAPI 앱 + CORSMiddleware(`allow_origins=[settings.CORS_ALLOW_ORIGIN or "http://localhost:3000"]`) + `app.include_router(items.router)`.
- [ ] `backend/tests/test_items.py` -- `test_list_items_returns_empty_array_initially`: httpx AsyncClient로 `GET /items` 호출, `status_code == 200 and response.json() == []` 검증. db.py 의존성 오버라이드로 라이브 호출 없이 통과.
- [ ] `backend/.env.example` -- 키 이름만 (값은 placeholder). `backend/.env`는 gitignored (이미 루트 `.gitignore`가 `*.env` 글롭으로 커버).
- [ ] `frontend/` -- 정확한 `npx create-next-app@latest` 플래그 실행. App Router + Tailwind + src 디렉토리.
- [ ] `frontend/src/types/item.ts` -- `Item` TS 타입 (snake_case).
- [ ] `frontend/src/lib/api.ts` -- `listItems()` 구현. fetch 실패 / 200 외 응답 시 명시적 throw. base URL = `process.env.NEXT_PUBLIC_API_BASE_URL`.
- [ ] `frontend/src/app/page.tsx` -- Server Component. try/await `listItems()` → 빈 배열이면 "첫 항목을 추가해보세요" 한 줄, catch면 "백엔드 연결 실패" 메시지. Tailwind 유틸리티만 사용.
- [ ] `frontend/.env.local.example` -- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
- [ ] `_bmad-output/implementation-artifacts/notes-story-1-1.md` -- Phase A 시점 사용 버전 기록 (`uv run python --version`, `uv pip list` 또는 `uv.lock` 참고; `node --version`, `frontend/package.json`의 next/react 버전).

**Execution (Phase B — Supabase 연결):**
- [ ] 사용자가 Supabase 콘솔에서 프로젝트 생성 + SQL Editor에서 `supabase/migrations/0001_init.sql` 실행. URL + service-role key 캡처. (에이전트는 가이드만)
- [ ] `backend/.env` -- 사용자가 채움 (커밋 금지).
- [ ] `backend/db.py` -- `get_supabase()` factory. `supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)`. 모듈 캐시.
- [ ] `backend/routers/items.py` -- `GET /` 를 `get_supabase().table("items").select("*").order("position").execute().data` 기반으로 교체. FastAPI Depends로 `get_supabase` 주입.
- [ ] `backend/tests/conftest.py` -- `get_supabase` 의존성 오버라이드 fixture (가짜 클라이언트가 빈 배열 반환). 기존 스모크 테스트가 Phase B에서도 라이브 호출 없이 통과해야 함.
- [ ] `_bmad-output/implementation-artifacts/notes-story-1-1.md` -- Phase B 추가 (Supabase 연결 검증 결과: 실제 `GET /items` 라이브 호출 1회 결과 + 응답 시간 메모).

**Acceptance Criteria:**
- Given `uv`가 설치되고 Phase A 작업이 끝난 상태, when `uv run fastapi dev main.py` 를 backend에서 실행, then `:8000`에서 서버가 기동되고 Swagger UI가 `/docs`에서 보이며 `GET /items` 는 `200 []` 반환.
- Given `npm install` 후 frontend, when `npm run dev` 실행, then `:3000`에서 페이지가 로드되고 "첫 항목을 추가해보세요" 가 SSR로 첫 페인트에 표시 (loading spinner 없이).
- Given 백엔드를 멈춘 상태, when frontend `:3000` 페이지를 새로 로드, then "백엔드 연결 실패" 류 명시 메시지가 화면에 표시되고 silent fail 아님.
- Given backend 디렉토리, when `uv run pytest` 실행, then `test_list_items_returns_empty_array_initially` 1개가 통과.
- Given 전체 트리, when `frontend/` 전체를 grep 으로 `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` 검색, then 매칭 0건. `frontend/.next/` 빌드 후에도 동일.
- Given Phase B 완료, when Supabase `items` 테이블이 비어 있는 상태에서 `GET /items` 호출, then `200 []` 반환 (라이브 호출 실측).
- Given 사용자가 Supabase 콘솔에서 한 행을 임시 삽입, when `GET /items` 호출, then 그 행이 반환되고 `position` 오름차순.

## Spec Change Log

(첫 작성 시점 — 비어 있음)

## Design Notes

- **Phase 경계 이유:** 사용자가 명시적으로 "Next.js + FastAPI 빌드 다하면 Supabase 연결도 시작"이라 요청. AC를 두 단계로 쪼개면 Phase A 끝 시점에 "양쪽 서버가 독립 기동되고 API 라운드트립이 빈 배열로 흐른다"가 검증되어 Supabase 변수가 격리된다.
- **Phase A 스모크 테스트 전략:** `db.py` 자체를 Phase A 끝 시점에 만들지 않고 `routers/items.py`에서 리터럴 `[]` 반환. Phase B 진입 시 `get_supabase` Depends 도입 + conftest fixture로 오버라이드. 이렇게 하면 기존 스모크 1개가 Phase A 통과 → Phase B 진입 후에도 그대로 통과해야 한다는 회귀 가드가 자연스럽게 성립.
- **SSR 페치 + 에러 표면화 골든 예 (`app/page.tsx`):**
  ```tsx
  export default async function Page() {
    try {
      const items = await listItems();
      if (items.length === 0) return <p>첫 항목을 추가해보세요</p>;
      return <ul>{items.map(i => <li key={i.id}>{i.text}</li>)}</ul>;
    } catch (e) {
      return <p>백엔드 연결 실패: {(e as Error).message}</p>;
    }
  }
  ```
  Story 1.4에서 `EmptyState.tsx`를 분리할 때 이 골격을 그대로 컴포넌트화한다.
- **Pydantic v2 + supabase-py 주의:** `supabase-py` 응답 `data`는 dict 리스트. `Item.model_validate(row)`로 파싱해 응답한다 (Phase B). Pydantic 자동 직렬화에 의지하지 말고 명시 변환.
- **service-role key 누출 가드:** Acceptance 마지막 grep 항목은 매 PR 반복 가능. `.next/static` 번들도 포함해 검사.

## Verification

**Commands (backend, `cd backend`):**
- `uv run fastapi dev main.py` -- 기대: `:8000` 에 listening, `http://localhost:8000/docs` 에서 Swagger UI 노출, `GET /items` → `200 []`.
- `uv run pytest -q` -- 기대: 1 passed, 0 failed.

**Commands (frontend, `cd frontend`):**
- `npm run dev` -- 기대: `:3000` 에 listening, 페이지 첫 페인트에 "첫 항목을 추가해보세요" 표시.
- `npm run build` -- 기대: 빌드 성공, 경고만 허용. 빌드 산출물에 `SUPABASE_*_KEY` 없음.

**Commands (project root):**
- `grep -r "SUPABASE_SERVICE_ROLE_KEY" frontend/` -- 기대: 매칭 없음.
- `grep -r "SUPABASE_ANON_KEY" frontend/` -- 기대: 매칭 없음.

**Manual checks:**
- Supabase 콘솔에서 `items` 테이블 + `app_state` (id=1) 행 존재 확인 (Phase B 진입 전제).
- `.env` 파일이 `git status` 에 unstaged 로도 나타나지 않음 (gitignored 확인).
