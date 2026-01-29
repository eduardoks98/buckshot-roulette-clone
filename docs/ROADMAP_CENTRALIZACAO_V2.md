# ROADMAP: Centralização Completa do Games Admin

> **Versão:** 2.0
> **Data:** 28/01/2026
> **Escopo:** Login centralizado, Sistema de Ads para Patrocinadores, Pagamentos, Integração Larakit

---

## SUMÁRIO EXECUTIVO

### Decisões Tomadas
| Item | Decisão |
|------|---------|
| **Login Providers** | Google + Facebook + Discord |
| **Tipos de Ad** | Banner + Video Rewarded + Interstitial + Native Ads |
| **Pagamentos** | Stripe + MercadoPago + AbacatePay |

### Recursos Disponíveis no Larakit (já prontos para integrar)
- ✅ `eduardoks98/auth` - Sistema base de autenticação
- ✅ `eduardoks98/google-auth` - Google OAuth (já em uso parcial)
- ✅ `eduardoks98/facebook-auth` - Facebook OAuth
- ✅ `eduardoks98/auth-discord` - Discord OAuth (CRIADO em 28/01/2026)
- ✅ `eduardoks98/payment-stripe` - Stripe completo
- ✅ `eduardoks98/payment-mercadopago` - PIX + Boleto + Cartão
- ✅ `eduardoks98/payment-abacatepay` - PIX brasileiro
- ✅ `eduardoks98/monetization` - Sistema de moedas virtuais e rewards
- ✅ `eduardoks98/ads-google` - AdMob (rewarded ads)
- ✅ `eduardoks98/storage-s3` - Upload de vídeos/imagens (compatível com Cloudflare R2 / MinIO)
- ✅ `eduardoks98/media-library` - Processamento de mídia

---

## FASE 1: LOGIN CENTRALIZADO

### 1.1 Estrutura do Banco de Dados

**Nova tabela: `user_oauth_providers`**
```sql
CREATE TABLE user_oauth_providers (
    id CHAR(36) PRIMARY KEY,
    game_user_id CHAR(36) NOT NULL,
    provider ENUM('google', 'facebook', 'discord') NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_avatar VARCHAR(500),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (game_user_id) REFERENCES game_users(id) ON DELETE CASCADE,
    UNIQUE KEY (provider, provider_id),
    INDEX (game_user_id, provider)
);
```

**Atualizar tabela `game_users`**
```sql
ALTER TABLE game_users
    ADD COLUMN facebook_id VARCHAR(255) NULL AFTER google_id,
    ADD COLUMN discord_id VARCHAR(255) NULL AFTER facebook_id,
    ADD COLUMN primary_provider ENUM('google', 'facebook', 'discord') DEFAULT 'google';
```

### 1.2 Pacotes Larakit a Integrar

**composer.json (games-admin)**
```json
{
    "require": {
        "eduardoks98/auth": "^1.0",
        "eduardoks98/google-auth": "^1.1",
        "eduardoks98/facebook-auth": "^1.1"
    }
}
```

### 1.3 Criar Pacote Discord OAuth (larakit)

**Estrutura: `packages/auth/discord/`**
```
discord/
├── src/
│   ├── DiscordAuthServiceProvider.php
│   ├── Services/
│   │   └── DiscordAuthService.php
│   ├── Http/
│   │   └── Controllers/
│   │       └── DiscordAuthController.php
│   └── config/
│       └── discord-auth.php
├── database/
│   └── migrations/
├── routes/
│   └── api.php
├── composer.json
└── README.md
```

**Discord OAuth Scopes necessários:**
- `identify` - Informações básicas do usuário
- `email` - Email do usuário
- `guilds` - Servidores (opcional, para verificar se está em servidor do jogo)

### 1.4 API Endpoints de Auth (Games Admin)

```
# OAuth Flows
GET  /api/auth/{provider}/redirect      → Redireciona para OAuth
GET  /api/auth/{provider}/callback      → Callback do OAuth
POST /api/auth/token/refresh            → Refresh token

# User Management
GET  /api/auth/me                       → Dados do usuário logado
POST /api/auth/logout                   → Logout
GET  /api/auth/providers                → Lista providers vinculados
POST /api/auth/providers/{provider}/link    → Vincular novo provider
DELETE /api/auth/providers/{provider}/unlink → Desvincular provider

# Game-specific auth (para o jogo chamar)
POST /api/games/{code}/auth/validate    → Validar token do jogo
POST /api/games/{code}/auth/sync        → Sincronizar usuário do jogo
```

### 1.5 Fluxo de Login Centralizado

```
JOGADOR                     JOGO (BangShot)              GAMES ADMIN
   │                              │                            │
   │ Clica "Login com Discord"    │                            │
   │ ─────────────────────────────>                            │
   │                              │                            │
   │                              │  Redirect to Admin OAuth   │
   │                              │ ────────────────────────────>
   │                              │                            │
   │         <──────────────────── Redirect to Discord ────────│
   │                              │                            │
   │ Autoriza no Discord          │                            │
   │ ─────────────────────────────────────────────────────────>│
   │                              │                            │
   │                              │    Callback com code       │
   │                              │ <────────────────────────────
   │                              │                            │
   │                              │  Troca code por tokens     │
   │                              │  Cria/atualiza game_user   │
   │                              │  Gera JWT                  │
   │                              │ ────────────────────────────>
   │                              │                            │
   │  <───────────────────────────  Redirect com JWT token     │
   │  Logado!                     │                            │
```

### 1.6 Arquivos a Modificar

**Games Admin:**
- `app/Http/Controllers/Api/AuthController.php` (criar)
- `app/Services/OAuthService.php` (criar)
- `config/auth.php` (atualizar guards)
- `routes/api.php` (adicionar rotas)
- `database/migrations/` (novas tabelas)

**BangShot:**
- `src/server/src/controllers/auth.controller.ts` (usar Admin API)
- `src/client/src/context/AuthContext.tsx` (múltiplos providers)
- `src/client/src/components/auth/LoginButtons.tsx` (criar)

---

## FASE 2: SISTEMA DE ADS PARA PATROCINADORES

### 2.1 Conceito do Sistema

**Tipos de Ad Suportados:**

| Tipo | Descrição | Comportamento | Preço Base |
|------|-----------|---------------|------------|
| **Banner Estático** | Imagem fixa em posição do site | Sempre visível | R$ 50/semana |
| **Banner Animado** | GIF ou imagem rotativa | Sempre visível | R$ 75/semana |
| **Video Rewarded** | Vídeo que usuário assiste para ganhar reward | Modal fullscreen, usuário escolhe assistir | R$ 150/1000 views |
| **Interstitial** | Tela cheia entre transições | Aparece em momentos específicos (fim de partida) | R$ 100/1000 views |
| **Native Ad** | Se mistura ao conteúdo do jogo | Integrado ao UI do jogo | R$ 200/semana |

**Tamanhos de Banner:**
```
LEADERBOARD:    728x90   (topo de página)
BANNER:         468x60   (padrão)
RECTANGLE:      300x250  (sidebar)
LARGE_RECT:     336x280  (sidebar grande)
SKYSCRAPER:     120x600  (lateral)
WIDE_SKY:       160x600  (lateral largo)
MOBILE_BANNER:  320x50   (mobile)
MOBILE_LARGE:   320x100  (mobile grande)
```

### 2.2 Estrutura do Banco de Dados

**Tabela: `sponsors`**
```sql
CREATE TABLE sponsors (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    website VARCHAR(500),
    logo_url VARCHAR(500),

    -- Billing info
    billing_email VARCHAR(255),
    tax_id VARCHAR(50),           -- CNPJ/CPF
    billing_address JSON,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Payment preferences
    preferred_payment_method ENUM('stripe', 'mercadopago', 'abacatepay'),
    stripe_customer_id VARCHAR(255),
    mercadopago_customer_id VARCHAR(255),

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Tabela: `ad_campaigns`**
```sql
CREATE TABLE ad_campaigns (
    id CHAR(36) PRIMARY KEY,
    sponsor_id CHAR(36) NOT NULL,
    game_id CHAR(36) NULL,        -- NULL = todos os jogos

    name VARCHAR(255) NOT NULL,
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed') DEFAULT 'draft',

    -- Datas
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Budget
    budget_type ENUM('daily', 'total') DEFAULT 'total',
    budget_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0,

    -- Targeting
    target_countries JSON,        -- ['BR', 'PT', 'US']
    target_languages JSON,        -- ['pt', 'en']
    target_platforms JSON,        -- ['web', 'mobile', 'desktop']

    -- Review
    reviewed_by CHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (sponsor_id) REFERENCES sponsors(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
);
```

**Tabela: `ad_creatives`**
```sql
CREATE TABLE ad_creatives (
    id CHAR(36) PRIMARY KEY,
    campaign_id CHAR(36) NOT NULL,

    type ENUM('banner', 'video', 'interstitial', 'native') NOT NULL,
    format VARCHAR(50) NOT NULL,   -- '728x90', '300x250', 'video_30s', etc.

    -- Media
    media_type ENUM('image', 'gif', 'video') NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    media_thumbnail_url VARCHAR(500),

    -- Video specific
    video_duration INT NULL,       -- em segundos
    video_skip_after INT NULL,     -- pode pular após X segundos

    -- Content
    title VARCHAR(100),
    description VARCHAR(255),
    cta_text VARCHAR(50),          -- "Saiba mais", "Compre agora"
    cta_url VARCHAR(500) NOT NULL,

    -- Position preferences
    allowed_positions JSON,        -- ['header', 'sidebar', 'between_matches', 'game_over']

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Review
    review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    review_notes TEXT,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE
);
```

**Tabela: `ad_placements`**
```sql
CREATE TABLE ad_placements (
    id CHAR(36) PRIMARY KEY,
    game_id CHAR(36) NOT NULL,

    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,  -- 'header', 'sidebar', 'between_matches', 'reward_modal'

    -- Dimensões aceitas
    accepted_formats JSON NOT NULL,  -- ['728x90', '468x60']
    accepted_types JSON NOT NULL,    -- ['banner', 'video']

    -- Pricing
    price_model ENUM('cpm', 'cpc', 'cpv', 'fixed') NOT NULL,
    price_amount DECIMAL(10,2) NOT NULL,

    -- Display rules
    frequency_cap INT NULL,          -- max impressões por usuário/dia
    min_interval_seconds INT NULL,   -- intervalo mínimo entre exibições

    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (game_id) REFERENCES games(id)
);
```

**Tabela: `ad_impressions`**
```sql
CREATE TABLE ad_impressions (
    id CHAR(36) PRIMARY KEY,
    creative_id CHAR(36) NOT NULL,
    placement_id CHAR(36) NOT NULL,
    game_user_id CHAR(36) NULL,

    -- Event type
    event_type ENUM('impression', 'click', 'video_start', 'video_25', 'video_50', 'video_75', 'video_complete', 'reward_claimed') NOT NULL,

    -- Context
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    country_code CHAR(2),
    device_type ENUM('desktop', 'mobile', 'tablet'),

    -- Revenue
    revenue_amount DECIMAL(10,4) DEFAULT 0,

    created_at TIMESTAMP,

    INDEX (creative_id, event_type, created_at),
    INDEX (placement_id, created_at),
    INDEX (game_user_id, created_at)
);
```

**Tabela: `ad_payments`**
```sql
CREATE TABLE ad_payments (
    id CHAR(36) PRIMARY KEY,
    sponsor_id CHAR(36) NOT NULL,
    campaign_id CHAR(36) NULL,

    -- Payment info
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'BRL',

    -- Provider
    payment_provider ENUM('stripe', 'mercadopago', 'abacatepay') NOT NULL,
    provider_payment_id VARCHAR(255),
    provider_status VARCHAR(50),

    -- Status
    status ENUM('pending', 'processing', 'paid', 'failed', 'refunded') DEFAULT 'pending',

    -- PIX specific
    pix_qr_code TEXT,
    pix_copy_paste TEXT,

    -- Timestamps
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (sponsor_id) REFERENCES sponsors(id),
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id)
);
```

### 2.3 API Endpoints para Sponsors

```
# Portal do Sponsor (autenticado)
POST   /api/sponsors/register              → Cadastro de sponsor
POST   /api/sponsors/login                 → Login
GET    /api/sponsors/me                    → Dados do sponsor

# Campanhas
GET    /api/sponsors/campaigns             → Listar campanhas
POST   /api/sponsors/campaigns             → Criar campanha
GET    /api/sponsors/campaigns/{id}        → Detalhes da campanha
PUT    /api/sponsors/campaigns/{id}        → Atualizar campanha
DELETE /api/sponsors/campaigns/{id}        → Deletar campanha

# Criativos
POST   /api/sponsors/campaigns/{id}/creatives      → Upload de criativo
GET    /api/sponsors/campaigns/{id}/creatives      → Listar criativos
DELETE /api/sponsors/creatives/{id}                → Remover criativo

# Pagamentos
GET    /api/sponsors/payments                      → Histórico de pagamentos
POST   /api/sponsors/campaigns/{id}/pay            → Pagar campanha
POST   /api/sponsors/payments/{id}/pix             → Gerar PIX
GET    /api/sponsors/payments/{id}/status          → Status do pagamento

# Analytics
GET    /api/sponsors/campaigns/{id}/stats          → Estatísticas da campanha
GET    /api/sponsors/analytics/overview            → Overview geral

# API Pública (para o jogo)
GET    /api/games/{code}/ads                       → Buscar ads para exibir
POST   /api/games/{code}/ads/{id}/impression       → Registrar impressão
POST   /api/games/{code}/ads/{id}/click            → Registrar clique
POST   /api/games/{code}/ads/{id}/video-progress   → Progresso do vídeo
POST   /api/games/{code}/ads/{id}/reward           → Claim reward
```

### 2.4 Componentes Frontend (BangShot)

**Novos componentes a criar:**
```
src/client/src/components/ads/
├── AdContainer.tsx           # Container genérico
├── BannerAd.tsx              # Banner estático/animado
├── VideoRewardedAd.tsx       # Modal de vídeo com reward
├── InterstitialAd.tsx        # Tela cheia entre transições
├── NativeAd.tsx              # Ad integrado ao UI
├── AdContext.tsx             # Context para gerenciar ads
└── hooks/
    ├── useAds.ts             # Hook para buscar ads
    ├── useAdImpression.ts    # Hook para registrar impressões
    └── useVideoReward.ts     # Hook para vídeos rewarded
```

**VideoRewardedAd.tsx - Exemplo de estrutura:**
```tsx
interface VideoRewardedAdProps {
  onRewardClaimed: (reward: Reward) => void;
  onClose: () => void;
  rewardType: 'coins' | 'xp' | 'item';
  rewardAmount: number;
}

// Modal fullscreen com:
// - Vídeo do patrocinador
// - Contador de tempo (não pode pular até X segundos)
// - Botão "Claim Reward" ao final
// - Tracking de progresso (25%, 50%, 75%, 100%)
```

### 2.5 Preços e Pacotes

**Tabela: `ad_packages`**
```sql
CREATE TABLE ad_packages (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- O que inclui
    ad_type ENUM('banner', 'video', 'interstitial', 'native', 'combo') NOT NULL,
    formats JSON NOT NULL,           -- ['728x90', '300x250']
    positions JSON NOT NULL,         -- ['header', 'sidebar']

    -- Duração
    duration_type ENUM('impressions', 'days', 'views') NOT NULL,
    duration_value INT NOT NULL,     -- 1000 impressões, 7 dias, etc.

    -- Preço
    price DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'BRL',

    -- Features
    features JSON,                   -- ['priority_display', 'analytics_detailed']

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMP
);
```

**Pacotes Iniciais:**
```
1. STARTER BANNER
   - 1 banner 300x250
   - 7 dias
   - R$ 49,90

2. PRO BANNER
   - 3 banners (728x90, 300x250, 468x60)
   - 30 dias
   - R$ 149,90

3. VIDEO BASIC
   - 1000 video views (até 30s)
   - R$ 199,90

4. VIDEO PRO
   - 5000 video views
   - Analytics detalhado
   - R$ 799,90

5. FULL PACKAGE
   - Todos os formatos
   - 30 dias
   - Prioridade de exibição
   - R$ 999,90
```

---

## FASE 3: INTEGRAÇÃO DE PAGAMENTOS

### 3.1 Pacotes Larakit a Integrar

```json
{
    "require": {
        "eduardoks98/payment-stripe": "^1.1",
        "eduardoks98/payment-mercadopago": "^1.1",
        "eduardoks98/payment-abacatepay": "^1.1"
    }
}
```

### 3.2 Fluxo de Pagamento

```
SPONSOR                    GAMES ADMIN                 PAYMENT PROVIDER
   │                            │                            │
   │ Seleciona pacote           │                            │
   │ ──────────────────────────>│                            │
   │                            │                            │
   │ Escolhe forma de pagamento │                            │
   │ (Stripe/MercadoPago/PIX)   │                            │
   │ ──────────────────────────>│                            │
   │                            │                            │
   │                            │  Cria payment intent       │
   │                            │ ──────────────────────────>│
   │                            │                            │
   │                            │  <─── Retorna checkout URL │
   │                            │       ou QR Code PIX       │
   │                            │                            │
   │ <───────────────────────── │                            │
   │ Exibe checkout/QR Code     │                            │
   │                            │                            │
   │ Realiza pagamento          │                            │
   │ ─────────────────────────────────────────────────────>  │
   │                            │                            │
   │                            │  <─── Webhook: paid        │
   │                            │                            │
   │                            │  Ativa campanha            │
   │                            │  Envia email confirmação   │
   │                            │                            │
   │ <───────────────────────── │                            │
   │ Campanha ativa!            │                            │
```

### 3.3 Configuração de Providers

**.env (games-admin)**
```env
# Stripe
STRIPE_KEY=pk_...
STRIPE_SECRET=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...

# AbacatePay
ABACATEPAY_TOKEN=...
ABACATEPAY_WEBHOOK_SECRET=...
```

---

## FASE 4: INTEGRAÇÃO COM BANGSHOT

### 4.1 SDK do Games Admin

**Criar pacote NPM: `@games-admin/sdk`**
```
packages/sdk/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── auth/
│   │   └── AuthService.ts
│   ├── ads/
│   │   └── AdsService.ts
│   ├── config/
│   │   └── ConfigService.ts
│   └── types/
│       └── index.ts
├── package.json
└── README.md
```

### 4.2 Uso no BangShot

```typescript
// src/server/src/services/admin-sdk.ts
import { GamesAdminSDK } from '@games-admin/sdk';

export const adminSDK = new GamesAdminSDK({
  gameCode: process.env.GAMES_ADMIN_GAME_CODE!,
  apiKey: process.env.GAMES_ADMIN_API_KEY!,
  apiUrl: process.env.GAMES_ADMIN_URL!,
  cache: { enabled: true, ttl: 5 * 60 * 1000 },
});

// Uso
const rankingConfig = await adminSDK.configs.ranking.get();
const ads = await adminSDK.ads.getForPlacement('between_matches');
await adminSDK.ads.trackImpression(adId, { userId, sessionId });
```

---

## CRONOGRAMA DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2): Login Centralizado
- [ ] Criar pacote Discord OAuth no larakit
- [ ] Integrar google-auth e facebook-auth no games-admin
- [ ] Criar tabelas de OAuth providers
- [ ] Implementar API de auth
- [ ] Atualizar BangShot para usar auth centralizada
- [ ] Testar fluxo completo

### Sprint 2 (Semana 3-4): Sistema de Sponsors Base
- [ ] Criar tabelas de sponsors, campaigns, creatives
- [ ] Implementar CRUD de sponsors
- [ ] Implementar CRUD de campanhas
- [ ] Upload de mídia (local/R2)
- [ ] Sistema de review/aprovação

### Sprint 3 (Semana 5-6): Sistema de Ads
- [ ] Criar tabelas de placements e impressions
- [ ] API de delivery de ads
- [ ] Componentes React (BannerAd, VideoRewardedAd)
- [ ] Tracking de impressões/cliques
- [ ] Sistema de frequência/capping

### Sprint 4 (Semana 7-8): Pagamentos
- [ ] Integrar AbacatePay (PIX) - **PRIMEIRO** (mais simples, taxa fixa R$0.80)
- [ ] Integrar MercadoPago (PIX + Cartão BR) - **SEGUNDO**
- [ ] Integrar Stripe (Cartão Internacional) - **TERCEIRO**
- [ ] Webhooks de pagamento
- [ ] Dashboard de pagamentos

### Sprint 5 (Semana 9-10): Landing Page (Portal de Jogos)
- [ ] Criar projeto Laravel para landing page
- [ ] Grid de jogos estilo Friv
- [ ] Sistema de busca/filtro
- [ ] Categorias e tags
- [ ] Contador de jogadores online
- [ ] Integração com login centralizado
- [ ] Deploy no Apache (mysys.shop)

### Sprint 6 (Semana 11-12): Polish & Analytics
- [ ] Dashboard do sponsor
- [ ] Relatórios e analytics
- [ ] Otimizações de performance
- [ ] Testes E2E
- [ ] Documentação
- [ ] Configuração SSL (Let's Encrypt)

---

## ARQUIVOS CRÍTICOS A CRIAR/MODIFICAR

### Games Admin (Laravel)
```
app/
├── Models/
│   ├── Sponsor.php
│   ├── AdCampaign.php
│   ├── AdCreative.php
│   ├── AdPlacement.php
│   ├── AdImpression.php
│   ├── AdPayment.php
│   └── UserOAuthProvider.php
├── Http/Controllers/
│   ├── Api/
│   │   ├── AuthController.php
│   │   ├── SponsorController.php
│   │   ├── CampaignController.php
│   │   ├── AdDeliveryController.php
│   │   └── PaymentController.php
│   └── Admin/
│       ├── SponsorManagementController.php
│       └── AdReviewController.php
├── Services/
│   ├── OAuthService.php
│   ├── AdDeliveryService.php
│   ├── AdTrackingService.php
│   └── PaymentService.php
└── database/migrations/
    ├── xxxx_create_sponsors_table.php
    ├── xxxx_create_ad_campaigns_table.php
    ├── xxxx_create_ad_creatives_table.php
    ├── xxxx_create_ad_placements_table.php
    ├── xxxx_create_ad_impressions_table.php
    ├── xxxx_create_ad_payments_table.php
    └── xxxx_create_user_oauth_providers_table.php
```

### Larakit (novo pacote)
```
packages/auth/discord/
├── src/
│   ├── DiscordAuthServiceProvider.php
│   ├── Services/DiscordAuthService.php
│   └── config/discord-auth.php
└── composer.json
```

### BangShot (React/Node)
```
src/client/src/
├── components/
│   ├── ads/
│   │   ├── AdContainer.tsx
│   │   ├── BannerAd.tsx
│   │   ├── VideoRewardedAd.tsx
│   │   ├── InterstitialAd.tsx
│   │   └── AdContext.tsx
│   └── auth/
│       └── MultiProviderLogin.tsx
└── hooks/
    ├── useAds.ts
    └── useAuth.ts

src/server/src/
├── services/
│   └── admin-sdk.ts
└── controllers/
    └── auth.controller.ts (atualizar)
```

---

## VERIFICAÇÃO DO PLANO

### Testes de Login
1. Login com Google → deve funcionar como hoje
2. Login com Facebook → deve criar/vincular conta
3. Login com Discord → deve criar/vincular conta
4. Vincular múltiplos providers → uma conta, vários logins
5. Desvincular provider → manter pelo menos um

### Testes de Ads
1. Sponsor se cadastra → recebe email de boas-vindas
2. Sponsor cria campanha → status "pending_review"
3. Admin aprova → status "approved"
4. Sponsor paga → status "active"
5. Jogo exibe ad → impressão registrada
6. Usuário clica → clique registrado
7. Vídeo assistido → reward liberado

### Testes de Pagamento
1. Pagar com Stripe (cartão internacional)
2. Pagar com MercadoPago (cartão BR)
3. Pagar com PIX (MercadoPago ou AbacatePay)
4. Webhook de confirmação ativa campanha
5. Falha de pagamento não ativa campanha

---

## ESTIMATIVA DE CUSTO

### Infraestrutura (ZERO CUSTO)
| Serviço | Solução Gratuita | Detalhes |
|---------|------------------|----------|
| Cache | **Laravel File/Database Cache** | Já incluso no Laravel, sem Redis |
| Storage de Mídia | **Local Storage + Cloudflare R2** | R2 tem 10GB grátis/mês, ou storage local |
| CDN | **Cloudflare (Free Tier)** | CDN gratuito, SSL gratuito |
| Banco de Dados | **MySQL local** | Já temos |
| Queue | **Database Queue** | Laravel queue sem Redis |

### Alternativas Self-Hosted (se precisar escalar)
- **KeyDB** (substituto Redis, open-source)
- **MinIO** (substituto S3, self-hosted)
- **Apache mod_cache** como cache (já temos Apache)

---

## INFRAESTRUTURA DO SERVIDOR

### Servidor
- **OS**: Linux
- **Web Server**: Apache (não Nginx)
- **Domínio Principal**: mysys.shop

### Estrutura de Subdomínios
```
mysys.shop                    → Landing Page (Portal estilo Friv)
admin.mysys.shop              → Games Admin Panel
bangshot.mysys.shop           → Jogo BangShot
jogo2.mysys.shop              → Próximo jogo
api.mysys.shop                → API centralizada (opcional)
sponsors.mysys.shop           → Portal de Sponsors (opcional)
```

### Configuração Apache (Virtual Hosts)

**Arquivo: `/etc/apache2/sites-available/mysys.shop.conf`**
```apache
# Landing Page Principal
<VirtualHost *:80>
    ServerName mysys.shop
    ServerAlias www.mysys.shop
    DocumentRoot /var/www/mysys/landing/public

    <Directory /var/www/mysys/landing/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/landing_error.log
    CustomLog ${APACHE_LOG_DIR}/landing_access.log combined
</VirtualHost>

# Games Admin Panel
<VirtualHost *:80>
    ServerName admin.mysys.shop
    DocumentRoot /var/www/mysys/games-admin/public

    <Directory /var/www/mysys/games-admin/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/admin_error.log
    CustomLog ${APACHE_LOG_DIR}/admin_access.log combined
</VirtualHost>

# BangShot Game (Node.js com proxy)
<VirtualHost *:80>
    ServerName bangshot.mysys.shop

    # Frontend React (build estático)
    DocumentRoot /var/www/mysys/bangshot/client/dist

    # Proxy para API Node.js
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    # WebSocket para Socket.IO
    ProxyPass /socket.io ws://localhost:3000/socket.io
    ProxyPassReverse /socket.io ws://localhost:3000/socket.io

    <Directory /var/www/mysys/bangshot/client/dist>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>

# Portal de Sponsors
<VirtualHost *:80>
    ServerName sponsors.mysys.shop
    DocumentRoot /var/www/mysys/sponsors-portal/public

    <Directory /var/www/mysys/sponsors-portal/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Comandos Linux para Setup

```bash
# 1. Habilitar módulos Apache necessários
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod ssl
sudo a2enmod headers

# 2. Criar estrutura de diretórios
sudo mkdir -p /var/www/mysys/{landing,games-admin,bangshot,sponsors-portal}
sudo chown -R www-data:www-data /var/www/mysys

# 3. Habilitar sites
sudo a2ensite mysys.shop.conf
sudo systemctl reload apache2

# 4. Instalar Certbot para SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d mysys.shop -d www.mysys.shop -d admin.mysys.shop -d bangshot.mysys.shop -d sponsors.mysys.shop

# 5. Node.js para jogos (PM2 para gerenciar processos)
sudo npm install -g pm2
cd /var/www/mysys/bangshot/server
pm2 start npm --name "bangshot" -- start
pm2 save
pm2 startup
```

### Landing Page (Portal Estilo Friv)

**Features:**
- Grid de jogos com thumbnails
- Busca/filtro por nome, categoria
- Jogos em destaque
- Categorias (Ação, Puzzle, Multiplayer, etc.)
- Contador de jogadores online
- Login unificado (mesma conta para todos os jogos)

**Tech Stack:**
- Laravel (mesmo do admin, ou Next.js/React)
- Ou simplesmente uma rota no Games Admin com blade templates

**Estrutura:**
```
landing/
├── public/
│   └── index.php
├── resources/
│   └── views/
│       ├── home.blade.php      # Grid de jogos
│       ├── game.blade.php      # Página do jogo
│       └── search.blade.php    # Resultados de busca
└── routes/
    └── web.php
```

### Taxas de Pagamento (única cobrança)
- Stripe: 2.9% + R$0.30/transação
- MercadoPago: 0.99% - 4.98%
- AbacatePay: R$0.80 fixo/PIX

### Total Estimado
**R$ 0/mês de infraestrutura** - apenas taxas de transação quando sponsors pagarem

---

*Roadmap versão 2.0 - Aprovado em 28/01/2026*
