# SC Supermercado Central — V6 Supabase + Vercel

Aplicação completa do **SC Supermercado Central** em **Next.js 16**, usando a arquitetura oficial:

**GitHub → Vercel → Supabase PostgreSQL**

## Arquitetura

- **GitHub**: código-fonte e histórico oficial.
- **Vercel**: build, hospedagem e funções Next.js.
- **Supabase**: banco PostgreSQL oficial do sistema.
- **WhatsApp**: finalização comercial do pedido, mantendo o pedido registrado no banco antes da abertura do WhatsApp.

O Railway e o MySQL/MariaDB não são mais necessários nesta versão.

## Login administrativo simplificado

O painel usa somente **e-mail + senha**. O 2FA foi removido conforme solicitado.

Também foram removidas as antigas dependências de:

- `ADMIN_EMAILS`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_TOTP_SECRET`

As sessões administrativas são aleatórias, guardadas em cookie HttpOnly e validadas pela tabela `admin_sessions` no Supabase. O banco armazena apenas o hash do token de sessão.

### Primeiro acesso

Se não existir nenhum administrador ativo, acesse:

`/admin/setup`

Cadastre nome, e-mail e senha. Assim que a primeira conta é criada, essa tela deixa de aceitar novos cadastros e o acesso normal passa a ser:

`/admin/login`

Novos membros da equipe continuam sendo cadastrados pelo próprio painel, com níveis e permissões individuais.

## Banco Supabase

O projeto foi adaptado de MySQL para **PostgreSQL**:

- `pg` substitui `mysql2`;
- `ON DUPLICATE KEY UPDATE` foi migrado para `ON CONFLICT`;
- funções de data MySQL foram migradas para intervalos PostgreSQL;
- inserção de pedidos usa `RETURNING id`;
- sessões e rate limiting administrativo ficam persistidos no Supabase.

A aplicação usa uma camada de compatibilidade `prepare().bind().all()/first()/run()/batch()` para preservar a organização das rotas existentes.

## Configuração Vercel

Cadastre em **Vercel → Project → Settings → Environment Variables**:

```env
DATABASE_URL=postgresql://...
DB_CONNECTION_LIMIT=5
NEXT_PUBLIC_SITE_URL=https://SEU-PROJETO.vercel.app
ADMIN_LOGIN_MAX_ATTEMPTS=5
ADMIN_LOGIN_WINDOW_MINUTES=15
ADMIN_LOGIN_LOCK_MINUTES=15
```

Para `DATABASE_URL`, copie a **Transaction Pooler connection string** do Supabase. Não publique essa URL no GitHub.

## Desenvolvimento local

```bash
npm install
npm run typecheck
npm run dev
```

Abra:

- Loja: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`
- Primeiro administrador: `http://localhost:3000/admin/setup`

## Funcionalidades preservadas

A V6 mantém vitrine, catálogo, produtos por unidade/peso, estoque, carrinho, checkout, WhatsApp, pedidos, acompanhamento, clientes, fidelidade, cupons, banners, encarte, avaliações, notificações, relatórios, auditoria, backups, equipe e permissões.
