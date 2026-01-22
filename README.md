# Buckshot Roulette Clone

Um clone web do jogo Buckshot Roulette com modo single-player (vs IA) e multiplayer online (2-4 jogadores).

## Como Jogar

### Modo Single-Player (vs IA)

1. Abra o arquivo `index.html` diretamente no navegador
2. Clique em **JOGAR**
3. Jogue contra a IA do Dealer

### Modo Multiplayer (2-4 jogadores)

1. Instale as dependências do servidor:
```bash
cd server
npm install
```

2. Inicie o servidor:
```bash
npm start
```

3. Abra no navegador: `http://localhost:3000`

4. Clique em **MULTIPLAYER**:
   - Um jogador cria a sala e compartilha o código de 6 dígitos
   - Outros jogadores entram com o código
   - O host inicia o jogo quando todos estiverem prontos

## Regras

### Mecânica Básica
- 3 rodadas para vencer
- Espingarda carregada com cartuchos LIVE (vermelhos) e BLANK (azuis)
- 2-4 HP por rodada (aleatório)
- Atirar em si com BLANK = joga novamente
- Atirar em si com LIVE = dano + passa turno
- Atirar no oponente = sempre passa turno

### Itens (10 total)

| Emoji | Item | Efeito |
|-------|------|--------|
| 🔍 | Lupa | Revela o cartucho atual |
| 🍺 | Cerveja | Ejeta o cartucho atual |
| 🚬 | Cigarro | Cura 1 HP |
| ⛓️ | Algemas | Pula o turno do oponente |
| 🪚 | Serra | Próximo tiro = 2x dano |
| 📱 | Celular | Revela posição de outro cartucho |
| 🔄 | Inversor | Inverte o cartucho atual (LIVE↔BLANK) |
| 💉 | Adrenalina | Rouba e usa item do oponente |
| 💊 | Remédio Vencido | 50% +2 HP / 50% -1 HP |
| ↩️ | Inversor de Ordem | Inverte direção dos turnos (só multiplayer) |

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript puro
- **Backend**: Node.js + Express + Socket.io

## Créditos

Inspirado em [Buckshot Roulette](https://mikeklubnika.itch.io/buckshot-roulette) por Mike Klubnika.
