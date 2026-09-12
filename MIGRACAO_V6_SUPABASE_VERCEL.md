# Migração V6 — GitHub + Supabase + Vercel

## Concluído no código

1. MySQL/MariaDB removido do runtime.
2. Driver `mysql2` substituído por `pg`.
3. Consultas incompatíveis migradas para PostgreSQL.
4. Railway removido da arquitetura oficial.
5. Login administrativo migrado para credenciais armazenadas no Supabase.
6. 2FA/TOTP removido completamente do fluxo de login e da interface.
7. Sessões administrativas persistentes criadas no Supabase (`admin_sessions`).
8. Proteção de tentativas de login persistente (`admin_login_attempts`).
9. Primeiro administrador criado por `/admin/setup`.
10. Site pronto para deploy Next.js na Vercel.

## Supabase utilizado

Projeto existente: `sc-central-supermercado`.

A migração de segurança V6 já cria/garante as tabelas de sessão e tentativas de login e mantém `require_mfa = 0`.

## O que falta configurar na Vercel

Somente a `DATABASE_URL` do Supabase e a URL pública do projeto. A senha do administrador não fica mais em variável de ambiente.
