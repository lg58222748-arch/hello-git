---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-tutorial-2026-05-18/prd.md
  - _bmad-output/planning-artifacts/architecture.md
regeneratedFrom: 2026-05-18 epics (모바일 하이브리드 스택, 폐기)
regeneratedOn: 2026-05-19
---

# 오늘 (bmad-tutorial) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **오늘** (bmad-tutorial), decomposing the requirements from the **2026-05-19 갱신본 PRD** + **architecture.md** into implementable stories.

> **재생성 사유:** 2026-05-18 작성본은 모바일 하이브리드(React Native/Flutter/Capacitor 중 택1 + 로컬 저장)를 가정. 사용자가 BMad 튜토리얼 실습 스택을 **Next.js + FastAPI + Supabase**로 전환하면서 Story 1.1부터 어긋남. 이번 재생성은 새 스택 기준으로 처음부터 다시 분해.

## Requirements Inventory

### Functional Requirements

**F1 — 일과 항목 관리 (CRUD + 순서 변경)**

- **FR1.1**: 사용자는 새 일과 항목을 텍스트 한 줄로 추가할 수 있다.
- **FR1.2**: 사용자는 기존 항목의 텍스트를 수정할 수 있다.
- **FR1.3**: 사용자는 항목을 삭제할 수 있다 (확인 없음).
- **FR1.4**: 사용자는 항목의 표시 순서를 변경할 수 있다 (드래그 정렬).
- **FR1.5**: 항목 텍스트 길이 상한은 60자다 (grapheme 기준).

**F2 — V 체크 토글**

- **FR2.1**: 사용자가 항목을 탭/클릭하면 V 체크가 표시된다.
- **FR2.2**: 체크된 항목을 다시 탭/클릭하면 체크가 해제된다.
- **FR2.3**: 체크 상태 변경은 즉시 시각적으로 반영된다 (별도 저장 버튼 없음).
- **FR2.4**: 체크된 항목은 시각적으로 구분되되 목록에서 사라지거나 순서가 바뀌지 않는다.

**F3 — 일일 자동 리셋**

- **FR3.1**: 자정(00:00 클라이언트 로컬 시간)에 모든 항목의 V 체크가 자동 해제된다. 항목 목록 자체는 유지.
- **FR3.2**: 탭이 닫혀 있었더라도 다시 접속하면 마지막 동기화 일자와 현재 일자 사이의 자정 경과를 감지해 리셋을 적용한다.
- **FR3.3**: 리셋 직전 체크 상태는 별도 저장·이력화되지 않는다.

**F4 — 오늘 화면 (Today)**

- **FR4.1**: 서비스 URL 접속 시 가장 먼저 오늘 화면이 표시된다.
- **FR4.2**: 오늘 화면은 등록된 항목 전체와 각 항목의 체크 상태를 한 화면에 보여준다.
- **FR4.3**: 오늘 화면에서 직접 항목을 추가/체크/순서 변경할 수 있다 (별도 라우트 이동 없이).
- **FR4.4**: 빈 상태(항목 0개)에서는 "첫 항목을 추가해보세요" 류의 안내가 표시된다.

### NonFunctional Requirements

- **NFR1 (스택)**: Frontend **Next.js**, Backend **FastAPI**, DB **Supabase (Postgres)**. n=1 / 인증 없음. Supabase는 service-role key로 FastAPI에서만 접근.
- **NFR2 (영속성)**: Supabase Postgres에 저장. 브라우저 캐시/세션과 무관하게 동일 URL에서 같은 데이터 확인.
- **NFR3 (응답 속도)**: 페이지 로드 후 1초 이내 인터랙션 가능. 사용자 액션 300ms 이내 시각 반영 (V1 측정 후 위반 시 V1.1에서 낙관적 UI 고려).
- **NFR4 (단순성)**: Today 외 라우트 최소화. 메뉴/설정/탭 네비게이션 지양.
- **NFR5 (반응형 웹)**: 데스크톱 + 모바일 브라우저 모두 동작. 별도 PWA/네이티브 없음.
- **NFR6 (온라인 전제)**: 오프라인 시 명확한 상태 표시. 별도 큐잉/오프라인 복구 로직 없음.

### Additional Requirements

**Architecture에서 도출된 기술 결정 (architecture.md SoT):**

- **스타터 셋업**: 단일 스타터 부재. 각 계층 공식 CLI 분리 사용 (`create-next-app`, `uv init`, Supabase 웹 콘솔). → **Epic 1 Story 1.1에 반영**.
- **초기 스키마**: `supabase/migrations/0001_init.sql` 1회 적용 (`items` + `app_state` 두 테이블). Story 1.1에 포함.
- **API 계약**: 6개 엔드포인트 (`GET /items`, `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}`, `POST /items/reorder`, `POST /reset-if-new-day`).
- **명명 규칙**: 전 구간 `snake_case` (DB → JSON → TS 타입). 변환 계층 없음.
- **자정 리셋 구현 방식**: 클라이언트 lazy 감지 + 서버 멱등 적용. 페이지 로드 + `visibilitychange` 이벤트 트리거.
- **자정 리셋 SoT 테이블**: `app_state.last_seen_date` (단일 행).
- **낙관적 UI 미적용 (V1)**: 모든 액션은 정직한 spinner + 네트워크 왕복. NFR3 위반 시 V1.1에서 체크 토글 우선 전환.
- **CORS**: 로컬 dev `http://localhost:3000` 허용. 프로덕션은 배포 시점 결정.
- **service-role key 격리**: 백엔드 환경 변수에만, 브라우저 노출 절대 금지.
- **테스트 러너**: backend `pytest + httpx`, frontend `Vitest + Testing Library` (Story 1.1에서 셋업).
- **드래그 라이브러리**: `@dnd-kit/sortable` (Story 2.3에서 도입).
- **유니코드 길이**: `Intl.Segmenter` 기반 grapheme 카운터 (Story 2.4).

### UX Design Requirements

> **UX Design 문서 부재.** UX 와이어프레임이 아직 작성되지 않았으므로, 각 스토리 AC에 "UX 결정 필요" 항목을 직접 포함한다. 별도 `bmad-create-ux-design` 워크플로우 실행 시 본 문서 및 영향받는 스토리 AC 보강 필요.

### FR Coverage Map

| FR | Epic / Story | 설명 |
|---|---|---|
| FR1.1 | Epic 1 / Story 1.2 | `POST /items` + AddItemForm으로 첫 추가 |
| FR1.2 | Epic 2 / Story 2.1 | `PATCH /items/{id}` (text) + 편집 모드 |
| FR1.3 | Epic 2 / Story 2.2 | `DELETE /items/{id}` (확인 없음) |
| FR1.4 | Epic 2 / Story 2.3 | `POST /items/reorder` + dnd-kit |
| FR1.5 | Epic 2 / Story 2.4 | DB check + Pydantic + grapheme 카운터 |
| FR2.1 | Epic 1 / Story 1.5 | 탭/클릭 → 체크 |
| FR2.2 | Epic 1 / Story 1.5 | 탭/클릭 → 체크 해제 |
| FR2.3 | Epic 1 / Story 1.5 | 즉시 시각 반영 |
| FR2.4 | Epic 1 / Story 1.6 | 체크 항목 시각 구분 + 위치 유지 |
| FR3.1 | Epic 3 / Story 3.1 | 활성 탭에서 자정 도달 시 자동 해제 |
| FR3.2 | Epic 3 / Story 3.2 | 재접속 시 자정 경과 감지 + 리셋 적용 |
| FR3.3 | Epic 3 / Story 3.3 | 리셋 시 별도 이력 저장 금지 |
| FR4.1 | Epic 1 / Story 1.3 | URL 접속 시 Today가 첫 화면 |
| FR4.2 | Epic 1 / Story 1.3 | 항목 전체 + 체크 상태 한 화면 |
| FR4.3 | Epic 1 / Story 1.3 + Epic 2 전반 | 화면 이동 없이 추가/체크/순서 변경 |
| FR4.4 | Epic 1 / Story 1.4 | 빈 상태 안내 |
| NFR1 | Epic 1 / Story 1.1 | 스택 셋업으로 충족 |
| NFR2 | Epic 1 / Story 1.7 | 영속성 검증 스토리 |
| NFR3 | 횡단 (모든 Story AC에 가드) | 1초/300ms |
| NFR4 | 횡단 (Epic 설계 원칙) | Today 외 라우트 최소화 |
| NFR5 | Epic 1 / Story 1.1 + 횡단 | 반응형 웹 (Tailwind) |
| NFR6 | Epic 1 / Story 1.1 (api.ts 에러 표면화) + 횡단 | 온라인 전제, 네트워크 실패 가시화 |

## Epic List

### Epic 1: 첫 사용 가능 버전 (셋업 + 추가 + V 체크)

n=1 사용자가 URL에 접속한 순간부터 "항목을 추가하고 V 체크를 누르며 하루를 보낸다"는 핵심 가치 한 사이클을 완성한다. 가장 얇은 동작 가능 제품(MVP-core). Next.js + FastAPI + Supabase 셋업 포함.

**FRs covered:** FR1.1, FR2.1, FR2.2, FR2.3, FR2.4, FR4.1, FR4.2, FR4.4
**NFRs covered:** NFR1, NFR2, NFR3 (initial), NFR5, NFR6

### Epic 2: 항목 관리 완성 (수정/삭제/순서/길이)

Epic 1에서 만든 기본 CRUD를 "추가만 가능"에서 풀 CRUD + 드래그 정렬 + 60자 가드까지 확장한다. 일주일 실사용 시 자연스럽게 떠오르는 "오타 고치고 싶다 / 안 쓰는 거 지우고 싶다 / 순서 바꾸고 싶다"를 한 에픽에서 모두 해결.

**FRs covered:** FR1.2, FR1.3, FR1.4, FR1.5, FR4.3
**NFRs covered:** NFR4 (액션 진입 방식 단순화)

### Epic 3: 자정 자동 리셋 (반복 루틴 자동화)

PRD 핵심 차별점. 클라이언트 로컬 자정마다 V가 자동으로 해제되도록 만든다. 활성 탭과 재접속(자정 경과 후 다시 열기) 두 시나리오 모두 정확히 동작하도록 보장.

**FRs covered:** FR3.1, FR3.2, FR3.3

---

## Epic 1: 첫 사용 가능 버전 (셋업 + 추가 + V 체크)

**Goal:** seunwoo가 URL에 접속한 순간부터 "오늘 운동 → 탭 → V 체크"라는 하루 한 사이클을 끝까지 돌릴 수 있는 가장 얇은 동작 가능 제품을 만든다. 새로고침/세션 종료 후에도 데이터가 유지되어야 한다.

### Story 1.1: 프로젝트 셋업 — Next.js + FastAPI + Supabase 빈 빌드 가능 상태 확보

As a **개발자(seunwoo)**,
I want **Supabase 프로젝트 생성 + 초기 스키마 적용 + FastAPI 백엔드 스캐폴드 + Next.js 프론트엔드 스캐폴드까지 끝나서, 빈 항목 목록이 브라우저에 표시되는 상태**를,
So that **이후 모든 스토리가 같은 기반 위에서 구현될 수 있다.**

**Acceptance Criteria:**

**Given** 빈 디렉토리 상태
**When** Supabase 웹 콘솔에서 새 프로젝트를 생성하고 `supabase/migrations/0001_init.sql`을 실행한다
**Then** `items` 테이블과 `app_state` 테이블이 생성되고 `app_state`에 (id=1, last_seen_date=today) 1행이 삽입된다 (architecture.md SoT 스키마)
**And** Supabase URL과 service-role key를 캡처해 둔다

**Given** 빈 `backend/` 디렉토리
**When** `uv init` + `uv add fastapi[standard] uvicorn pydantic-settings supabase python-dateutil` + `uv add --dev pytest httpx pytest-asyncio` 실행
**Then** `backend/main.py`에 FastAPI 앱이 생성되고 `GET /items`가 빈 배열 `[]`를 반환한다
**And** `backend/.env`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOW_ORIGIN=http://localhost:3000`가 설정된다 (`.env.example`만 커밋)
**And** CORS 미들웨어가 `localhost:3000`을 허용한다
**And** `backend/db.py`에 Supabase client factory가 존재하고 `GET /items`가 그것을 통해 Supabase에 쿼리한다
**And** `uv run fastapi dev main.py`로 서버가 `:8000`에서 기동되고 Swagger UI가 `/docs`에서 보인다
**And** `pytest`가 통과하는 스모크 테스트 1개(`test_list_items_returns_empty_array_initially`)가 존재한다

**Given** 빈 `frontend/` 디렉토리
**When** `npx create-next-app@latest frontend --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"` 실행
**Then** Next.js App Router 프로젝트가 생성된다
**And** `frontend/.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`이 설정된다 (`.env.local.example`만 커밋)
**And** `src/lib/api.ts`에 fetch 기반 API 클라이언트 골격이 존재하고 `listItems(): Promise<Item[]>`를 export한다
**And** `src/types/item.ts`에 architecture.md 스키마와 일치하는 `Item` 타입이 존재한다 (`snake_case` 필드)
**And** `src/app/page.tsx`가 Server Component로서 `listItems()` 결과를 받아 렌더하며, 빈 배열일 때 "첫 항목을 추가해보세요" 안내를 표시한다 (Story 1.4와 일치)
**And** `npm run dev`로 `:3000`에서 페이지가 로드된다

**Given** 결정 사항을 기록할 위치
**When** 셋업이 끝난다
**Then** 본 셋업이 architecture.md SoT를 따랐다는 확인이 README 또는 `_bmad-output/implementation-artifacts/notes-story-1-1.md`에 기록된다 (사용한 버전 — Next.js, FastAPI, supabase-py — 잠금 파일 기준)

**Given** NFR1·NFR6
**When** Supabase 키 노출 여부를 점검한다
**Then** `frontend/` 어디에도 `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_ANON_KEY`가 존재하지 않으며, 빌드 결과물에 포함되지 않는다
**And** 백엔드 미기동 상태에서 페이지를 열면 사용자에게 "백엔드 연결 실패" 류 메시지가 표시된다 (silent fail 금지)

### Story 1.2: 항목 추가 — 텍스트 한 줄로 새 일과 등록

As a **seunwoo**,
I want **Today 화면에서 텍스트 한 줄을 입력해 새 일과 항목을 등록**,
So that **"영양제" 같은 항목을 손쉽게 추가할 수 있다.**

**Acceptance Criteria:**

**Given** Story 1.1에서 빈 항목 목록과 비어 있는 입력 UI
**When** `src/components/today/AddItemForm.tsx`에 텍스트를 입력하고 추가 액션을 수행한다 (UX 결정 필요: Enter 키 / 추가 버튼 / 둘 다 — 인라인 권장)
**Then** 백엔드 `POST /items {text}`가 호출되고 201 응답으로 새 `Item`이 반환된다 (FR1.1)
**And** 새 항목이 목록의 마지막 위치에 미체크 상태로 추가된다
**And** 입력 필드는 비워지고 후속 추가가 즉시 가능하다
**And** DB의 새 항목 `position`은 기존 최대 `position` + 1 (또는 카운트)이다 — 정렬 안정성 가드

**Given** 빈 텍스트 또는 공백만 있는 입력
**When** 추가 액션을 수행한다
**Then** 백엔드 호출 없이 클라이언트에서 차단되거나, 추가 버튼이 비활성화된다

**Given** 백엔드 응답 대기 중 (NFR3 300ms 가드 적용)
**When** 사용자가 추가 액션을 한다
**Then** 추가 버튼 또는 입력 UI가 in-flight 동안 disabled 상태가 된다 (낙관적 UI 미적용 — architecture.md 결정)
**And** 응답 도착 후 입력이 다시 활성화되고 새 항목이 목록에 나타난다
**And** 네트워크 실패 시 사용자에게 에러 banner/inline 메시지가 표시되고 입력 텍스트는 유지된다 (재시도 가능)

### Story 1.3: Today 화면 표시 — URL 접속 시 항목 목록 노출

As a **seunwoo**,
I want **서비스 URL에 접속하면 곧바로 Today 화면이 보이고 등록된 항목 전체와 각 항목의 체크 상태가 한 화면에 표시**,
So that **별도 라우트 진입 없이 오늘 할 일을 한눈에 본다.**

**Acceptance Criteria:**

**Given** 백엔드가 동작 중이고 항목이 N개 등록된 상태
**When** 사용자가 서비스 URL에 접속한다
**Then** `app/page.tsx` Server Component가 `GET /items`를 호출해 초기 상태를 SSR로 렌더한다 (loading spinner 없이 첫 페인트에 목록 표시)
**And** 다른 라우트 전환 단계가 끼어들지 않는다 (Next.js 기본 외에 별도 스플래시 없음) — FR4.1
**And** N개 항목이 `position` 오름차순으로 모두 표시된다 (FR4.2)
**And** 각 항목의 체크 상태가 시각적으로 함께 표시된다 (시각 표현 상세는 Story 1.6에서 정의)

**Given** 클라이언트 hydrate 후
**When** `ItemList.tsx`가 마운트된다
**Then** 사용자 입력(탭/클릭/Enter)을 즉시 받을 수 있다 (NFR3 — 페이지 로드 후 1초 이내 인터랙션 가능)
**And** Galaxy/iPhone 모바일 브라우저와 데스크톱 Chrome에서 동일하게 동작한다 (NFR5)

**Given** 라우트 구조
**When** 본 스토리가 완료된다
**Then** `src/app/`에 `page.tsx` 외 별도 라우트는 존재하지 않는다 (NFR4)

### Story 1.4: 빈 상태 안내 — "첫 항목을 추가해보세요"

As a **seunwoo (앱을 처음 접속한 직후)**,
I want **항목이 0개일 때 무엇을 해야 할지 한 줄 안내를 보고**,
So that **튜토리얼 없이도 다음 행동(첫 항목 추가)을 자연스럽게 할 수 있다.**

**Acceptance Criteria:**

**Given** 항목 목록이 비어 있는 상태 (DB에 0행)
**When** Today 화면이 표시된다
**Then** `EmptyState.tsx`가 "첫 항목을 추가해보세요" 류 한 줄 문구를 표시한다 (FR4.4)
**And** `AddItemForm.tsx`는 계속 노출되어 즉시 추가가 가능하다
**And** 일러스트/장식 요소는 없거나 한 줄 텍스트와 동일한 시각 무게 이하로 최소화된다 (NFR4)

**Given** 항목을 1개 추가한 직후 (Story 1.2)
**When** Today 화면이 갱신된다
**Then** 빈 상태 안내 문구가 사라진다

**Given** 마지막 항목을 삭제한 직후 (Story 2.2 이후 시나리오)
**When** Today 화면이 갱신된다
**Then** 빈 상태 안내 문구가 다시 표시된다

### Story 1.5: V 체크 토글 — 탭/클릭으로 체크/해제 + 즉시 반영

As a **seunwoo**,
I want **항목을 탭하기만 하면 V 체크가 즉시 표시되고, 다시 탭하면 즉시 해제**,
So that **별도 저장 버튼 없이 "끝냈음"을 한 손가락 또는 한 클릭으로 기록한다.**

**Acceptance Criteria:**

**Given** 미체크 상태의 항목
**When** 사용자가 `ItemRow.tsx` 영역을 탭/클릭한다
**Then** 백엔드 `PATCH /items/{id}` `{checked: true}`가 호출된다 (FR2.1)
**And** 응답 도착 시 V 체크 표시가 화면에 반영된다 (FR2.3)
**And** 별도의 저장/확인 단계가 없다
**And** 변경 사항이 Supabase에 영속화된다 (이후 새로고침 시에도 유지 — Story 1.7과 호환)

**Given** 체크 상태의 항목
**When** 사용자가 항목을 다시 탭/클릭한다
**Then** 백엔드 `PATCH /items/{id}` `{checked: false}`가 호출된다 (FR2.2)
**And** 응답 도착 시 V 체크 표시가 해제된다 (FR2.3)

**Given** 백엔드 응답 대기 중 (낙관적 UI 미적용 — architecture.md V1 결정)
**When** 사용자가 탭한다
**Then** 행 영역이 in-flight 동안 가벼운 disabled/loading 상태로 표시된다 (UX 결정 필요: opacity 변화 vs. 별도 인디케이터 — 단순함 우선)
**And** 응답 도착 후 정상 상태로 복귀한다

**Given** NFR3 (액션 300ms 가드)
**When** 로컬 dev에서 탭 → 시각 반영까지의 시간을 측정한다
**Then** 평균 300ms 이내에 시각 피드백이 표시된다 (architecture-notes 또는 본 스토리 결과 노트에 측정값 기록)
**And** 측정 결과가 300ms를 초과하면 OQ6에 따라 V1.1에서 체크 토글부터 낙관적 UI 도입 검토 (본 스토리는 측정과 기록까지)

**Given** 네트워크 실패
**When** 사용자가 탭한 직후 백엔드가 오류를 반환한다
**Then** 시각 상태가 변경되지 않고 (낙관적 UI가 없으므로 롤백도 없음) 에러 banner/toast가 표시된다 (NFR6)

### Story 1.6: 체크 항목 시각 구분 + 위치 유지

As a **seunwoo**,
I want **체크된 항목과 미체크 항목을 한눈에 구분할 수 있되, 체크해도 목록에서 사라지거나 자리가 바뀌지 않게**,
So that **"내가 오늘 어디까지 했는지" 흐름을 같은 자리에서 본다.**

**Acceptance Criteria:**

**Given** 항목 N개가 일정 순서로 표시된 상태
**When** 사용자가 임의의 항목을 체크/해제한다 (Story 1.5의 동작)
**Then** 해당 항목의 화면상 위치(인덱스)는 변하지 않는다 (FR2.4)
**And** 항목은 사라지지 않고 같은 자리에 남는다 — 클라이언트에서 자동 재정렬 금지
**And** 백엔드 `GET /items`는 항상 `position` 오름차순이므로 새로고침 후에도 동일한 순서가 유지된다

**Given** 체크된 항목과 미체크 항목이 섞여 있는 상태
**When** Today 화면이 표시된다
**Then** 두 상태가 시각적으로 명확히 구분된다 (UX 결정 필요: 체크 아이콘 + 텍스트 strikethrough + opacity 중 최소 1개 적용, 권장은 체크 아이콘 + strikethrough 조합)
**And** 시각 구분이 색맹 사용자에게도 식별 가능하도록 색상 외 단서를 1개 이상 포함한다 (NFR 횡단 — 단순한 접근성)
**And** Tailwind 유틸리티 클래스만 사용 (custom CSS 최소화 — NFR4 단순성)

### Story 1.7: 영속성 검증 — 새로고침/세션 종료 후 데이터 복원

As a **seunwoo**,
I want **브라우저를 새로고침하거나 탭을 닫았다가 다시 열어도 항목 목록과 현재 체크 상태가 그대로 유지**,
So that **데이터가 휘발될까 불안해하지 않고 안심하고 쓴다.**

**Acceptance Criteria:**

**Given** 항목 N개가 등록되고 그중 K개가 체크된 상태
**When** 브라우저를 강제 새로고침한다 (Ctrl+R / Cmd+R)
**Then** 같은 N개 항목이 같은 순서로 표시된다 (NFR2)
**And** 정확히 같은 K개 항목이 체크된 상태로 표시된다 (자정 미경과 가정)

**Given** 같은 시나리오
**When** 탭을 완전히 닫았다가 새 탭에서 동일 URL에 다시 접속한다
**Then** 동일하게 항목과 체크 상태가 복원된다

**Given** 같은 시나리오
**When** 다른 기기(예: 모바일)의 브라우저에서 동일 URL에 접속한다
**Then** 동일한 항목과 체크 상태가 표시된다 (Supabase 단일 데이터 소스이므로 자연스럽게 충족 — n=1 가정)

**Given** 본 스토리는 새 코드 변경을 거의 요구하지 않음
**When** 검증 절차를 실행한다
**Then** 위 시나리오들이 모두 통과한다는 사실이 manual test note로 `_bmad-output/implementation-artifacts/notes-story-1-7.md`에 기록된다 (자동 테스트는 백엔드 API 라운드트립 1개로 갈음 — 프론트 새로고침은 수동 가드)

---

## Epic 2: 항목 관리 완성 (수정/삭제/순서/길이)

**Goal:** Epic 1의 "추가만 가능"을 풀 CRUD + 드래그 정렬 + 입력 가드레일까지 확장한다. 일주일 실사용에서 자연스럽게 떠오르는 "오타 고치고 싶다, 안 쓰는 거 지우고 싶다, 순서 바꾸고 싶다"를 한 에픽에서 모두 해결.

### Story 2.1: 항목 텍스트 수정

As a **seunwoo**,
I want **이미 등록된 항목의 텍스트를 수정**,
So that **오타나 표현 변경을 다시 추가/삭제 없이 처리한다.**

**Acceptance Criteria:**

**Given** 항목 1개 이상이 등록된 상태
**When** 사용자가 `ItemRow.tsx`에 대해 수정 액션을 수행한다 (UX 결정 필요: 데스크톱은 hover 시 노출되는 편집 아이콘 / 모바일은 롱탭 또는 행 옆 점3개 메뉴 — Epic 2 시작 시 한 번 결정 후 모든 액션에 일관 적용)
**Then** 해당 항목 텍스트를 편집할 수 있는 인라인 입력 상태로 진입한다 (별도 화면 이동 없음 — FR4.3)
**And** 편집을 확정(Enter 또는 확정 버튼)하면 백엔드 `PATCH /items/{id}` `{text}`가 호출되고 변경된 텍스트가 즉시 목록에 반영된다 (FR1.2)
**And** 항목의 체크 상태와 `position`은 변경되지 않는다

**Given** 편집 입력 상태
**When** 사용자가 편집을 취소한다 (Escape 또는 외부 영역 탭/클릭)
**Then** 원래 텍스트가 유지되고 백엔드 호출이 없다

**Given** 60자 가드레일 (Story 2.4)이 적용된 상태
**When** 편집 입력으로 60자 초과를 시도한다
**Then** Story 2.4와 동일 정책에 따라 차단되거나 60자에서 잘린다

**Given** 빈 텍스트로 편집을 확정하려는 경우
**When** 사용자가 모든 텍스트를 지우고 확정한다
**Then** 백엔드 호출이 차단되고 사용자에게 "내용을 입력하세요" 안내가 표시된다 (삭제는 Story 2.2의 명시적 삭제 액션을 사용해야 함)

### Story 2.2: 항목 삭제 (확인 없음)

As a **seunwoo**,
I want **항목을 삭제 액션 한 번으로 즉시 제거** (확인 다이얼로그 없음),
So that **무거운 확인 단계 없이 빠르게 정리한다.**

**Acceptance Criteria:**

**Given** 항목 N개가 등록된 상태
**When** 사용자가 특정 항목에 대해 삭제 액션을 수행한다 (Story 2.1에서 결정한 액션 진입 방식과 일관 — 데스크톱 hover 아이콘 / 모바일 롱탭 또는 메뉴 + 삭제 옵션)
**Then** 백엔드 `DELETE /items/{id}`가 호출되고 204 응답이 반환된다 (FR1.3)
**And** 해당 항목이 즉시 목록에서 사라진다
**And** 확인 다이얼로그나 추가 단계가 없다
**And** 변경이 Supabase에 영속화된다

**Given** 마지막 항목 1개만 남은 상태
**When** 그 항목을 삭제한다
**Then** 목록이 빈 상태가 되고 Story 1.4의 빈 상태 안내가 표시된다

**Given** 삭제된 항목
**When** 사용자가 같은 텍스트를 다시 추가한다
**Then** 별도 복원 메커니즘 없이 "새 항목"으로 추가된다 (이력/휴지통 V1 미포함, FR3.3과 일관)

**Given** 다른 항목들의 `position` 처리
**When** 중간 위치의 항목을 삭제한다
**Then** 나머지 항목의 `position` 값을 백엔드에서 자동 재정렬하지 않는다 (gap 허용) — Story 2.3의 reorder 명시 호출 외에는 `position` 변경 금지

### Story 2.3: 항목 순서 변경 — 드래그 정렬

As a **seunwoo**,
I want **항목을 끌어서 원하는 순서로 재배치**,
So that **하루 흐름 순서대로(아침→낮→저녁) 정렬해 둘 수 있다.**

**Acceptance Criteria:**

**Given** 항목 2개 이상이 등록된 상태
**When** 사용자가 `@dnd-kit/sortable` 기반의 드래그 제스처를 수행한다 (UX 결정 필요: 핸들 위치 — 행 전체 vs. 우측 핸들 아이콘 / 모바일은 핸들 아이콘 권장)
**Then** 드래그 중인 항목이 시각적으로 들어 올려진 듯한 피드백을 받는다 (dnd-kit 기본 동작)
**And** 드롭 위치 확정 시 백엔드 `POST /items/reorder` `{ids: [uuid, ...]}`가 호출되고 200 응답이 반환된다 (FR1.4)
**And** 백엔드는 받은 `ids` 순서대로 각 항목의 `position`을 0, 1, 2, ... 로 재할당한다
**And** 새 순서가 Supabase에 영속화되어 새로고침 후에도 유지된다

**Given** 항목의 체크 상태가 임의로 섞여 있는 상태
**When** 사용자가 드래그로 순서를 변경한다
**Then** 각 항목의 `checked` 값은 그대로 따라 이동한다 (체크가 해제되지 않는다)

**Given** Story 1.6의 "체크 항목 위치 유지" 원칙
**When** 사용자가 직접 드래그를 수행하지 않은 시점
**Then** 시스템이 자동으로 순서를 재정렬하지 않는다 (예: 체크된 항목을 하단으로 자동 이동 금지)

**Given** 드래그 도중 백엔드 실패
**When** `POST /items/reorder`가 오류를 반환한다
**Then** 프론트는 직전 순서로 되돌리고 사용자에게 에러 banner를 표시한다 (NFR6)
**And** Supabase 상태와 화면 상태의 정합성이 유지된다

### Story 2.4: 60자 입력 가드레일

As a **seunwoo**,
I want **항목 텍스트 입력 시 60자(grapheme 기준)를 넘으면 더 이상 입력되지 않게**,
So that **"한 줄"이라는 단순함 컨셉이 자연스럽게 유지된다.**

**Acceptance Criteria:**

**Given** 항목 추가 입력(Story 1.2) 또는 수정 입력(Story 2.1) 상태
**When** 사용자가 60자에 도달한 시점 이후 추가 문자를 입력한다
**Then** `src/lib/graphemeLen.ts`의 `Intl.Segmenter` 기반 카운터가 60에서 입력을 차단한다 (FR1.5)
**And** (선택) 현재 글자 수가 가벼운 시각 피드백으로 표시될 수 있다 — UX 결정. 단순함 우선이면 표시 생략 가능

**Given** 한글/이모지/공백이 포함된 텍스트
**When** 글자 수를 계산한다
**Then** grapheme 단위로 카운트된다 (예: "🇰🇷"는 1로 카운트, "한"도 1로 카운트)
**And** 백엔드 Pydantic 모델의 `Field(max_length=60)`는 Python 기본 문자 수(코드포인트 ≒ grapheme)를 기준으로 검증한다 — 클라이언트와 서버의 카운트 기준 차이가 발생할 수 있는 엣지(예: 결합 이모지 시퀀스)는 본 스토리 노트에 기록하고 V2 검토

**Given** 60자를 초과한 텍스트가 외부 경로(예: 클립보드 붙여넣기)로 유입
**When** 입력 필드에 반영된다
**Then** 60자까지만 반영되거나 입력이 거부된다 (정책 통일)

**Given** 백엔드 레벨 가드
**When** 어떤 이유로든 클라이언트 가드를 우회한 60자 초과 텍스트가 백엔드에 도달한다
**Then** Pydantic 검증으로 422가 반환되고, 그래도 통과했다면 DB의 `check (char_length(text) <= 60)` 제약이 거부한다 (architecture.md 3-layer 검증)

---

## Epic 3: 자정 자동 리셋 (반복 루틴 자동화)

**Goal:** PRD의 핵심 차별점 — "매일 같은 일과를 V 체크 하나로 반복"이 성립하려면 클라이언트 로컬 자정마다 V가 자동으로 해제되어야 한다. 활성 탭과 재접속 모두에서 정확히 동작하도록 보장하며, 멱등성과 이력 미저장을 데이터 레벨에서 강제한다.

### Story 3.1: 자정 도달 시 자동 해제 (활성 탭)

As a **seunwoo**,
I want **탭을 켜둔 상태에서 자정이 지나고 페이지로 돌아오거나 다시 활성화하는 순간 모든 V 체크가 자동으로 해제**,
So that **자정을 넘긴 직후에도 별도 동작 없이 새 하루가 시작된 상태가 된다.**

**Acceptance Criteria:**

**Given** 탭이 백그라운드/포그라운드 어느 쪽이든 열려 있고 K개 항목이 체크된 상태
**When** 로컬 시간이 00:00을 지나고 사용자가 탭으로 돌아온다 (`visibilitychange` 이벤트가 `visible`로 전환)
**Then** `src/lib/resetCheck.ts`가 현재 로컬 날짜(`YYYY-MM-DD`)를 계산해 `POST /reset-if-new-day {client_date}`를 호출한다
**And** 백엔드는 `app_state.last_seen_date`와 비교해 더 큰 날짜이면 `UPDATE items SET checked = false`와 `UPDATE app_state SET last_seen_date = client_date`를 한 트랜잭션으로 실행한다 (FR3.1)
**And** 응답으로 `{reset: true, items: [...]}` 가 반환되고 프론트는 화면을 새 상태로 교체한다 (별도 새로고침 없이)
**And** 항목 목록 자체(텍스트, position)는 변경되지 않는다

**Given** 사용자의 단말 시간대(timezone) 변경
**When** `resetCheck.ts`가 동작한다
**Then** 매 호출 시점의 클라이언트 로컬 날짜가 새로 계산되므로 별도 timezone 보정 코드가 필요하지 않다 (`new Date().toLocaleDateString('sv-SE')` 또는 동등한 ISO `YYYY-MM-DD` 산출)
**And** DST/timezone 변경의 엣지 케이스(예: 자정이 두 번 지나가는 듯 보이는 경우)는 본 스토리 노트에 가능한 시나리오로 기록되고 V2 테스트로 보류

**Given** 자정 직전·직후에 사용자가 항목을 탭하는 경합 상황
**When** 리셋이 진행된다
**Then** 리셋 후 탭 액션은 새 상태(미체크 → 체크)에 적용되며, `PATCH /items/{id}`와 `POST /reset-if-new-day`가 동시에 진행되더라도 마지막 응답이 일관된 상태를 만들어낸다 (n=1, 단일 사용자이므로 race는 매우 드묾 — 본 시나리오는 수동 가드)

### Story 3.2: 재접속 시 자정 경과 감지 + 적용

As a **seunwoo**,
I want **자정에 탭이 꺼져 있었더라도, 다음에 페이지를 열면 V 체크가 이미 해제되어 있는 깨끗한 상태**,
So that **앱이 백그라운드/종료 상태였는지 의식하지 않고 같은 경험을 받는다.**

**Acceptance Criteria:**

**Given** 항목 K개가 체크된 채 탭이 모두 닫힌 상태
**When** 자정을 지나 다음 날 사용자가 서비스 URL에 다시 접속한다
**Then** `app/page.tsx` Server Component의 초기 fetch 직후 또는 클라이언트 hydrate 직후에 `POST /reset-if-new-day`가 호출된다 (FR3.2)
**And** 백엔드는 자정 1회 통과를 감지하고 모든 V를 해제한 뒤 `{reset: true, items: [...]}` 를 반환한다
**And** 사용자가 보는 첫 화면에 깨끗한(모두 미체크) 목록이 표시된다 (FR3.2)

**Given** 마지막 사용 시각과 현재 실행 시각 사이에 자정이 0회 포함되는 경우
**When** 페이지가 열린다
**Then** `client_date == last_seen_date`이므로 백엔드는 `{reset: false, items: [...]}`만 반환하고 체크 상태는 변경되지 않는다

**Given** 마지막 사용 시각과 현재 실행 시각 사이에 자정이 2회 이상 포함되는 경우 (예: 이틀 만에 접속)
**When** 페이지가 열린다
**Then** 동일하게 V를 모두 해제하는 1회 효과만 적용된다 (멱등성: `last_seen_date < client_date`로만 판정)
**And** 중간 날짜의 상태가 별도 이력화되지 않는다 (Story 3.3, FR3.3과 일관)

**Given** NFR3 (1초 이내 인터랙션)
**When** 리셋 적용을 포함한 콜드 페이지 로드 시간을 측정한다
**Then** 페이지 로드부터 인터랙션 가능 시점까지 평균 1초 이내이다 (측정값은 `notes-story-3-2.md`에 기록)

**Given** Story 3.1과의 중복 호출 가능성
**When** 페이지 로드 직후 + visibilitychange가 거의 동시에 발생한다
**Then** 두 번째 호출은 백엔드에서 `{reset: false}`로 응답되어 사이드 이펙트가 없다 (멱등성으로 안전)

### Story 3.3: 리셋 시 이력 미저장

As a **seunwoo**,
I want **리셋 직전의 체크 상태가 어디에도 저장되거나 이력화되지 않게**,
So that **V1의 "이력 없음" 단순성 원칙(섹션 4.2 Out of Scope)이 데이터 레벨에서도 보장된다.**

**Acceptance Criteria:**

**Given** 항목 K개가 체크된 상태
**When** Story 3.1 또는 3.2의 리셋이 트리거된다
**Then** 리셋 직전의 체크 스냅샷이 별도 테이블/파일/로그로 저장되지 않는다 (FR3.3)
**And** Supabase에는 `items`와 `app_state` 두 테이블 외에 어떠한 히스토리/audit 테이블도 존재하지 않는다 (`information_schema.tables` 점검으로 검증)
**And** 어떤 UI에서도 "어제 K개 완료" 같은 통계가 도출 불가능하다 (PRD 4.2 Out of Scope 일치)

**Given** 디버깅/임시 로그
**When** 개발자가 리셋 동작을 관찰한다
**Then** 백엔드 로그는 "리셋 발생 / 발생하지 않음" 사실과 `client_date`, `previous_last_seen_date` 정도만 기록한다
**And** 어떤 항목이 체크되었었는지에 대한 식별 가능한 데이터(`item.id`, `item.text`, 체크 수)는 로그에 남기지 않는다 (단순성 + 향후 통계 기능 추가 유혹 방지)

**Given** Pydantic 응답 모델
**When** `/reset-if-new-day` 응답을 직렬화한다
**Then** 응답 본문은 `{reset: bool, items: [Item, ...]}`만 포함하며 "리셋 전 K개" 같은 카운터 필드는 없다 (응답 스키마 자체로 이력화 시도 차단)

---

## Final Validation Summary

**FR Coverage:** 모든 FR1.1~FR4.4가 위 FR Coverage Map 표에 1개 이상의 스토리에 매핑됨. NFR1~NFR6도 각 스토리 AC에 횡단 또는 명시적으로 포함됨.

**Architecture Compliance:**
- **스타터 셋업** → Story 1.1이 `create-next-app` + `uv init` + Supabase 콘솔 + `0001_init.sql`를 모두 포함
- **DB/엔티티 생성 시점** → `items`와 `app_state` 두 테이블은 Story 1.1에서 함께 생성 (`app_state`가 Story 3.x에서 필요하지만 초기 스키마에 두는 것이 일관성 + 마이그레이션 단순화)
- **명명 규칙** → 모든 스토리 AC가 `snake_case` 필드명과 architecture.md 엔드포인트 명칭을 그대로 사용
- **낙관적 UI 미적용** → Story 1.5에서 명시적으로 가드, 측정 후 OQ6 트리거 조건 기록

**Story Independence (Within-Epic):**
- **Epic 1:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7. 각 스토리는 직전 스토리들의 산출물만 사용. 1.4는 1.3을 전제로 빈 상태만 다룸. 1.7은 검증 스토리로 새 코드 거의 없음.
- **Epic 2:** 2.1 → 2.2 → 2.3 → 2.4. 2.1과 2.2는 같은 액션 진입 방식 결정을 공유 — 2.1에서 결정 후 2.2가 사용. 2.4는 2.1·2.2 입력 경로 모두에 적용되지만 독립적으로 구현 가능.
- **Epic 3:** 3.1 → 3.2 → 3.3. 3.1·3.2는 동일 엔드포인트(`/reset-if-new-day`)를 다른 트리거로 호출. 백엔드는 3.1에서 처음 만들어지고 3.2에서 추가 변경 없음. 3.3은 3.1·3.2 구현이 이미 충족하는 조건들의 검증/가드.

**Epic Independence:**
- **Epic 1 단독:** 사용 가능 — 추가 + V 체크 + 새로고침 후 유지. 자정 리셋은 없어도 동작(단, 영원히 체크가 누적됨).
- **Epic 2 단독 (Epic 1 위):** 풀 CRUD + 정렬 + 길이 가드. 자정 리셋 없이도 완결.
- **Epic 3 단독 (Epic 1·2 위):** 자정 리셋 추가. PRD 핵심 차별점.

**File Churn Check:**
- `ItemRow.tsx`는 Epic 1(체크 토글) + Epic 2(편집·삭제) 양쪽에서 수정됨 — 단일 컴포넌트가 점진적으로 책임을 늘리는 자연스러운 패턴. 별도 컴포넌트로 분리 시 props 폭증 + 응집도 저하. 통합 유지 결정.
- `routers/items.py`도 Epic 1·2 양쪽에서 엔드포인트가 추가됨 — 동일하게 자연스러운 점진적 확장.
- 파일 churn 사유로 에픽 통합 권장은 발생하지 않음.

**Forward-Dependency Check:**
- Story 1.4의 "빈 상태로 돌아갈 때" 시나리오는 Story 2.2의 삭제를 가정 — Story 2.2가 구현되기 전에는 본 시나리오만 보류 (Story 1.4의 1차 AC는 Story 1.1 직후의 첫 진입 상태로 충족 가능).
- Story 1.5의 "낙관적 UI 측정/트리거 조건"은 Story 1.5 내부에서 측정·기록까지만 완료, 실제 낙관적 UI 도입은 V1.1로 명시 보류 — Forward dependency 아님.
- 그 외 모든 스토리는 직전 스토리의 산출물만 참조.

**Status:** READY FOR DEVELOPMENT
