# Buckshot Roulette - Changelog e Status do Projeto

## Status Geral

| Componente | Status |
|------------|--------|
| Single Player (vs IA) | Completo |
| Multiplayer (2-4 jogadores) | Funcional |
| Sistema de Itens | Completo (10 itens) |
| UI/Responsividade | Completo |
| Autenticacao (Google OAuth) | Estrutura pronta |
| Banco de Dados (MySQL) | Configurado |
| Sistema de Estatisticas | Em desenvolvimento |

---

## v4 - Refatoracao Completa (2026-01-22)

### Migracao de Stack

**ANTES:**
- Frontend: HTML/CSS/JS puro
- Backend: Node.js com Socket.IO simples
- Sem banco de dados

**DEPOIS:**
- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript + Socket.IO
- Banco: MySQL + Prisma ORM
- Autenticacao: Passport.js + Google OAuth 2.0

### Nova Estrutura de Pastas

```
buckshot-roulette/
├── src/
│   ├── client/           # React Frontend
│   │   ├── src/
│   │   │   ├── pages/    # Home, SinglePlayer, Multiplayer
│   │   │   ├── context/  # SocketContext, AuthContext
│   │   │   └── components/
│   │   └── package.json
│   ├── server/           # Node.js Backend
│   │   ├── src/
│   │   │   ├── socket/   # room.handler, game.handler
│   │   │   ├── services/ # game.service, room.service
│   │   │   └── config/   # passport, database
│   │   ├── prisma/       # Schema do banco
│   │   └── package.json
│   └── shared/           # Tipos e constantes compartilhados
│       ├── types/
│       └── constants/
├── docs/
│   ├── CHANGELOG.md      # Este arquivo
│   └── GAME_RULES.md     # Regras oficiais do jogo
├── _old/                 # Codigo antigo (referencia)
├── start-server.bat      # Iniciar servidor
└── start-client.bat      # Iniciar cliente
```

---

## BUGS CORRIGIDOS (v4)

### [CORRIGIDO] Itens duplicados ao recarregar shells

**Data:** 2026-01-22

**Problema:** Quando os cartuchos acabavam e a espingarda recarregava, os jogadores recebiam itens duplicados.

**Causa:** `reloadShells()` era chamado DUAS VEZES:
1. Dentro de `processShot()` (correto)
2. Novamente no handler (ERRADO)

**Arquivos modificados:**
- `src/server/src/services/game/game.service.ts` - Retorna `itemsDistributed` no `ShotResult`
- `src/server/src/socket/game.handler.ts` - Usa resultado de `processShot()` em vez de chamar novamente

---

### [CORRIGIDO] Serra aparecia com 2 HP

**Data:** 2026-01-22

**Problema:** A serra (hand_saw) aparecia mesmo quando o HP maximo era 2, o que a tornava extremamente overpowered (morte instantanea).

**Regra oficial:** Serra NAO deve aparecer quando HP maximo e 2.

**Arquivos modificados:**
- `src/shared/constants/items.ts` - `getRandomItem()` aceita `excludeIds` opcional
- `src/server/src/services/game/game.service.ts` - `distributeItems()` exclui `hand_saw` quando `maxHp <= 2`

---

### [CORRIGIDO] Adrenalina nao usava item roubado

**Data:** 2026-01-22

**Problema:** Adrenalina apenas roubava o item mas nao o usava imediatamente.

**Regra oficial:** Adrenalina rouba E USA o item imediatamente.

**Arquivos modificados:**
- `src/server/src/services/game/game.service.ts` - Flag `usedImmediately`
- `src/server/src/socket/game.handler.ts` - Processa item roubado automaticamente

---

### [CORRIGIDO] Phone mostrava posicao relativa

**Data:** 2026-01-22

**Problema:** O celular (phone) mostrava "Cartucho #2" quando deveria mostrar a posicao absoluta na sequencia.

**Arquivos modificados:**
- `src/server/src/services/game/game.service.ts` - Calcula posicao absoluta

---

## FEATURES IMPLEMENTADAS (v4)

### Sistema de Estatisticas (Em Desenvolvimento)

**Status:** Parcialmente implementado

**Campos rastreados:**
- `damageDealt` - Dano total causado
- `damageTaken` - Dano total recebido
- `selfDamage` - Dano causado a si mesmo
- `shotsFired` - Quantidade de tiros
- `itemsUsed` - Quantidade de itens usados
- `kills` - Eliminacoes
- `deaths` - Mortes

**Arquivos modificados:**
- `src/server/src/services/game/game.service.ts` - Adiciona tracking em `processShot()`
- `src/server/prisma/schema.prisma` - Novos campos em `GameParticipant`

---

### Banco de Dados MySQL

**Schema implementado:**
- `User` - Usuarios com stats e ranking
- `Session` - Sessoes de login
- `Game` - Partidas
- `GameParticipant` - Participantes e suas stats
- `Round` - Rounds de cada partida
- `LeaderboardEntry` - Leaderboard por periodo

---

## EM DESENVOLVIMENTO

### Sistema de Reconexao

**Problema atual:** Jogadores perdem o jogo quando a conexao cai.

**Plano:**
1. Servidor gera `reconnectToken` ao desconectar
2. Cliente salva credenciais no localStorage
3. Cliente tenta reconectar automaticamente em 60 segundos
4. Servidor restaura estado do jogador

### Jogar Todos os 3 Rounds

**Problema atual:** Jogo termina quando alguem ganha 2 rounds (best of 3).

**Plano:** Jogar todos os 3 rounds e determinar vencedor pelo maior numero de vitorias.

### Tela de Game Over com Estatisticas

**Plano:**
- Podium com 1o, 2o, 3o lugar
- Tabela de estatisticas por jogador
- Awards/Titulos (Mais Dano, Mais Passivo, etc.)

---

## COMO RODAR O PROJETO (v4)

### Pre-requisitos
- Node.js 18+
- MySQL 8+

### Setup do Banco de Dados
1. Crie o banco: `CREATE DATABASE buckshot_roulette;`
2. Configure `.env` com sua conexao MySQL
3. Execute: `cd src/server && npx prisma db push`

### Iniciar Servidor
```bash
start-server.bat
# ou
cd src/server && npm run dev
```

### Iniciar Cliente
```bash
start-client.bat
# ou
cd src/client && npm run dev
```

### Acessar
- Cliente: http://localhost:5173
- Servidor: http://localhost:3000

---

## REFERENCIAS

- [Buckshot Roulette - itch.io](https://mikeklubnika.itch.io/buckshot-roulette)
- [Buckshot Roulette - Wikipedia](https://en.wikipedia.org/wiki/Buckshot_Roulette)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

*Ultima atualizacao: 2026-01-22*
