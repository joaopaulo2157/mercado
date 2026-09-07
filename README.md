# Supermercado Central

Aplicação do **Supermercado Central** preparada para rodar com **Next.js + MySQL/MariaDB**, sem depender do Cloudflare D1 ou R2.

## O que mudou nesta versão

- banco principal migrado de D1/SQLite para **MySQL/MariaDB**;
- consultas específicas do SQLite convertidas para SQL compatível com MySQL/MariaDB;
- camada de compatibilidade em `lib/sql-database.ts`, preservando as rotas e funcionalidades existentes;
- imagens enviadas pelo painel armazenadas na tabela `media_files`;
- backups do catálogo armazenados na tabela `catalog_backups`;
- estoque com `DECIMAL(12,3)`, permitindo produtos vendidos por peso;
- autenticação administrativa local por sessão segura, sem depender de cabeçalhos do Cloudflare/ChatGPT;
- execução principal convertida para **Next.js em Node.js**;
- arquivos antigos do Cloudflare/D1 preservados somente em `legacy/`, fora da compilação principal.

## Arquivos importantes

- `database/supermercado_central.sql` — instalação completa do banco;
- `database/LEIA-ME-INSTALACAO.txt` — instalação rápida;
- `database/GUIA-MIGRACAO-D1-PARA-MYSQL.md` — detalhes técnicos da migração;
- `.env.example` — modelo das variáveis de ambiente;
- `lib/sql-database.ts` — conexão/pool MySQL e compatibilidade com a antiga API D1;
- `db/schema.ts` — schema Drizzle em MySQL.

## Requisitos

- Node.js `>= 22.13.0`;
- MySQL 5.7+/8.x ou MariaDB 10.3+;
- uma hospedagem da aplicação que execute Node.js e consiga acessar o servidor MySQL/MariaDB.

> O banco pode estar em cPanel, Plesk, VPS, servidor próprio ou serviço MySQL gerenciado. A hospedagem do site precisa suportar Node.js porque o projeto continua sendo uma aplicação Next.js.

## Instalação do banco

1. Crie um banco MySQL/MariaDB vazio na hospedagem.
2. Crie um usuário e conceda privilégios sobre esse banco.
3. Abra o phpMyAdmin (ou outro cliente SQL), selecione o banco e importe:

   `database/supermercado_central.sql`

O arquivo cria **23 tabelas**, índices e os dados iniciais do projeto.

## Configuração da aplicação

Copie `.env.example` para `.env.local` durante o desenvolvimento ou cadastre as mesmas variáveis no painel da hospedagem.

Exemplo por campos separados:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=supermercado_user
DB_PASSWORD=sua-senha
DB_NAME=supermercado_central
DB_SSL=false
DB_CONNECTION_LIMIT=10

AUTH_MODE=local
ADMIN_EMAILS=admin@seudominio.com
ADMIN_PASSWORD=uma-senha-administrativa-forte
ADMIN_SESSION_SECRET=um-segredo-longo-e-aleatorio
```

Ou use uma URL completa:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/supermercado_central
```

Se a hospedagem do banco exigir SSL, configure também:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Instalação e execução

```bash
npm install
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

O primeiro `npm install` gera um novo `package-lock.json` contendo o driver `mysql2`. O lockfile da versão antiga foi preservado como `legacy/cloudflare-sites/package-lock.d1-legacy.json` somente para histórico.

## Painel administrativo

Por padrão, `AUTH_MODE=local` habilita o login próprio do projeto em `/admin/login`.

Configure obrigatoriamente:

- `ADMIN_EMAILS` — um ou mais e-mails autorizados, separados por vírgula;
- `ADMIN_PASSWORD` — senha do login;
- `ADMIN_SESSION_SECRET` — segredo longo usado para assinar a sessão.

As permissões internas e os níveis de acesso do painel continuam sendo controlados pelas tabelas e regras já existentes no projeto.

## Hospedagem com cPanel/Plesk

No painel da hospedagem:

1. crie o banco e o usuário MySQL;
2. associe o usuário ao banco com os privilégios necessários;
3. importe `database/supermercado_central.sql`;
4. configure as variáveis `DB_*` no ambiente da aplicação Node.js;
5. se banco e aplicação estiverem em servidores diferentes, habilite o acesso remoto ao MySQL para o host/IP da aplicação;
6. execute `npm install`, `npm run build` e inicie com `npm start` ou pelo gerenciador Node do provedor.

## Migração de dados que já estejam no D1

O arquivo SQL incluído instala a **estrutura e os dados iniciais presentes no código deste ZIP**. Ele não consegue, sozinho, acessar um banco D1 remoto.

Se existir um D1 em produção contendo pedidos, clientes, estoque ou outros registros mais recentes, exporte esses dados antes de desligá-lo e importe-os no MySQL. O guia em `database/GUIA-MIGRACAO-D1-PARA-MYSQL.md` explica essa diferença.

## Legado

Arquivos específicos do antigo ambiente Cloudflare/Vinext foram mantidos em `legacy/cloudflare-sites/` e as migrações SQLite/D1 em `database/legacy/`. Eles não fazem parte da compilação atual e não devem ser importados no MySQL.
