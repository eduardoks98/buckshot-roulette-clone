# Bang Shot - Regras do Jogo

> Documentacao baseada nas regras oficiais do jogo Buckshot Roulette

---

## Indice

1. [Visao Geral](#visao-geral)
2. [Regras Basicas](#regras-basicas)
3. [Itens](#itens)
   - [Itens Base](#itens-base)
   - [Itens Double or Nothing](#itens-double-or-nothing)
   - [Itens Multiplayer](#itens-multiplayer)
4. [Restricoes de Itens](#restricoes-de-itens)
5. [Mecanicas Especiais](#mecanicas-especiais)

---

## Visao Geral

Bang Shot e um jogo de horror indie que simula uma versao modificada da roleta russa, usando uma espingarda pump-action de 8 cartuchos em vez do revolver tradicional.

### Modos de Jogo

| Modo | Jogadores | Descricao |
|------|-----------|-----------|
| Single Player | 1 vs Dealer | Modo classico contra a IA |
| Double or Nothing | 1 vs Dealer | Modo infinito com itens extras |
| Multiplayer | 2-4 jogadores | Modo competitivo online |

---

## Regras Basicas

### Inicio de Rodada

1. **HP**: Cada jogador recebe entre 2-4 HP (aleatorio)
2. **Cartuchos**: A espingarda e carregada com 2-8 cartuchos (mix de LIVE e BLANK)
3. **Itens**: Cada jogador recebe 1-5 itens aleatorios
4. **Limite de Itens**: Maximo de 8 itens por jogador (8 slots)

### Turnos

- O jogador da vez DEVE atirar (em si ou em outro jogador)
- Pode usar quantos itens quiser ANTES de atirar
- **Atirar em si com BLANK**: Mantem o turno
- **Atirar em si com LIVE**: Toma dano e passa o turno
- **Atirar em outro**: Passa o turno (independente do cartucho)

### Dano

| Tipo | Dano Normal | Dano com Serra |
|------|-------------|----------------|
| LIVE | 1 HP | 2 HP |
| BLANK | 0 HP | 0 HP |

### Condicoes de Vitoria

- **Rodada**: Ser o ultimo jogador vivo
- **Partida**: Vencer 2 de 3 rodadas (best of 3)

---

## Itens

### Itens Base

#### 🔍 Lupa (Magnifying Glass)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 🔍 |
| Efeito | Revela o cartucho ATUAL (LIVE ou BLANK) |
| Restricoes | Nenhuma |
| Pode usar multiplas vezes | Sim |

**Quando usar:**
- Quando nao sabe o que tem na camara
- Antes de decidir atirar em si ou no oponente

**Quando NAO usar:**
- Se ja sabe o cartucho (via Phone ou outra Lupa)

---

#### 🍺 Cerveja (Beer)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 🍺 |
| Efeito | Ejeta o cartucho atual SEM atirar (revela o que era) |
| Restricoes | **NAO pode usar se nao ha cartuchos** |

**Quando usar:**
- Quando sabe que e LIVE e quer descartar
- Combo: Lupa -> ve LIVE -> Cerveja

**Quando NAO usar:**
- Se e BLANK e quer atirar em si para manter turno

---

#### 🚬 Cigarro (Cigarettes)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 🚬 |
| Efeito | Restaura 1 HP |
| Restricoes | Nenhuma |
| Pode usar com HP maximo | **SIM** (so remove do inventario) |

**Quando usar:**
- Quando esta com HP baixo
- Para liberar espaco no inventario

---

#### ⛓️ Algemas (Handcuffs)

| Propriedade | Valor |
|-------------|-------|
| Emoji | ⛓️ |
| Efeito | O alvo pula o PROXIMO turno dele |
| Restricoes | **NAO pode algemar quem ja esta algemado** |
| Alvo | Qualquer oponente vivo |

**Mecanicas especiais:**
- Apos ser algemado, o alvo fica IMUNE a algemas ate jogar
- Atirar em si com BLANK nao conta contra a duracao
- Algemas sao removidas no final da rodada

**Quando usar:**
- Antes de atirar LIVE no oponente (ele nao pode revidar)

---

#### 🪚 Serra (Hand Saw)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 🪚 |
| Efeito | Proximo tiro causa DANO DOBRADO (2 em vez de 1) |
| Restricoes | **NAO pode usar se cano ja esta serrado** |
| Duracao | Ate o proximo tiro ou ejecao |

**Quando usar:**
- Quando tem certeza que o proximo cartucho e LIVE
- Combo: Lupa -> ve LIVE -> Serra -> Atira

**Quando NAO usar:**
- Se nao sabe o cartucho (pode ser BLANK e desperdicar)

---

### Itens Double or Nothing

#### 📱 Celular (Burner Phone)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 📱 |
| Efeito | Revela um cartucho FUTURO aleatorio (nao o atual) |
| Restricoes | **NAO pode usar se so resta 1 cartucho** |
| Informacao | Mostra posicao e tipo (ex: "Cartucho #3: LIVE") |

**Quando usar:**
- Para planejar turnos futuros
- Quando quer saber a sequencia de cartuchos

---

#### 🔄 Inversor (Inverter)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 🔄 |
| Efeito | Converte o cartucho atual (LIVE vira BLANK, BLANK vira LIVE) |
| Restricoes | Nenhuma |

**Quando usar:**
- Quando sabe que e LIVE e quer BLANK (para atirar em si)
- Combo: Lupa -> ve LIVE -> Inversor -> Atira em si (BLANK) -> Mantem turno

**Quando NAO usar:**
- Se nao sabe o cartucho (50% chance de piorar)

---

#### 💉 Adrenalina (Adrenaline)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 💉 |
| Efeito | Rouba um item do oponente E USA IMEDIATAMENTE |
| Restricoes | **NAO pode roubar outra Adrenalina** |
| Alvo | Qualquer oponente com itens |

**Fluxo de uso:**
1. Seleciona Adrenalina
2. Seleciona oponente alvo
3. Visualiza itens do oponente
4. Seleciona item para roubar
5. Item e roubado e usado automaticamente

**Quando usar:**
- Quando oponente tem item valioso (Serra, Lupa)
- Quando precisa de um item especifico que nao tem

---

#### 💊 Remedio Vencido (Expired Medicine)

| Propriedade | Valor |
|-------------|-------|
| Emoji | 💊 |
| Efeito | 50% chance: +2 HP / 50% chance: -1 HP |
| Restricoes | Nenhuma |
| PERIGO | **PODE TE MATAR se voce tem 1 HP!** |

**Quando usar:**
- Quando esta desesperado com HP baixo (2+ HP)
- Quando a recompensa vale o risco

**Quando NAO usar:**
- Se tem 1 HP (50% de chance de morrer!)
- Se esta com HP maximo ou quase

---

### Itens Multiplayer

#### ↩️ Inversor de Ordem (Turn Reverser)

| Propriedade | Valor |
|-------------|-------|
| Emoji | ↩️ |
| Efeito | Inverte a direcao dos turnos (horario <-> anti-horario) |
| Restricoes | Nenhuma |
| Util em | Jogos com 3-4 jogadores |

**Quando usar:**
- Para fazer um oponente especifico jogar antes/depois
- Para evitar que um oponente jogue logo apos voce

---

## Restricoes de Itens

### Tabela Resumo

| Item | Restricao | Codigo |
|------|-----------|--------|
| 🪚 Serra | Cano ja serrado | `user.sawedOff === true` |
| ⛓️ Algemas | Alvo ja algemado | `target.handcuffed === true` |
| ⛓️ Algemas | Alvo imune | `target.handcuffImmune === true` |
| 🍺 Cerveja | Sem cartuchos | `currentShellIndex >= shells.length` |
| 📱 Celular | So 1 cartucho | `remainingShells.length === 0` |
| 💉 Adrenalina | Roubar adrenalina | `stolenItem.id === 'adrenaline'` |
| 💉 Adrenalina | Alvo sem itens | `target.items.length === 0` |

### Itens SEM Restricoes

- 🔍 Lupa (pode usar varias vezes)
- 🚬 Cigarro (pode usar com HP maximo)
- 🔄 Inversor (pode usar sem saber o cartucho)
- 💊 Remedio Vencido (pode usar a qualquer momento)
- ↩️ Inversor de Ordem (pode usar a qualquer momento)

---

## Mecanicas Especiais

### Imunidade a Algemas

Apos ser algemado, o jogador fica **IMUNE** a novas algemas ate seu proximo turno. Isso evita que um jogador seja algemado infinitamente.

```
Turno 1: Jogador A algema Jogador B
         -> B.handcuffed = true
         -> B.handcuffImmune = true

Turno 2: B pula o turno (algemado)
         -> B.handcuffed = false
         -> B.handcuffImmune ainda = true (nao pode ser algemado de novo)

Turno 3: B joga normalmente
         -> B.handcuffImmune = false (pode ser algemado novamente)
```

### Efeito da Serra

A serra dura ate o proximo **disparo ou ejecao** de cartucho:

- Tiro LIVE: Dano dobrado, serra consumida
- Tiro BLANK: Nenhum dano, serra consumida
- Cerveja: Serra consumida (cartucho ejetado)

### Recarga de Cartuchos

Quando os cartuchos acabam:
1. Nova carga de 2-8 cartuchos (mix de LIVE/BLANK)
2. Novos itens distribuidos (1-5 por jogador)
3. Anuncio mostra quantos LIVE e BLANK

### Atirar em Si com BLANK

Se voce atira em si mesmo com um cartucho BLANK:
- Nenhum dano
- **Voce mantem o turno**
- Proximo cartucho e carregado automaticamente

Esta e uma mecanica estrategica importante!

---

## Sistema de Raridade dos Itens

Os itens tem diferentes probabilidades de aparecer:

| Item | Peso | Raridade |
|------|------|----------|
| 🔍 Lupa | 15 | Comum |
| 🍺 Cerveja | 15 | Comum |
| 📱 Celular | 12 | Comum |
| 🔄 Inversor | 10 | Medio |
| ↩️ Inversor de Ordem | 10 | Medio |
| 💊 Remedio Vencido | 8 | Medio |
| ⛓️ Algemas | 8 | Raro |
| 🚬 Cigarro | 8 | Raro |
| 🪚 Serra | 7 | Raro |
| 💉 Adrenalina | 7 | Raro |

---

## Referencias

- [Steam Guide - Ultimate Guide to Buckshot Roulette](https://steamcommunity.com/sharedfiles/filedetails/?id=3218902482)
- [Buckshot Roulette Wiki](https://buckshot-roulette.fandom.com/wiki/Buckshot_Roulette)
- [The Gamer - Items Guide](https://www.thegamer.com/buckshot-roulette-items-explained-guide/)

---

*Ultima atualizacao: Janeiro 2026*
