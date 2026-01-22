// ==========================================
// PLAYER CARD COMPONENT
// ==========================================

import { PlayerPublicState } from '../../../../../shared/types';
import HPDisplay from '../../common/HPDisplay/HPDisplay';
import './PlayerCard.css';

interface PlayerCardProps {
  player: PlayerPublicState;
  isCurrentTurn?: boolean;
  isSelected?: boolean;
  isMe?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export default function PlayerCard({
  player,
  isCurrentTurn = false,
  isSelected = false,
  isMe = false,
  onClick,
  compact = false,
}: PlayerCardProps) {
  const classes = [
    'player-card',
    isCurrentTurn && 'active',
    isSelected && 'selected',
    isMe && 'is-me',
    !player.alive && 'dead',
    player.disconnected && 'disconnected',
    compact && 'compact',
    onClick && 'clickable',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={player.alive ? onClick : undefined}>
      {/* Avatar */}
      <div className="player-avatar">
        {player.name.charAt(0).toUpperCase()}
        {player.disconnected && <span className="disconnect-icon">⚡</span>}
      </div>

      {/* Info */}
      <div className="player-info">
        <div className="player-name-row">
          <span className="player-name">{player.name}</span>
          {isMe && <span className="you-badge">Voce</span>}
        </div>

        {/* HP */}
        <HPDisplay current={player.hp} max={player.maxHp} size="sm" />

        {/* Status Effects */}
        {(player.handcuffed || player.sawedOff) && (
          <div className="player-status">
            {player.handcuffed && (
              <span className="status-effect handcuff" title="Algemado">
                🔗
              </span>
            )}
            {player.sawedOff && (
              <span className="status-effect sawed" title="Serrada (2x dano)">
                🪚
              </span>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      {!compact && player.items.length > 0 && (
        <div className="player-items">
          {player.items.slice(0, 7).map((item, i) => (
            <span key={i} className="item-icon" title={item.name}>
              {item.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Dead Overlay */}
      {!player.alive && <div className="dead-overlay">ELIMINADO</div>}
    </div>
  );
}
