-- bmad-tutorial "오늘" 앱 초기 스키마
-- 적용: Supabase 대시보드 → SQL Editor → New query → 본 파일 내용 붙여넣기 → Run
-- 아키텍처 SoT: _bmad-output/planning-artifacts/architecture.md
-- 생성일: 2026-05-19

-- items: 매일 반복되는 일과 항목
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  text        text not null check (char_length(text) <= 60),
  checked     boolean not null default false,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists items_position_idx on public.items (position);

-- app_state: 자정 리셋 감지용 단일 행
-- last_seen_date를 client_date와 비교해 더 작은 경우에만 items.checked를 일괄 false로
create table if not exists public.app_state (
  id              integer primary key default 1 check (id = 1),
  last_seen_date  date not null
);

insert into public.app_state (id, last_seen_date)
values (1, current_date)
on conflict (id) do nothing;

-- updated_at 자동 갱신 트리거
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- RLS는 의도적으로 활성화하지 않습니다 (n=1, 인증 없음, FastAPI service-role key 경유).
-- 만약 Supabase 대시보드가 RLS 활성화를 권하면 본 프로젝트에서는 명시적으로 disable로 유지하세요.
