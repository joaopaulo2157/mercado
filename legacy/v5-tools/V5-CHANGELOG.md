# Changelog — SC Supermercado Central V5.1

## V5.1 - Home Premium

- Hero refinado com CTA principal “Ver ofertas de hoje”.
- Ofertas relâmpago reposicionadas imediatamente após o hero.
- Barra superior passa a destacar anúncio, horário e acesso às ofertas.
- Setores ganham fotos do próprio catálogo, mantendo ícone como fallback.
- Nova seção “Destaques para colocar na sua lista” entre setores e catálogo.
- Cards de produto recebem selo percentual de desconto e maior destaque para preço/foto.
- Catálogo recebe acabamento visual mais limpo e comercial.
- Carrinho mobile passa a exibir quantidade de itens, subtotal e botão “Ver carrinho”.
- Animações de hover foram suavizadas nas áreas comerciais mais densas.
- Nova camada de estilos `app/home-premium-v5-1.css`, importada por último para preservar compatibilidade com as versões anteriores.
- Nenhuma alteração feita no painel administrativo, banco, autenticação ou regras de pedidos.


## Segurança
- Credenciais individuais de funcionários com scrypt.
- 2FA TOTP real por funcionário com QR Code.
- Segredos TOTP criptografados com AES-256-GCM.
- 2FA TOTP opcional da conta proprietária via ambiente.
- Rate limit por conta e IP.
- CSP e cabeçalhos HTTP de segurança.
- Cookies administrativos mais restritivos.
- Migração automática/manual da estrutura V5.

## SEO e catálogo
- Catálogo inicial carregado no servidor a partir do MySQL.
- Sitemap dinâmico baseado no banco.
- URL pública centralizada em configuração.
- Domínio legado removido.
- Produtos relacionados vindos do banco.
- Agenda de promoções respeitada também nas páginas de produto.

## PWA
- Service Worker V5.
- Tela offline.
- Cache privado excluído.
- Ícones PWA 192/512 e maskable.

## Compatibilidade
- Mantidos carrinho, checkout, WhatsApp, pedidos, estoque, cupons, fidelidade, avaliações, notificações, listas, relatórios, RBAC, auditoria e backups da V4.

## Experiência e performance
- Busca tolerante a acentos e erros simples de digitação.
- Removida a segunda busca duplicada do catálogo no carregamento inicial.
- Atualização do catálogo em foco/intervalo controlado.
- Imagens internas passam pela otimização do Next.js quando compatível.
- Páginas comerciais não são servidas com preços antigos pelo cache offline.

## V5.0.1 - Correção de preparação local

- Corrigida incompatibilidade TypeScript com `mysql2 >= 3.24` em `lib/sql-database.ts`.
- Parâmetros de prepared statements agora usam uma união SQL explícita em vez de `unknown[]`.
- `undefined` passa a ser normalizado para `NULL`; objetos/arrays são serializados antes de chegar ao `mysql2`.
- Faixa de Node local ajustada para `>=22 <27`, eliminando o `EBADENGINE` no Node 26 usado na máquina de desenvolvimento.
- Scripts de instalação necessários para `esbuild`, `sharp` e `unrs-resolver` foram explicitamente autorizados no `package.json` para npm 12.
