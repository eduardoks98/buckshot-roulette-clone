// ==========================================
// SOUND CONTROL - Controle de volume e música
// ==========================================

import { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../../audio';
import { VolumeIcon } from '../../icons';
import './SoundControl.css';

interface SoundControlProps {
  compact?: boolean;
}

export function SoundControl({ compact = false }: SoundControlProps) {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(soundManager.isMusicEnabled());
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume());
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundManager.loadSettings();
    setEnabled(soundManager.isEnabled());
    setVolume(soundManager.getVolume());
    setMusicEnabled(soundManager.isMusicEnabled());
    setMusicVolume(soundManager.getMusicVolume());
  }, []);

  // Click outside para fechar o painel
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

  const toggleSound = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
  };

  const toggleMusic = () => {
    const newEnabled = !musicEnabled;
    setMusicEnabled(newEnabled);
    soundManager.setMusicEnabled(newEnabled);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    soundManager.setMusicVolume(newVolume);
  };

  const getVolumeLevel = (): 'off' | 'muted' | 'low' | 'medium' | 'high' => {
    if (!enabled || volume === 0) return 'muted';
    if (volume < 0.3) return 'low';
    if (volume < 0.7) return 'medium';
    return 'high';
  };

  if (compact) {
    return (
      <button
        className="sound-control sound-control--compact"
        onClick={toggleSound}
        title={enabled ? 'Desativar som' : 'Ativar som'}
      >
        <VolumeIcon size={20} level={getVolumeLevel()} />
      </button>
    );
  }

  const togglePanel = () => setShowPanel(!showPanel);

  return (
    <div className="sound-control" ref={panelRef}>
      <button
        className="sound-control__btn"
        onClick={togglePanel}
        title="Configurações de áudio"
      >
        <VolumeIcon size={20} level={getVolumeLevel()} />
      </button>

      {showPanel && (
        <div className="sound-control__panel">
          <div className="sound-control__panel-inner">
            {/* Sound Effects */}
            <div className="sound-control__section">
              <div className="sound-control__header">
                <span className="sound-control__label">Efeitos</span>
                <button
                  className={`sound-control__toggle ${enabled ? 'active' : ''}`}
                  onClick={toggleSound}
                >
                  {enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {enabled && (
                <div className="sound-control__slider-row">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="sound-control__slider"
                  />
                  <span className="sound-control__value">{Math.round(volume * 100)}%</span>
                </div>
              )}
            </div>

            {/* Music */}
            <div className="sound-control__section">
              <div className="sound-control__header">
                <span className="sound-control__label">Música</span>
                <button
                  className={`sound-control__toggle ${musicEnabled ? 'active' : ''}`}
                  onClick={toggleMusic}
                >
                  {musicEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {musicEnabled && (
                <div className="sound-control__slider-row">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={musicVolume}
                    onChange={handleMusicVolumeChange}
                    className="sound-control__slider"
                  />
                  <span className="sound-control__value">{Math.round(musicVolume * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SoundControl;
