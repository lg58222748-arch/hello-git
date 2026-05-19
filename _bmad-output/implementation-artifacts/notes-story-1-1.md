# Story 1.1 — 구현 노트

> Phase A 완료 / Phase B 미진행 상태에서 작성. 사용 도구 버전은 lock 파일 부재 환경 기준 (uv 대신 venv + pip + requirements.txt 채택, 사유는 spec-1-1-project-setup.md Spec Change Log 참고 예정).

## Phase A — Next.js + FastAPI 스캐폴드

### 검증 결과 (2026-05-19)

| 항목 | 결과 |
|---|---|
| `pytest -q` (backend) | 1 passed (0.54s) |
| `uvicorn main:app --host 127.0.0.1 --port 8000` | 기동 OK, `/items` → `200 []`, `/docs` → `200` |
| `npm run build` (frontend) | 통과 (Route `/`는 `ƒ Dynamic`, `force-dynamic` 효력 확인) |
| Frontend E2E happy | `GET http://localhost:3000` → 200, "첫 항목을 추가해보세요" SSR 노출 |
| Frontend E2E error | backend down 상태에서 `GET http://localhost:3000` → 200, "백엔드 연결 실패: ..." 메시지 노출 (silent fail 아님) |
| Service-role key 누출 | `Grep`으로 `frontend/`와 `frontend/.next/` 전체에서 `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` 매칭 0건 |

### 사용 버전 (Phase A 시점)

**Backend (`backend/requirements.txt` SoT, 78개 라인):**

- Python 3.12.10 (venv `backend/.venv`)
- fastapi 0.136.1
- pydantic 2.13.4
- supabase 2.30.0 (Phase B 진입 시 활용)
- pytest 9.0.3
- httpx 0.28.1

**Frontend (`frontend/package.json` + `package-lock.json` SoT):**

- Next.js 16.2.6
- React 19.2.4
- TypeScript ^5
- Tailwind CSS ^4 (`@tailwindcss/postcss`)
- ESLint ^9

**Toolchain:**

- Node.js v24.14.1
- npm (bundled with Node 24)
- Python 3.12.10 (`C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe`)

### 아키텍처 결정 SoT 준수 확인

- ✅ 전 구간 `snake_case` (DB → JSON 필드 → Pydantic → TS `Item` 타입)
- ✅ 단일 seam — frontend HTTP는 `src/lib/api.ts` 경유, backend Supabase는 (Phase B에서) `db.py` 경유 예정
- ✅ `src/app/page.tsx`는 Server Component, `force-dynamic`으로 매 요청 SSR
- ✅ CORS 미들웨어 `http://localhost:3000` 허용
- ✅ 환경 변수: `backend/.env.example`, `frontend/.env.local.example` 만 커밋 대상. 실제 값 파일은 `.gitignore`로 차단
- ✅ Today 외 라우트 0개 (NFR4)
- ✅ 백엔드 미기동 시 silent fail 금지 (NFR6) — `ApiError` 던지고 `page.tsx`가 catch해 메시지 렌더

### 아키텍처 SoT에서 의식적으로 벗어난 부분

- **`uv` → `venv + pip + requirements.txt`**: 사용자가 Phase A 진행 중 `uv` 설치 없이 진행 요청. 결과적으로 `pyproject.toml` 대신 `requirements.txt`가 의존성 SoT가 됨. 정식 Spec Change Log 항목은 step-04 review 시 spec 파일에 기록 예정.
- 영향 범위: 백엔드 명령이 `uv run pytest` → `.venv\Scripts\python.exe -m pytest`, `uv run fastapi dev` → `.venv\Scripts\python.exe -m uvicorn main:app` 으로 변경. 코드 자체는 영향 없음.

## Phase B — Supabase 연결 (미완)

다음 단계 진입 전제:

1. 사용자가 Supabase 콘솔에서 신규 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/0001_init.sql` 실행 (items + app_state 테이블 + 트리거)
3. 프로젝트 URL + service-role key 캡처
4. `backend/.env` 파일 생성 후 값 입력 (커밋 금지)

진입 후 작업:

- `backend/db.py` — `get_supabase()` factory
- `backend/routers/items.py` — `Depends(get_supabase)` 주입, `select * from items order by position` 호출
- `backend/tests/conftest.py` — `app.dependency_overrides[get_supabase]` fixture로 라이브 의존성 격리
- 본 노트에 Phase B 검증 결과 + 응답 시간 측정값 append
