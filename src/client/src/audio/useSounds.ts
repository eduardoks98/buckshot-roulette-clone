// ==========================================
// USE SOUNDS - Hook React para gerenciar sons
// ==========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager, MusicName } from './SoundManager';

export function useSounds() {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundManager.getVolume());
  const [musicEnabled, setMusicEnabledState] = useState(soundManager.isMusicEnabled());
  const [musicVolume, setMusicVolumeState] = useState(soundManager.getMusicVolume());
  const timerWarningPlayed = useRef(false);

  useEffect(() => {
    soundManager.loadSettings();
    setSoundEnabled(soundManager.isEnabled());
    setSoundVolume(soundManager.getVolume());
    setMusicEnabledState(soundManager.isMusicEnabled());
    setMusicVolumeState(soundManager.getMusicVolume());
  }, []);

  const playShot = useCallback((isLive: boolean) => {
    soundManager.play(isLive ? 'shot-live' : 'shot-blank');
  }, []);

  const playDamage = useCallback(() => {
    soundManager.play('damage');
  }, []);

  const playHeal = useCallback(() => {
    soundManager.play('heal');
  }, []);

  const playItem = useCallback((itemId: string) => {
    soundManager.playItem(itemId);
  }, []);

  const playRoundStart = useCallback(() => {
    soundManager.play('round-start');
  }, []);

  const playRoundWin = useCallback(() => {
    soundManager.play('round-win');
  }, []);

  const playGameOver = useCallback((won: boolean) => {
    soundManager.play(won ? 'game-over-win' : 'game-over-lose');
  }, []);

  const playTurnChange = useCallback(() => {
    soundManager.play('turn-change');
  }, []);

  const playTimerWarning = useCallback(() => {
    soundManager.play('timer-warning', { volume: 0.5 });
  }, []);

  const playReload = useCallback(() => {
    soundManager.play('reload');
  }, []);

  // Reset timer warning flag (para novo turno)
  const resetTimerWarning = useCallback(() => {
    timerWarningPlayed.current = false;
  }, []);

  // Verifica e toca warning do timer se necessario
  const checkTimerWarning = useCallback((seconds: number) => {
    if (seconds === 10 && !timerWarningPlayed.current) {
      playTimerWarning();
      timerWarningPlayed.current = true;
    }
  }, [playTimerWarning]);

  const setEnabled = useCallback((enabled: boolean) => {
    soundManager.setEnabled(enabled);
    setSoundEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume);
    setSoundVolume(volume);
  }, []);

  // ==========================================
  // MUSIC FUNCTIONS
  // ==========================================

  const playMusic = useCallback((name: MusicName) => {
    soundManager.playMusic(name);
  }, []);

  const stopMusic = useCallback((fadeOut: boolean = true) => {
    soundManager.stopMusic(fadeOut);
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    soundManager.setMusicEnabled(enabled);
    setMusicEnabledState(enabled);
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    soundManager.setMusicVolume(volume);
    setMusicVolumeState(volume);
  }, []);

  // ==========================================
  // UI SOUND FUNCTIONS
  // ==========================================

  const playClick = useCallback(() => {
    soundManager.playClick();
  }, []);

  const playHover = useCallback(() => {
    soundManager.playHover();
  }, []);

  const playSuccess = useCallback(() => {
    soundManager.playSuccess();
  }, []);

  const playError = useCallback(() => {
    soundManager.playError();
  }, []);

  const playJoinRoom = useCallback(() => {
    soundManager.playJoinRoom();
  }, []);

  const playLeaveRoom = useCallback(() => {
    soundManager.playLeaveRoom();
  }, []);

  return {
    // Play functions - Game
    playShot,
    playDamage,
    playHeal,
    playItem,
    playRoundStart,
    playRoundWin,
    playGameOver,
    playTurnChange,
    playTimerWarning,
    playReload,

    // Play functions - UI
    playClick,
    playHover,
    playSuccess,
    playError,
    playJoinRoom,
    playLeaveRoom,

    // Music functions
    playMusic,
    stopMusic,

    // Timer helpers
    resetTimerWarning,
    checkTimerWarning,

    // Sound settings
    setEnabled,
    setVolume,
    isEnabled: soundEnabled,
    volume: soundVolume,

    // Music settings
    setMusicEnabled,
    setMusicVolume,
    isMusicEnabled: musicEnabled,
    musicVolume,
  };
}
