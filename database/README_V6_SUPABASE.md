# Banco V6 — Supabase PostgreSQL

O banco oficial do SC Supermercado Central é o projeto Supabase `sc-central-supermercado`.

A aplicação usa conexão PostgreSQL server-side através de `DATABASE_URL`. Para a Vercel, prefira a **Transaction Pooler connection string** do Supabase.

A migração `migrations/V6_SUPABASE_POSTGRES.sql` adiciona as tabelas usadas pelo novo login administrativo sem 2FA:

- `admin_sessions`
- `admin_login_attempts`

Ela também mantém `security_settings.require_mfa = 0`.

Não coloque a senha do banco ou a `DATABASE_URL` no GitHub.
