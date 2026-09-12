# Migração: Cloudflare D1/SQLite → MySQL/MariaDB

Esta versão do Supermercado Central usa **MySQL/MariaDB como banco principal** e **Next.js em Node.js** como runtime da aplicação.

## Resultado da migração

A aplicação deixou de depender do Cloudflare D1 para persistência. A camada `lib/sql-database.ts` mantém a interface utilizada pelo código antigo (`prepare`, `bind`, `all`, `first`, `run` e `batch`), mas executa as consultas por meio do driver `mysql2` e de um pool de conexões.

Também foram removidas dependências de armazenamento R2 do fluxo principal:

- uploads do painel → tabela `media_files` (`MEDIUMBLOB`);
- backups do catálogo → tabela `catalog_backups` (`LONGTEXT`).

Assim, banco, catálogo, estoque, pedidos, usuários administrativos, mídia e backups podem permanecer no mesmo servidor MySQL/MariaDB.

## Instalação rápida

1. Crie um banco MySQL/MariaDB vazio.
2. Importe `database/supermercado_central.sql`.
3. Copie `.env.example` para `.env.local` ou configure as variáveis no provedor.
4. Informe `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`, ou utilize `DATABASE_URL`.
5. Configure `ADMIN_EMAILS`, `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`.
6. Execute `npm install`.
7. Execute `npm run build` e inicie com `npm start`.

Exemplo de URL:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/supermercado_central
```

## Compatibilidade do SQL

O arquivo `supermercado_central.sql` foi preparado com:

- InnoDB;
- `utf8mb4`;
- chaves e índices compatíveis com hospedagens compartilhadas modernas;
- datas em `DATETIME`/`CURRENT_TIMESTAMP`;
- estoque em `DECIMAL(12,3)` para quantidades fracionadas;
- valores monetários em centavos inteiros, preservando o modelo existente.

Alvo recomendado: MySQL 5.7+/8.x ou MariaDB 10.3+.

## Recursos SQLite/D1 convertidos

Entre as conversões feitas no código:

- `ON CONFLICT ... DO UPDATE` → `ON DUPLICATE KEY UPDATE`;
- `excluded.campo` → `VALUES(campo)`;
- `datetime('now', ...)` → `DATE_SUB` / `DATE_ADD`;
- `MAX(0, valor)` usado como função escalar → `GREATEST(0, valor)`;
- `CAST(... AS INTEGER)` → `CAST(... AS SIGNED)`;
- operações D1 em lote → transação MySQL pelo pool de conexões.

## Estrutura criada

O SQL principal cria 23 tabelas:

- `categories`
- `products`
- `store_settings`
- `delivery_zones`
- `coupons`
- `banners`
- `home_content`
- `orders`
- `order_items`
- `shopping_lists`
- `store_notifications`
- `customers`
- `reviews`
- `order_status_history`
- `metrics`
- `audit_logs`
- `staff`
- `security_settings`
- `admin_approvals`
- `admin_devices`
- `inventory_movements`
- `media_files`
- `catalog_backups`

## Autenticação administrativa portátil

O ambiente anterior podia receber identidade por cabeçalhos específicos. Para permitir hospedagem comum, foi incluído um login local assinado por cookie HttpOnly.

Configuração recomendada:

```env
AUTH_MODE=local
ADMIN_EMAILS=admin@seudominio.com
ADMIN_PASSWORD=uma-senha-forte
ADMIN_SESSION_SECRET=um-segredo-diferente-e-bem-longo
```

O painel fica acessível por `/admin/login` quando o modo local está ativo.

## Dados que já existam em um D1 remoto

Este projeto enviado não contém um arquivo físico com os dados atuais de um D1 remoto. Portanto, `supermercado_central.sql` cria a estrutura e popula os dados iniciais encontrados nas migrações/código do ZIP, mas **não copia automaticamente registros que existam somente no servidor Cloudflare**.

Se houver um D1 em produção, faça um export antes da desativação e migre esses registros para as tabelas equivalentes no MySQL/MariaDB. Isso é especialmente importante para:

- pedidos e itens de pedidos;
- clientes;
- estoque e movimentações;
- equipe/administradores;
- cupons e configurações alteradas em produção;
- avaliações e listas de compras.

## Hospedagem

O banco pode estar em cPanel, Plesk, VPS, servidor próprio ou serviço MySQL gerenciado. A aplicação deve rodar em um ambiente Node.js e ter conectividade de rede com o banco.

Caso o banco esteja em outro servidor, habilite o acesso remoto MySQL somente para o host/IP necessário e mantenha credenciais fortes. Se o provedor oferecer TLS/SSL, ative `DB_SSL=true`.

## Arquivos legados

- migrações antigas SQLite/D1: `database/legacy/sqlite-d1-migrations/`;
- arquivos do antigo runtime Cloudflare/Vinext: `legacy/cloudflare-sites/`.

Eles foram preservados apenas para histórico/referência e não participam da compilação principal.
