# PRD — Quiz Claude Code (Verdadeiro ou Falso)

> Documento de requisitos para ser consumido pelo Claude Code na construção do projeto.
> Idioma da interface: **Português (pt-BR)**. Idioma do código (variáveis, funções, commits): **inglês**.

---

## 1. Visão geral

### 1.1 Problema
Muitas pessoas — de líderes de negócio a desenvolvedores experientes — ouvem falar do Claude Code, mas têm uma visão superficial ou equivocada do que ele faz e de como usá-lo bem. Faltam formas rápidas e divertidas de testar e reforçar esse conhecimento.

### 1.2 Solução
Um quiz web de **Verdadeiro ou Falso** sobre Claude Code, com partidas curtas (15 perguntas, ~3 minutos), dificuldade progressiva, timer por pergunta, explicação educativa a cada erro e um **ranking global** persistido no Supabase.

### 1.3 Objetivos de negócio
| Objetivo | Como medir |
|---|---|
| Educar sobre Claude Code de forma leve | % de partidas concluídas (meta: ≥ 70% das iniciadas) |
| Gerar engajamento e recorrência | Partidas por visitante; % que joga mais de 1 vez |
| Criar competição saudável (eventos, comunidades, times) | % de partidas finalizadas que salvam nickname no ranking (meta: ≥ 40%) |
| Identificar lacunas de conhecimento | Taxa de erro por pergunta/categoria (análise futura via dados de `game_sessions`) |

### 1.4 Público-alvo
- **Iniciantes / negócio**: gestores, PMs, curiosos que querem entender o que é o Claude Code.
- **Intermediários**: devs que já usaram o Claude Code e querem conhecer features.
- **Avançados**: usuários frequentes que dominam configuração, hooks, MCP, subagentes e boas práticas.

### 1.5 Fora de escopo (v1)
- Login/contas de usuário (apenas nickname no final).
- Painel administrativo / CMS de perguntas (perguntas ficam em JSON local).
- Multiplayer em tempo real.
- Múltiplos idiomas.
- Rate limiting distribuído e captcha.
- Rankings por período (semanal/mensal) ou por categoria.

---

## 2. Regras do jogo

### 2.1 Estrutura da partida
- **15 perguntas** por partida, todas de Verdadeiro ou Falso.
- **Dificuldade progressiva** em 3 blocos fixos:
  - Perguntas 1–5: **Fácil**
  - Perguntas 6–10: **Médio**
  - Perguntas 11–15: **Difícil**
- Existe **um único modo de jogo** (os níveis de dificuldade são as etapas da progressão), garantindo um ranking único e comparável.
- O nível atual deve ficar visível na tela (ex.: badge "Fácil / Médio / Difícil" + barra de progresso "Pergunta 7 de 15").

### 2.2 Seleção das perguntas
- O banco tem **45 perguntas**: 15 por dificuldade, 15 por categoria (5 por combinação categoria × dificuldade).
- Para cada bloco de dificuldade, o servidor sorteia 5 perguntas daquela dificuldade:
  1. Sorteia 1 pergunta de cada uma das 3 categorias (garante cobertura temática).
  2. Sorteia mais 2 entre as restantes daquela dificuldade (qualquer categoria).
  3. Embaralha a ordem dentro do bloco.
- Não há repetição de perguntas dentro de uma partida.
- O algoritmo deve funcionar para qualquer tamanho de banco ≥ 5 perguntas por dificuldade (para suportar crescimento até 50+ perguntas).

### 2.3 Timer
- Cada pergunta tem **no máximo 10 segundos**.
- O timer é exibido visualmente (contagem regressiva + barra), mudando de cor nos últimos 3 segundos.
- O **servidor é a fonte da verdade** do tempo: ele registra o instante em que a pergunta foi servida (`current_served_at`) e calcula o tempo de resposta.
- Tolerância de rede: o servidor aceita respostas até **10s + 2s de margem** após servir a pergunta. Acima disso, a resposta conta como **tempo esgotado**.
- Ao esgotar o tempo no cliente, ele envia automaticamente uma resposta `null` (timeout).
- Timeout = **erro**, e o tempo registrado para aquela pergunta é 10.000 ms.
- A tela de feedback (após responder) **não** é cronometrada.

### 2.4 Pontuação
- **1 ponto por acerto**. Erro ou timeout = 0 ponto. Pontuação máxima: **15**.
- **Tempo total** (`total_time_ms`) = soma de `min(tempo_de_resposta, 10000)` de todas as 15 perguntas, calculado no servidor.
- **Critério de ordenação do ranking**:
  1. Maior número de acertos (`correct_count DESC`)
  2. Menor tempo total (`total_time_ms ASC`)
  3. Partida salva primeiro (`created_at ASC`)

### 2.5 Feedback por pergunta
- Após responder (ou esgotar o tempo), mostrar imediatamente:
  - **Acerto**: indicação "Correto!" em verde; explicação disponível em um bloco expansível ("Ver explicação").
  - **Erro ou timeout**: indicação "Incorreto" (ou "Tempo esgotado") em vermelho, **a resposta correta** ("A afirmação é VERDADEIRA/FALSA") e **a explicação** sempre visível.
- Botão "Próxima pergunta" (atalho: `Enter`) para avançar. Na última pergunta o botão vira "Ver resultado".

### 2.6 Fim de partida e ranking
- Tela de resultado mostra: acertos (ex.: 11/15), tempo total, desempenho por dificuldade (acertos em Fácil/Médio/Difícil) e por categoria.
- Mensagem de desempenho por faixa:
  - 0–5: "Iniciante — bora explorar a documentação!"
  - 6–10: "Praticante — você já domina o básico."
  - 11–14: "Avançado — mandou bem!"
  - 15: "Mestre do Claude Code!"
- Opção **"Salvar no ranking"** com campo de **nickname** (opcional — o jogador pode apenas ver o ranking ou jogar de novo).
- Regras do nickname:
  - 3 a 16 caracteres após `trim()`.
  - Permitidos: letras (inclusive acentuadas), números, espaço, `_` e `-` (regex: `^[\p{L}\p{N} _-]{3,16}$` com flag `u`).
  - Bloquear lista básica de palavrões (arquivo `src/data/blocked-words.json`, comparação case-insensitive e sem acentos).
  - Nicknames **não são únicos** (é um ranking de partidas, não de jogadores).
  - O nickname é salvo em `localStorage` para pré-preencher na próxima partida.
- Cada partida pode ser salva **apenas uma vez**, e só se estiver finalizada e tiver terminado há menos de 30 minutos.
- Após salvar, mostrar a **posição** obtida e redirecionar/linkar para o ranking com a entrada destacada.

### 2.7 Ranking
- **Global, all-time, top 20** partidas.
- Colunas: posição, nickname, acertos (x/15), tempo total (formato `mm:ss.s`), data.
- Top 3 com destaque visual (ouro/prata/bronze).
- Se a partida recém-salva do jogador estiver fora do top 20, mostrar uma linha extra no final com a posição dele.

---

## 3. Experiência e interface

### 3.1 Identidade visual — "Terminal / dev"
- Tema **escuro** como padrão, inspirado em CLI.
- Paleta sugerida (definir como CSS variables / tokens do Tailwind):
  - Fundo: `#141413` · Superfície: `#1f1e1d` · Borda: `#3a3936`
  - Texto: `#f0eee6` · Texto secundário: `#a3a29c`
  - Destaque (laranja-terracota): `#d97757`
  - Sucesso: `#4ade80` · Erro: `#f87171` · Alerta (timer final): `#fbbf24`
- Tipografia: sans-serif para o corpo (ex.: Inter via `next/font`) e **monoespaçada** para detalhes (timer, progresso, prompt, ranking) — ex.: JetBrains Mono via `next/font`.
- Elementos "de terminal": prompt `>` antes do enunciado, cursor piscante no título da home, cabeçalho tipo janela de terminal nos cards.
- Não usar logotipos ou marca registrada da Anthropic; o projeto é um quiz da comunidade. Incluir no rodapé: "Projeto não oficial. Claude Code é um produto da Anthropic."

### 3.2 Telas
| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Home | Título, descrição curta, regras resumidas (15 perguntas, 10s cada, progressivo), botões "Começar" e "Ver ranking", prévia do top 5. |
| `/play` | Partida | Pergunta, badge de dificuldade e categoria, progresso, timer, botões **Verdadeiro** / **Falso**, feedback pós-resposta. |
| `/play` (estado final) | Resultado | Placar, tempo, breakdown, formulário de nickname, botões "Jogar de novo" e "Ver ranking". |
| `/ranking` | Ranking | Top 20, destaque da partida do jogador (via query `?highlight=<scoreId>`). |

A partida e o resultado podem ser a mesma rota com uma máquina de estados no cliente: `idle → loading → question → feedback → … → finished → saved`.

### 3.3 Interação e acessibilidade
- Atalhos de teclado: `V` ou `←` = Verdadeiro; `F` ou `→` = Falso; `Enter` = próxima.
- Botões grandes, área de toque ≥ 44px; layout responsivo mobile-first (funcionar bem em 360px de largura).
- Timer com `aria-live="polite"` anunciando apenas marcos (5s e 3s restantes) para não poluir leitores de tela.
- Feedback de acerto/erro não depende só de cor (ícone + texto).
- Respeitar `prefers-reduced-motion` (desligar animações não essenciais).
- Desabilitar os botões de resposta enquanto a requisição está em andamento (evitar duplo clique).
- Se o jogador sair/recarregar no meio da partida, a partida é perdida (v1). Avisar com `beforeunload` durante uma pergunta ativa.

---

## 4. Arquitetura técnica

### 4.1 Stack
- **Next.js** (versão estável mais recente, **App Router**) com **TypeScript** em modo `strict`.
- **Tailwind CSS** para estilos.
- **Supabase** (Postgres) para sessões de jogo e ranking, acessado com `@supabase/supabase-js` **somente no servidor**.
- **Zod** para validar payloads das API routes.
- **Vitest** para testes unitários; **Playwright** para um teste E2E do fluxo principal.
- **Deploy**: Vercel (app) + Supabase (banco).
- Gerenciador de pacotes: npm.

### 4.2 Princípio central: o servidor é a autoridade
- O arquivo de perguntas com respostas (`src/data/questions.json`) é importado **apenas em código de servidor** (route handlers e módulos em `src/server/`). Usar `import "server-only"` nesses módulos.
- O cliente **nunca** recebe `answer` nem `explanation` antes de responder.
- Pontos e tempo são calculados no servidor a partir dos timestamps registrados no banco. O cliente nunca envia score.

### 4.3 Fluxo de uma partida
```
Cliente                                   Servidor (Route Handlers)                 Supabase
  | POST /api/game/start  ------------->  sorteia 15 ids, cria sessão  ---------->  insert game_sessions
  |  <-- { sessionId, total: 15 }
  | POST /api/game/next   ------------->  marca current_served_at = now() ------>  update
  |  <-- { index, question (sem resposta), timeLimitMs: 10000 }
  | POST /api/game/answer ------------->  valida índice/tempo, corrige,  -------->  update (condicional)
  |      { sessionId, index, answer }     acumula correct_count e total_time_ms
  |  <-- { correct, correctAnswer, explanation, timedOut, isLast }
  |   ... repete next/answer até a 15ª ...
  |  (na última resposta status = 'finished')
  | GET  /api/game/result?sessionId ---->  resumo da partida
  | POST /api/ranking     ------------->  valida nickname, insere score -------->  insert scores
  |      { sessionId, nickname }
  |  <-- { scoreId, position }
  | GET  /api/ranking     ------------->  top 20  <------------------------------  select
```

### 4.4 API (Route Handlers em `src/app/api/...`)
Todas as respostas em JSON. Erros no formato `{ error: { code: string, message: string } }` com status HTTP adequado.

**`POST /api/game/start`**
- Body: vazio.
- Ação: sorteia as perguntas (seção 2.2), cria `game_sessions` com `status = 'in_progress'`.
- Resposta `201`: `{ sessionId: string, totalQuestions: 15, timeLimitMs: 10000 }`.

**`POST /api/game/next`**
- Body: `{ sessionId: uuid }`.
- Pré-condições: sessão `in_progress`, `current_served_at IS NULL` (a pergunta anterior já foi respondida), sessão criada há < 30 min.
- Ação: grava `current_served_at = now()`.
- Resposta `200`: `{ index: number (0–14), difficulty, category, statement, timeLimitMs: 10000 }`.
- Se a pergunta atual já foi servida e não respondida (ex.: chamada duplicada), retornar a mesma pergunta **sem** reiniciar o timer.

**`POST /api/game/answer`**
- Body: `{ sessionId: uuid, index: number, answer: boolean | null }` (`null` = timeout do cliente).
- Validações: `index === current_index`, `current_served_at IS NOT NULL`, sessão `in_progress`.
- Cálculo:
  - `elapsed = now() - current_served_at`
  - `timedOut = answer === null || elapsed > 12000`
  - `correct = !timedOut && answer === question.answer`
  - `timeMs = timedOut ? 10000 : min(elapsed, 10000)`
- Atualização **condicional** (`WHERE id = $1 AND current_index = $index AND status = 'in_progress'`) para evitar respostas duplicadas em corrida: incrementa `current_index`, zera `current_served_at`, soma `correct_count` e `total_time_ms`, adiciona item em `answers` (`{ questionId, answer, correct, timeMs, timedOut }`). Se for a 15ª, `status = 'finished'` e `finished_at = now()`.
- Resposta `200`: `{ correct, timedOut, correctAnswer: boolean, explanation: string, isLast: boolean }`.
- Se a atualização condicional não afetar linhas → `409 ALREADY_ANSWERED`.

**`GET /api/game/result?sessionId=...`**
- Requer `status IN ('finished','saved')`.
- Resposta: `{ correctCount, totalTimeMs, byDifficulty: {facil, medio, dificil}, byCategory: {...}, saved: boolean }`.

**`POST /api/ranking`**
- Body: `{ sessionId: uuid, nickname: string }`.
- Validações: nickname (seção 2.6), sessão `finished` (não `saved`), `finished_at` há < 30 min.
- Ação: insere em `scores` copiando `correct_count` e `total_time_ms` **da sessão** e marca a sessão como `saved` (idealmente numa função SQL/RPC transacional; `scores.session_id` é `UNIQUE` como garantia final).
- Resposta `201`: `{ scoreId, position }` onde `position` = número de scores estritamente melhores + 1, pela ordenação da seção 2.4.

**`GET /api/ranking?highlight=<scoreId>`**
- Resposta: `{ top: ScoreRow[20], highlighted?: ScoreRow & { position } }`.
- Cache: `revalidate` curto (ex.: 30s) ou `no-store`; após salvar, chamar `revalidatePath('/ranking')`.

### 4.5 Modelo de dados (Supabase / Postgres)
Criar como migration SQL em `supabase/migrations/0001_init.sql`.

```sql
create extension if not exists pgcrypto;

create table public.game_sessions (
  id                uuid primary key default gen_random_uuid(),
  question_ids      text[]      not null,
  current_index     smallint    not null default 0 check (current_index between 0 and 15),
  current_served_at timestamptz,
  answers           jsonb       not null default '[]'::jsonb,
  correct_count     smallint    not null default 0 check (correct_count between 0 and 15),
  total_time_ms     integer     not null default 0 check (total_time_ms >= 0),
  status            text        not null default 'in_progress'
                    check (status in ('in_progress', 'finished', 'saved')),
  created_at        timestamptz not null default now(),
  finished_at       timestamptz
);

create table public.scores (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid        not null unique references public.game_sessions(id) on delete cascade,
  nickname      text        not null check (char_length(nickname) between 3 and 16),
  correct_count smallint    not null check (correct_count between 0 and 15),
  total_time_ms integer     not null check (total_time_ms between 0 and 150000),
  created_at    timestamptz not null default now()
);

create index scores_ranking_idx
  on public.scores (correct_count desc, total_time_ms asc, created_at asc);

-- Acesso somente via service role (API routes). Sem policies = anon/authenticated negados.
alter table public.game_sessions enable row level security;
alter table public.scores        enable row level security;
```

- Recomendado: função `save_score(p_session_id uuid, p_nickname text)` em PL/pgSQL que valida o status, insere o score e atualiza a sessão em uma única transação.
- Limpeza (opcional, v1.1): job/cron no Supabase removendo `game_sessions` não salvas com mais de 7 dias.

### 4.6 Variáveis de ambiente
| Variável | Onde | Observação |
|---|---|---|
| `SUPABASE_URL` | Servidor | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | **Nunca** prefixar com `NEXT_PUBLIC_`; nunca importar em componente cliente |

- Fornecer `.env.example` com as chaves vazias. `.env*.local` no `.gitignore`.
- Validar as variáveis com Zod na inicialização do módulo `src/server/env.ts`.

### 4.7 Estrutura de pastas sugerida
```
.
├── prd.md
├── CLAUDE.md                      # gerar com /init após o scaffold
├── .env.example
├── supabase/
│   └── migrations/0001_init.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Home
│   │   ├── play/page.tsx          # Partida + resultado
│   │   ├── ranking/page.tsx       # Ranking (Server Component)
│   │   └── api/
│   │       ├── game/start/route.ts
│   │       ├── game/next/route.ts
│   │       ├── game/answer/route.ts
│   │       ├── game/result/route.ts
│   │       └── ranking/route.ts
│   ├── components/                # QuestionCard, Timer, AnswerButtons, Feedback, ResultSummary, NicknameForm, RankingTable, TerminalWindow
│   ├── hooks/                     # useCountdown, useGameMachine, useKeyboardShortcuts
│   ├── lib/                       # código compartilhado SEM segredos: types, constants, formatTime, nickname validation
│   ├── server/                    # "server-only": env, supabase client, questions repo, selectQuestions, scoring, game service
│   └── data/
│       ├── questions.json         # banco de perguntas (somente servidor)
│       └── blocked-words.json
└── tests/
    ├── unit/                      # Vitest
    └── e2e/                       # Playwright
```

### 4.8 Tipos principais
```ts
export type Category = "fundamentos" | "features" | "boas-praticas";
export type Difficulty = "facil" | "medio" | "dificil";

export interface Question {
  id: string;            // ex.: "fund-facil-01"
  category: Category;
  difficulty: Difficulty;
  statement: string;     // afirmação a ser julgada
  answer: boolean;       // true = Verdadeiro
  explanation: string;   // 1–3 frases, mostrada ao errar
}

export type PublicQuestion = Omit<Question, "answer" | "explanation"> & { index: number };
```

Rótulos de exibição: `fundamentos` → "Fundamentos do Claude Code", `features` → "Features e Produtividade", `boas-praticas` → "Boas Práticas"; `facil/medio/dificil` → "Fácil/Médio/Difícil".

Validar `questions.json` com Zod em um teste unitário (ids únicos, ≥ 5 perguntas por dificuldade, todas as categorias presentes em cada dificuldade, `explanation` não vazia).

### 4.9 Constantes
```ts
export const QUESTIONS_PER_GAME = 15;
export const QUESTIONS_PER_DIFFICULTY = 5;
export const TIME_LIMIT_MS = 10_000;
export const NETWORK_GRACE_MS = 2_000;
export const SESSION_TTL_MS = 30 * 60_000;
export const RANKING_SIZE = 20;
export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 16;
```

### 4.10 Segurança e integridade
- Respostas e explicações nunca chegam ao bundle do cliente (verificar com `next build` + busca por um trecho de explicação no `.next/static`).
- Score calculado só no servidor; tempo medido com timestamps do servidor.
- Atualizações condicionais impedem responder duas vezes a mesma pergunta.
- `session_id UNIQUE` em `scores` impede salvar a mesma partida duas vezes.
- Validação de todos os inputs com Zod; nickname sanitizado (React já escapa a renderização).
- Chave service role apenas em variáveis de ambiente do servidor na Vercel.
- Risco aceito na v1: um bot pode jogar via API respondendo rápido; mitigação futura com rate limit por IP (ex.: Upstash) e/ou Turnstile.

### 4.11 Testes
**Unitários (Vitest)** — obrigatórios:
- `selectQuestions`: retorna 15 ids únicos; 5 por dificuldade na ordem fácil → médio → difícil; cada bloco contém as 3 categorias; aleatoriedade injetável (passar função `random` para testes determinísticos).
- `scoreAnswer`: acerto, erro, timeout por `null`, timeout por atraso > 12s, limite de 10.000 ms.
- `validateNickname`: limites de tamanho, caracteres inválidos, palavras bloqueadas, `trim`.
- `formatTime`: ex.: `83450 ms → "01:23.4"`.
- Schema de `questions.json`.

**E2E (Playwright)** — fluxo feliz: iniciar partida, responder as 15 perguntas, ver resultado, salvar nickname, ver a entrada destacada no ranking. Usar um projeto Supabase de teste (ou local via Supabase CLI).

### 4.12 Deploy
1. Criar projeto no Supabase e aplicar `supabase/migrations/0001_init.sql` (SQL Editor ou `supabase db push`).
2. Importar o repositório na Vercel (framework: Next.js).
3. Configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nos ambientes Production e Preview.
4. Garantir que a região das funções da Vercel seja próxima à região do Supabase (latência afeta a medição de tempo).
5. Smoke test em produção: jogar uma partida completa e salvar no ranking.

---

## 5. Plano de implementação (ordem sugerida para o Claude Code)
1. **Scaffold**: `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/`), Vitest, Zod, supabase-js, `server-only`. Tokens de tema e fontes.
2. **Conteúdo**: criar `src/data/questions.json` a partir do Apêndice A + tipos + teste de schema.
3. **Lógica pura**: `selectQuestions`, `scoreAnswer`, `validateNickname`, `formatTime` com testes.
4. **Banco**: migration SQL, função `save_score`, cliente Supabase server-only, `env.ts`.
5. **API**: route handlers da seção 4.4 com validação Zod e tratamento de erros.
6. **UI da partida**: máquina de estados, Timer, QuestionCard, AnswerButtons, Feedback, atalhos de teclado.
7. **Resultado + ranking**: ResultSummary, NicknameForm, página `/ranking`, destaque e posição.
8. **Home** com prévia do top 5.
9. **Polimento**: responsividade, acessibilidade, estados de loading/erro, `beforeunload`.
10. **E2E + deploy** na Vercel.

Cada etapa deve terminar com `npm run lint`, `npm run test` e `npm run build` passando.

## 6. Critérios de aceite
- [ ] Uma partida tem exatamente 15 perguntas, 5 fáceis → 5 médias → 5 difíceis, sem repetição, cobrindo as 3 categorias em cada bloco.
- [ ] Cada pergunta tem timer de 10s; ao zerar, conta como erro e mostra resposta correta e explicação.
- [ ] Em todo erro, a tela mostra a resposta correta e a explicação.
- [ ] A pontuação é 1 ponto por acerto, calculada no servidor; o tempo total é medido no servidor.
- [ ] O bundle do cliente não contém respostas nem explicações.
- [ ] Ao final, é possível salvar o resultado com nickname válido; a mesma partida não pode ser salva duas vezes.
- [ ] O ranking mostra o top 20 global ordenado por acertos ↓, tempo ↑, data ↑, e destaca a partida do jogador.
- [ ] Os dados do ranking persistem no Supabase e sobrevivem a novos deploys.
- [ ] Funciona em mobile (360px) e desktop; jogável só com teclado.
- [ ] Aplicação publicada na Vercel conectada ao Supabase.

## 7. Evoluções futuras (backlog)
- Rate limiting por IP e Cloudflare Turnstile antes de salvar no ranking.
- Ranking semanal e por categoria.
- Compartilhar resultado (imagem OG dinâmica com `next/og`).
- Painel de analytics com taxa de erro por pergunta.
- Ampliar o banco para 100+ perguntas e modo "treino" por categoria (sem ranking).
- Link para a documentação oficial em cada explicação.

---

## Apêndice A — Banco de perguntas (45)

Distribuição: 3 categorias × 3 dificuldades × 5 perguntas. 26 verdadeiras / 19 falsas.

> ⚠️ O Claude Code evolui rápido. Antes de publicar, revisar cada afirmação contra a documentação oficial atual do Claude Code e ajustar o que tiver mudado.

Converter para `src/data/questions.json` exatamente com os campos abaixo.

```json
[
  {
    "id": "fund-facil-01",
    "category": "fundamentos",
    "difficulty": "facil",
    "statement": "O Claude Code é uma ferramenta de programação agêntica da Anthropic que pode ser usada diretamente no terminal.",
    "answer": true,
    "explanation": "O Claude Code nasceu como uma ferramenta de linha de comando: você conversa com ele no terminal e ele atua no seu projeto lendo arquivos, editando código e rodando comandos."
  },
  {
    "id": "fund-facil-02",
    "category": "fundamentos",
    "difficulty": "facil",
    "statement": "O Claude Code só funciona com projetos escritos em JavaScript ou TypeScript.",
    "answer": false,
    "explanation": "O Claude Code é agnóstico de linguagem: funciona com Python, Java, Go, Rust, C#, PHP e praticamente qualquer base de código baseada em texto."
  },
  {
    "id": "fund-facil-03",
    "category": "fundamentos",
    "difficulty": "facil",
    "statement": "O Claude Code consegue ler arquivos, editar código e executar comandos no terminal do seu projeto.",
    "answer": true,
    "explanation": "Essa é a essência de um agente de código: ele usa ferramentas para explorar o repositório, alterar arquivos e executar comandos como testes e builds."
  },
  {
    "id": "fund-facil-04",
    "category": "fundamentos",
    "difficulty": "facil",
    "statement": "Para usar o Claude Code é obrigatório abandonar sua IDE e trabalhar exclusivamente pelo terminal.",
    "answer": false,
    "explanation": "Além do terminal, o Claude Code tem integrações com IDEs como VS Code e JetBrains, além de app desktop e versão web."
  },
  {
    "id": "fund-facil-05",
    "category": "fundamentos",
    "difficulty": "facil",
    "statement": "Por padrão, o Claude Code pede sua permissão antes de editar arquivos ou executar comandos de shell.",
    "answer": true,
    "explanation": "O modo de permissão padrão é conservador: ações que alteram o sistema exigem aprovação, e você pode liberar ações específicas conforme ganha confiança."
  },
  {
    "id": "fund-medio-01",
    "category": "fundamentos",
    "difficulty": "medio",
    "statement": "O arquivo CLAUDE.md é carregado automaticamente no contexto e serve para dar instruções e informações persistentes sobre o projeto.",
    "answer": true,
    "explanation": "O CLAUDE.md funciona como a memória do projeto: comandos de build, convenções de código e regras do time ficam ali e são lidos no início de cada sessão."
  },
  {
    "id": "fund-medio-02",
    "category": "fundamentos",
    "difficulty": "medio",
    "statement": "O Claude Code só pode ser usado com chave de API cobrada por uso; assinaturas como Claude Pro ou Max não dão acesso a ele.",
    "answer": false,
    "explanation": "O Claude Code pode ser usado tanto com assinaturas do Claude (como Pro e Max, além de planos de equipe) quanto com cobrança por uso via API."
  },
  {
    "id": "fund-medio-03",
    "category": "fundamentos",
    "difficulty": "medio",
    "statement": "O comando /init analisa o código e gera um arquivo CLAUDE.md inicial para o projeto.",
    "answer": true,
    "explanation": "O /init é o atalho para começar: o Claude explora o repositório e escreve um CLAUDE.md com a estrutura, comandos e convenções que encontrou."
  },
  {
    "id": "fund-medio-04",
    "category": "fundamentos",
    "difficulty": "medio",
    "statement": "A janela de contexto do Claude Code é ilimitada, então o tamanho da conversa nunca afeta a sessão.",
    "answer": false,
    "explanation": "O contexto é finito. Conversas longas consomem espaço e podem degradar o foco; por isso existem recursos como /compact, /clear e a compactação automática."
  },
  {
    "id": "fund-medio-05",
    "category": "fundamentos",
    "difficulty": "medio",
    "statement": "Executar `claude --continue` (ou `claude -c`) retoma a conversa mais recente.",
    "answer": true,
    "explanation": "O --continue retoma a última sessão do diretório atual, e o --resume permite escolher qual sessão anterior retomar."
  },
  {
    "id": "fund-dificil-01",
    "category": "fundamentos",
    "difficulty": "dificil",
    "statement": "Configurações do usuário (~/.claude/settings.json) têm precedência sobre as configurações do projeto (.claude/settings.json).",
    "answer": false,
    "explanation": "É o contrário: configurações mais específicas vencem. A ordem vai de políticas gerenciadas pela empresa, passando por argumentos de linha de comando, settings local e compartilhado do projeto, até o settings do usuário."
  },
  {
    "id": "fund-dificil-02",
    "category": "fundamentos",
    "difficulty": "dificil",
    "statement": "Nas regras de permissão, uma regra de deny prevalece sobre uma regra de allow que cubra a mesma ação.",
    "answer": true,
    "explanation": "Regras de negação são avaliadas antes das de permissão. Isso permite liberar um conjunto amplo de comandos e ainda bloquear casos específicos."
  },
  {
    "id": "fund-dificil-03",
    "category": "fundamentos",
    "difficulty": "dificil",
    "statement": "O arquivo .claude/settings.local.json é destinado a preferências pessoais e não deve ser versionado no Git.",
    "answer": true,
    "explanation": "O settings.local.json guarda ajustes individuais naquele projeto; o Claude Code o configura para ser ignorado pelo Git. O que é do time vai em .claude/settings.json."
  },
  {
    "id": "fund-dificil-04",
    "category": "fundamentos",
    "difficulty": "dificil",
    "statement": "Todos os arquivos CLAUDE.md em subdiretórios do projeto são carregados integralmente ao iniciar a sessão, não importa onde o Claude esteja trabalhando.",
    "answer": false,
    "explanation": "Os CLAUDE.md acima do diretório atual são carregados na inicialização; os de subdiretórios são incluídos sob demanda, quando o Claude passa a trabalhar com arquivos daquela pasta."
  },
  {
    "id": "fund-dificil-05",
    "category": "fundamentos",
    "difficulty": "dificil",
    "statement": "Um CLAUDE.md pode importar o conteúdo de outros arquivos usando a sintaxe @caminho/do/arquivo.",
    "answer": true,
    "explanation": "Importações com @ permitem manter o CLAUDE.md enxuto e reaproveitar documentos existentes, como um README ou um guia de estilo."
  },

  {
    "id": "feat-facil-01",
    "category": "features",
    "difficulty": "facil",
    "statement": "No prompt do Claude Code é possível referenciar um arquivo digitando @ seguido do caminho.",
    "answer": true,
    "explanation": "Mencionar arquivos com @ coloca o conteúdo diretamente no contexto e evita que o Claude precise procurá-los."
  },
  {
    "id": "feat-facil-02",
    "category": "features",
    "difficulty": "facil",
    "statement": "O comando /clear apaga os arquivos do seu projeto.",
    "answer": false,
    "explanation": "O /clear limpa apenas o histórico da conversa, começando um contexto novo. Seus arquivos não são afetados."
  },
  {
    "id": "feat-facil-03",
    "category": "features",
    "difficulty": "facil",
    "statement": "Pressionar Esc interrompe o Claude durante uma tarefa sem perder o histórico da conversa.",
    "answer": true,
    "explanation": "O Esc para o trabalho em andamento para que você corrija o rumo; a conversa continua de onde parou."
  },
  {
    "id": "feat-facil-04",
    "category": "features",
    "difficulty": "facil",
    "statement": "O Claude Code só consegue trabalhar em um arquivo por vez.",
    "answer": false,
    "explanation": "O Claude Code faz mudanças coordenadas em vários arquivos, como renomear uma função em todo o projeto ou implementar uma feature de ponta a ponta."
  },
  {
    "id": "feat-facil-05",
    "category": "features",
    "difficulty": "facil",
    "statement": "É possível colar ou arrastar uma imagem, como um screenshot ou mockup, para o prompt do Claude Code.",
    "answer": true,
    "explanation": "O Claude entende imagens: você pode enviar prints de erros ou designs para ele analisar e implementar."
  },
  {
    "id": "feat-medio-01",
    "category": "features",
    "difficulty": "medio",
    "statement": "O comando /compact resume a conversa atual para liberar espaço no contexto, mantendo as informações principais.",
    "answer": true,
    "explanation": "O /compact substitui o histórico por um resumo. Você pode até passar instruções sobre o que priorizar no resumo."
  },
  {
    "id": "feat-medio-02",
    "category": "features",
    "difficulty": "medio",
    "statement": "No Plan Mode, o Claude já aplica as alterações nos arquivos enquanto monta o plano.",
    "answer": false,
    "explanation": "No Plan Mode o Claude apenas lê e analisa o código para propor um plano; nada é modificado até você aprovar e sair desse modo."
  },
  {
    "id": "feat-medio-03",
    "category": "features",
    "difficulty": "medio",
    "statement": "Comandos de barra personalizados só podem ser criados por meio de plugins pagos.",
    "answer": false,
    "explanation": "Você pode criar comandos e skills próprios com arquivos Markdown dentro da pasta .claude do projeto ou do usuário, sem custo extra."
  },
  {
    "id": "feat-medio-04",
    "category": "features",
    "difficulty": "medio",
    "statement": "O MCP (Model Context Protocol) permite conectar o Claude Code a ferramentas e fontes de dados externas, como bancos de dados e issue trackers.",
    "answer": true,
    "explanation": "O MCP é um protocolo aberto; ao adicionar um servidor MCP, o Claude ganha novas ferramentas para consultar e agir em sistemas externos."
  },
  {
    "id": "feat-medio-05",
    "category": "features",
    "difficulty": "medio",
    "statement": "O comando `claude -p \"sua pergunta\"` executa uma consulta de forma não interativa e imprime a resposta, o que é útil em scripts e CI.",
    "answer": true,
    "explanation": "O modo print (-p) é o modo headless: roda sem interface interativa e encerra ao terminar, ideal para automações e pipelines."
  },
  {
    "id": "feat-dificil-01",
    "category": "features",
    "difficulty": "dificil",
    "statement": "Um hook PreToolUse que termina com código de saída 2 bloqueia a chamada da ferramenta e devolve o stderr como feedback ao Claude.",
    "answer": true,
    "explanation": "O código 2 sinaliza bloqueio: a ferramenta não é executada e a mensagem em stderr é mostrada ao Claude para que ele ajuste o que está fazendo."
  },
  {
    "id": "feat-dificil-02",
    "category": "features",
    "difficulty": "dificil",
    "statement": "Subagentes compartilham a mesma janela de contexto da conversa principal.",
    "answer": false,
    "explanation": "Cada subagente roda com seu próprio contexto e devolve só o resultado à conversa principal, o que ajuda a manter o contexto principal limpo."
  },
  {
    "id": "feat-dificil-03",
    "category": "features",
    "difficulty": "dificil",
    "statement": "Servidores MCP com escopo de projeto ficam registrados no arquivo .mcp.json na raiz do repositório, que pode ser versionado para o time.",
    "answer": true,
    "explanation": "O escopo de projeto grava a configuração em .mcp.json, permitindo que todo o time use os mesmos servidores MCP (o Claude Code pede aprovação antes de usá-los)."
  },
  {
    "id": "feat-dificil-04",
    "category": "features",
    "difficulty": "dificil",
    "statement": "Os checkpoints do Claude Code permitem desfazer qualquer alteração, inclusive arquivos apagados por comandos bash como rm.",
    "answer": false,
    "explanation": "Os checkpoints rastreiam as edições feitas pelas ferramentas de edição do Claude. Mudanças feitas por comandos bash não são cobertas; para isso, conte com o Git."
  },
  {
    "id": "feat-dificil-05",
    "category": "features",
    "difficulty": "dificil",
    "statement": "No modo não interativo, a opção `--output-format json` permite obter a resposta do Claude em formato estruturado.",
    "answer": true,
    "explanation": "Com -p, os formatos text, json e stream-json facilitam integrar o Claude Code a scripts e outras ferramentas."
  },

  {
    "id": "bp-facil-01",
    "category": "boas-praticas",
    "difficulty": "facil",
    "statement": "Ser específico no prompt (quais arquivos, comportamento esperado, restrições) tende a gerar resultados melhores do que pedidos vagos.",
    "answer": true,
    "explanation": "Quanto mais contexto e critérios claros, menos o Claude precisa adivinhar, e menos idas e vindas são necessárias."
  },
  {
    "id": "bp-facil-02",
    "category": "boas-praticas",
    "difficulty": "facil",
    "statement": "Como o Claude Code é muito capaz, não é necessário revisar as alterações antes de fazer commit.",
    "answer": false,
    "explanation": "Você continua responsável pelo código. Revisar diffs, rodar testes e entender as mudanças é parte essencial do fluxo."
  },
  {
    "id": "bp-facil-03",
    "category": "boas-praticas",
    "difficulty": "facil",
    "statement": "É uma boa prática colocar senhas e chaves de API no CLAUDE.md para que o Claude possa usá-las.",
    "answer": false,
    "explanation": "O CLAUDE.md costuma ser versionado e compartilhado. Segredos devem ficar em variáveis de ambiente ou gerenciadores de segredos, nunca nele."
  },
  {
    "id": "bp-facil-04",
    "category": "boas-praticas",
    "difficulty": "facil",
    "statement": "Usar /clear ao mudar para uma tarefa não relacionada ajuda a manter o contexto limpo e focado.",
    "answer": true,
    "explanation": "Contexto acumulado de outra tarefa pode distrair o Claude e gastar espaço; começar limpo costuma dar respostas melhores."
  },
  {
    "id": "bp-facil-05",
    "category": "boas-praticas",
    "difficulty": "facil",
    "statement": "Usar Git junto com o Claude Code facilita revisar e reverter mudanças.",
    "answer": true,
    "explanation": "Commits frequentes criam pontos seguros de retorno e deixam claro o que o Claude alterou em cada etapa."
  },
  {
    "id": "bp-medio-01",
    "category": "boas-praticas",
    "difficulty": "medio",
    "statement": "Um fluxo recomendado para tarefas complexas é: explorar o código, planejar, implementar e então commitar.",
    "answer": true,
    "explanation": "Separar exploração e planejamento da implementação evita que o Claude parta direto para o código sem entender o problema."
  },
  {
    "id": "bp-medio-02",
    "category": "boas-praticas",
    "difficulty": "medio",
    "statement": "Quanto maior o CLAUDE.md, melhor: o ideal é colar nele toda a documentação do projeto.",
    "answer": false,
    "explanation": "O CLAUDE.md é carregado em toda sessão e consome contexto. Ele deve ser conciso, com o que realmente importa; detalhes podem ficar em arquivos referenciados."
  },
  {
    "id": "bp-medio-03",
    "category": "boas-praticas",
    "difficulty": "medio",
    "statement": "Dar ao Claude uma forma de verificar o próprio trabalho, como testes ou screenshots, melhora a qualidade dos resultados.",
    "answer": true,
    "explanation": "Com um critério verificável, o Claude consegue iterar sozinho até acertar, em vez de entregar algo que apenas parece correto."
  },
  {
    "id": "bp-medio-04",
    "category": "boas-praticas",
    "difficulty": "medio",
    "statement": "Manter uma única sessão longa para todas as tarefas do dia costuma melhorar o desempenho do Claude.",
    "answer": false,
    "explanation": "Sessões longas acumulam contexto irrelevante. Sessões focadas por tarefa, com /clear entre elas, tendem a funcionar melhor."
  },
  {
    "id": "bp-medio-05",
    "category": "boas-praticas",
    "difficulty": "medio",
    "statement": "Em TDD com o Claude, uma boa prática é escrever os testes primeiro, confirmar que falham e então pedir a implementação sem alterar os testes.",
    "answer": true,
    "explanation": "Testes como alvo fixo dão ao Claude um critério objetivo de sucesso e impedem que ele 'ajuste' os testes para passar."
  },
  {
    "id": "bp-dificil-01",
    "category": "boas-praticas",
    "difficulty": "dificil",
    "statement": "Usar `--dangerously-skip-permissions` no dia a dia, na sua máquina principal, é recomendado para ganhar velocidade.",
    "answer": false,
    "explanation": "Pular todas as permissões só é recomendado em ambientes isolados, como containers sem acesso a dados sensíveis. Na máquina principal, prefira regras de allow específicas."
  },
  {
    "id": "bp-dificil-02",
    "category": "boas-praticas",
    "difficulty": "dificil",
    "statement": "Git worktrees permitem rodar várias sessões do Claude Code em paralelo, em branches diferentes, sem que uma sobrescreva os arquivos da outra.",
    "answer": true,
    "explanation": "Cada worktree é um diretório de trabalho separado do mesmo repositório, então cada sessão edita sua própria cópia dos arquivos."
  },
  {
    "id": "bp-dificil-03",
    "category": "boas-praticas",
    "difficulty": "dificil",
    "statement": "Hooks são executados com as permissões do seu usuário, por isso é importante revisar hooks de terceiros antes de habilitá-los.",
    "answer": true,
    "explanation": "Um hook é um comando de shell rodando automaticamente na sua máquina; um hook malicioso ou mal escrito pode ler ou alterar qualquer coisa a que você tenha acesso."
  },
  {
    "id": "bp-dificil-04",
    "category": "boas-praticas",
    "difficulty": "dificil",
    "statement": "Liberar todos os comandos Bash sem restrição no settings.json compartilhado do projeto é a forma recomendada de reduzir pedidos de permissão.",
    "answer": false,
    "explanation": "O recomendado é liberar comandos específicos e seguros (como os de teste e lint) e manter negações para ações sensíveis, em vez de abrir tudo."
  },
  {
    "id": "bp-dificil-05",
    "category": "boas-praticas",
    "difficulty": "dificil",
    "statement": "Para algo que precisa acontecer sempre, como rodar o formatador após cada edição, uma instrução no CLAUDE.md é mais garantida do que um hook.",
    "answer": false,
    "explanation": "Instruções no CLAUDE.md orientam o modelo, mas não são determinísticas. Hooks são executados pelo próprio Claude Code em todo evento configurado, garantindo o comportamento."
  }
]
```

---

## Apêndice B — Decisões do brainstorm
| Tema | Decisão |
|---|---|
| Formato | Somente Verdadeiro ou Falso |
| Partida | 15 perguntas, 5 fáceis → 5 médias → 5 difíceis |
| Modo de dificuldade | Único modo progressivo (sem escolha de nível) |
| Timer | 10s por pergunta, medido no servidor (+2s de tolerância de rede) |
| Pontuação | 1 ponto por acerto |
| Desempate | Menor tempo total, depois data |
| Validação | No servidor (API routes do Next.js); respostas nunca vão ao cliente |
| Ranking | Global, all-time, top 20, persistido no Supabase |
| Identificação | Nickname opcional ao final da partida |
| Feedback | Em todo erro: resposta correta + explicação |
| Visual | Tema escuro inspirado em terminal, destaque laranja-terracota |
| Conteúdo | 45 perguntas em JSON local (15 por categoria) |
| Deploy | Vercel + Supabase |
