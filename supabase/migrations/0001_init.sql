create extension if not exists pgcrypto;

create table public.game_sessions (
  id                uuid primary key default gen_random_uuid(),
  question_ids      text[]      not null,
  current_index     smallint    not null default 0 check (current_index between 0 and 15),
  current_served_at timestamptz,
  answers           jsonb       not null default '[]'::jsonb,
  correct_count     smallint    not null default 0 check (correct_count between 0 and 15),
  total_time_ms     integer     not null default 0 check (total_time_ms >= 0),
  status            text        not null default 'in_progress'
                    check (status in ('in_progress', 'finished', 'saved')),
  created_at        timestamptz not null default now(),
  finished_at       timestamptz
);

create table public.scores (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid        not null unique references public.game_sessions(id) on delete cascade,
  nickname      text        not null check (char_length(nickname) between 3 and 16),
  correct_count smallint    not null check (correct_count between 0 and 15),
  total_time_ms integer     not null check (total_time_ms between 0 and 150000),
  created_at    timestamptz not null default now()
);

create index scores_ranking_idx
  on public.scores (correct_count desc, total_time_ms asc, created_at asc);

-- Access only through the service role (API routes). No policies = anon/authenticated denied.
alter table public.game_sessions enable row level security;
alter table public.scores        enable row level security;

-- Ranking position: number of strictly better scores + 1
-- (correct_count desc, total_time_ms asc, created_at asc). Null if the score doesn't exist.
create or replace function public.score_position(p_score_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select (
    select count(*)
    from scores o
    where (-o.correct_count, o.total_time_ms, o.created_at)
        < (-t.correct_count, t.total_time_ms, t.created_at)
  )::integer + 1
  from scores t
  where t.id = p_score_id;
$$;

-- Saves a finished session to the ranking atomically. Raises one of:
-- SESSION_NOT_FOUND, ALREADY_SAVED, SESSION_NOT_FINISHED, SESSION_EXPIRED.
create or replace function public.save_score(p_session_id uuid, p_nickname text)
returns table (score_id uuid, score_position integer)
language plpgsql
set search_path = public
as $$
declare
  s game_sessions%rowtype;
  new_id uuid;
begin
  select * into s from game_sessions where id = p_session_id for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;
  if s.status = 'saved' then
    raise exception 'ALREADY_SAVED';
  end if;
  if s.status <> 'finished' then
    raise exception 'SESSION_NOT_FINISHED';
  end if;
  if s.finished_at < now() - interval '30 minutes' then
    raise exception 'SESSION_EXPIRED';
  end if;

  insert into scores (session_id, nickname, correct_count, total_time_ms)
  values (s.id, p_nickname, s.correct_count, s.total_time_ms)
  returning id into new_id;

  update game_sessions set status = 'saved' where id = s.id;

  return query select new_id, public.score_position(new_id);
end;
$$;

revoke execute on function public.score_position(uuid) from public, anon, authenticated;
revoke execute on function public.save_score(uuid, text) from public, anon, authenticated;
grant execute on function public.score_position(uuid) to service_role;
grant execute on function public.save_score(uuid, text) to service_role;
