# Buckshot Roulette - Changelog e Status do Projeto

## Status Geral

| Componente | Status |
|------------|--------|
| Single Player (vs IA) | Completo |
| Multiplayer (2-4 jogadores) | Funcional (com bugs menores) |
| Sistema de Itens | Completo |
| UI/Responsividade | Completo (layout de mesa + animacoes) |

---

## BUGS CORRIGIDOS

### [CORRIGIDO] Bug: Jogadores nao recebem itens ao iniciar nova rodada

**Data:** 2026-01-22

**Problema:** As vezes jogadores nao recebiam itens quando comecava um novo round.

**Causa:** A propriedade `hadZeroItems` nao era inicializada quando jogadores criavam ou entravam na sala.

**Arquivos modificados:** `server/server.js`

**Correcoes aplicadas:**
- Adicionado `hadZeroItems: false` na funcao `createRoom()` (linha 47-58)
- Adicionado `hadZeroItems: false` na funcao `joinRoom()` (linha 80-92)
- Adicionado `handcuffImmune: false` para consistencia

---

### [CORRIGIDO] Bug: Cerveja nao distribui itens ao recarregar espingarda

**Data:** 2026-01-22

**Problema:** Quando a cerveja ejetava o ultimo cartucho e a espingarda recarregava, os jogadores nao recebiam novos itens.

**Causa:** O caso `beer` no `processItem` nao chamava `distributeItems()` apos recarregar.

**Arquivos modificados:** `server/server.js`

**Correcoes aplicadas:**
- Adicionado chamada para `distributeItems()` no caso `beer` quando `reloaded = true`
- Adicionado `newShells` ao resultado para mostrar quantas balas foram carregadas

---

### [CORRIGIDO] Bug: Botoes de atirar em outros jogadores nao aparecem

**Data:** 2026-01-21

**Problema:** Com 2+ jogadores, so aparecia o botao "ATIRAR EM SI" mas nao os botoes para atirar nos outros.

**Causa:** Propriedade `alive` nao era enviada nos eventos de sala (`roomCreated`, `playerJoined`, etc.).

**Arquivos modificados:** `server/server.js`, `multiplayer.js`

**Correcoes aplicadas:**
- Adicionado `alive: p.alive || true` em todos os eventos de sala
- Garantido `alive` no handler `roundStarted` do cliente

---

### [CORRIGIDO] Bug: Nome aparece como "[object Object]"

**Data:** 2026-01-21

**Problema:** Ao criar sala, o nome do jogador aparecia como "[object Object]".

**Causa:** O evento `createRoom` recebia um objeto mas o codigo tratava como string.

**Arquivos modificados:** `server/server.js`

**Correcoes aplicadas:**
- Adicionado tratamento para extrair `playerName` e `password` do objeto recebido

---

## BUGS PENDENTES

### [PENDENTE] Bug: Modal de Adrenalina nao aparece

**Problema:** Ao usar Adrenalina e escolher o alvo, o modal para escolher qual item roubar nao aparece.

**Status:** Requer investigacao - adicionar debug logs

---

### [PENDENTE] Bug: Adrenalina nao USA o item roubado

**Problema:** Adrenalina apenas ROUBA o item mas nao ATIVA o efeito dele.

**Regra correta:** Adrenalina rouba um item do oponente E USA imediatamente.

**Arquivos a modificar:** `server/server.js` - case `adrenaline`

---

### [PENDENTE] Bug: Morrer com Remedio Vencido nao dispara Game Over

**Problema:** Quando um jogador morre usando o remedio vencido, o jogo fica travado.

**Causa:** No handler `useItem` nao ha verificacao de fim de jogo apos processar o item.

**Arquivos a modificar:** `server/server.js` - handler `useItem`

---

## FEATURES IMPLEMENTADAS

### Sistema de Itens (10 itens)

| Item | Emoji | Status | Descricao |
|------|-------|--------|-----------|
| Lupa | :mag: | Completo | Revela se o cartucho atual e LIVE ou BLANK |
| Cerveja | :beer: | Completo | Ejeta o cartucho atual sem disparar |
| Cigarro | :smoking: | Completo | Restaura 1 HP |
| Algemas | :chains: | Completo | Pula o proximo turno do oponente |
| Serra | :carpentry_saw: | Completo | Proximo tiro causa 2x de dano |
| Celular | :iphone: | Completo | Revela a posicao de um cartucho na arma |
| Inversor | :arrows_counterclockwise: | Completo | Inverte o cartucho atual (LIVE<->BLANK) |
| Adrenalina | :syringe: | Parcial | Rouba item (falta usar automaticamente) |
| Remedio Vencido | :pill: | Parcial | 50% chance: +2 HP ou -1 HP (falta game over) |
| Inversor de Ordem | :leftwards_arrow_with_hook: | Completo | Inverte direcao dos turnos |

---

### Sistema de Salas

| Feature | Status |
|---------|--------|
| Criar sala com codigo de 6 digitos | Completo |
| Entrar na sala com codigo | Completo |
| Senha opcional para sala | Completo |
| Lista de salas disponiveis | Completo |
| Host pode iniciar o jogo | Completo |
| 2-4 jogadores | Completo |
| Desconexao = eliminado | Completo |

---

### Sistema de Turnos

| Feature | Status |
|---------|--------|
| Turnos em ordem (horario/anti-horario) | Completo |
| Inverter direcao com item | Completo |
| Pular turno com algemas | Completo |
| Imunidade apos ser algemado | Completo |
| Primeiro jogador aleatorio | Completo |

---

## MELHORIAS DE UI IMPLEMENTADAS

### [IMPLEMENTADO] Layout de Mesa estilo Buckshot Roulette

**Data:** 2026-01-22

**Objetivo:** Melhorar o layout do multiplayer para ficar mais intuitivo e remeter ao estilo do jogo original.

**Caracteristicas implementadas:**
- Visual de mesa com textura de madeira escura e efeitos de luz
- Jogadores posicionados ao redor da mesa (Grid CSS responsivo)
- Area central com espingarda detalhada (cano, coronha, camara)
- Efeito CRT scanlines no header
- Animacoes de tiro (recuo da espingarda, flash de disparo)
- Animacao de dano (shake + flash vermelho)
- Animacao de cura (pulse verde)
- Efeito visual de serra na espingarda (brilho vermelho)
- Indicador de turno com glow pulsante
- Badge "VOCE" para identificar seu jogador
- Badge "ELIMINADO" para jogadores mortos
- Responsividade para mobile (layout empilhado)

**Arquivos modificados:**
- `styles.css` - 400+ linhas de CSS adicionadas para efeitos visuais
- `multiplayer.js` - Animacoes disparadas via JavaScript

---

## COMO RODAR O PROJETO

### Single Player
1. Abra `index.html` diretamente no navegador
2. Clique em "JOGAR"

### Multiplayer
1. Abra o terminal na pasta `server`
2. Execute: `npm install` (so na primeira vez)
3. Execute: `node server.js`
4. Abra **http://localhost:3000** no navegador
5. Clique em "MULTIPLAYER"

---

## ESTRUTURA DE ARQUIVOS

```
e:\Cursor\buckshotcopy\
├── index.html        # Estrutura HTML do jogo
├── styles.css        # Estilizacao dark/atmosferica
├── game.js           # Logica do jogo local (vs IA)
├── multiplayer.js    # Cliente Socket.io para online
├── README.md         # Instrucoes basicas
├── docs/
│   └── CHANGELOG.md  # Este arquivo
└── server/
    ├── package.json  # Dependencias do servidor
    └── server.js     # Servidor Node.js + Socket.io
```

---

## REFERENCIAS

- [Buckshot Roulette - itch.io](https://mikeklubnika.itch.io/buckshot-roulette)
- [Buckshot Roulette - Wikipedia](https://en.wikipedia.org/wiki/Buckshot_Roulette)
- [Socket.IO Rooms Documentation](https://socket.io/docs/v3/rooms/)

---

*Ultima atualizacao: 2026-01-22*
