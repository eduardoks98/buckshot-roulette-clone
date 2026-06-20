# Coordenação — Bang Shot (`buckshotcopy`)

> Lido pela skill **`/coordenar`**. Vários agentes podem trabalhar aqui em paralelo.
> **O quadro/kanban (roadmap) NÃO é neste repo — é no `games-admin` (o hub).** Este jogo é o
> sistema **`bangshot`** lá. Padrão do ecossistema: ver `AGENTS.md` → `../games-admin/docs/dev/`.

## O quadro fica no games-admin
- **Tela:** `GAMES_ADMIN_URL` (do `.env`) + `/admin/roadmap` — Kanban + Lista; filtre por **Bang Shot**.
- É lá que se vê / cria / move as tasks; o **changelog público** sai de lá ao cortar a tag.
- A tabela "Trabalhando agora" abaixo é só o **registro rápido de presença** local.

## Trabalhando agora
| lane | agente | o que está fazendo | desde |
|---|---|---|---|
| _(vazio)_ | | | |

## Ciclo da task — Definition of Done
1. **Começar:** crie um card no kanban do bangshot (`status: doing`) — via API ou na tela. Nasce com
   a **checklist de QA obrigatória**.
   ```bash
   curl -s -X POST "$GAMES_ADMIN_URL/api/systems/bangshot/roadmap" \
     -H "X-API-Key: $MYSYS_API_KEY" -H "Content-Type: application/json" \
     -d '{"title":"<o que vou fazer>","agent":"<você>","status":"doing"}'
   ```
2. **Terminar (só fecha com prova):** subtasks de QA (criar testes / validar / rodar package de
   padrões) ✓; `changelog_note` escrito; **build + testes verdes**; UI → screenshot/vídeo. Mova pra
   `done` (`PATCH .../roadmap/{id}` com `status:"done"`, `changelog_note`, `subtasks:{...}`).
   "Compilou" **não** é "feito".

## Git (índice compartilhado)
- SEMPRE `git commit <arquivos>` (path-limited). NUNCA `git add .` nem `git merge`. Build antes de commitar.
- Em arquivo compartilhado: só sendo dono OU pausando o outro agente; commite só os seus hunks.
