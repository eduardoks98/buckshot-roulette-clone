// ==========================================
// GAME BOARD COMPONENT - Shared UI for Single/Multiplayer
// ==========================================

import { useMemo } from 'react';
import { RevolverCylinder } from '../RevolverCylinder';
import { RoundAnnouncementOverlay } from '../RoundAnnouncementOverlay';
import {
  HeartFullIcon,
  HeartEmptyIcon,
  TrophyIcon,
  ChainedIcon,
  HandSawIcon,
  ExplosionIcon,
  SmokeIcon,
  AdrenalineIcon,
  ITEM_ICONS,
  ItemIconId,
} from '../../icons';
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
  initialTotal?: number;  // Total shells at start of round (for cylinder display)
  currentPosition?: number;  // Current position in the cylinder (0 = first shell)
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

export interface ItemActionModal {
  itemId: string;
  emoji: string;
  name: string;
  playerName: string;
  message: string;
  result?: 'success' | 'fail';
  extraInfo?: string;
}

export type TurnDirection = 1 | -1;

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
  phoneRevealedPositions?: { position: number; type: 'live' | 'blank' }[];
  message: string;
  turnTimer?: number;

  // Overlays
  roundAnnouncement: RoundAnnouncement | null;
  lastShotResult: ShotResult | null;
  stealModalData: StealModalData | null;
  itemActionModal: ItemActionModal | null;
  gameOverData: React.ReactNode | null;

  // Direction
  turnDirection?: TurnDirection;

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
  onRoundAnnouncementComplete?: () => void;

  // Extra content
  children?: React.ReactNode;
}

// ========================================
// HELPER: Item Colors Map
// ========================================

const ITEM_COLORS: Record<string, string> = {
  magnifying_glass: '#4169e1', // Azul - informacao
  beer: '#d4a418',             // Dourado - cerveja
  cigarettes: '#4ade80',       // Verde - cura
  handcuffs: '#a0a0a0',        // Prata - metal
  hand_saw: '#e63946',         // Vermelho - perigo
  phone: '#22d3d4',            // Ciano - tecnologia
  inverter: '#a855f7',         // Roxo - inversao
  adrenaline: '#ec4899',       // Pink - energia
  expired_medicine: '#f97316', // Laranja - risco
  turn_reverser: '#38bdf8',    // Azul claro - ordem
};

// ========================================
// HELPER: Render Item Icon
// ========================================

function ItemIcon({ item, size = 20 }: { item: GameItem; size?: number }) {
  const IconComponent = ITEM_ICONS[item.id as ItemIconId];
  const itemColor = ITEM_COLORS[item.id] || 'var(--gold-accent, #d4a418)';

  if (IconComponent) {
    return <IconComponent size={size} color={itemColor} />;
  }
  // Fallback to emoji if no icon found
  return <span style={{ fontSize: size * 0.8 }}>{item.emoji}</span>;
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
  phoneRevealedPositions,
  message,
  turnTimer,
  roundAnnouncement,
  lastShotResult,
  stealModalData,
  itemActionModal,
  gameOverData,
  turnDirection = 1,
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
  onRoundAnnouncementComplete,
  children,
}: GameBoardProps) {
  // Check if any overlay is active (blocks interactions)
  const hasActiveOverlay = useMemo(() => {
    return roundAnnouncement !== null ||
           lastShotResult !== null ||
           gameOverData !== null ||
           stealModalData !== null ||
           itemActionModal !== null;
  }, [roundAnnouncement, lastShotResult, gameOverData, stealModalData, itemActionModal]);

  const canAct = isMyTurn && !hasActiveOverlay;

  return (
    <div className="game-board">
      {/* ========== HEADER ========== */}
      <div className="game-header">
        <div className="round-info">Rodada {round}/{maxRounds}</div>
        <div className={`direction-indicator ${turnDirection === 1 ? 'clockwise' : 'counter-clockwise'}`}>
          <svg viewBox="0 0 40 40" className="direction-svg">
            {/* Círculo de fundo */}
            <circle cx="20" cy="20" r="16" className="direction-circle" />
            {/* Seta curvada */}
            <path
              className="direction-arrow"
              d={turnDirection === 1
                ? "M12 20 A8 8 0 1 1 28 20" // Sentido horário
                : "M28 20 A8 8 0 1 0 12 20"  // Anti-horário
              }
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Ponta da seta */}
            <polygon
              className="direction-arrow-head"
              points={turnDirection === 1
                ? "28,16 32,20 28,24" // Ponta direita
                : "12,16 8,20 12,24"   // Ponta esquerda
              }
            />
          </svg>
        </div>
        <button className="back-btn-small" onClick={onBack}>Sair</button>
      </div>

      {/* ========== MESSAGE ========== */}
      {message && !roundAnnouncement && !lastShotResult && !gameOverData && (
        <div className="game-message">{message}</div>
      )}


      {/* ========== OPPONENTS AREA ========== */}
      <div className="opponents-area">
        {opponents.map(player => (
          <div
            key={player.id}
            className={`opponent-card ${player.id === currentPlayerId ? 'active' : ''} ${player.id === selectedTarget ? 'selected' : ''} ${!player.alive ? 'dead' : ''} ${player.id === damagedPlayerId ? 'damage' : ''} ${player.id === healedPlayerId ? 'heal' : ''}`}
            onClick={() => player.alive && onSelectTarget(player.id)}
          >
            {/* Turn indicator badge - shows on the active player's card */}
            {player.id === currentPlayerId && !hasActiveOverlay && (
              <div className="turn-badge">
                <span className="turn-badge-text">VEZ</span>
                {turnTimer !== undefined && (
                  <span className={`turn-badge-timer ${turnTimer <= 10 ? 'warning' : turnTimer <= 30 ? 'caution' : ''}`}>
                    {turnTimer}s
                  </span>
                )}
              </div>
            )}

            <div className="opponent-name">
              {player.name}
              {player.roundWins !== undefined && player.roundWins > 0 && (
                <span className="round-wins">
                  <TrophyIcon size={14} color="#fbbf24" />
                  {player.roundWins}
                </span>
              )}
              {player.handcuffed && <span className="status-icon"><ChainedIcon size={16} color="var(--gold-accent)" /></span>}
              {player.sawedOff && <span className="status-icon"><HandSawIcon size={16} color="var(--gold-accent)" /></span>}
            </div>
            <div className="opponent-hp">
              {Array.from({ length: player.maxHp }).map((_, i) => (
                <span key={i} className={`hp-heart ${i < player.hp ? 'full' : 'empty'}`}>
                  {i < player.hp ? <HeartFullIcon size={18} /> : <HeartEmptyIcon size={18} />}
                </span>
              ))}
            </div>
            <div className="opponent-items">
              {player.items.slice(0, 8).map((item, i) => (
                <span key={i} className="item-icon">
                  <ItemIcon item={item} size={18} />
                </span>
              ))}
            </div>

            {/* Spent shell indicator */}
            {playerLastShell[player.id] && (
              <div className={`player-spent-shell ${playerLastShell[player.id]}`} />
            )}
          </div>
        ))}
      </div>

      {/* ========== REVOLVER CYLINDER AREA ========== */}
      <div className="revolver-area">
        <RevolverCylinder
          totalChambers={shells.initialTotal || shells.total}
          remainingShells={shells.total}
          currentPosition={shells.currentPosition || 0}
          revealedChambers={[
            // Lupa - revela posição atual
            ...(revealedShell ? [{ position: shells.currentPosition || 0, type: revealedShell }] : []),
            // Phone - revela posições específicas
            ...(phoneRevealedPositions || [])
          ]}
          spentChambers={Array.from({ length: (shells.initialTotal || shells.total) - shells.total }, (_, i) => i)}
          isSpinning={shotAnimation !== null}
          isActive={isMyTurn}
          shotResult={shotAnimation}
          size="md"
        />

        {/* Shoot buttons */}
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
      <div className={`my-status ${myId === damagedPlayerId ? 'damage' : ''} ${myId === healedPlayerId ? 'heal' : ''} ${isMyTurn ? 'my-turn' : ''}`}>
        {/* Turn indicator badge - shows when it's my turn */}
        {isMyTurn && !hasActiveOverlay && (
          <div className="turn-badge my-turn-badge">
            {/* Spent shell inline with badge */}
            {playerLastShell[myId] && (
              <div className={`badge-spent-shell ${playerLastShell[myId]}`} />
            )}
            <span className="turn-badge-text">SUA VEZ</span>
            {turnTimer !== undefined && (
              <span className={`turn-badge-timer ${turnTimer <= 10 ? 'warning' : turnTimer <= 30 ? 'caution' : ''}`}>
                {turnTimer}s
              </span>
            )}
          </div>
        )}

        {/* My spent shell - only show when NOT my turn */}
        {!isMyTurn && playerLastShell[myId] && (
          <div className={`my-spent-shell ${playerLastShell[myId]}`} />
        )}

        {me && me.roundWins !== undefined && me.roundWins > 0 && (
          <span className="my-round-wins">
            <TrophyIcon size={18} color="#fbbf24" /> {me.roundWins}
          </span>
        )}

        <div className="my-hp">
          {Array.from({ length: me?.maxHp || 0 }).map((_, i) => (
            <span key={i} className={`hp-heart ${i < (me?.hp || 0) ? 'full' : 'empty'}`}>
              {i < (me?.hp || 0) ? <HeartFullIcon size={28} /> : <HeartEmptyIcon size={28} />}
            </span>
          ))}
        </div>

        {me?.handcuffed && (
          <span className="my-status-effect">
            <ChainedIcon size={16} color="var(--gold-accent)" /> Algemado
          </span>
        )}
        {me?.sawedOff && (
          <span className="my-status-effect">
            <HandSawIcon size={16} color="var(--gold-accent)" /> Serrada (2x dano)
          </span>
        )}
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
            <ItemIcon item={item} size={28} />
          </button>
        ))}
        {myItems.length === 0 && <p className="no-items">Sem itens</p>}
      </div>


      {/* ========== ROUND ANNOUNCEMENT OVERLAY ========== */}
      {roundAnnouncement && !gameOverData && (
        <RoundAnnouncementOverlay
          round={roundAnnouncement.round}
          live={roundAnnouncement.live}
          blank={roundAnnouncement.blank}
          hp={roundAnnouncement.hp}
          onAnimationComplete={onRoundAnnouncementComplete}
        />
      )}

      {/* ========== SHOT RESULT OVERLAY ========== */}
      {lastShotResult && !gameOverData && (
        <div className={`shot-result-overlay ${lastShotResult.type}`}>
          <div className="shot-result">
            {lastShotResult.type === 'live' ? (
              <>
                <div className="shot-icon"><ExplosionIcon size={80} /></div>
                <div className="shot-text">BALA REAL!</div>
                <div className="shot-damage">-{lastShotResult.damage} HP</div>
              </>
            ) : (
              <>
                <div className="shot-icon"><SmokeIcon size={80} /></div>
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
            <h3><AdrenalineIcon size={24} color="var(--gold-accent)" /> Roubar item de {stealModalData.playerName}</h3>
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
                      title={`${item.name} (sera usado imediatamente)`}
                    >
                      <span className="steal-item-emoji">
                        <ItemIcon item={item} size={32} />
                      </span>
                      <span className="steal-item-name">{item.name}</span>
                    </button>
                  ))
              ) : (
                <p className="no-items-to-steal">Sem itens roubaveis!</p>
              )}
            </div>
            <button className="steal-cancel-btn" onClick={onCancelSteal}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ========== ITEM ACTION MODAL ========== */}
      {itemActionModal && !gameOverData && (
        <div className="item-action-overlay">
          <div className={`item-action-modal ${itemActionModal.result || ''}`}>
            <div className="item-action-emoji">
              {(() => {
                const IconComponent = ITEM_ICONS[itemActionModal.itemId as ItemIconId];
                const itemColor = ITEM_COLORS[itemActionModal.itemId] || 'var(--gold-accent)';
                return IconComponent ? (
                  <IconComponent size={64} color={itemColor} />
                ) : (
                  itemActionModal.emoji
                );
              })()}
            </div>
            <div className="item-action-name">{itemActionModal.name}</div>
            <div className="item-action-player">{itemActionModal.playerName}</div>
            {itemActionModal.extraInfo && (
              <div className={`item-action-extra ${itemActionModal.extraInfo.includes('LIVE') || itemActionModal.extraInfo.includes('VIVA') ? 'live' : 'blank'}`}>
                {itemActionModal.extraInfo}
              </div>
            )}
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
