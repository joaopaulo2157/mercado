# SC Supermercado Central — V5.1 Home Premium

Aplicação completa do **Supermercado Central** em **Next.js 16 + MySQL/MariaDB**, com vitrine responsiva, carrinho, checkout, pedido registrado no banco antes da abertura do WhatsApp, acompanhamento de pedidos e painel administrativo por níveis de acesso.

## V5.1 — Home Premium

A V5.1 mantém integralmente a segurança, o banco, o painel administrativo e o fluxo de pedidos da V5.0.1. A atualização é focada na **experiência visual e comercial da página principal**:

- ofertas especiais passam a aparecer logo após o hero;
- hero com CTA principal direcionado às ofertas do dia;
- segundo CTA direciona aos setores ou repete a última compra;
- setores passam a usar imagens reais dos produtos do próprio catálogo;
- nova faixa de destaques antes do catálogo completo;
- cards de produtos com hierarquia visual mais forte e selo automático de desconto;
- catálogo mais limpo, com imagens maiores e botão de adicionar mais evidente;
- barra de carrinho no celular mostra quantidade, subtotal e acesso direto ao carrinho;
- refinamento de espaçamento, sombras e movimento para reduzir ruído visual;
- ordem da home prioriza impacto, economia, descoberta e compra.

A lógica do painel administrativo não foi alterada nesta etapa.


## Principais evoluções da V5

### Segurança administrativa

- contas individuais para membros da equipe;
- senha própria por funcionário usando **scrypt + salt individual**;
- senha proprietária mantida em variável de ambiente;
- **2FA TOTP real** para funcionários, com geração de QR Code no painel;
- segredo TOTP armazenado criptografado com **AES-256-GCM** usando `ADMIN_SESSION_SECRET`;
- 2FA opcional para a conta proprietária através de `ADMIN_TOTP_SECRET`;
- bloqueio contra força bruta **por conta e por IP**;
- janela de tentativas e duração do bloqueio configuráveis;
- cookies administrativos `HttpOnly`, `Secure` em produção e `SameSite=Strict`;
- proteção de origem nos endpoints administrativos;
- limite de tamanho nas requisições de login e administração;
- CSP, HSTS em produção, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e proteção contra cache/indexação do painel;
- trilha de auditoria e aprovação de ações críticas preservadas.

### Catálogo, SEO e dados

- a página inicial recebe o catálogo diretamente do **MySQL no servidor**;
- o catálogo padrão continua apenas como fallback de emergência;
- sitemap passa a refletir categorias e produtos ativos do banco;
- produtos relacionados passam a vir do banco;
- preço promocional respeita início/fim da oferta também na página individual do produto;
- domínio antigo fixo removido de metadata, sitemap, robots e dados estruturados;
- URL pública centralizada por `NEXT_PUBLIC_SITE_URL`, `SITE_URL` ou variáveis automáticas da Vercel;
- Schema.org de `GroceryStore` e `Product` usa dados reais da loja sempre que o banco está disponível.

### PWA e mobile

- novo Service Worker V5;
- cache público separado do cache de assets;
- páginas administrativas, acompanhamento e histórico pessoal não são armazenadas no cache offline;
- tela `/offline` própria;
- ícones PWA 192×192 e 512×512, incluindo versões maskable;
- atalhos de instalação para Comprar, Acompanhar pedido e Meus pedidos;
- atualização segura dos caches antigos.

### Compatibilidade com a V4

A V5 mantém a estrutura MySQL/Drizzle da V4 e possui migração incremental em:

`database/migrations/V5_SECURITY.sql`

A aplicação também tenta aplicar automaticamente as colunas de segurança da V5 quando o usuário do banco possui permissão de `ALTER TABLE`. Em ambientes mais restritos, execute o SQL de migração manualmente antes de usar os novos acessos da equipe.

## Arquivos importantes

- `database/supermercado_central.sql` — instalação completa para banco novo;
- `database/migrations/V5_SECURITY.sql` — migração de uma instalação V4 existente;
- `database/LEIA-ME-INSTALACAO.txt` — instalação rápida;
- `.env.example` — todas as variáveis de ambiente;
- `lib/sql-database.ts` — pool e camada de compatibilidade MySQL;
- `lib/admin-password.ts` — hash de senha scrypt;
- `lib/admin-mfa.ts` — criptografia dos segredos TOTP;
- `lib/totp.ts` — geração/validação TOTP;
- `lib/admin-login-security.ts` — rate limiting de login;
- `lib/v5-schema.ts` — migração automática da camada de segurança;
- `lib/site-url.ts` — URL pública única para SEO;
- `db/schema.ts` — schema Drizzle MySQL.

## Requisitos

- Node.js `>=22 <27`;
- MySQL 5.7+/8.x ou MariaDB 10.3+;
- hospedagem Node.js com acesso ao banco MySQL/MariaDB.

## Banco novo

1. Crie um banco MySQL/MariaDB vazio.
2. Crie o usuário do banco e conceda privilégios.
3. Importe:

   `database/supermercado_central.sql`

O arquivo cria **24 tabelas**, índices e dados iniciais.

## Atualizando um banco V4

Execute:

`database/migrations/V5_SECURITY.sql`

A migração preserva produtos, clientes, pedidos, configurações, estoque e demais dados existentes.

## Variáveis de ambiente

Exemplo mínimo:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/supermercado_central

AUTH_MODE=local
ADMIN_EMAILS=proprietario@seudominio.com
ADMIN_PASSWORD=uma-senha-proprietaria-forte
ADMIN_SESSION_SECRET=um-segredo-exclusivo-longo-com-64-ou-mais-caracteres

NEXT_PUBLIC_SITE_URL=https://www.seudominio.com.br

ADMIN_LOGIN_MAX_ATTEMPTS=5
ADMIN_LOGIN_WINDOW_MINUTES=15
ADMIN_LOGIN_LOCK_MINUTES=15
```

Também é possível configurar o banco pelos campos `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.

### 2FA do proprietário

Para exigir TOTP também na conta proprietária, cadastre uma chave Base32 no aplicativo autenticador e no ambiente:

```env
ADMIN_TOTP_SECRET=SUA_CHAVE_BASE32
```

As contas da equipe não usam essa chave. Cada funcionário recebe uma chave TOTP própria gerada no painel em **Equipe e permissões**.

## Instalação

```bash
npm install
npm run dev
```

Produção:

```bash
npm run typecheck
npm run build
npm start
```

## Painel administrativo

A conta proprietária definida em `ADMIN_EMAILS` continua sendo o acesso de recuperação/controle total. A partir da V5, o proprietário pode cadastrar novos membros em **Equipe e permissões**, definindo:

- nome;
- e-mail de login;
- senha individual;
- perfil-base;
- permissões adicionais;
- 2FA TOTP;
- status ativo/inativo.

Desativar um membro impede novo acesso ao painel mesmo que ele ainda possua um cookie de sessão assinado, porque as permissões são validadas novamente no servidor.

## URL pública e SEO

Não deixe URLs antigas fixas no código. Configure:

```env
NEXT_PUBLIC_SITE_URL=https://www.seudominio.com.br
```

Na Vercel, se essa variável não existir, a aplicação também reconhece `VERCEL_PROJECT_PRODUCTION_URL` e `VERCEL_URL`.

## Observação sobre imagens

A V5 preserva o armazenamento de imagens na tabela `media_files` para evitar quebrar instalações existentes. Para catálogos muito grandes, a próxima evolução recomendada é migrar os binários para armazenamento de objetos (Vercel Blob, S3/R2 ou Supabase Storage) e manter apenas a URL no MySQL.

## Legado

Arquivos específicos das versões Cloudflare/D1 permanecem em `legacy/` apenas como histórico e não fazem parte da compilação principal.
