# Plano de Melhorias - BANGSHOT

## Visao Geral

Este documento detalha todas as melhorias planejadas para o BANGSHOT, organizadas em sprints por ordem de complexidade.

---

# SPRINT 1 - Bug Fixes Simples
**Prioridade:** Alta | **Complexidade:** Baixa

---

## 1.1 Bug Online Count (mostrando 2 ao inves de 1)

### Problema
O contador de usuarios online esta mostrando numeros incorretos. Exemplo: 1 usuario logado mas mostra "2 online".

### Causa Raiz
A funcao `getOnlineCount()` em `socket.ts` conta:
- Usuarios autenticados unicos por `odUserId`
- Conexoes anonimas (sem autenticacao)

O problema ocorre quando:
1. Entradas `null` no `socketUserMap` sao contadas como anonimas
2. Conexoes stale (nao limpas corretamente no disconnect)
3. Usuario abre multiplas abas antes de autenticar

### Arquivos Afetados
```
src/server/src/socket.ts (linhas 32-55, 144-169)
```

### Solucao
```typescript
// ANTES (problematico)
for (const [, userData] of socketUserMap) {
  if (userData?.odUserId) {
    uniqueUserIds.add(userData.odUserId);
  } else {
    anonymousCount++; // Conta null como anonimo!
  }
}

// DEPOIS (corrigido)
for (const [socketId, userData] of socketUserMap) {
  // Pular entradas nulas ou invalidas
  if (!userData) continue;

  if (userData.odUserId) {
    uniqueUserIds.add(userData.odUserId);
  } else {
    anonymousCount++;
  }
}
```

### Testes
1. Logar com 1 usuario -> deve mostrar "1 online"
2. Abrir 2 abas com mesmo usuario -> deve mostrar "1 online"
3. Deslogar -> deve mostrar "0 online" ou "1 online" se aba ainda aberta sem auth

---

## ~~1.2 Modal nao deve fechar com Escape quando digitando~~

> **STATUS: CONCLUIDO** - Modal ja foi corrigida e funciona como esperado.

---

# SPRINT 2 - Melhorias de UX
**Prioridade:** Media | **Complexidade:** Baixa-Media

---

## 2.1 Melhorar Dropdown do Som

### Problema
- Dropdown abre apenas com hover (ruim para mobile)
- Fecha facilmente ao mover o mouse
- Visual basico

### Arquivos Afetados
```
src/client/src/components/common/SoundControl/SoundControl.tsx
src/client/src/components/common/SoundControl/SoundControl.css
```

### Solucao

#### Mudancas no TSX
```typescript
// Adicionar ref e click-outside
const panelRef = useRef<HTMLDivElement>(null);

// Trocar hover por click
const togglePanel = () => setShowPanel(!showPanel);

// Click-outside para fechar
useEffect(() => {
  if (!showPanel) return;

  const handleClickOutside = (e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setShowPanel(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showPanel]);

// Remover onMouseEnter/onMouseLeave
// Adicionar onClick no botao
```

#### Melhorias Visuais
- Adicionar icone de musica na secao de musica
- Slider com estilo customizado (thumb maior, track colorido)
- Indicador visual de volume (barras ou onda)
- Animacao suave de abertura/fechamento

### Testes
1. Desktop: clicar no icone -> dropdown abre
2. Desktop: clicar fora -> dropdown fecha
3. Mobile: tocar no icone -> dropdown abre
4. Ajustar volume -> som muda em tempo real

---

## 2.2 Criar Icones EXCLUSIVOS para Conquistas

### Objetivo
Criar icones SVG exclusivos e unicos para a pagina de Conquistas (Achievements).
Os icones devem ser diferentes dos usados em outras partes do sistema.

### Arquivos a Criar
```
src/client/src/components/icons/achievements/
  ├── index.ts
  ├── FirstBloodIcon.tsx      (first_blood - Primeiro Sangue)
  ├── SerialKillerIcon.tsx    (serial_killer - Serial Killer)
  ├── CenturionIcon.tsx       (centurion - Centuriao)
  ├── AngelOfDeathIcon.tsx    (angel_of_death - Anjo da Morte)
  ├── DemolisherIcon.tsx      (demolisher - Demolidor)
  ├── SniperIcon.tsx          (sniper - Atirador de Elite)
  ├── SawMasterIcon.tsx       (saw_master - Mestre da Serra)
  ├── SurvivorIcon.tsx        (survivor - Sobrevivente)
  ├── IronWillIcon.tsx        (iron_will - Vontade de Ferro)
  ├── PharmacistIcon.tsx      (pharmacist - Farmaceutico)
  ├── PacifistIcon.tsx        (pacifist - Pacifista)
  ├── LastStandIcon.tsx       (last_stand - Ultima Chance)
  ├── CollectorIcon.tsx       (collector - Colecionador)
  ├── ItemHoarderIcon.tsx     (item_hoarder - Acumulador)
  ├── ThiefIcon.tsx           (thief - Ladrao)
  ├── ChainMasterIcon.tsx     (chain_master - Mestre das Correntes)
  ├── FortuneTellerIcon.tsx   (fortune_teller - Vidente)
  ├── RookieIcon.tsx          (rookie - Novato)
  ├── VeteranIcon.tsx         (veteran - Veterano)
  ├── ChampionIcon.tsx        (champion - Campeao)
  ├── UnbeatableIcon.tsx      (unbeatable - Imbativel)
  ├── DominatorIcon.tsx       (dominator - Dominador)
  ├── SocialButterflyIcon.tsx (social_butterfly - Borboleta Social)
  ├── FullHouseIcon.tsx       (full_house - Casa Cheia)
  └── RivalIcon.tsx           (rival - Rival)
```

### Mapeamento de Conquistas para Icones

#### Combate (7 icones)
| Achievement | Nome | Icone Sugerido |
|-------------|------|----------------|
| first_blood | Primeiro Sangue | Gota de sangue com espada |
| serial_killer | Serial Killer | Mascara com faca |
| centurion | Centuriao | Capacete romano com espadas |
| angel_of_death | Anjo da Morte | Asas com foice |
| demolisher | Demolidor | Punho quebrando |
| sniper | Atirador de Elite | Mira de sniper |
| saw_master | Mestre da Serra | Serra circular com sangue |

#### Sobrevivencia (5 icones)
| Achievement | Nome | Icone Sugerido |
|-------------|------|----------------|
| survivor | Sobrevivente | Coracao com escudo |
| iron_will | Vontade de Ferro | Braco de ferro flexionado |
| pharmacist | Farmaceutico | Frasco de remedio com caveira |
| pacifist | Pacifista | Pomba com ramo |
| last_stand | Ultima Chance | Coracao pegando fogo |

#### Itens (5 icones)
| Achievement | Nome | Icone Sugerido |
|-------------|------|----------------|
| collector | Colecionador | Mochila aberta com itens |
| item_hoarder | Acumulador | Pilha de caixas/itens |
| thief | Ladrao | Mao pegando seringa |
| chain_master | Mestre das Correntes | Algemas brilhando |
| fortune_teller | Vidente | Bola de cristal com olho |

#### Jogos (5 icones)
| Achievement | Nome | Icone Sugerido |
|-------------|------|----------------|
| rookie | Novato | Controle de game simples |
| veteran | Veterano | Medalha com estrelas |
| champion | Campeao | Trofeu dourado |
| unbeatable | Imbativel | Chamas em sequencia |
| dominator | Dominador | Coroa com raios |

#### Social (3 icones)
| Achievement | Nome | Icone Sugerido |
|-------------|------|----------------|
| social_butterfly | Borboleta Social | Grupo de pessoas conectadas |
| full_house | Casa Cheia | Mesa com 4 cadeiras ocupadas |
| rival | Rival | Dois rostos se encarando |

### Estrutura do Componente de Icone
```tsx
// Exemplo: FirstBloodIcon.tsx
import { IconProps, getIconSize } from '../Icon';

export function FirstBloodIcon({ size = 'md', className, style, title }: IconProps) {
  const s = getIconSize(size);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-label={title}
    >
      {/* SVG path exclusivo para este icone */}
      <path d="..." fill="#ef4444" />
      <path d="..." fill="#991b1b" />
    </svg>
  );
}
```

### Atualizacao do index.ts de achievements
```typescript
// src/client/src/components/icons/achievements/index.ts
export * from './FirstBloodIcon';
export * from './SerialKillerIcon';
// ... todos os 25 icones

// Mapeamento por ID
export const ACHIEVEMENT_ICONS_NEW: Record<string, React.FC<IconProps>> = {
  first_blood: FirstBloodIcon,
  serial_killer: SerialKillerIcon,
  centurion: CenturionIcon,
  // ... todos os 25
};

export function getAchievementIconNew(id: string): React.FC<IconProps> | null {
  return ACHIEVEMENT_ICONS_NEW[id] || null;
}
```

### Atualizacao do Achievements.tsx
```tsx
import { getAchievementIconNew } from '../../components/icons/achievements';

// No render
const IconComponent = getAchievementIconNew(milestone.id); // Usar ID ao inves de icon string
return (
  <div className="achievement-icon">
    {IconComponent ? <IconComponent size={48} /> : <DefaultIcon />}
  </div>
);
```

### Estilo dos Icones
- Tamanho base: 48x48 viewBox
- Cores: Usar paleta do jogo (vermelho sangue, dourado, verde, etc.)
- Estilo: Detalhado mas clean, estilo flat com gradientes sutis
- Todos devem ter mesmo peso visual

### Testes
1. Acessar pagina de Conquistas
2. Verificar que todos os 25 icones aparecem corretamente
3. Verificar que icones tem boa aparencia em diferentes tamanhos
4. Verificar que conquistas bloqueadas mostram icone em grayscale

---

## 2.3 Substituir Emojis por Icones no Leaderboard

### Problema
Titulos no Leaderboard usam strings de icone que nao renderizam como componentes.

### Arquivos Afetados
```
src/client/src/pages/Leaderboard/Leaderboard.tsx
src/client/src/components/icons/index.ts
```

### Solucao
Reutilizar icones existentes (ou criar novos se necessario) para os titulos:

| Titulo | Icon ID | Componente |
|--------|---------|------------|
| Exterminador | skull | SkullIcon |
| Tanque | shield | ShieldIcon |
| Sortudo | clover | CloverIcon |
| Atirador | target | TargetIcon |
| Estrategista | backpack | BackpackIcon |
| Homem de Ferro | muscle | MuscleIcon |
| Estrela Ascendente | star | StarIcon |
| Perfeccionista | fire | FireIcon |
| Lenda | medal | MedalIcon |
| Campeao Supremo | crown | CrownIcon |

### Implementacao
```tsx
// Leaderboard.tsx
const TitleIcon = ACHIEVEMENT_ICONS[titleDef.icon];
return (
  <span className="entry-title">
    {TitleIcon && <TitleIcon size={14} />}
    {titleDef.name}
  </span>
);
```

---

# SPRINT 3 - Ajustes de Layout
**Prioridade:** Media | **Complexidade:** Baixa

---

## 3.1 Landing Page - Header com Link para Portal

### Problema
A landing page do BANGSHOT nao tem forma de voltar ao portal principal.

### Arquivos Afetados
```
src/client/src/pages/Home/Home.tsx
src/client/src/pages/Home/Home.css
```

### Solucao

#### Adicionar Header no Home.tsx
```tsx
// Antes da section hero
<header className="landing__header">
  <a href="https://games.mysys.shop" className="landing__portal-link">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    <span>Games Portal</span>
  </a>
</header>
```

#### Adicionar CSS
```css
/* Header fixo */
.landing__header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  background: rgba(13, 13, 13, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #2a2a2a;
  z-index: 100;
}

.landing__portal-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}

.landing__portal-link:hover {
  color: #34d399;
  transform: translateX(-4px);
}

/* Ajustar padding do conteudo */
.landing {
  padding-top: 60px; /* Compensar header fixo */
}
```

### Testes
1. Acessar landing page -> header visivel no topo
2. Scroll na pagina -> header permanece fixo
3. Clicar no link -> redireciona para portal
4. Hover no link -> efeito visual de seta

---

# SPRINT 4 - Design System
**Prioridade:** Media | **Complexidade:** Media

---

## 4.1 BugReportModal - Alinhar Design com Portal

### Objetivo
Padronizar o design do BugReportModal com o sistema de design do games-admin portal.

### Arquivos Afetados
```
src/client/src/components/common/BugReportModal/BugReportModal.tsx
src/client/src/components/common/BugReportModal/BugReportModal.css
```

### Design Tokens do Portal
```css
/* Cores */
--bg-body: #0d0d0d;
--bg-card: #1a1a1a;
--bg-input: #141414;
--primary: #10b981;
--primary-hover: #0ea573;
--border-color: #2a2a2a;
--text-primary: #ffffff;
--text-secondary: #a0a0a0;

/* Status */
--success: #22c55e;
--danger: #ef4444;
--warning: #f59e0b;
--info: #3b82f6;

/* Espacamento */
--radius: 12px;
--padding: 1.5rem;
```

### Mudancas Necessarias

#### Estrutura do Modal
```tsx
<div className="bug-report-overlay">
  <div className="bug-report-modal">
    {/* Header */}
    <div className="bug-report-header">
      <h2>Reportar Bug</h2>
      <button className="bug-report-close" onClick={onClose}>
        <XIcon size={20} />
      </button>
    </div>

    {/* Body */}
    <div className="bug-report-body">
      {/* Form fields */}
    </div>

    {/* Footer */}
    <div className="bug-report-footer">
      <button className="btn-secondary" onClick={onClose}>Cancelar</button>
      <button className="btn-primary" type="submit">Enviar</button>
    </div>
  </div>
</div>
```

#### CSS Atualizado
```css
.bug-report-modal {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bug-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #2a2a2a;
}

.bug-report-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.bug-report-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #2a2a2a;
}

/* Inputs */
.bug-report-input {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #ffffff;
  padding: 0.75rem 1rem;
}

.bug-report-input:focus {
  border-color: #10b981;
  outline: none;
}

/* Botoes */
.btn-primary {
  background: #10b981;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0ea573;
}

.btn-secondary {
  background: transparent;
  color: #a0a0a0;
  border: 1px solid #2a2a2a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
}

/* Badges de prioridade */
.priority-low { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.priority-medium { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.priority-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.priority-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
```

### Testes
1. Abrir BugReportModal -> visual alinhado com portal
2. Preencher formulario -> campos funcionam corretamente
3. Enviar report -> feedback de sucesso/erro
4. Responsivo em mobile

---

# SPRINT 5 - Features Novas (Media)
**Prioridade:** Media | **Complexidade:** Media-Alta

---

## 5.1 Menu In-Game

### Objetivo
Criar um menu acessivel durante a partida para ajustar configuracoes ou abandonar o jogo.

### Arquivos Novos
```
src/client/src/components/game/GameMenu/GameMenu.tsx
src/client/src/components/game/GameMenu/GameMenu.css
src/client/src/components/game/GameMenu/index.ts
```

### Arquivos a Modificar
```
src/client/src/pages/SinglePlayer/SinglePlayer.tsx
src/client/src/pages/Multiplayer/Game/Game.tsx
src/client/src/components/game/GameBoard/GameBoard.tsx
```

### Interface do Componente
```typescript
interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAbandon: () => void;
  isSinglePlayer?: boolean;
  isPaused?: boolean; // Se o jogo esta pausado (ex: esperando reconexao)
}
```

### Estrutura do Componente
```tsx
function GameMenu({ isOpen, onClose, onAbandon, isSinglePlayer }: GameMenuProps) {
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="game-menu-overlay">
      <div className="game-menu">
        <h2 className="game-menu__title">Menu</h2>

        {/* Controles de Audio */}
        <div className="game-menu__section">
          <h3>Audio</h3>
          <div className="game-menu__row">
            <span>Efeitos Sonoros</span>
            <SoundSlider type="effects" />
          </div>
          <div className="game-menu__row">
            <span>Musica</span>
            <SoundSlider type="music" />
          </div>
        </div>

        {/* Acoes */}
        <div className="game-menu__actions">
          <button className="game-menu__btn game-menu__btn--primary" onClick={onClose}>
            Voltar ao Jogo
          </button>
          <button
            className="game-menu__btn game-menu__btn--danger"
            onClick={() => setShowAbandonConfirm(true)}
          >
            Abandonar Partida
          </button>
        </div>

        {/* Confirmacao de Abandono */}
        {showAbandonConfirm && (
          <div className="game-menu__confirm">
            <p>Tem certeza que deseja abandonar?</p>
            {!isSinglePlayer && <p className="warning">Voce perdera ELO!</p>}
            <div className="game-menu__confirm-actions">
              <button onClick={() => setShowAbandonConfirm(false)}>Cancelar</button>
              <button className="danger" onClick={onAbandon}>Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### CSS
```css
.game-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.game-menu {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 2rem;
  min-width: 320px;
  max-width: 400px;
}

.game-menu__title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.game-menu__section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #2a2a2a;
}

.game-menu__section h3 {
  font-size: 0.875rem;
  color: #a0a0a0;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.game-menu__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.game-menu__actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.game-menu__btn {
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.game-menu__btn--primary {
  background: #10b981;
  color: white;
  border: none;
}

.game-menu__btn--danger {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.game-menu__btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
}
```

### Integracao com Teclado
```typescript
// No GameBoard ou pagina de jogo
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape ou M abre/fecha menu
    if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
      // Nao abrir se estiver em outro modal
      if (!hasActiveOverlay) {
        setShowGameMenu(prev => !prev);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [hasActiveOverlay]);
```

### Botao de Menu no GameBoard
```tsx
// Adicionar botao hamburguer no canto superior
<button className="game-menu-trigger" onClick={() => setShowGameMenu(true)}>
  <MenuIcon size={24} />
</button>
```

### Testes
1. Durante jogo: pressionar Escape -> menu abre
2. No menu: ajustar volume -> som muda imediatamente
3. Clicar "Voltar ao Jogo" -> menu fecha
4. Clicar "Abandonar" -> confirmacao aparece
5. Confirmar abandono -> redireciona para lobby
6. SinglePlayer: abandonar nao mostra aviso de ELO

---

# SPRINT 6 - Feature Grande
**Prioridade:** Media | **Complexidade:** Alta

---

## 6.1 SinglePlayer com Multiplos Bots Configuraveis

### Objetivo
Permitir que o jogador configure a quantidade e dificuldade dos bots antes de iniciar uma partida solo.

### Fluxo de Usuario
```
/singleplayer
    |
    v
[SinglePlayerSetup]  <-- NOVO
    - Escolher quantidade de bots (1-3)
    - Escolher dificuldade de cada bot
    - Preview da partida
    - Botao "Iniciar"
    |
    v
[SinglePlayer]  <-- MODIFICADO
    - Recebe config dos bots
    - Gerencia turnos de multiplos jogadores
    - AI adaptada por dificuldade
```

### Arquivos Novos
```
src/client/src/pages/SinglePlayer/SinglePlayerSetup.tsx
src/client/src/pages/SinglePlayer/SinglePlayerSetup.css
```

### Arquivos a Modificar
```
src/client/src/pages/SinglePlayer/SinglePlayer.tsx
src/client/src/App.tsx (rotas)
```

### Interfaces
```typescript
// Tipos para configuracao de bot
type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotConfig {
  id: string;
  name: string;
  difficulty: BotDifficulty;
}

interface SinglePlayerConfig {
  bots: BotConfig[];
}

// Props do SinglePlayer atualizado
interface SinglePlayerProps {
  config?: SinglePlayerConfig;
}
```

### Componente SinglePlayerSetup
```tsx
function SinglePlayerSetup() {
  const navigate = useNavigate();
  const [botCount, setBotCount] = useState(1);
  const [bots, setBots] = useState<BotConfig[]>([
    { id: 'bot-1', name: 'Bot 1', difficulty: 'medium' }
  ]);

  // Atualizar lista de bots quando quantidade muda
  useEffect(() => {
    setBots(prev => {
      const newBots: BotConfig[] = [];
      for (let i = 0; i < botCount; i++) {
        newBots.push(prev[i] || {
          id: `bot-${i + 1}`,
          name: `Bot ${i + 1}`,
          difficulty: 'medium'
        });
      }
      return newBots;
    });
  }, [botCount]);

  const updateBotDifficulty = (index: number, difficulty: BotDifficulty) => {
    setBots(prev => prev.map((bot, i) =>
      i === index ? { ...bot, difficulty } : bot
    ));
  };

  const startGame = () => {
    navigate('/singleplayer/game', { state: { bots } });
  };

  return (
    <div className="sp-setup">
      <h1>Configurar Partida Solo</h1>

      {/* Seletor de quantidade */}
      <div className="sp-setup__count">
        <label>Quantidade de Bots</label>
        <div className="sp-setup__count-buttons">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className={botCount === n ? 'active' : ''}
              onClick={() => setBotCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de bots */}
      <div className="sp-setup__bots">
        {bots.map((bot, index) => (
          <div key={bot.id} className="sp-setup__bot-card">
            <div className="sp-setup__bot-avatar">
              <RobotIcon size={48} />
            </div>
            <div className="sp-setup__bot-info">
              <span className="sp-setup__bot-name">{bot.name}</span>
              <select
                value={bot.difficulty}
                onChange={(e) => updateBotDifficulty(index, e.target.value as BotDifficulty)}
              >
                <option value="easy">Facil</option>
                <option value="medium">Medio</option>
                <option value="hard">Dificil</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="sp-setup__preview">
        <h3>Jogadores na Partida</h3>
        <div className="sp-setup__players">
          <div className="sp-setup__player sp-setup__player--you">
            <UserIcon size={24} />
            <span>Voce</span>
          </div>
          {bots.map(bot => (
            <div key={bot.id} className="sp-setup__player">
              <RobotIcon size={24} />
              <span>{bot.name}</span>
              <span className={`difficulty difficulty--${bot.difficulty}`}>
                {bot.difficulty === 'easy' ? 'Facil' : bot.difficulty === 'medium' ? 'Medio' : 'Dificil'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acoes */}
      <div className="sp-setup__actions">
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Voltar
        </button>
        <button className="btn-primary" onClick={startGame}>
          Iniciar Partida
        </button>
      </div>
    </div>
  );
}
```

### Atualizacao do SinglePlayer.tsx

#### Mudancas Principais
1. Receber config via location state
2. Gerenciar estado para multiplos jogadores (voce + N bots)
3. Sistema de turnos rotativo
4. AI diferenciada por dificuldade

```typescript
// Estado atualizado para multiplos jogadores
interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  items: Item[];
  isBot: boolean;
  difficulty?: BotDifficulty;
  handcuffed: boolean;
  sawedOff: boolean;
}

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  // ... resto do estado
}
```

#### Logica de Dificuldade
```typescript
const getDifficultyConfig = (difficulty: BotDifficulty) => {
  switch (difficulty) {
    case 'easy':
      return {
        itemUseChance: 0.2,      // 20% chance de usar item
        thinkingDelay: [800, 1500], // Delay mais curto
        optimalTarget: false,    // Escolhe alvo aleatorio
      };
    case 'medium':
      return {
        itemUseChance: 0.5,
        thinkingDelay: [1000, 2500],
        optimalTarget: false,    // Considera probabilidades
      };
    case 'hard':
      return {
        itemUseChance: 0.7,
        thinkingDelay: [1500, 3500],
        optimalTarget: true,     // Sempre escolhe melhor alvo
      };
  }
};
```

### Rotas Atualizadas
```tsx
// App.tsx
<Route path="/singleplayer" element={<SinglePlayerSetup />} />
<Route path="/singleplayer/game" element={<SinglePlayer />} />
```

### Testes
1. Acessar /singleplayer -> tela de setup aparece
2. Selecionar 3 bots -> 3 cards aparecem
3. Mudar dificuldade -> preview atualiza
4. Iniciar jogo -> partida comeca com bots configurados
5. Turnos rotativos funcionam corretamente
6. Bots faceis erram mais, dificeis acertam mais
7. Game over mostra resultado correto

---

# Resumo das Sprints

| Sprint | Tarefas | Complexidade | Estimativa |
|--------|---------|--------------|------------|
| **1** | Bug Online Count | Baixa | 30min |
| **2** | Sound Dropdown, 25 Icones Conquistas, Icones Leaderboard | Media | 4-5h |
| **3** | Landing Header | Baixa | 30min-1h |
| **4** | BugReport Design | Media | 1-2h |
| **5** | Game Menu | Media-Alta | 2-3h |
| **6** | SinglePlayer Multi-Bot | Alta | 4-6h |

**Total Estimado:** 12-18 horas

---

# Checklist de Verificacao Final

## Sprint 1
- [ ] Bug Online Count corrigido
- [ ] ~~Modal Escape~~ (JA FEITO)

## Sprint 2
- [ ] Sound Dropdown com click ao inves de hover
- [ ] Sound Dropdown com click-outside para fechar
- [ ] 25 icones exclusivos de conquistas criados
- [ ] Icones de titulos no Leaderboard funcionando

## Sprint 3
- [ ] Header na landing page com link para portal

## Sprint 4
- [ ] BugReport com cores do portal (#10b981, #1a1a1a)
- [ ] BugReport com estrutura header/body/footer

## Sprint 5
- [ ] GameMenu abre com Escape durante jogo
- [ ] GameMenu permite ajustar volume
- [ ] GameMenu permite abandonar partida
- [ ] Confirmacao de abandono funcional

## Sprint 6
- [ ] Tela de setup do SinglePlayer
- [ ] Selecao de 1-3 bots
- [ ] Selecao de dificuldade por bot
- [ ] Partida funciona com multiplos bots
- [ ] AI diferenciada por dificuldade

## Geral
- [ ] Testes em mobile
- [ ] Testes em Chrome, Firefox, Safari
- [ ] Build de producao sem erros
- [ ] Performance aceitavel
