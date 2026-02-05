// ==========================================
// DEBUG PAGE - Unified testing page (admin only)
// ==========================================

import { useState, useCallback, useRef, useEffect, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  RevolverCylinderWithSound,
  RevolverCylinderWithSoundRef,
  RevealedChamber
} from '../../components/game/RevolverCylinder';
import { SoundControl } from '../../components/common/SoundControl';
import { WaveformVisualizer } from '../../components/common/WaveformVisualizer';
import { useSounds } from '../../audio/useSounds';
import { audioTrimmer, AUDIO_TRIM_CONFIGS, TrimResult } from '../../audio/AudioTrimmer';
import {
  MagnifyingGlassIcon,
  BeerIcon,
  CigaretteIcon,
  HandcuffsIcon,
  HandSawIcon,
  PhoneIcon,
  InverterIcon,
  AdrenalineIcon,
  MedicineIcon,
  TurnReverserIcon,
  RankIcon,
} from '../../components/icons';
import { getRankColor } from '../../utils/helpers';
import { GameMode } from '../../../../shared';
import './Debug.css';

// ==========================================
// TYPES
// ==========================================

type DebugTab = 'audio' | 'gameplay' | 'ranks';

interface AudioItem {
  id: string;
  name: string;
  icon?: string;
  Icon?: ComponentType<{ size?: number }>;
}


// Categorias de audio para o editor
const AUDIO_CATEGORIES: Record<string, { label: string; items: AudioItem[] }> = {
  shots: {
    label: 'Tiros',
    items: [
      { id: 'sfx/shot-live.mp3', name: 'Live', icon: '💥' },
      { id: 'sfx/shot-blank.mp3', name: 'Blank', icon: '💨' },
      { id: 'sfx/revolver-spin.mp3', name: 'Spin', icon: '🔄' },
      { id: 'sfx/revolver-cocking.mp3', name: 'Cocking', icon: '⚙️' },
      { id: 'sfx/damage.mp3', name: 'Dano', icon: '💔' },
      { id: 'sfx/heal.mp3', name: 'Cura', icon: '💚' },
      { id: 'sfx/reload.mp3', name: 'Reload', icon: '🔃' },
    ]
  },
  items: {
    label: 'Itens',
    items: [
      { id: 'sfx/items/magnifying-glass.mp3', name: 'Lupa', Icon: MagnifyingGlassIcon },
      { id: 'sfx/items/beer.mp3', name: 'Cerveja', Icon: BeerIcon },
      { id: 'sfx/items/cigarette.mp3', name: 'Cigarro', Icon: CigaretteIcon },
      { id: 'sfx/items/handcuffs.mp3', name: 'Algemas', Icon: HandcuffsIcon },
      { id: 'sfx/items/handsaw.mp3', name: 'Serra', Icon: HandSawIcon },
      { id: 'sfx/items/phone.mp3', name: 'Telefone', Icon: PhoneIcon },
      { id: 'sfx/items/inverter.mp3', name: 'Inversor', Icon: InverterIcon },
      { id: 'sfx/items/adrenaline.mp3', name: 'Adrenalina', Icon: AdrenalineIcon },
      { id: 'sfx/items/medicine.mp3', name: 'Remedio', Icon: MedicineIcon },
      { id: 'sfx/items/turn-reverser.mp3', name: 'Reversor', Icon: TurnReverserIcon },
    ]
  },
  ui: {
    label: 'UI',
    items: [
      { id: 'sfx/ui/click.mp3', name: 'Click', icon: '👆' },
      { id: 'sfx/ui/hover.mp3', name: 'Hover', icon: '✋' },
      { id: 'sfx/ui/success.mp3', name: 'Sucesso', icon: '✅' },
      { id: 'sfx/ui/error.mp3', name: 'Erro', icon: '❌' },
      { id: 'sfx/ui/join-room.mp3', name: 'Entrar', icon: '🚪' },
      { id: 'sfx/ui/leave-room.mp3', name: 'Sair', icon: '🚶' },
    ]
  },
  game: {
    label: 'Game',
    items: [
      { id: 'sfx/round-start.mp3', name: 'Round Start', icon: '🎬' },
      { id: 'sfx/round-win.mp3', name: 'Round Win', icon: '🏆' },
      { id: 'sfx/turn-change.mp3', name: 'Turno', icon: '🔀' },
      { id: 'sfx/timer-warning.mp3', name: 'Timer', icon: '⏰' },
      { id: 'sfx/game-over-win.mp3', name: 'Vitoria', icon: '🎉' },
      { id: 'sfx/game-over-lose.mp3', name: 'Derrota', icon: '💀' },
    ]
  },
};

// ==========================================
// AUDIO SECTION
// ==========================================

function AudioSection() {
  const sounds = useSounds();
  const cylinderRef = useRef<RevolverCylinderWithSoundRef>(null);

  // Estado para RevolverCylinderWithSound
  const [unifiedCylinderState, setUnifiedCylinderState] = useState({
    totalChambers: 8,
    remainingShells: 8,
    currentPosition: 0,
    revealedChambers: [] as RevealedChamber[],
    spentChambers: [] as number[],
  });

  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [isShootingUnified, setIsShootingUnified] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('shots');
  const [customTrimFile, setCustomTrimFile] = useState('sfx/revolver-spin.mp3');
  const [customTrimConfig, setCustomTrimConfig] = useState({
    duration: 0.8,
    fadeIn: 0,
    fadeOut: 0.1,
    start: 0,
    speed: 1.0,
  });
  const [customTrimResult, setCustomTrimResult] = useState<TrimResult | null>(null);
  const [customTrimLoading, setCustomTrimLoading] = useState(false);
  const [customAudioBuffer, setCustomAudioBuffer] = useState<AudioBuffer | null>(null);
  const [customAudioLoading, setCustomAudioLoading] = useState(false);
  const [reverbAmount, setReverbAmount] = useState(0);

  const handleReverbChange = useCallback((value: number) => {
    setReverbAmount(value);
    audioTrimmer.setReverbAmount(value);
  }, []);

  useEffect(() => {
    const loadAudioAndConfig = async () => {
      const savedConfig = AUDIO_TRIM_CONFIGS[customTrimFile];
      if (savedConfig) {
        setCustomTrimConfig({
          duration: savedConfig.duration,
          fadeIn: savedConfig.fadeIn ?? 0,
          fadeOut: savedConfig.fadeOut ?? 0,
          start: savedConfig.start ?? 0,
          speed: savedConfig.speed ?? 1.0,
        });
      }

      setCustomTrimResult(null);
      setCustomAudioLoading(true);
      try {
        const url = `/audio/${customTrimFile}`;
        const buffer = await audioTrimmer.loadAudio(url);
        setCustomAudioBuffer(buffer);
      } catch (err) {
        console.error('Erro ao carregar audio:', err);
        setCustomAudioBuffer(null);
      } finally {
        setCustomAudioLoading(false);
      }
    };

    loadAudioAndConfig();
  }, [customTrimFile]);

  const handleShot = useCallback((isLive: boolean) => {
    if (isShootingUnified) return;

    const soundName = `shot-sequence-${isLive ? 'live' : 'blank'}`;
    setLastPlayed(soundName);
    setIsShootingUnified(true);

    cylinderRef.current?.triggerShot(isLive);

    setUnifiedCylinderState(prev => ({
      ...prev,
      spentChambers: [...prev.spentChambers, prev.currentPosition],
      currentPosition: (prev.currentPosition + 1) % prev.totalChambers,
      remainingShells: Math.max(0, prev.remainingShells - 1),
    }));

    setTimeout(() => setIsShootingUnified(false), 600);
  }, [isShootingUnified]);

  const handleReloadSpin = useCallback(() => {
    if (isShootingUnified) return;

    setLastPlayed('reload-spin');
    setIsShootingUnified(true);
    cylinderRef.current?.triggerReloadSpin();
    setTimeout(() => setIsShootingUnified(false), 900);
  }, [isShootingUnified]);

  const handleResetCylinder = useCallback(() => {
    setUnifiedCylinderState({
      totalChambers: 8,
      remainingShells: 8,
      currentPosition: 0,
      revealedChambers: [],
      spentChambers: [],
    });
  }, []);

  const handleRevealChamber = useCallback((type: 'live' | 'blank') => {
    setUnifiedCylinderState(prev => ({
      ...prev,
      revealedChambers: [...prev.revealedChambers, { position: prev.currentPosition, type }],
    }));
  }, []);

  const handleCustomTrim = useCallback(async () => {
    setCustomTrimLoading(true);
    setCustomTrimResult(null);
    try {
      const url = `/audio/${customTrimFile}`;
      const result = await audioTrimmer.processAudio(url, customTrimConfig);
      setCustomTrimResult(result);
      setLastPlayed(`custom-trim-${customTrimFile}`);
    } catch (err) {
      console.error('Erro ao processar:', err);
    } finally {
      setCustomTrimLoading(false);
    }
  }, [customTrimFile, customTrimConfig]);

  const handlePlayCustomTrim = useCallback(() => {
    if (customTrimResult) {
      audioTrimmer.playBuffer(customTrimResult.buffer);
      setLastPlayed('custom-trim-preview');
    }
  }, [customTrimResult]);

  const handlePlayOriginal = useCallback(async () => {
    try {
      const url = `/audio/${customTrimFile}`;
      const buffer = await audioTrimmer.loadAudio(url);
      audioTrimmer.playBuffer(buffer);
      setLastPlayed(`original-${customTrimFile}`);
    } catch (err) {
      console.error('Erro ao tocar original:', err);
    }
  }, [customTrimFile]);

  const handleCopyConfig = useCallback(() => {
    const configStr = `'${customTrimFile}': { duration: ${customTrimConfig.duration}, fadeIn: ${customTrimConfig.fadeIn}, fadeOut: ${customTrimConfig.fadeOut}, start: ${customTrimConfig.start}, speed: ${customTrimConfig.speed} },`;
    navigator.clipboard.writeText(configStr);
    setLastPlayed('config-copied');
  }, [customTrimFile, customTrimConfig]);

  const handleStopPlayback = useCallback(() => {
    audioTrimmer.stopPlayback();
    setLastPlayed('stopped');
  }, []);

  const handleWaveformSelectionChange = useCallback((newStart: number, newDuration: number) => {
    setCustomTrimConfig(prev => ({
      ...prev,
      start: Math.round(newStart * 100) / 100,
      duration: Math.round(newDuration * 100) / 100,
    }));
  }, []);

  return (
    <div className="debug-audio">
      {/* Controle de Volume Global */}
      <section className="debug-section">
        <h3>Controles de Volume</h3>
        <div className="debug-controls">
          <SoundControl />
          {lastPlayed && (
            <div className="debug-last-played">
              Ultimo som: <strong>{lastPlayed}</strong>
            </div>
          )}
        </div>
      </section>

      {/* Tiros com Animacao + Som */}
      <section className="debug-section">
        <h3>Tiros (com Animacao + Som)</h3>
        <div className="debug-cylinder-area">
          <RevolverCylinderWithSound
            ref={cylinderRef}
            totalChambers={unifiedCylinderState.totalChambers}
            remainingShells={unifiedCylinderState.remainingShells}
            currentPosition={unifiedCylinderState.currentPosition}
            revealedChambers={unifiedCylinderState.revealedChambers}
            spentChambers={unifiedCylinderState.spentChambers}
            isActive={true}
            size="lg"
            isSawed={false}
          />
          <div className="debug-cylinder-info">
            <span>Posicao: {unifiedCylinderState.currentPosition}</span>
            <span>Restantes: {unifiedCylinderState.remainingShells}</span>
          </div>
        </div>
        <div className="debug-buttons">
          <button
            className="debug-btn debug-btn--live"
            onClick={() => handleShot(true)}
            disabled={isShootingUnified}
          >
            Tiro LIVE
          </button>
          <button
            className="debug-btn debug-btn--blank"
            onClick={() => handleShot(false)}
            disabled={isShootingUnified}
          >
            Tiro BLANK
          </button>
          <button
            className="debug-btn debug-btn--secondary"
            onClick={handleResetCylinder}
          >
            Reset
          </button>
        </div>
        <div className="debug-buttons">
          <button
            className="debug-btn debug-btn--sequence"
            onClick={handleReloadSpin}
            disabled={isShootingUnified}
          >
            Spin (Reload)
          </button>
          <button
            className="debug-btn debug-btn--reveal-live"
            onClick={() => handleRevealChamber('live')}
          >
            Revelar LIVE
          </button>
          <button
            className="debug-btn debug-btn--reveal-blank"
            onClick={() => handleRevealChamber('blank')}
          >
            Revelar BLANK
          </button>
        </div>
      </section>

      {/* Musica */}
      <section className="debug-section">
        <h3>Musica Ambiente</h3>
        <div className="debug-buttons">
          <button
            className="debug-btn"
            onClick={() => {
              setLastPlayed('ambient-menu');
              sounds.playMusic('ambient-menu');
            }}
          >
            Menu
          </button>
          <button
            className="debug-btn"
            onClick={() => {
              setLastPlayed('ambient-game');
              sounds.playMusic('ambient-game');
            }}
          >
            Jogo
          </button>
          <button
            className="debug-btn debug-btn--secondary"
            onClick={() => {
              setLastPlayed('stop-music');
              sounds.stopMusic(true);
            }}
          >
            Parar
          </button>
        </div>
      </section>

      {/* Editor de Audio */}
      <section className="debug-section debug-section--highlight">
        <h3>Editor de Audio</h3>
        <p className="debug-subtitle">
          Selecione um arquivo, ajuste no waveform e copie a config!
        </p>

        <div className="debug-custom-trim">
          {/* Tabs de categorias */}
          <div className="audio-editor__categories">
            {Object.entries(AUDIO_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                className={`audio-editor__category-tab ${activeCategory === key ? 'audio-editor__category-tab--active' : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid de botoes com icones */}
          <div className="audio-editor__items-grid">
            {AUDIO_CATEGORIES[activeCategory]?.items.map(item => (
              <button
                key={item.id}
                className={`audio-editor__item-btn ${customTrimFile === item.id ? 'audio-editor__item-btn--selected' : ''}`}
                onClick={() => setCustomTrimFile(item.id)}
                title={item.id}
              >
                {item.Icon ? (
                  <item.Icon size={24} />
                ) : (
                  <span className="audio-editor__item-emoji">{item.icon}</span>
                )}
                <span className="audio-editor__item-name">{item.name}</span>
              </button>
            ))}
          </div>

          {/* Arquivo selecionado */}
          <div className="audio-editor__selected-file">
            {customTrimFile.split('/').pop()}
          </div>

          {/* Waveform Visualizer */}
          <WaveformVisualizer
            audioBuffer={customAudioBuffer}
            start={customTrimConfig.start}
            duration={customTrimConfig.duration}
            onSelectionChange={handleWaveformSelectionChange}
            isLoading={customAudioLoading}
          />

          {/* Controles de parametros */}
          <div className="debug-sequence-controls">
            <div className="debug-control-group">
              <label>Duration (s):</label>
              <input
                type="range"
                min="0.05"
                max={Math.max(5, customAudioBuffer?.duration ?? 5)}
                step="0.05"
                value={customTrimConfig.duration}
                onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
              />
              <span className="debug-value">{customTrimConfig.duration.toFixed(2)}s</span>
            </div>

            <div className="debug-control-group">
              <label>Speed:</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={customTrimConfig.speed}
                onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
              />
              <span className="debug-value">{customTrimConfig.speed.toFixed(1)}x</span>
            </div>

            <div className="debug-control-group">
              <label>Start (s):</label>
              <input
                type="range"
                min="0"
                max={Math.max(1, (customAudioBuffer?.duration ?? 1) - 0.1)}
                step="0.05"
                value={customTrimConfig.start}
                onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, start: parseFloat(e.target.value) }))}
              />
              <span className="debug-value">{customTrimConfig.start.toFixed(2)}s</span>
            </div>

            <div className="debug-control-group">
              <label>Fade In (s):</label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={customTrimConfig.fadeIn}
                onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, fadeIn: parseFloat(e.target.value) }))}
              />
              <span className="debug-value">{customTrimConfig.fadeIn.toFixed(2)}s</span>
            </div>

            <div className="debug-control-group">
              <label>Fade Out (s):</label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={customTrimConfig.fadeOut}
                onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, fadeOut: parseFloat(e.target.value) }))}
              />
              <span className="debug-value">{customTrimConfig.fadeOut.toFixed(2)}s</span>
            </div>

            <div className="debug-control-group debug-control-group--reverb">
              <label>Reverb:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={reverbAmount}
                onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
              />
              <span className="debug-value">{Math.round(reverbAmount * 100)}%</span>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="debug-buttons">
            <button
              className="debug-btn debug-btn--lose"
              onClick={handleStopPlayback}
            >
              Parar
            </button>
            <button
              className="debug-btn"
              onClick={handlePlayOriginal}
              disabled={customAudioLoading}
            >
              Original
            </button>
            <button
              className="debug-btn debug-btn--sequence"
              onClick={handleCustomTrim}
              disabled={customTrimLoading || customAudioLoading}
            >
              {customTrimLoading ? 'Processando...' : 'Processar'}
            </button>
            {customTrimResult && (
              <button
                className="debug-btn debug-btn--live"
                onClick={handlePlayCustomTrim}
              >
                Ouvir
              </button>
            )}
            <button
              className="debug-btn debug-btn--secondary"
              onClick={handleCopyConfig}
            >
              Copiar Config
            </button>
          </div>

          {/* Resultado */}
          {customTrimResult && (
            <div className="debug-trimmer-result">
              Original: {customTrimResult.originalDuration.toFixed(2)}s → Trimmed: {customTrimResult.trimmedDuration.toFixed(2)}s
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ==========================================
// GAMEPLAY SECTION - Uses server bots via socket
// ==========================================

type BotDifficulty = 'easy' | 'medium' | 'hard';
type LoadingState = 'idle' | 'connecting' | 'creating_room' | 'adding_bots' | 'starting';

interface BotConfig {
  difficulty: BotDifficulty;
  name: string;
}

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

function GameplaySection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, connect } = useSocket();

  // Auto-connect to socket when component mounts
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  // Bot configuration
  const [botCount, setBotCount] = useState(1);
  const [bots, setBots] = useState<BotConfig[]>([
    { difficulty: 'medium', name: 'Bot 1' },
  ]);
  const [rankEnabled, setRankEnabled] = useState(false);

  // Loading state
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [botsAdded, setBotsAdded] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && loadingState !== 'idle') {
        socket.emit('leaveRoom');
      }
    };
  }, [socket, loadingState]);

  // Update bot count
  const handleBotCountChange = useCallback((count: number) => {
    setBotCount(count);
    const newBots: BotConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (bots[i]) {
        newBots.push(bots[i]);
      } else {
        newBots.push({
          difficulty: 'medium',
          name: `Bot ${i + 1}`,
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

  // Start game with server bots
  const handleStartGame = useCallback(() => {
    if (!socket || !isConnected) {
      setError('Nao conectado ao servidor');
      return;
    }

    setLoadingState('connecting');
    setError(null);
    setBotsAdded(0);

    // Step 1: Create room in DEBUG mode
    setLoadingState('creating_room');

    const handleRoomCreated = (data: { code: string }) => {
      console.log('[Debug] Room created:', data.code);
      setLoadingState('adding_bots');

      // Step 2: Add bots one by one
      let currentBotIndex = 0;

      const addNextBot = () => {
        if (currentBotIndex < bots.length) {
          const bot = bots[currentBotIndex];
          socket.emit('addBot', {
            botName: bot.name,
            difficulty: bot.difficulty,
          });
        } else {
          // All bots added, start game
          setLoadingState('starting');
          socket.emit('startGame');
        }
      };

      const handleBotAdded = () => {
        currentBotIndex++;
        setBotsAdded(currentBotIndex);
        addNextBot();
      };

      const handleBotError = (data: { message: string }) => {
        console.error('[Debug] Bot error:', data.message);
        setError(data.message);
        setLoadingState('idle');
        socket.off('botAdded', handleBotAdded);
        socket.off('botError', handleBotError);
      };

      socket.on('botAdded', handleBotAdded);
      socket.on('botError', handleBotError);

      // Start adding bots
      addNextBot();
    };

    const handleRoundStarted = () => {
      console.log('[Debug] Game started, navigating to multiplayer');
      // Navigate to multiplayer game page
      navigate('/multiplayer/game');
      cleanup();
    };

    const handleJoinError = (message: string) => {
      console.error('[Debug] Join error:', message);
      setError(message);
      setLoadingState('idle');
      cleanup();
    };

    const handleStartError = (message: string) => {
      console.error('[Debug] Start error:', message);
      setError(message);
      setLoadingState('idle');
      cleanup();
    };

    const cleanup = () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roundStarted', handleRoundStarted);
      socket.off('joinError', handleJoinError);
      socket.off('startError', handleStartError);
    };

    // Set up listeners
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roundStarted', handleRoundStarted);
    socket.on('joinError', handleJoinError);
    socket.on('startError', handleStartError);

    // Create room with DEBUG mode
    socket.emit('createRoom', {
      playerName: user?.display_name || 'Debug Player',
      gameMode: GameMode.DEBUG,
      debugRankEnabled: rankEnabled,
    });
  }, [socket, isConnected, bots, rankEnabled, navigate, user]);

  // Loading screen
  if (loadingState !== 'idle') {
    const messages: Record<LoadingState, string> = {
      idle: '',
      connecting: 'Conectando ao servidor...',
      creating_room: 'Criando sala de debug...',
      adding_bots: `Adicionando bots (${botsAdded}/${bots.length})...`,
      starting: 'Iniciando partida...',
    };

    return (
      <div className="debug-gameplay debug-gameplay--loading">
        <div className="debug-loading">
          <div className="debug-loading__spinner" />
          <span className="debug-loading__text">{messages[loadingState]}</span>
          {error && <span className="debug-loading__error">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="debug-gameplay">
      <div className="debug-gameplay-setup">
        {/* Header */}
        <div className="debug-setup__header">
          <h3>Teste de Gameplay com Bots</h3>
          <p className="debug-setup__subtitle">
            Usa o mesmo sistema de bots do multiplayer (bot.service.ts do servidor)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="debug-setup__error">
            {error}
          </div>
        )}

        {/* Rank Toggle */}
        <div className="debug-setup__section debug-setup__section--rank">
          <label className="debug-setup__label">
            <RankIcon tier="Gold" size="sm" />
            <span>Progressao de Rank</span>
          </label>
          <div className="debug-setup__toggle-wrapper">
            <button
              className={`debug-setup__toggle ${rankEnabled ? 'debug-setup__toggle--active' : ''}`}
              onClick={() => setRankEnabled(!rankEnabled)}
            >
              <span className="debug-setup__toggle-track">
                <span className="debug-setup__toggle-thumb" />
              </span>
              <span className="debug-setup__toggle-label">
                {rankEnabled ? 'ATIVADO' : 'DESATIVADO'}
              </span>
            </button>
            <span className="debug-setup__toggle-hint">
              {rankEnabled
                ? 'LP/MMR/ELO serao alterados (para testes de ranking)'
                : 'Apenas Stats + XP (sem mudancas no rank)'}
            </span>
          </div>
        </div>

        {/* Bot Count */}
        <div className="debug-setup__section">
          <label className="debug-setup__label">
            <span>Numero de Bots</span>
          </label>
          <div className="debug-setup__bot-count">
            {[1, 2, 3].map(count => (
              <button
                key={count}
                className={`debug-setup__count-btn ${botCount === count ? 'active' : ''}`}
                onClick={() => handleBotCountChange(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Bot Cards */}
        <div className="debug-setup__bots">
          {bots.map((bot, index) => (
            <div key={index} className="debug-setup__bot-card">
              <div className="debug-setup__bot-header">
                <span className="debug-setup__bot-icon">🤖</span>
                <span className="debug-setup__bot-name">{bot.name}</span>
              </div>

              <div className="debug-setup__difficulty">
                <span className="debug-setup__difficulty-label">Dificuldade:</span>
                <div className="debug-setup__difficulty-options">
                  {(Object.keys(DIFFICULTY_INFO) as BotDifficulty[]).map(diff => {
                    const info = DIFFICULTY_INFO[diff];
                    const isSelected = bot.difficulty === diff;
                    return (
                      <button
                        key={diff}
                        className={`debug-setup__diff-btn ${isSelected ? 'active' : ''}`}
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

        {/* Start Button */}
        <button
          className="debug-setup__start-btn"
          onClick={handleStartGame}
          disabled={!isConnected}
        >
          {isConnected ? 'INICIAR TESTE' : 'CONECTANDO...'}
        </button>

        {/* Info */}
        <div className="debug-setup__info">
          <h4>Diferencas do modo Debug:</h4>
          <ul>
            <li>✅ Estatisticas sao registradas (kills, damage, etc)</li>
            <li>✅ XP e ganho normalmente</li>
            <li>{rankEnabled ? '✅' : '❌'} Mudancas de LP/MMR/ELO {rankEnabled ? '(ativado)' : '(desativado)'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// RANKS SECTION
// ==========================================

function RanksSection() {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
  const divisions = ['IV', 'III', 'II', 'I'];

  return (
    <div className="debug-ranks">
      <section className="debug-section">
        <h3>Tiers de Rank</h3>
        <div className="debug-ranks-grid">
          {tiers.map(tier => (
            <div key={tier} className="debug-rank-card">
              <RankIcon tier={tier} size="lg" />
              <span className="debug-rank-name" style={{ color: getRankColor(tier) }}>{tier}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="debug-section">
        <h3>Divisoes</h3>
        <p className="debug-subtitle">Cada tier (exceto Master+) tem 4 divisoes: IV, III, II, I</p>
        <div className="debug-divisions">
          {divisions.map(div => (
            <span key={div} className="debug-division">{div}</span>
          ))}
        </div>
      </section>

      <section className="debug-section">
        <h3>Exemplos Completos</h3>
        <div className="debug-rank-examples">
          {tiers.slice(0, 4).map(tier => (
            <div key={tier} className="debug-rank-example">
              <RankIcon tier={tier} size="md" />
              <div className="debug-rank-example-info">
                <span style={{ color: getRankColor(tier) }}>{tier} II</span>
                <span className="debug-rank-lp">75 LP</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="debug-section">
        <h3>Tamanhos de Icone</h3>
        <div className="debug-icon-sizes">
          <div className="debug-icon-size">
            <RankIcon tier="Diamond" size="xs" />
            <span>xs</span>
          </div>
          <div className="debug-icon-size">
            <RankIcon tier="Diamond" size="sm" />
            <span>sm</span>
          </div>
          <div className="debug-icon-size">
            <RankIcon tier="Diamond" size="md" />
            <span>md</span>
          </div>
          <div className="debug-icon-size">
            <RankIcon tier="Diamond" size="lg" />
            <span>lg</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Debug() {
  // const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DebugTab>('audio');

  // Protect: only admin can access
  // useEffect(() => {
  //   if (!isAdmin) {
  //     navigate('/');
  //   }
  // }, [isAdmin, navigate]);

  // if (!isAdmin) return null;

  return (
    <PageLayout title="Debug" onBack={() => navigate('/lobby')}>
      <div className="debug-page">
        {/* Tabs */}
        <nav className="debug-tabs">
          <button
            className={`debug-tab ${activeTab === 'audio' ? 'debug-tab--active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            Audio
          </button>
          <button
            className={`debug-tab ${activeTab === 'gameplay' ? 'debug-tab--active' : ''}`}
            onClick={() => setActiveTab('gameplay')}
          >
            Gameplay
          </button>
          <button
            className={`debug-tab ${activeTab === 'ranks' ? 'debug-tab--active' : ''}`}
            onClick={() => setActiveTab('ranks')}
          >
            Ranks
          </button>
        </nav>

        {/* Content */}
        <div className="debug-content">
          {activeTab === 'audio' && <AudioSection />}
          {activeTab === 'gameplay' && <GameplaySection />}
          {activeTab === 'ranks' && <RanksSection />}
        </div>
      </div>
    </PageLayout>
  );
}
