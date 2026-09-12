-- SC SUPERMERCADO CENTRAL V6
-- Supabase PostgreSQL + Vercel
-- Idempotente: pode ser executado mais de uma vez.

create table if not exists public.admin_sessions (
  token_hash varchar(64) primary key,
  staff_id varchar(255) not null references public.staff(id) on delete cascade,
  email varchar(255) not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_sessions_email_idx
  on public.admin_sessions(email);

create index if not exists admin_sessions_exp_idx
  on public.admin_sessions(expires_at);

create table if not exists public.admin_login_attempts (
  subject_hash varchar(64) primary key,
  attempts integer not null default 0,
  first_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_locked_idx
  on public.admin_login_attempts(locked_until);

-- 2FA removido do fluxo administrativo na V6.
update public.security_settings
set require_mfa = 0,
    updated_at = now()
where id = 1;
