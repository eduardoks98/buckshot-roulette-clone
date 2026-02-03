// ==========================================
// SINGLEPLAYER SETUP - Configuracao de bots
// ==========================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DealerIcon, PlayersIcon, BackArrowIcon } from '../../components/icons';
import './SinglePlayerSetup.css';

// ==========================================
// TYPES
// ==========================================

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  id: string;
  name: string;
  difficulty: BotDifficulty;
}

export interface SinglePlayerConfig {
  bots: BotConfig[];
}

interface SinglePlayerSetupProps {
  onStartGame: (config: SinglePlayerConfig) => void;
}

// ==========================================
// CONSTANTS
// ==========================================

const BOT_NAMES = ['Dealer', 'Bot Alpha', 'Bot Beta'];

const DIFFICULTY_INFO: Record<BotDifficulty, { label: string; description: string; color: string }> = {
  easy: {
    label: 'Facil',
    description: 'Usa 20% dos itens, decisoes aleatorias',
    color: '#22c55e',
  },
  medium: {
    label: 'Medio',
    description: 'Usa 50% dos itens, considera probabilidades',
    color: '#f59e0b',
  },
  hard: {
    label: 'Dificil',
    description: 'Usa 70% dos itens, otimiza alvos',
    color: '#ef4444',
  },
};

// ==========================================
// COMPONENT
// ==========================================

export default function SinglePlayerSetup({ onStartGame }: SinglePlayerSetupProps) {
  const navigate = useNavigate();
  const [botCount, setBotCount] = useState(1);
  const [bots, setBots] = useState<BotConfig[]>([
    { id: 'bot-1', name: 'Dealer', difficulty: 'medium' },
  ]);

  // Update bot count
  const handleBotCountChange = useCallback((count: number) => {
    setBotCount(count);

    // Adjust bots array
    const newBots: BotConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (bots[i]) {
        newBots.push(bots[i]);
      } else {
        newBots.push({
          id: `bot-${i + 1}`,
          name: BOT_NAMES[i] || `Bot ${i + 1}`,
          difficulty: 'medium',
        });
      }
    }
    setBots(newBots);
  }, [bots]);

  // Update bot difficulty
  const handleDifficultyChange = useCallback((botIndex: number, difficulty: BotDifficulty) => {
    setBots(prev => {
      const newBots = [...prev];
      if (newBots[botIndex]) {
        newBots[botIndex] = { ...newBots[botIndex], difficulty };
      }
      return newBots;
    });
  }, []);

  // Start game
  const handleStart = useCallback(() => {
    onStartGame({ bots });
  }, [bots, onStartGame]);

  return (
    <div className="sp-setup">
      <div className="sp-setup__container">
        {/* Header */}
        <div className="sp-setup__header">
          <button className="sp-setup__back" onClick={() => navigate('/')}>
            <BackArrowIcon size={20} />
          </button>
          <h1 className="sp-setup__title">MODO TREINO</h1>
        </div>

        {/* Bot Count Selector */}
        <div className="sp-setup__section">
          <label className="sp-setup__label">
            <PlayersIcon size={18} />
            <span>Numero de Bots</span>
          </label>
          <div className="sp-setup__bot-count">
            {[1, 2, 3].map(count => (
              <button
                key={count}
                className={`sp-setup__count-btn ${botCount === count ? 'active' : ''}`}
                onClick={() => handleBotCountChange(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Bot Cards */}
        <div className="sp-setup__bots">
          {bots.map((bot, index) => (
            <div key={bot.id} className="sp-setup__bot-card">
              <div className="sp-setup__bot-header">
                <DealerIcon size={24} />
                <span className="sp-setup__bot-name">{bot.name}</span>
              </div>

              <div className="sp-setup__difficulty">
                <span className="sp-setup__difficulty-label">Dificuldade:</span>
                <div className="sp-setup__difficulty-options">
                  {(Object.keys(DIFFICULTY_INFO) as BotDifficulty[]).map(diff => {
                    const info = DIFFICULTY_INFO[diff];
                    const isSelected = bot.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        className={`sp-setup__diff-btn ${isSelected ? 'active' : ''}`}
                        style={{
                          '--diff-color': info.color,
                        } as React.CSSProperties}
                        onClick={() => handleDifficultyChange(index, diff)}
                        title={info.description}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="sp-setup__preview">
          <div className="sp-setup__preview-title">Preview da Partida</div>
          <div className="sp-setup__preview-players">
            <div className="sp-setup__preview-player sp-setup__preview-player--you">
              <span className="sp-setup__preview-icon">👤</span>
              <span>Voce</span>
            </div>
            <span className="sp-setup__preview-vs">vs</span>
            {bots.map((bot) => (
              <div key={bot.id} className="sp-setup__preview-player">
                <span className="sp-setup__preview-icon">🤖</span>
                <span>{bot.name}</span>
                <span
                  className="sp-setup__preview-diff"
                  style={{ color: DIFFICULTY_INFO[bot.difficulty].color }}
                >
                  ({DIFFICULTY_INFO[bot.difficulty].label})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button className="sp-setup__start-btn" onClick={handleStart}>
          INICIAR PARTIDA
        </button>
      </div>
    </div>
  );
}
