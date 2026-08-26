# Secure Invest

Plataforma de análise e **Paper Trading**. Não é corretora, não envia ordens à B3 e não movimenta o saldo virtual. Pagamentos Mercado Pago servem exclusivamente aos planos do produto.

> Paper Trading é simulação. Dados e insights são informativos e educacionais, não recomendação de investimento.

## Acesso online

O Secure Invest está hospedado na Vercel e disponível em [security-invest.vercel.app](https://security-invest.vercel.app/).

O deployment público está funcional. Para utilizar recursos que dependem de provedores externos, como dados de mercado e pagamentos, as respectivas variáveis de ambiente devem permanecer configuradas na Vercel.

## Arquitetura

Next.js 16 + React 19 + TypeScript; Route Handlers REST em `app/api`; serviços em `src/server`; Supabase Auth/PostgreSQL/RLS; FMP para mercado/fundamentos; Alpha Vantage para técnico/sentimento; Mercado Pago para Pix e webhook.

```text
Browser → Next.js UI → /api → services/providers → Supabase / FMP / Alpha Vantage / Mercado Pago
```

## Instalação

```bash
npm install
npm run dev
```

Crie e configure somente `.env.local`; ele não pode ser versionado. Variáveis mínimas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
SECURITY_HASH_SECRET=
```

Inclua também as chaves FMP, Alpha Vantage e Mercado Pago necessárias para as integrações. Nunca coloque chave de servidor no browser. Chaves expostas devem ser revogadas e rotacionadas.

## Deploy na Vercel

O projeto compila na Vercel, mas só deve ser disponibilizado após a configuração abaixo:

1. Crie as variáveis de produção no painel da Vercel — nunca as adicione ao Git:
   - Públicas: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Exclusivamente de servidor: `SUPABASE_SECRET_KEY`, `SECURITY_HASH_SECRET`, `FMP_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`.
   - Configuração: `APP_URL=https://<seu-dominio>` e `ALLOWED_ORIGINS=https://<seu-dominio>`.
2. Aplique a migration no projeto Supabase e cadastre no Supabase Auth os redirect URLs `https://<seu-dominio>/auth/callback` e `https://<seu-dominio>/reset-password`.
3. No Mercado Pago, configure o webhook para `https://<seu-dominio>/api/webhooks/mercadopago` e use credenciais de teste durante a homologação.
4. Faça um teste real de cadastro, recuperação de senha, cotação FMP, ordem simulada e webhook antes de divulgar. Para a conta BRL inicial, use ativos cuja cotação FMP seja BRL; cotações em USD são recusadas de propósito.

Não faça deploy público com chaves que já foram expostas: gere novas chaves antes de configurar a Vercel.

## Supabase e migrations

Execute a migration em `supabase/migrations/` pela Supabase CLI/pipeline. Ela cria profiles, Paper Trading, watchlists, planos, pagamentos, assinaturas, webhooks, logs, rate limit, health checks, constraints e RLS. O trigger de cadastro cria profile, preferências, watchlist e conta virtual.

O primeiro administrador deve ser promovido diretamente no banco após confirmar o UUID:

```sql
update public.profiles set role = 'ADMIN' where id = '<uuid-confirmado>';
```

### Modelo de dados

`profiles` e `user_preferences` complementam `auth.users`. Cada usuário recebe uma `paper_account`, uma `watchlist` padrão e preferências no trigger de cadastro. `paper_orders`, `paper_positions` e `paper_transactions` registram a simulação; a função transacional do PostgreSQL bloqueia a conta antes de alterar saldo ou posição. `plans` define preços; `payments`, `subscriptions` e `webhook_events` registram o ciclo de pagamento. `security_events`, `login_attempts`, `audit_logs`, `api_usage_logs`, `rate_limit_buckets` e `integration_health` atendem auditoria e operação.

RLS está habilitado para as tabelas de usuário. O navegador utiliza a chave publicável e só lê os próprios registros; rotas de servidor usam a chave secreta exclusivamente no ambiente servidor para executar regras de negócio.

## Segurança

- Sessões Supabase em cookies e validação no servidor.
- RLS/RBAC, proteção IDOR, Zod, allowlists e campos permitidos.
- CORS restrito, CSRF por origin, headers de segurança e rate limit PostgreSQL.
- Logs redigem tokens, senhas, cookies, chaves e CVV.
- Ordens consultam cotação no backend; o cliente nunca define preço.
- Webhook Mercado Pago valida HMAC, consulta o pagamento externo e compara status/valor/moeda/referência antes de ativar a assinatura.

## Rotas

| Método | Endpoint | Autorização | Finalidade |
| --- | --- | --- | --- |
| POST | `/api/auth/sign-up`, `/sign-in`, `/sign-out` | pública/sessão | Cadastro e sessão Supabase |
| POST | `/api/auth/forgot-password`, `/reset-password` | pública/sessão | Recuperação de senha |
| GET | `/api/auth/session` | sessão | Estado da sessão atual |
| GET | `/api/market/search`, `/quote/:symbol`, `/profile/:symbol`, `/history/:symbol` | pública limitada | Dados FMP normalizados |
| GET | `/api/fundamentals/:symbol`, `/api/analysis/technical/:symbol`, `/api/analysis/sentiment/:symbol`, `/api/insights/:symbol` | pública limitada | Fundamentos, técnico, sentimento e insights |
| GET/POST | `/api/trading/*`, `/api/trading/orders` | sessão | Conta, carteira, posições, histórico e ordens simuladas |
| GET/POST/DELETE | `/api/watchlist`, `/api/watchlist/assets` | sessão | Watchlist do próprio usuário |
| GET/POST | `/api/plans`, `/api/payments/orders` | pública/sessão | Planos e Pix de assinatura |
| POST | `/api/webhooks/mercadopago` | assinatura HMAC | Confirmação idempotente de pagamento |
| GET/PATCH | `/api/admin/*` | ADMIN | Indicadores e gestão administrativa |

O contrato OpenAPI resumido está em `docs/openapi.yaml`. O preço jamais é aceito no corpo de uma ordem; `POST /api/trading/orders` exige `X-Idempotency-Key` e aceita apenas `symbol`, `side`, `quantity` e `orderType: MARKET`.

## Integrações e operação

- FMP: pesquisa, cotação, perfil, histórico e fundamentos; cache configurável e timeout.
- Alpha Vantage: RSI, SMA, EMA, MACD e News Sentiment; falhas não impedem a FMP.
- Mercado Pago: Pix para planos; use credenciais de teste até a homologação. O webhook consulta novamente o pagamento no provedor antes de conceder acesso.
- Supabase: Auth, PostgreSQL e RLS. A migration ainda precisa ser aplicada no projeto Supabase correto.

Se a FMP estiver indisponível ou a cotação estiver vencida, a ordem de Paper Trading é rejeitada com `MARKET_DATA_UNAVAILABLE`; o sistema não inventa preços.

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
```

Os testes não chamam serviços externos nem realizam pagamentos. Antes de produção, aplique migrations em ambiente de teste, configure URLs de callback/webhook e use credenciais de teste do Mercado Pago. Não promova para produção sem uma rodada de integração contra Supabase, FMP, Alpha Vantage e Mercado Pago sandbox.
