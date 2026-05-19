# Epic 1 Context: 첫 사용 가능 버전 (셋업 + 추가 + V 체크)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

n=1 사용자(seunwoo)가 서비스 URL에 접속한 순간부터 "항목을 추가하고 V 체크를 눌러 하루 한 사이클을 마친다"는 핵심 가치를 끝까지 돌릴 수 있는, 가장 얇은 동작 가능 제품(MVP-core)을 완성한다. Next.js + FastAPI + Supabase 3계층을 처음부터 셋업해 이후 모든 에픽이 공유할 기반을 만든다. 새로고침이나 세션 종료 후에도 데이터와 체크 상태가 동일 URL에서 그대로 보여야 한다.

> 참고: 본 프로젝트는 UX 디자인 문서가 아직 없다. 시각/인터랙션 세부는 각 스토리 AC의 "UX 결정 필요" 마커에서 스토리 시작 시 결정한다.

## Stories

- Story 1.1: 프로젝트 셋업 — Next.js + FastAPI + Supabase 빈 빌드 가능 상태 확보
- Story 1.2: 항목 추가 — 텍스트 한 줄로 새 일과 등록
- Story 1.3: Today 화면 표시 — URL 접속 시 항목 목록 노출
- Story 1.4: 빈 상태 안내 — "첫 항목을 추가해보세요"
- Story 1.5: V 체크 토글 — 탭/클릭으로 체크/해제 + 즉시 반영
- Story 1.6: 체크 항목 시각 구분 + 위치 유지
- Story 1.7: 영속성 검증 — 새로고침/세션 종료 후 데이터 복원

## Requirements & Constraints

- **Today 단일 화면 원칙:** 서비스 URL 접속 시 곧바로 Today 화면이 보이고, 항목 추가/체크가 같은 화면에서 라우트 이동 없이 가능해야 한다. `/` 외 라우트를 만들지 않는다.
- **빈 상태 가이드:** 항목이 0개이면 "첫 항목을 추가해보세요" 류 한 줄 안내를 노출하고, 입력 폼은 계속 보여 즉시 추가가 가능해야 한다.
- **V 체크 즉시성:** 항목을 탭/클릭하면 별도 저장 버튼 없이 체크 상태가 토글되고 시각적으로 반영된다. 체크해도 항목이 사라지거나 자리가 바뀌지 않는다.
- **시각 구분 + 접근성:** 체크/미체크 두 상태를 색상 외 단서(체크 아이콘, 텍스트 strikethrough 등) 1개 이상으로 구분한다.
- **영속성:** 모든 데이터는 Supabase Postgres에 저장. 새로고침/탭 종료/다른 기기 접속 모두에서 동일 상태가 보여야 한다.
- **응답 속도:** 페이지 로드 후 1초 이내 인터랙션 가능, 사용자 액션 300ms 이내 시각 반영. V1에서는 측정·기록까지만 수행하고, 위반 시 V1.1에서 낙관적 UI 도입을 검토한다.
- **반응형 + 온라인 전제:** 데스크톱 + 모바일 브라우저 모두 동작. 오프라인/네트워크 실패는 사용자에게 가시화하며 silent fail은 금지한다 (별도 큐잉/오프라인 복구는 V1 미포함).
- **보안:** Supabase service-role key는 백엔드 환경 변수에만 존재하고 프론트 어디에도 노출/번들되지 않아야 한다.

## Technical Decisions

- **스택:** Frontend Next.js (App Router, TypeScript, Tailwind, `src/` 디렉토리), Backend FastAPI on Python 3.12+ via `uv`, DB Supabase managed Postgres. RLS 미사용 — 단일 사용자 + service-role key 경유.
- **스타터 셋업:** 단일 통합 스타터 부재. Frontend는 `npx create-next-app@latest frontend --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"`, Backend는 `uv init` + `uv add fastapi[standard] uvicorn pydantic-settings supabase python-dateutil` (+ dev: `pytest httpx pytest-asyncio`), DB는 Supabase 웹 콘솔에서 신규 프로젝트 생성.
- **초기 스키마:** `supabase/migrations/0001_init.sql` 1회 수동 적용. `items` 테이블 (uuid id, text NOT NULL with `check (char_length(text) <= 60)`, checked bool, position int, created_at/updated_at timestamptz)과 `app_state` 테이블 (id=1 단일 행 제약, last_seen_date date) 두 개. `items_position_idx` 인덱스 포함. Epic 3에서만 쓰일 `app_state`도 Epic 1에서 함께 생성 — 마이그레이션 단순화.
- **API 계약 (Epic 1 범위):** `GET /items` (position 오름차순 반환), `POST /items {text} → 201 Item`, `PATCH /items/{id} {text?, checked?} → 200 Item`. 응답 envelope 없이 리소스 그대로 반환. 에러는 FastAPI 기본 `{ "detail": "..." }`.
- **데이터 정렬:** 새 항목 `position`은 기존 최대값 + 1. 백엔드는 명시적 reorder 요청 외에는 `position`을 재정렬하지 않는다 (gap 허용). 클라이언트가 체크 상태에 따라 자동 재정렬하지 않는다.
- **명명 규칙:** 전 구간 `snake_case` (DB 컬럼 → JSON 필드 → TS 타입). camelCase 변환 계층을 두지 않는다 — 한 가지 버그 카테고리 제거.
- **Validation 3-layer:** DB check 제약 + Pydantic `Field(max_length=60)` + UI grapheme 카운터. Epic 1에서는 DB/Pydantic 가드만 자연 적용되고, UI grapheme 카운터는 Epic 2 Story 2.4에서 도입.
- **낙관적 UI 미적용 (V1):** 모든 액션은 정직한 spinner/disabled + 네트워크 왕복 대기. Story 1.5에서 토글 응답 시간을 측정·기록해 V1.1 트리거 조건만 확보한다.
- **렌더 패턴:** `app/page.tsx`는 Server Component로 초기 `GET /items`를 SSR 페치 (첫 페인트에 spinner 없음). `ItemList`만 Client Component로 인터랙티브 동작 담당.
- **단일 seam 규칙:** 프론트 모든 HTTP 호출은 `src/lib/api.ts` 경유, 백엔드 모든 Supabase 접근은 `backend/db.py`의 client factory 경유.
- **타입:** `src/types/item.ts`에 architecture 스키마와 일치하는 `Item` 타입 (snake_case 필드). 백엔드 Pydantic은 `Item`, `ItemCreate`, `ItemUpdate`.
- **환경 변수:** `backend/.env` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOW_ORIGIN=http://localhost:3000`), `frontend/.env.local` (`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`). `.env*`는 gitignore, `.env.example`만 커밋.
- **CORS:** 로컬 dev에서 `http://localhost:3000` 허용. 프로덕션 origin은 배포 시점 결정 (V1 보류).
- **테스트 러너:** Backend `pytest + httpx + pytest-asyncio` (Story 1.1에서 셋업, 스모크 테스트 `test_list_items_returns_empty_array_initially` 포함). Frontend Vitest + Testing Library는 Story 1.1에서 셋업.
- **상태 관리:** React state + `useReducer`. 전역 store(Redux/Zustand)나 SWR/TanStack Query는 V1 미도입.
- **스타일링:** Tailwind 유틸리티만 사용, custom CSS 최소화.
- **드래그/grapheme/리셋 라이브러리는 Epic 1 범위 밖** — `@dnd-kit/sortable`은 Epic 2 Story 2.3, `Intl.Segmenter` 카운터는 Epic 2 Story 2.4, `resetCheck.ts`와 `/reset-if-new-day`는 Epic 3.

## UX & Interaction Patterns

UX 디자인 문서가 아직 없다. 다음 항목은 해당 스토리 시작 시 결정해야 한다:

- **Story 1.2 추가 액션 방식:** Enter 키 / 추가 버튼 / 둘 다 — 인라인 단순함 권장.
- **Story 1.5 in-flight 시각 표시:** 토글 응답 대기 중 행의 disabled/loading 표현 (opacity 변화 vs. 별도 인디케이터) — 단순함 우선.
- **Story 1.6 체크 시각 구분:** 체크 아이콘 / 텍스트 strikethrough / opacity 중 최소 1개. 권장은 아이콘 + strikethrough 조합. 색상 외 단서를 1개 이상 포함해 색맹 사용자도 식별 가능해야 한다.
- 모든 결정은 모바일 터치와 데스크톱 마우스/키보드에서 일관되게 동작해야 한다. NFR4 단순성 원칙에 따라 장식/일러스트는 최소화한다.

## Cross-Story Dependencies

- **내부 순서:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7. 각 스토리는 직전 스토리들의 산출물만 사용한다.
- **1.3과 1.4의 결합:** 1.3의 빈 배열 분기가 1.4의 빈 상태 안내를 그대로 사용한다. Story 1.1의 `app/page.tsx` 골격이 이미 빈 상태 안내를 노출하므로 1.4는 그 자리에 정식 `EmptyState.tsx`를 분리한다.
- **1.5와 1.6의 결합:** 1.5는 체크 토글의 동작/영속화/응답 시간 측정을 담당하고, 1.6은 그 결과를 시각 구분 + 위치 유지 규칙으로 보강한다.
- **1.7은 검증 스토리:** 새 코드 변경이 거의 없고 1.1~1.6의 영속성을 수동 + 가벼운 자동 테스트로 가드한다. 검증 결과는 `_bmad-output/implementation-artifacts/notes-story-1-7.md`에 기록.
- **Epic 2 의존:** 1.4의 "마지막 항목 삭제 시 빈 상태 복귀" 시나리오는 Story 2.2 구현 전에는 보류된다 — 1.4 자체는 첫 진입 빈 상태로 충족 가능.
- **Epic 3 준비:** `app_state` 테이블은 Epic 3에서만 쓰이지만 Story 1.1의 초기 스키마에 포함해 마이그레이션을 한 번에 마친다.
- **재방문 파일:** `ItemRow.tsx`와 `routers/items.py`는 Epic 2에서 편집/삭제 책임이 추가되며 점진적으로 확장된다 (의도된 churn, 분리 금지).
