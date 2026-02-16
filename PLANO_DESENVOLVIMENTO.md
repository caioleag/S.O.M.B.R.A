# Plano de Desenvolvimento S.O.M.B.R.A

## Contexto

S.O.M.B.R.A (Serviço Operacional de Missões Bizarras, Ridículas e Absurdamente Inúteis) é uma PWA que transforma desafios cotidianos em missões secretas absurdas. Grupos de 3-5 amigos criam "operações" com duração de 7/14/30 dias e competem completando missões fotográficas temáticas de agentes secretos.

**Estado atual:** Repo vazio + Supabase project `xmoerkvaypdbxtvuqoyo` (sa-east-1) em branco. Google Auth já configurado no Supabase.

**Escopo:** Fase 1 (MVP) + Fase 2. Banco de missões: apenas as 45 do PRD.

**Execução:** Vibe-coding com bypass — IA executa tudo autonomamente. Se MCP do Supabase falhar, o usuário precisa reautenticar (`/mcp`).

---

## Etapa 1 — Banco de Dados (via Supabase MCP)

Todas as migrations via `apply_migration` no projeto `xmoerkvaypdbxtvuqoyo`.

### Migration 1: `create_profiles_table`
- `profiles`: `id uuid PK references auth.users`, `username text unique`, `avatar_url text`, `total_missions_completed int default 0`, `total_operations int default 0`, `badges_earned jsonb default '[]'`, `rank text default 'Recruta'`, `created_at timestamptz`
- Trigger: ao criar user em `auth.users` → cria profile automaticamente
- RLS: autenticado lê qualquer perfil; edita apenas o próprio

### Migration 2: `create_operations_table`
- `operations`: `id uuid PK`, `name text`, `creator_id references profiles`, `duration_days int check(7,14,30)`, `daily_reset_hour int (0-23)`, `status text (inactive/active/completed)`, `invite_code text unique (6 chars)`, `started_at`, `ends_at`, `created_at`
- RLS: somente membros veem; criador edita

### Migration 3: `create_operation_members_table`
- `operation_members`: `operation_id + user_id` unique, `role (creator/member)`, `total_points int default 0`, `joined_at`
- RLS: membros da mesma operação leem; próprio edita

### Migration 4: `create_missions_table`
- `missions`: `category`, `title`, `objective`, `difficulty (easy/medium/hard)`, `points (10/20/30)`
- RLS: qualquer autenticado lê

### Migration 5: `seed_45_missions`
- INSERT das 45 missões exatas do PRD (9 por categoria × 5 categorias)

### Migration 6: `create_daily_mission_pools_table`
- `daily_mission_pools`: `operation_id + day_number` unique, `mission_ids uuid[]`, `created_at`

### Migration 7: `create_assigned_missions_table`
- `assigned_missions`: `operation_id`, `user_id`, `mission_id`, `day_number`, `category_assigned`, `status (available/selected/completed/failed/rejected)`, `photo_url`, `caption`, timestamps

### Migration 8: `create_votes_table`
- `votes`: `assigned_mission_id + voter_id` unique, `vote (approve/reject)`, `created_at`

### Migration 9: `create_reactions_table`
- `reactions`: `assigned_mission_id + user_id + reaction_type` unique, `reaction_type (funny/creative/precise/bold/gross)`

### Migration 10: `create_storage_and_helpers`
- Bucket `mission-photos` com políticas de upload/leitura
- Functions SQL: `generate_invite_code()`, `calculate_rank(int)`, `check_vote_result(uuid)`

---

## Etapa 2 — Setup Next.js + Design System

- `npx create-next-app@latest` com TypeScript, Tailwind, App Router, src/
- Deps: `@supabase/supabase-js`, `@supabase/ssr`, `next-pwa`, `browser-image-compression`, `qrcode.react`, `framer-motion`, `lucide-react`
- `.env.local` com URL e anon key do Supabase (obter via MCP `get_project_url` + `get_publishable_keys`)
- `manifest.json` PWA: `theme_color: #0a0a0a`, `background_color: #0a0a0a`, ícone com silhueta de espião, `display: standalone`

### Design Tokens (`tailwind.config.ts`)

```
Paleta:
  base:        #0a0a0a  — fundo principal (quarto escuro)
  surface:     #111111  — cards/painéis
  elevated:    #1a1a1a  — modais, drawers
  border:      #242424  — divisores sutis
  border-gold: #3d3520  — bordas de elementos ativos/selecionados

  gold:        #c9a227  — ação principal, aprovado, pontos
  gold-dim:    #7a5f16  — gold desativado
  red-dark:    #8b1a1a  — perigo, rejeitado, classified
  red-dim:     #4a0f0f  — vermelho apagado

  ink:         #e8e4d9  — texto principal (papel envelhecido)
  ink-muted:   #6b6660  — texto secundário (tinta desbotada)
  ink-faint:   #3a3632  — texto fantasma (placeholder)

Categorias de missão (fundo / texto / borda):
  Infiltração: #0d1a26 / #4a7ab5 / #1e3a52
  Vigilância:  #0d1f0d / #4a8c4a / #1e3f1e
  Sabotagem:   #1f0d0d / #c94040 / #3f1e1e
  Negociação:  #150d1f / #8a5abf / #2a1e3f
  Extração:    #1f180d / #c9a227 / #3f320e

Dificuldade (pontos coloridos ●●○):
  easy:   #4a8c4a (verde)
  medium: #c9a227 (âmbar)
  hard:   #c94040 (vermelho)

Fontes:
  Special Elite — títulos, labels de status, carimbos, nav
  Inter          — corpo, números, inputs

Base unit: 4px (escala: 4/8/12/16/20/24/32/40/48)
```

### Texturas e Efeitos Globais (`globals.css`)

```css
/* Scanlines sutis — sensação de tela de monitor antigo */
body::after {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
  );
}

/* Grain de papel fotográfico (noise SVG base64 com opacity 0.04) */
.paper-grain { background-image: url("data:image/svg+xml,..."); }

/* Carimbos girados */
.stamp { font-family: 'Special Elite'; letter-spacing: 0.15em; transform: rotate(-2deg); }
.stamp-approved { color: #4a8c4a; border: 2px solid #4a8c4a; }
.stamp-rejected { color: #c94040; border: 2px solid #c94040; }

/* Redacted — loading skeleton temático */
.redacted { background: #242424; color: transparent; border-radius: 2px;
            animation: flicker 3s infinite; user-select: none; }
@keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.7} 95%{opacity:1} }

/* Cursor de máquina de escrever */
.typewriter-cursor::after { content: '▌'; animation: blink 1s step-end infinite; }
@keyframes blink { 50%{opacity:0} }
```

---

## Etapa 3 — Autenticação e Perfil

- `src/lib/supabase/client.ts` (browser) e `server.ts` (SSR)
- `middleware.ts` — refresh sessão + proteção de rotas
- `/auth/callback` — route handler OAuth
- Hook `useUser` — retorna user + profile

### `/login` — Tela de Autenticação

Layout full-screen `#0a0a0a`. Centro vertical com:
- Logo: `S.O.M.B.R.A` em Special Elite, tracking muito largo (`letter-spacing: 0.3em`), tamanho grande, cor `#c9a227`. Abaixo, subtítulo em ink-muted com tamanho pequeno: `"SERVIÇO OPERACIONAL DE MISSÕES BIZARRAS, RIDÍCULAS E ABSURDAMENTE INÚTEIS"` — todo em maiúsculo, quebra em múltiplas linhas, tracking largo.
- Linha separadora: `1px solid #242424` com largura contida.
- Classificação: texto `[CLASSIFICADO]` em `#8b1a1a`, Special Elite, pequeno, centralizado — como carimbo acima do botão.
- Botão Google: fundo `#111111`, borda `1px solid #3d3520`, texto `#e8e4d9`, ícone Google à esquerda. `hover`: borda vira `#c9a227`. Sem rounded excessivo — `border-radius: 2px`.
- Rodapé: `"ACESSO RESTRITO — AGENTES AUTORIZADOS"` em ink-faint, minúsculo.

### `/onboarding` — Escolha de Codinome

Tela `#0a0a0a`. Card central `#111111`, borda `#242424`:
- Header: `"IDENTIFICAÇÃO DO AGENTE"` em Special Elite + `"Escolha seu codinome de operação."` em Inter ink-muted.
- Input: borda `#242424`, `focus: border-color: #c9a227` sem glow/shadow. Placeholder `"ex: agente_fantasma"` em ink-faint. Fonte Inter.
- Botão confirmar: fundo `#c9a227`, texto `#0a0a0a` (contraste máximo), Special Elite. Sem sombra.
- Validação inline: erro em `#c94040`, sem ícones excessivos — apenas texto abaixo do input.

---

## Etapa 4 — Layout e Navegação

- Layout raiz: fontes Google (Special Elite + Inter), `color-scheme: dark`, metadata PWA
- Layout autenticado `(app)/layout.tsx`: `pb-16` para espaço do bottom nav fixo

### BottomNav

Fixo bottom-0, `bg-[#0a0a0a]`, `border-t border-[#242424]`, altura 56px. 4 itens:
```
MISSÃO  |  FEED  |  RANKING  |  AGENTE
```
- Labels: Special Elite, `text-[10px]`, tracking largo, maiúsculo
- Ícones: Lucide, 20px, `stroke-width: 1.5`
- Estado inativo: `#3a3632` (ícone + texto)
- Estado ativo: ícone `#c9a227`, texto `#c9a227`, sem background pill — apenas a cor muda
- Sem border-radius no container do item ativo — flat, como botão de painel de controle

### TopBar

Altura 48px, `bg-[#0a0a0a]`, `border-b border-[#242424]`:
- Esquerda: nome da operação em Special Elite `#e8e4d9`, ou `S.O.M.B.R.A` na home
- Direita: dia atual `DIA 03` em Inter monospace `#6b6660`, ou nada quando irrelevante
- Sem sombra — flat, como cabeçalho de documento

### Primitivos de UI

**Button:**
- Primary: `bg-[#c9a227] text-[#0a0a0a]` Special Elite, `border-radius: 2px`, padding `12px 24px`
- Secondary: `bg-transparent border border-[#242424] text-[#e8e4d9]`, hover `border-[#c9a227]`
- Danger: `bg-transparent border border-[#8b1a1a] text-[#c94040]`
- Disabled: `opacity-40 cursor-not-allowed`
- Sem animação de scale/bounce — feedback apenas via cor

**Card:**
- `bg-[#111111] border border-[#242424]`, `border-radius: 4px`, padding `16px`
- Sem sombra box-shadow — elevação comunicada por borda mais clara
- Card selecionado/ativo: `border-[#3d3520]`

**Badge de dificuldade:** `●●○` (pontos SVG/emoji), cor da dificuldade. Sem texto "Fácil/Médio/Difícil" — só os pontos.

**Badge de patente:** Special Elite, maiúsculo, cor `#c9a227`, sem fundo colorido — apenas texto com ícone de posto militar (SVG customizado por patente).

**Modal:** `bg-[#111111]`, sem rounded grande — `border-radius: 4px`, borda `#242424`. Overlay `bg-black/80`. Animação: `opacity` + `translateY(8px)→0` via Framer Motion.

**Estados de carregamento (Skeleton temático):**
Blocos `redacted` de largura variada em vez de shimmer genérico. Texto placeholder: `████████` em `#242424`.

**Estados de erro:**
Texto `"TRANSMISSÃO INTERROMPIDA"` em Special Elite `#c94040`, subtítulo em Inter descrevendo o erro real. Botão "TENTAR NOVAMENTE".

**Estados vazios:**
Blocos redacted com texto abaixo — `"NENHUMA MISSÃO DISPONÍVEL"` em ink-muted.

### Home (sem operação ativa)

`bg-[#0a0a0a]`, centralizado verticalmente:
- Logo `S.O.M.B.R.A` menor que na login, `#c9a227`
- `"AGUARDANDO ORDENS, AGENTE."` em ink-muted Inter
- Dois botões empilhados: `[CRIAR OPERAÇÃO]` (primary) e `[ENTRAR COM CÓDIGO]` (secondary)

---

## Etapa 5 — Operações (Criar, Entrar, Gerenciar)

- `/operations/create` — form: nome, duração, horário virada
- `/operations/join` — input código
- `/operations/[id]` — tela principal (tabs: Missões, Feed, Ranking)
- `/operations/[id]/lobby` — sala de espera: membros, código, QR, botão iniciar
- `/join/[code]` — rota pública que redireciona para join com código
- API routes: criar operação, entrar (validar 3-5 limite, 1 ativa por user), iniciar (gera pool)

### `/operations/create` — Formulário de Criação

Header: `"NOVA OPERAÇÃO"` em Special Elite grande. Subtítulo `"Configure a missão, agente."` ink-muted.

Campos:
- **Nome:** label `"DESIGNAÇÃO DA OPERAÇÃO"` Special Elite pequeno ink-muted, input fundo `#111111` borda `#242424`
- **Duração:** 3 botões toggle `[ 7 DIAS ] [ 14 DIAS ] [ 30 DIAS ]` — selecionado: borda `#c9a227` texto `#c9a227`; não selecionado: borda `#242424` texto ink-muted. Sem radio circle — o botão inteiro vira o indicador.
- **Virada diária:** label `"HORA DA VIRADA"` + select estilizado ou scroll picker com `00h–23h`. Nota abaixo em ink-faint: `"Missões expiram neste horário."` — tom de briefing.
- CTA: `[CRIAR OPERAÇÃO]` botão primary largura total.

### `/operations/join` — Entrar com Código

Card centralizado. Campo de código: `border-[#242424]`, texto grande Inter monospace uppercase, `letter-spacing: 0.3em` — parece um código de acesso. Botão `[INFILTRAR]` primary.

Erro "operação lotada": mensagem `"OPERAÇÃO COMPLETA — LIMITE DE AGENTES ATINGIDO"` em `#c94040`.

### InviteCard

Card `#111111`, borda `#3d3520`:
- Topo: `"CÓDIGO DE ACESSO"` Special Elite ink-muted pequeno
- Código: `ABC-123` em Special Elite grande `#c9a227`, `letter-spacing: 0.4em`
- QR Code: fundo `#ffffff` padding `8px`, `border-radius: 2px`, tamanho 120x120px — fica contrastado no fundo escuro
- Botões embaixo: `[COPIAR LINK]` e `[COMPARTILHAR]` secondary side-by-side

### `/operations/[id]/lobby` — Sala de Espera

TopBar: nome da operação + `"AGUARDANDO AGENTES"` piscando (typewriter cursor).

**MemberList:**
Lista vertical, cada item: avatar (foto Google, 32px círculo), codinome em Special Elite `#e8e4d9`, role badge `[CRIADOR]` em `#8b1a1a` Special Elite se aplicável. Slots vazios: `████████` redacted com `"AGUARDANDO..."` ink-faint.

Contagem: `"3 / 5 AGENTES"` em Inter monospace ink-muted.

InviteCard abaixo da lista.

Botão `[INICIAR OPERAÇÃO]` — visível apenas para o criador, desabilitado se < 3 membros. Mensagem quando desabilitado: `"Mínimo de 3 agentes necessário."` em ink-faint.

### `/operations/[id]` — Tela Principal (com tabs)

TopBar: nome da operação à esquerda, `"DIA 04"` à direita em Inter monospace `#6b6660`.

Tabs: `MISSÕES | FEED | RANKING` — sem underline animado fancy. Apenas tab ativa com texto `#c9a227`, inativas `#3a3632`. Linha `1px` em `#242424` abaixo. Fonte Special Elite.

---

## Etapa 6 — Sistema de Missões Diárias

- API: GET pool (gera on-demand se não existe para o dia), POST select (transação atômica), POST submit (comprime + upload storage)
- Compressão client-side: `browser-image-compression` (max 800px, quality 0.7)
- Lógica de geração: por membro → sorteia categoria → 3 easy + 3 medium + 3 hard → pool compartilhado + 5 extras

### MissionPool

Lista vertical (não grid — cards precisam de espaço para respirar em mobile). Padding `16px`.

Filtro por dificuldade: 3 chips `[●○○ FÁCIL] [●●○ MÉDIA] [●●● DIFÍCIL]` + `[TODAS]`. Chip ativo: borda `#c9a227`, texto `#c9a227`. Fonte Special Elite pequeno.

Countdown da virada diária: topo da lista, `"VIRADA EM 04:23:11"` em Inter monospace `#6b6660` — sem cor chamativa, apenas informativo.

### MissionCard

Card `#111111`, borda esquerda `4px solid [cor-da-categoria]`, borda restante `1px solid #242424`. Padding `16px`. `border-radius: 2px` (quase quadrado — briefing militar).

```
┌────────────────────────────────────┐
│ ▌ VIGILÂNCIA              ●●○  20pt│  ← categoria + dificuldade + pontos
│                                    │
│  Siga um estranho por 5 minutos    │  ← título Special Elite #e8e4d9
│  sem ser percebido                 │
│                                    │
│  Fotografe o momento exato em que  │  ← objetivo Inter ink-muted pequeno
│  ele perceber que está sendo       │
│  seguido.                          │
│                                    │
│             [ACEITAR MISSÃO]       │  ← botão secondary (não primary)
└────────────────────────────────────┘
```

- Categoria: Special Elite pequeno, cor da categoria, uppercase
- Dificuldade: `●●○` pontos coloridos (verde/âmbar/vermelho), após 2 espaços em branco
- Pontos: Inter monospace `#c9a227` com `"pt"` em ink-muted. Ex: `20pt`
- Título: Special Elite 16px `#e8e4d9`
- Objetivo: Inter 13px `#6b6660`, max 3 linhas antes de truncar com `...`
- Botão aceitar: secondary (bordado), largura ajustada à direita — não ocupa toda a largura do card

Card de missão já selecionada (status `selected`): borda `1px solid #3d3520`, fundo `#0f0e0a` — levemente amarelado/quente para indicar "em andamento".

### ActiveMission

Tela full-screen dedicada após aceitar. TopBar com `← VOLTAR`.

```
┌────────────────────────────────────┐
│ [CLASSIFICADO]                     │  ← carimbo stamp-approved girado
│                                    │
│  SUA MISSÃO                        │  ← Special Elite ink-muted
│  Siga um estranho por 5 minutos    │  ← título grande Special Elite #e8e4d9
│                                    │
│  ──────────────────────────────    │
│  OBJETIVO                          │  ← label Special Elite ink-muted
│  Fotografe o momento exato em que  │  ← Inter #e8e4d9
│  ele perceber que está sendo       │
│  seguido.                          │
│                                    │
│  ●●○  MÉDIA  |  20 PONTOS          │  ← dificuldade + pontos
│                                    │
│  ────────────────────────────────  │
│                                    │
│  [   ÁREA DE EVIDÊNCIA FOTOGRÁFICA  ]│  ← zona de upload
│  [   Toque para fotografar ou      ]│
│  [   selecionar da galeria         ]│
│                                    │
│  [preview da foto se já selecionada]│
│                                    │
│             [SUBMETER EVIDÊNCIA]   │  ← botão primary, habilitado só com foto
└────────────────────────────────────┘
```

Área de upload: borda `2px dashed #3d3520`, fundo `#0f0e0a`, `border-radius: 2px`. Ícone câmera `#3d3520`. Após selecionar foto: preview ocupa toda a área, botão de remoção `✕` no canto superior direito em `#111111/80%`.

Caption: textarea `#111111` borda `#242424`, placeholder `"Descreva sua evidência, agente..."` — opcional, aparece após foto selecionada.

Estado de envio: botão vira `"TRANSMITINDO..."` com typewriter cursor, desabilitado.

---

## Etapa 7 — Feed e Votação

- API vote: registra voto → checa maioria → atualiza status + pontos
- Supabase Realtime subscription em `assigned_missions` e `votes`

### FeedList

Scroll vertical, padding `16px`, gap `12px` entre cards. Sem header de seção — o TopBar já informa o contexto.

Novas submissions chegam via Realtime: banner sutil no topo `"↑ 1 nova evidência"` em `#c9a227` Special Elite — clicar leva ao topo. Não interrompe o scroll atual.

Skeleton enquanto carrega: 3 FeedCards com blocos redacted na proporção exata do card real.

### FeedCard

Card `#111111`, borda `#242424`. Sem `border-radius` excessivo — `2px`.

```
┌────────────────────────────────────┐
│ agente_fantasma    VIGILÂNCIA ●●○  │  ← linha superior
│                                    │
│ ┌──────────────────────────────┐   │
│ │                              │   │
│ │         FOTO 4:3             │   │  ← imagem ocupa largura total do card
│ │                              │   │
│ └──────────────────────────────┘   │
│                                    │
│  "Fotografei o momento exato."     │  ← caption em itálico ink-muted
│                                    │
│  Siga um estranho por 5 minutos    │  ← título da missão Special Elite pequeno
│                                    │
│  ─────────────────────────────     │
│  [✓ APROVAR]  (2)  [✗ REJEITAR]   │  ← botões de voto
└────────────────────────────────────┘
```

- Linha superior: codinome Special Elite `#e8e4d9` + categoria e dificuldade `#6b6660` à direita
- Foto: `object-fit: cover`, aspect-ratio `4/3`, sem rounded. Toque abre lightbox.
- Caption: Inter 13px `#6b6660` itálico
- Título missão: Special Elite 12px `#6b6660`

**Overlay de status na foto** (Framer Motion, após votar majoritariamente):
- APROVADO: carimbo verde `stamp-approved` centralizado com `opacity: 0.85`, rotate `-6deg`, fade-in
- REJEITADO: carimbo vermelho `stamp-rejected`, mesmas propriedades

### VoteButtons

Dois botões full-width, divididos 50/50, dentro do card:
- `[✓ APROVAR]`: ícone check + texto, borda `#242424`, hover `border-[#4a8c4a] text-[#4a8c4a]`
- `[✗ REJEITAR]`: ícone x + texto, borda `#242424`, hover `border-[#c94040] text-[#c94040]`
- Após votar: botão votado fica com borda na cor do voto, o outro fica `opacity-30`
- Na própria missão: ambos desabilitados, texto `"SUA EVIDÊNCIA"` centralizado ink-faint
- Contagem de votos: número entre os botões `(2)` em Inter monospace ink-muted — atualiza em realtime

---

## Etapa 8 — Ranking ao Vivo

- Realtime subscription em `operation_members` para pontos ao vivo

### RankingList

Sem padding excessivo. Lista densa como placar de missão.

Header: `"CLASSIFICAÇÃO"` Special Elite `#6b6660` pequeno + `"AO VIVO"` com ponto piscante `●` em `#4a8c4a`.

Cada linha do ranking:
```
#01  [avatar]  agente_fantasma     SÊNIOR    145pt
#02  [avatar]  operador_zero       AGENTE     98pt
#03  [avatar]  ghost_protocol      AGENTE     72pt
```

- Posição: `#01` Inter monospace `#3a3632` — líder vira `#c9a227`
- Avatar: 32px círculo, sem borda
- Codinome: Special Elite `#e8e4d9`, `font-size: 14px`
- Patente: Special Elite `10px` `#6b6660` uppercase
- Pontos: Inter monospace `#c9a227` alinhado à direita, `"pt"` em `#6b6660`
- Row do usuário atual: fundo `#0f0e0a` (levemente destacado), sem borda especial
- Pontos atualizando via realtime: flash sutil `bg-[#c9a227]/10` no row por 1s (Framer animate)
- Separador entre rows: `1px solid #1a1a1a` — quase invisível

Posição `#01` tem um marcador especial: linha com `border-left: 2px solid #c9a227` ao invés da `#242424` padrão.

---

## Etapa 9 — Perfil Básico

### `/profile`

Sem hero extravagante. Layout de dossiê:

```
┌────────────────────────────────────┐
│  [avatar 56px]                     │
│  agente_fantasma    SÊNIOR         │  ← codinome Special Elite grande + patente
│  ──────────────────────────────    │
│  OPERAÇÕES         MISSÕES    TAXA │
│      07              145      82%  │  ← números Inter monospace #c9a227
│                                    │
│  ──────────────────────────────    │
│  BADGES                            │  ← badges se houver, ou "NENHUM AINDA"
│  [badge1] [badge2]                 │
│                                    │
│  ──────────────────────────────    │
│             [ENCERRAR SESSÃO]      │  ← botão danger
└────────────────────────────────────┘
```

- Avatar: 56px círculo, sem borda dourada excessiva
- Codinome: Special Elite 20px `#e8e4d9`
- Patente: Special Elite 11px `#6b6660` uppercase, mesma linha que codinome
- Stats: label Special Elite 10px `#6b6660` uppercase + número Inter monospace 24px `#c9a227`
- Separadores: `1px solid #1a1a1a`
- Botão logout: danger style, largura auto, alinhado à direita ou centralizado

**→ Fim do MVP (Fase 1)**

---

## Etapa 10 — Notificações Push

- Tabela `push_subscriptions` (migration)
- `src/lib/notifications.ts` — solicitar permissão, registrar subscription
- Edge Function `send-push-notification`
- Notificar: nova missão (virada), submission de outro agente, aprovação/rejeição

---

## Etapa 11 — Reações e Badges (Fase 2)

- API toggle reação
- Lógica badges: no encerramento, quem acumulou mais reações de cada tipo ganha o badge

### ReactionBar

Aparece no FeedCard abaixo dos VoteButtons, separado por `1px solid #1a1a1a`.

5 botões de reação lado a lado:
```
😂 3   🎨 1   🎯 0   😳 5   🤢 2
```
- Cada botão: emoji + contagem Inter monospace `12px` `#6b6660`
- Não reagido: fundo transparente, hover `bg-[#1a1a1a]`
- Reagido: fundo `#1a1a1a`, borda `1px solid #3d3520` — sutil, sem cor chamativa no próprio emoji
- Contagem zero: exibe `0` em `#3a3632` (quase invisível) — mantém layout estável
- Tap em emoji ativo: toggle (remove reação), contagem decrementa em realtime
- Animação ao reagir: emoji faz `scale 1→1.3→1` em 200ms (spring leve)

---

## Etapa 12 — Cerimônia de Encerramento (Fase 2)

- Edge Function cron: operações com `ends_at <= now()` → status completed
- Cleanup: após 7 dias de completed, deletar dados e fotos (outra Edge Function cron)

### `/operations/[id]/ceremony`

Sequência de telas em fullscreen com Framer Motion. Fundo `#0a0a0a`.

**Fase 1 — Abertura:**
Texto `"OPERAÇÃO ENCERRADA"` em Special Elite, digitado letra a letra (typewriter effect, 80ms/letra). Abaixo, nome da operação. Pausa de 1.5s, fade para próxima fase.

**Fase 2 — Ranking Final:**
Slides em sequence, cada agente entra com `slideInFromBottom` (0.3s, spring). Posição `#01` tem o slide maior, cor `#c9a227`. Cada slide: avatar, codinome, pontuação final, patente conquistada.

**Fase 3 — Stats Absurdos:**
Cards aparecendo um por vez com `fadeIn + scaleFrom95`. Cada card tem uma stat engraçada gerada do banco:
- `"agente_fantasma tentou seguir 3 pessoas. 2 perceberam."`
- `"operador_zero submeteu 14 evidências. 11 aprovadas. Incrível."` — tom deadpan
- Fonte Special Elite, fundo `#111111`, borda `#3d3520`.

**Fase 4 — Galeria Top Fotos:**
Grid 2 colunas das 6 fotos mais aprovadas. Cada foto com codinome do agente e título da missão abaixo. Sem borda, sem rounded — fotos brutas.

**Fase 5 — Badges:**
Para quem ganhou badge: carimbo aparece com `rotateFrom(-15deg) + opacity 0→1`, bounce leve. Texto `"[NOME] recebeu [BADGE]"`.

Botão final: `[VOLTAR AO QUARTEL-GENERAL]` → `/` home.

---

## Etapa 13 — Galeria de Favoritos e Stats (Fase 2)

- Migration: tabela `favorite_photos`
- `FavoriteButton` no feed
- `/profile/favorites` — galeria de fotos salvas
- Stats detalhados: missões por categoria, taxa aprovação, média pontos

---

## Etapa 14 — Sistema de Patentes (Fase 2)

- Trigger SQL: ao atualizar `total_missions_completed` → recalcula `rank`

### Visual das Patentes

Faixas e representação visual:
```
RECRUTA      0–10    ○○○○  (4 círculos vazios)    #6b6660
AGENTE      11–30    ●○○○  (1 preenchido)          #4a7ab5
SÊNIOR      31–60    ●●○○  (2 preenchidos)         #4a8c4a
OPERADOR    61–100   ●●●○  (3 preenchidos)         #c9a227
VETERANO   101–200   ●●●●  (4 preenchidos)         #c94040
LENDA       201+     ★★★★  (estrelas douradas)     #c9a227 + glow
```

Cada ícone de posto: 4 pontos/estrelas em SVG inline, `width: 48px`. No perfil aparece grande; no ranking aparece em 16px. Ao subir de patente, modal com animação de "promoção": carimbo `[PROMOVIDO]` + nome da nova patente.

---

## Etapa 15 — Polish e Deploy

- Deploy Vercel (env vars, domínio)
- Teste PWA install Android/iOS

### Loading States (Temáticos)

Nunca usar spinner genérico. Substitutos:
- Carregando lista: blocos `redacted` em proporção dos cards reais
- Carregando foto: retângulo `bg-[#1a1a1a]` `animate-pulse` com proporção 4:3
- Ação de botão: texto muda para `"PROCESSANDO..."` com `.typewriter-cursor`, `disabled`
- Full-page transition: texto `"DESCRIPTOGRAFANDO..."` centralizado, desaparece em 800ms

### Responsividade Mobile (360px–428px)

- Base unit 4px se mantém em todas as larguras
- Fontes: Special Elite não reduz abaixo de 11px; Inter não reduz abaixo de 12px
- Padding lateral: `16px` em 360px, `20px` em 428px
- MissionCard: sem truncagem do objetivo abaixo de 360px — wrap natural
- FeedCard: foto mantém aspect-ratio 4:3 independente de largura
- BottomNav: labels aparecem só em 375px+; em 360px só ícones (gap menor)
- Testar especificamente: iPhone SE (375px), Android pequeno (360px), iPhone 14 (390px)

### Error Boundaries

Componente `<ErrorBoundary>` com UI temática:
```
TRANSMISSÃO INTERROMPIDA
Ocorreu um erro inesperado na operação.
[TENTAR NOVAMENTE]
```
Special Elite `#c94040` para o título. Inter para a descrição.

### Meta Tags OG (Link de Convite)

`/join/[code]`: og:title `"Você foi recrutado para [NOME DA OPERAÇÃO]"`, og:description `"S.O.M.B.R.A — Aceite a missão se for corajoso o suficiente."`, og:image imagem estática com estética de dossiê + logo.

### Checklist de Craft Final (antes de deploy)

- [ ] Todos os textos de erro são temáticos (não genéricos do framework)
- [ ] Nenhum loading usa spinner — todos usam redacted ou typewriter
- [ ] Nenhum rounded maior que `4px` em cards/botões
- [ ] Box-shadows: apenas `rgba(0,0,0,0.5)` em modais, nowhere else
- [ ] Fontes fallback corretas: `'Special Elite', serif` / `'Inter', sans-serif`
- [ ] Cores de texto sempre passam WCAG AA contra o fundo correspondente
- [ ] Animações respeitam `prefers-reduced-motion` (Framer `useReducedMotion`)
- [ ] Bottom nav não sobrepõe conteúdo (padding-bottom correto em todos os scrolls)

---

## Verificação End-to-End

1. Login com Google → criar username → chegar na home
2. Criar operação → copiar código → (em outro browser/aba) entrar com código
3. Iniciar operação → verificar pool de 9 missões gerado
4. Selecionar missão → tirar foto → submeter → verificar no feed
5. Votar (do outro user) → verificar aprovação → pontos no ranking
6. Reagir com emojis → verificar contagem
7. Esperar encerramento (ou forçar via SQL) → verificar cerimônia
8. Verificar patente atualizada no perfil

---

## Notas Importantes

- **MCP Supabase:** Se perder acesso, executar `/mcp` para reautenticar
- **Projeto Supabase ID:** `xmoerkvaypdbxtvuqoyo`
- **45 missões:** Usar apenas as do PRD (`SOMBRA_PRD (1).md` linhas 230-315)
- **Estética:** Spy retro anos 60/70, tons escuros, acentos dourado/amber
- **Tom:** Sério de espião + humor absurdo (ex: "Missão aceita, agente. O relógio está correndo.")
