// ==========================================
// GAME MENU - Menu in-game para configuracoes
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { soundManager } from '../../../audio';
import { VolumeIcon, CloseIcon, LogoutIcon, SettingsIcon } from '../../icons';
import { WarningIcon } from '../../icons/status';
import './GameMenu.css';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAbandon: () => void;
  isSinglePlayer?: boolean;
}

export function GameMenu({ isOpen, onClose, onAbandon, isSinglePlayer = false }: GameMenuProps) {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundManager.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(soundManager.isMusicEnabled());
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume());
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  // Sync with sound manager on open
  useEffect(() => {
    if (isOpen) {
      setSoundEnabled(soundManager.isEnabled());
      setSoundVolume(soundManager.getVolume());
      setMusicEnabled(soundManager.isMusicEnabled());
      setMusicVolume(soundManager.getMusicVolume());
      setShowAbandonConfirm(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAbandonConfirm) {
          setShowAbandonConfirm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showAbandonConfirm, onClose]);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
  }, [soundEnabled]);

  const toggleMusic = useCallback(() => {
    const newEnabled = !musicEnabled;
    setMusicEnabled(newEnabled);
    soundManager.setMusicEnabled(newEnabled);
  }, [musicEnabled]);

  const handleSoundVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setSoundVolume(newVolume);
    soundManager.setVolume(newVolume);
  }, []);

  const handleMusicVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    soundManager.setMusicVolume(newVolume);
  }, []);

  const handleAbandonClick = useCallback(() => {
    setShowAbandonConfirm(true);
  }, []);

  const handleConfirmAbandon = useCallback(() => {
    onAbandon();
    onClose();
  }, [onAbandon, onClose]);

  const handleCancelAbandon = useCallback(() => {
    setShowAbandonConfirm(false);
  }, []);

  const getVolumeLevel = (): 'off' | 'muted' | 'low' | 'medium' | 'high' => {
    if (!soundEnabled || soundVolume === 0) return 'muted';
    if (soundVolume < 0.3) return 'low';
    if (soundVolume < 0.7) return 'medium';
    return 'high';
  };

  if (!isOpen) return null;

  return (
    <div className="game-menu-overlay" onClick={onClose}>
      <div className="game-menu" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="game-menu__header">
          <div className="game-menu__title">
            <SettingsIcon size={20} />
            <span>Menu</span>
          </div>
          <button className="game-menu__close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="game-menu__content">
          {showAbandonConfirm ? (
            <div className="game-menu__abandon-confirm">
              <div className="abandon-confirm__icon">
                <WarningIcon size={48} />
              </div>
              <h3>Abandonar Partida?</h3>
              <p>
                {isSinglePlayer
                  ? 'Seu progresso nesta partida sera perdido.'
                  : 'Voce perdera a partida e isso pode afetar seu ranking.'}
              </p>
              <div className="abandon-confirm__buttons">
                <button className="abandon-confirm__btn abandon-confirm__btn--cancel" onClick={handleCancelAbandon}>
                  Voltar
                </button>
                <button className="abandon-confirm__btn abandon-confirm__btn--confirm" onClick={handleConfirmAbandon}>
                  Abandonar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sound Effects Section */}
              <div className="game-menu__section">
                <div className="game-menu__section-header">
                  <div className="game-menu__section-title">
                    <VolumeIcon size={18} level={getVolumeLevel()} />
                    <span>Efeitos Sonoros</span>
                  </div>
                  <button
                    className={`game-menu__toggle ${soundEnabled ? 'active' : ''}`}
                    onClick={toggleSound}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {soundEnabled && (
                  <div className="game-menu__slider-row">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={handleSoundVolumeChange}
                      className="game-menu__slider"
                    />
                    <span className="game-menu__slider-value">{Math.round(soundVolume * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Music Section */}
              <div className="game-menu__section">
                <div className="game-menu__section-header">
                  <div className="game-menu__section-title">
                    <span className="game-menu__music-icon">&#9835;</span>
                    <span>Musica</span>
                  </div>
                  <button
                    className={`game-menu__toggle ${musicEnabled ? 'active' : ''}`}
                    onClick={toggleMusic}
                  >
                    {musicEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {musicEnabled && (
                  <div className="game-menu__slider-row">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={handleMusicVolumeChange}
                      className="game-menu__slider"
                    />
                    <span className="game-menu__slider-value">{Math.round(musicVolume * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="game-menu__divider" />

              {/* Abandon Button */}
              <button className="game-menu__abandon-btn" onClick={handleAbandonClick}>
                <LogoutIcon size={18} />
                <span>Abandonar Partida</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {!showAbandonConfirm && (
          <div className="game-menu__footer">
            <button className="game-menu__resume-btn" onClick={onClose}>
              Voltar ao Jogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameMenu;
