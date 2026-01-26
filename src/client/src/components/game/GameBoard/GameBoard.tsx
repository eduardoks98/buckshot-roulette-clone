// ==========================================
// GAME BOARD COMPONENT - Shared UI for Single/Multiplayer
// ==========================================

import { useMemo } from 'react';
import './GameBoard.css';

// ========================================
// TYPES
// ========================================

export interface GamePlayer {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  items: GameItem[];
  handcuffed: boolean;
  sawedOff: boolean;
  alive: boolean;
  roundWins?: number;
}

export interface GameItem {
  id: string;
  emoji: string;
  name: string;
}

export interface ShellInfo {
  total: number;
  live: number;
  blank: number;
}

export interface ShotResult {
  type: 'live' | 'blank';
  shooter: string;
  target: string;
  damage: number;
}

export interface RoundAnnouncement {
  round: number;
  live: number;
  blank: number;
  hp: number;
}

export interface StealModalData {
  playerId: string;
  playerName: string;
  items: GameItem[];
}

export interface GameBoardProps {
  // Game State
  round: number;
  maxRounds: number;
  shells: ShellInfo;
  currentPlayerId: string;
  myId: string;

  // Players
  opponents: GamePlayer[];
  me: GamePlayer | null;
  myItems: GameItem[];

  // UI State
  isMyTurn: boolean;
  selectedTarget: string | null;
  revealedShell: 'live' | 'blank' | null;
  message: string;
  turnTimer?: number;

  // Overlays
  roundAnnouncement: RoundAnnouncement | null;
  lastShotResult: ShotResult | null;
  stealModalData: StealModalData | null;
  gameOverData: React.ReactNode | null;

  // Animations
  shotAnimation: 'live' | 'blank' | null;
  damagedPlayerId: string | null;
  healedPlayerId: string | null;
  playerLastShell: Record<string, 'live' | 'blank'>;

  // Actions
  onSelectTarget: (playerId: string) => void;
  onShoot: (targetId: string) => void;
  onShootSelf: () => void;
  onUseItem: (itemIndex: number) => void;
  onStealItem?: (itemIndex: number) => void;
  onCancelSteal?: () => void;
  onBack: () => void;

  // Extra content
  children?: React.ReactNode;
}

// ========================================
// HELPER: Shell Icons
// ========================================

function ShellIcons({ live, blank }: { live: number; blank: number }) {
  const shells: JSX.Element[] = [];

  for (let i = 0; i < live; i++) {
    shells.push(
      <div key={`live-${i}`} className="shell-icon live" title="LIVE">
        <div className="shell-tip"></div>
      </div>
    );
  }

  for (let i = 0; i < blank; i++) {
    shells.push(
      <div key={`blank-${i}`} className="shell-icon blank" title="BLANK">
        <div className="shell-tip"></div>
      </div>
    );
  }

  return <div className="shells-visual">{shells}</div>;
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function GameBoard({
  round,
  maxRounds,
  shells,
  currentPlayerId,
  myId,
  opponents,
  me,
  myItems,
  isMyTurn,
  selectedTarget,
  revealedShell,
  message,
  turnTimer,
  roundAnnouncement,
  lastShotResult,
  stealModalData,
  gameOverData,
  shotAnimation,
  damagedPlayerId,
  healedPlayerId,
  playerLastShell,
  onSelectTarget,
  onShoot,
  onShootSelf,
  onUseItem,
  onStealItem,
  onCancelSteal,
  onBack,
  children,
}: GameBoardProps) {
  // Check if any overlay is active (blocks interactions)
  const hasActiveOverlay = useMemo(() => {
    return roundAnnouncement !== null ||
           lastShotResult !== null ||
           gameOverData !== null ||
           stealModalData !== null;
  }, [roundAnnouncement, lastShotResult, gameOverData, stealModalData]);

  const canAct = isMyTurn && !hasActiveOverlay;

  return (
    <div className="game-board">
      {/* ========== HEADER ========== */}
      <div className="game-header">
        <div className="round-info">Rodada {round}/{maxRounds}</div>
        <div className="shells-info">
          <span className="shells-remaining">{shells.total} CARTUCHOS</span>
        </div>
        {turnTimer !== undefined && isMyTurn && (
          <div className={`turn-timer ${turnTimer <= 10 ? 'warning' : turnTimer <= 30 ? 'caution' : ''}`}>
            {turnTimer}s
          </div>
        )}
        <button className="back-btn-small" onClick={onBack}>← Sair</button>
      </div>

      {/* ========== MESSAGE ========== */}
      {message && !roundAnnouncement && !lastShotResult && !gameOverData && (
        <div className="game-message">{message}</div>
      )}

      {/* ========== REVEALED SHELL (Magnifying Glass) ========== */}
      {revealedShell && !gameOverData && (
        <div className={`revealed-shell ${revealedShell}`}>
          Proximo cartucho: {revealedShell === 'live' ? 'VIVA' : 'VAZIA'}
        </div>
      )}

      {/* ========== OPPONENTS AREA ========== */}
      <div className="opponents-area">
        {opponents.map(player => (
          <div
            key={player.id}
            className={`opponent-card ${player.id === currentPlayerId ? 'active' : ''} ${player.id === selectedTarget ? 'selected' : ''} ${!player.alive ? 'dead' : ''} ${player.id === damagedPlayerId ? 'damage' : ''} ${player.id === healedPlayerId ? 'heal' : ''}`}
            onClick={() => player.alive && onSelectTarget(player.id)}
          >
            <div className="opponent-name">
              {player.name}
              {player.roundWins !== undefined && player.roundWins > 0 && (
                <span className="round-wins">🏆{player.roundWins}</span>
              )}
              {player.handcuffed && <span className="status-icon">🔗</span>}
              {player.sawedOff && <span className="status-icon">🪚</span>}
            </div>
            <div className="opponent-hp">
              {Array.from({ length: player.maxHp }).map((_, i) => (
                <span key={i} className={`hp-heart ${i < player.hp ? 'full' : 'empty'}`}>
                  {i < player.hp ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
            <div className="opponent-items">
              {player.items.slice(0, 8).map((item, i) => (
                <span key={i} className="item-icon">{item.emoji}</span>
              ))}
            </div>

            {/* Spent shell indicator */}
            {playerLastShell[player.id] && (
              <div className={`player-spent-shell ${playerLastShell[player.id]}`} />
            )}
          </div>
        ))}
      </div>

      {/* ========== SHOTGUN AREA ========== */}
      <div className="shotgun-area">
        <div className={`shotgun ${isMyTurn ? 'active' : ''} ${shotAnimation ? `shot-${shotAnimation}` : ''}`}>
          <div className="shotgun-barrel"></div>
          <div className="shotgun-body"></div>
          {shotAnimation && <div className={`muzzle-flash ${shotAnimation}`}></div>}
        </div>

        {/* Shoot buttons - IDENTICAL for SinglePlayer and Multiplayer */}
        {isMyTurn && !hasActiveOverlay && selectedTarget && (
          <button
            className={`shoot-btn ${!canAct ? 'disabled' : ''}`}
            onClick={() => onShoot(selectedTarget)}
            disabled={!canAct}
          >
            ATIRAR
          </button>
        )}

        {isMyTurn && !hasActiveOverlay && !selectedTarget && (
          <div className="shoot-options">
            <button
              className={`shoot-self-btn ${!canAct ? 'disabled' : ''}`}
              onClick={onShootSelf}
              disabled={!canAct}
            >
              Atirar em Si
            </button>
            <p className="shoot-hint">ou selecione um oponente</p>
          </div>
        )}
      </div>

      {/* ========== MY STATUS ========== */}
      <div className={`my-status ${myId === damagedPlayerId ? 'damage' : ''} ${myId === healedPlayerId ? 'heal' : ''}`}>
        {/* My spent shell */}
        {playerLastShell[myId] && (
          <div className={`my-spent-shell ${playerLastShell[myId]}`} />
        )}

        {me && me.roundWins !== undefined && me.roundWins > 0 && (
          <span className="my-round-wins">🏆 {me.roundWins}</span>
        )}

        <div className="my-hp">
          {Array.from({ length: me?.maxHp || 0 }).map((_, i) => (
            <span key={i} className={`hp-heart ${i < (me?.hp || 0) ? 'full' : 'empty'}`}>
              {i < (me?.hp || 0) ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        {me?.handcuffed && <span className="my-status-effect">Algemado</span>}
        {me?.sawedOff && <span className="my-status-effect">Serrada (2x dano)</span>}
      </div>

      {/* ========== MY ITEMS ========== */}
      <div className="my-items">
        {myItems.map((item, index) => (
          <button
            key={index}
            className={`item-btn ${hasActiveOverlay ? 'disabled' : ''}`}
            onClick={() => canAct && onUseItem(index)}
            disabled={!canAct}
            title={item.name}
          >
            {item.emoji}
          </button>
        ))}
        {myItems.length === 0 && <p className="no-items">Sem itens</p>}
      </div>

      {/* ========== WAITING TURN ========== */}
      {!isMyTurn && !hasActiveOverlay && (
        <div className="waiting-turn">
          Vez de {opponents.find(p => p.id === currentPlayerId)?.name || 'outro jogador'}...
        </div>
      )}

      {/* ========== ROUND ANNOUNCEMENT OVERLAY ========== */}
      {roundAnnouncement && !gameOverData && (
        <div className="round-announcement-overlay">
          <div className="round-announcement">
            <h2>🎯 RODADA {roundAnnouncement.round}</h2>
            <div className="shell-distribution">
              <div className="shells-visual-container">
                <ShellIcons live={roundAnnouncement.live} blank={roundAnnouncement.blank} />
              </div>
              <div className="shell-legend">
                <span className="legend-item live">🔴 {roundAnnouncement.live} LIVE</span>
                <span className="legend-item blank">🔵 {roundAnnouncement.blank} BLANK</span>
              </div>
            </div>
            <div className="hp-announcement">❤️ {roundAnnouncement.hp} HP cada</div>
          </div>
        </div>
      )}

      {/* ========== SHOT RESULT OVERLAY ========== */}
      {lastShotResult && !gameOverData && (
        <div className={`shot-result-overlay ${lastShotResult.type}`}>
          <div className="shot-result">
            {lastShotResult.type === 'live' ? (
              <>
                <div className="shot-icon">💥</div>
                <div className="shot-text">BALA REAL!</div>
                <div className="shot-damage">-{lastShotResult.damage} HP</div>
              </>
            ) : (
              <>
                <div className="shot-icon">💨</div>
                <div className="shot-text">VAZIA</div>
                <div className="shot-info">Sem dano</div>
              </>
            )}
            <div className="shot-details">
              {lastShotResult.shooter} → {lastShotResult.target}
            </div>
          </div>
        </div>
      )}

      {/* ========== STEAL MODAL (Adrenaline) ========== */}
      {stealModalData && !gameOverData && onStealItem && onCancelSteal && (
        <div className="steal-modal-overlay">
          <div className="steal-modal">
            <h3>💉 Roubar item de {stealModalData.playerName}</h3>
            <p className="steal-instruction">Selecione um item para roubar e USAR IMEDIATAMENTE:</p>
            <div className="steal-items">
              {stealModalData.items.filter(item => item.id !== 'adrenaline').length > 0 ? (
                stealModalData.items
                  .map((item, index) => ({ item, originalIndex: index }))
                  .filter(({ item }) => item.id !== 'adrenaline')
                  .map(({ item, originalIndex }) => (
                    <button
                      key={originalIndex}
                      className="steal-item-btn"
                      onClick={() => onStealItem(originalIndex)}
                      title={`${item.name} (será usado imediatamente)`}
                    >
                      <span className="steal-item-emoji">{item.emoji}</span>
                      <span className="steal-item-name">{item.name}</span>
                    </button>
                  ))
              ) : (
                <p className="no-items-to-steal">Sem itens roubáveis!</p>
              )}
            </div>
            <button className="steal-cancel-btn" onClick={onCancelSteal}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========== GAME OVER (rendered from parent) ========== */}
      {gameOverData}

      {/* ========== EXTRA CONTENT (bug report, etc) ========== */}
      {children}
    </div>
  );
}
