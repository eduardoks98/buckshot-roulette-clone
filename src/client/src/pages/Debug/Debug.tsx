// ==========================================
// DEBUG PAGE - Unified testing page (admin only)
// ==========================================

import { useState, useCallback, useRef, useEffect, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  RevolverCylinderWithSound,
  RevolverCylinderWithSoundRef,
  RevealedChamber
} from '../../components/game/RevolverCylinder';
import { GameBoard, GameBoardRef, GameItem, ShotResult, RoundAnnouncement, StealModalData } from '../../components/game';
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
  ITEM_ICONS,
  ItemIconId,
} from '../../components/icons';
import { getRankColor } from '../../utils/helpers';
import { ITEMS, ItemId } from '../../../../shared';
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

// Item colors for rendering
const ITEM_COLORS: Record<string, string> = {
  magnifying_glass: '#4169e1',
  beer: '#d4a418',
  cigarettes: '#4ade80',
  handcuffs: '#a0a0a0',
  hand_saw: '#e63946',
  phone: '#22d3d4',
  inverter: '#a855f7',
  adrenaline: '#ec4899',
  expired_medicine: '#f97316',
  turn_reverser: '#38bdf8',
};

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
// ITEM ICON HELPER
// ==========================================

function ItemIcon({ item, size = 20 }: { item: GameItem; size?: number }) {
  const IconComponent = ITEM_ICONS[item.id as ItemIconId];
  const itemColor = ITEM_COLORS[item.id] || 'var(--gold-accent, #d4a418)';

  if (IconComponent) {
    return <IconComponent size={size} color={itemColor} />;
  }
  return <span style={{ fontSize: size * 0.8 }}>{item.emoji}</span>;
}

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
// GAMEPLAY SECTION
// ==========================================

function GameplaySection() {
  const gameBoardRef = useRef<GameBoardRef>(null);
  const { playDamage, playHeal, playItem } = useSounds();

  // Game state
  const [myHp, setMyHp] = useState(4);
  const [myMaxHp, setMyMaxHp] = useState(4);
  const [opponentHp, setOpponentHp] = useState(4);
  const [opponentMaxHp, setOpponentMaxHp] = useState(4);
  const [myItems, setMyItems] = useState<GameItem[]>([]);
  const [opponentItems, setOpponentItems] = useState<GameItem[]>([]);
  const [shells, setShells] = useState({ total: 8, live: 4, blank: 4, initialTotal: 8, currentPosition: 0 });
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [revealedShell, setRevealedShell] = useState<'live' | 'blank' | null>(null);
  const [message, setMessage] = useState('');
  const [roundAnnouncement, setRoundAnnouncement] = useState<RoundAnnouncement | null>(null);
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  const [stealModalData, setStealModalData] = useState<StealModalData | null>(null);
  const [damagedPlayerId, setDamagedPlayerId] = useState<string | null>(null);
  const [healedPlayerId, setHealedPlayerId] = useState<string | null>(null);
  const [playerLastShell, setPlayerLastShell] = useState<Record<string, 'live' | 'blank'>>({});
  const [isSawed, setIsSawed] = useState(false);
  const [isHandcuffed, setIsHandcuffed] = useState(false);
  const [opponentHandcuffed, setOpponentHandcuffed] = useState(false);
  const [round, setRound] = useState(1);

  // Add item to my inventory
  const addItem = useCallback((itemId: ItemId) => {
    const item = ITEMS[itemId];
    if (item && myItems.length < 8) {
      setMyItems(prev => [...prev, { ...item }]);
    }
  }, [myItems.length]);

  // Add item to opponent inventory
  const addOpponentItem = useCallback((itemId: ItemId) => {
    const item = ITEMS[itemId];
    if (item && opponentItems.length < 8) {
      setOpponentItems(prev => [...prev, { ...item }]);
    }
  }, [opponentItems.length]);

  // Use item
  const handleUseItem = useCallback((index: number) => {
    const item = myItems[index];
    if (!item) return;

    playItem(item.id);
    const newItems = myItems.filter((_, i) => i !== index);
    setMyItems(newItems);

    switch (item.id) {
      case 'magnifying_glass':
        // Reveal current shell
        const shellType = Math.random() > 0.5 ? 'live' : 'blank';
        setRevealedShell(shellType);
        setMessage(`Cartucho atual: ${shellType === 'live' ? 'LIVE' : 'BLANK'}`);
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'beer':
        // Eject current shell
        const ejected = Math.random() > 0.5 ? 'live' : 'blank';
        setPlayerLastShell({ player: ejected });
        setShells(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          live: ejected === 'live' ? Math.max(0, prev.live - 1) : prev.live,
          blank: ejected === 'blank' ? Math.max(0, prev.blank - 1) : prev.blank,
          currentPosition: prev.currentPosition + 1,
        }));
        setRevealedShell(null);
        setMessage(`Ejetado: ${ejected === 'live' ? 'LIVE' : 'BLANK'}`);
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'cigarettes':
        playHeal();
        setMyHp(prev => Math.min(prev + 1, myMaxHp));
        setHealedPlayerId('player');
        setTimeout(() => setHealedPlayerId(null), 500);
        setMessage('+1 HP');
        setTimeout(() => setMessage(''), 1500);
        break;

      case 'handcuffs':
        setOpponentHandcuffed(true);
        setMessage('Oponente algemado!');
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'hand_saw':
        setIsSawed(true);
        setMessage('Proximo tiro: 2x dano!');
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'phone':
        const pos = Math.floor(Math.random() * shells.total) + 1;
        const type = Math.random() > 0.5 ? 'LIVE' : 'BLANK';
        setMessage(`Posicao ${pos}: ${type}`);
        setTimeout(() => setMessage(''), 3000);
        break;

      case 'inverter':
        setRevealedShell(null);
        setMessage('Cartucho invertido!');
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'adrenaline':
        if (opponentItems.length > 0) {
          setStealModalData({
            playerId: 'opponent',
            playerName: 'Oponente',
            items: opponentItems,
          });
        } else {
          setMessage('Sem itens para roubar');
          setTimeout(() => setMessage(''), 2000);
        }
        break;

      case 'expired_medicine':
        const success = Math.random() < 0.5;
        if (success) {
          playHeal();
          setMyHp(prev => Math.min(prev + 2, myMaxHp));
          setHealedPlayerId('player');
          setTimeout(() => setHealedPlayerId(null), 500);
          setMessage('Funcionou! +2 HP');
        } else {
          playDamage();
          setMyHp(prev => Math.max(prev - 1, 0));
          setDamagedPlayerId('player');
          setTimeout(() => setDamagedPlayerId(null), 500);
          setMessage('Vencido! -1 HP');
        }
        setTimeout(() => setMessage(''), 2000);
        break;

      case 'turn_reverser':
        setMessage('Ordem dos turnos invertida!');
        setTimeout(() => setMessage(''), 2000);
        break;
    }
  }, [myItems, opponentItems, shells.total, myMaxHp, playItem, playHeal, playDamage]);

  // Steal item
  const handleStealItem = useCallback((index: number) => {
    const stolenItem = opponentItems[index];
    setStealModalData(null);
    setOpponentItems(prev => prev.filter((_, i) => i !== index));
    setMyItems(prev => [...prev, stolenItem]);
    setMessage(`Roubou ${stolenItem.name}!`);
    setTimeout(() => setMessage(''), 2000);
  }, [opponentItems]);

  // Cancel steal
  const handleCancelSteal = useCallback(() => {
    setStealModalData(null);
    // Return adrenaline item
    setMyItems(prev => [...prev, { ...ITEMS.adrenaline }]);
  }, []);

  // Shoot
  const handleShoot = useCallback((targetId: string) => {
    const isLive = Math.random() > 0.5;
    gameBoardRef.current?.triggerShot(isLive);

    const damage = isSawed ? 2 : 1;
    setIsSawed(false);
    setRevealedShell(null);

    setPlayerLastShell({ player: isLive ? 'live' : 'blank' });
    setShells(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      live: isLive ? Math.max(0, prev.live - 1) : prev.live,
      blank: !isLive ? Math.max(0, prev.blank - 1) : prev.blank,
      currentPosition: prev.currentPosition + 1,
    }));

    setLastShotResult({
      type: isLive ? 'live' : 'blank',
      shooter: 'Voce',
      target: targetId === 'opponent' ? 'Oponente' : 'voce',
      damage: isLive ? damage : 0,
    });

    if (isLive) {
      playDamage();
      if (targetId === 'opponent') {
        setOpponentHp(prev => Math.max(prev - damage, 0));
        setDamagedPlayerId('opponent');
      } else {
        setMyHp(prev => Math.max(prev - damage, 0));
        setDamagedPlayerId('player');
      }
      setTimeout(() => setDamagedPlayerId(null), 600);
    }

    setTimeout(() => {
      setLastShotResult(null);
      setSelectedTarget(null);
    }, 2000);
  }, [isSawed, playDamage]);

  // Shoot self
  const handleShootSelf = useCallback(() => {
    handleShoot('player');
  }, [handleShoot]);

  // Select target
  const handleSelectTarget = useCallback((playerId: string) => {
    setSelectedTarget(prev => prev === playerId ? null : playerId);
  }, []);

  // Reload
  const handleReload = useCallback(() => {
    const live = Math.floor(Math.random() * 4) + 2;
    const blank = Math.floor(Math.random() * 4) + 2;
    setShells({ total: live + blank, live, blank, initialTotal: live + blank, currentPosition: 0 });
    setRevealedShell(null);
    gameBoardRef.current?.triggerReloadSpin();
    setRoundAnnouncement({ round, live, blank, hp: myMaxHp });
  }, [round, myMaxHp]);

  // Reset
  const handleReset = useCallback(() => {
    setMyHp(4);
    setMyMaxHp(4);
    setOpponentHp(4);
    setOpponentMaxHp(4);
    setMyItems([]);
    setOpponentItems([]);
    setShells({ total: 8, live: 4, blank: 4, initialTotal: 8, currentPosition: 0 });
    setIsMyTurn(true);
    setSelectedTarget(null);
    setRevealedShell(null);
    setMessage('');
    setRoundAnnouncement(null);
    setLastShotResult(null);
    setStealModalData(null);
    setDamagedPlayerId(null);
    setHealedPlayerId(null);
    setPlayerLastShell({});
    setIsSawed(false);
    setIsHandcuffed(false);
    setOpponentHandcuffed(false);
    setRound(1);
  }, []);

  const opponent = {
    id: 'opponent',
    name: 'Oponente',
    hp: opponentHp,
    maxHp: opponentMaxHp,
    items: opponentItems,
    handcuffed: opponentHandcuffed,
    sawedOff: false,
    alive: opponentHp > 0,
  };

  const me = {
    id: 'player',
    name: 'Voce',
    hp: myHp,
    maxHp: myMaxHp,
    items: myItems,
    handcuffed: isHandcuffed,
    sawedOff: isSawed,
    alive: myHp > 0,
  };

  return (
    <div className="debug-gameplay">
      {/* Debug Controls */}
      <div className="debug-gameplay-controls">
        <div className="debug-controls-section">
          <h4>Adicionar Itens (Meus)</h4>
          <div className="debug-items-grid">
            {(Object.keys(ITEMS) as ItemId[]).map(itemId => (
              <button
                key={itemId}
                className="debug-item-add-btn"
                onClick={() => addItem(itemId)}
                title={ITEMS[itemId].name}
              >
                <ItemIcon item={ITEMS[itemId]} size={24} />
              </button>
            ))}
          </div>
        </div>

        <div className="debug-controls-section">
          <h4>Adicionar Itens (Oponente)</h4>
          <div className="debug-items-grid">
            {(Object.keys(ITEMS) as ItemId[]).map(itemId => (
              <button
                key={itemId}
                className="debug-item-add-btn debug-item-add-btn--opponent"
                onClick={() => addOpponentItem(itemId)}
                title={ITEMS[itemId].name}
              >
                <ItemIcon item={ITEMS[itemId]} size={24} />
              </button>
            ))}
          </div>
        </div>

        <div className="debug-controls-section">
          <h4>Controles</h4>
          <div className="debug-hp-controls">
            <div className="debug-hp-row">
              <span>Meu HP:</span>
              <button onClick={() => setMyHp(h => Math.max(h - 1, 0))}>-</button>
              <span>{myHp}/{myMaxHp}</span>
              <button onClick={() => setMyHp(h => Math.min(h + 1, myMaxHp))}>+</button>
              <button onClick={() => setMyMaxHp(m => Math.min(m + 1, 6))}>+Max</button>
            </div>
            <div className="debug-hp-row">
              <span>Oponente:</span>
              <button onClick={() => setOpponentHp(h => Math.max(h - 1, 0))}>-</button>
              <span>{opponentHp}/{opponentMaxHp}</span>
              <button onClick={() => setOpponentHp(h => Math.min(h + 1, opponentMaxHp))}>+</button>
              <button onClick={() => setOpponentMaxHp(m => Math.min(m + 1, 6))}>+Max</button>
            </div>
          </div>
          <div className="debug-buttons">
            <button className="debug-btn" onClick={() => setIsMyTurn(!isMyTurn)}>
              Trocar Turno
            </button>
            <button className="debug-btn" onClick={() => setRound(r => r + 1)}>
              +Round
            </button>
            <button className="debug-btn debug-btn--sequence" onClick={handleReload}>
              Reload
            </button>
            <button className="debug-btn debug-btn--secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* GameBoard */}
      <div className="debug-gameboard-wrapper">
        <GameBoard
          ref={gameBoardRef}
          round={round}
          maxRounds={3}
          shells={shells}
          currentPlayerId={isMyTurn ? 'player' : 'opponent'}
          myId="player"
          opponents={[opponent]}
          me={me}
          myItems={myItems}
          isMyTurn={isMyTurn}
          selectedTarget={selectedTarget}
          revealedShell={revealedShell}
          message={message}
          roundAnnouncement={roundAnnouncement}
          lastShotResult={lastShotResult}
          stealModalData={stealModalData}
          itemActionModal={null}
          gameOverData={null}
          damagedPlayerId={damagedPlayerId}
          healedPlayerId={healedPlayerId}
          playerLastShell={playerLastShell}
          isSawed={isSawed}
          onSelectTarget={handleSelectTarget}
          onShoot={handleShoot}
          onShootSelf={handleShootSelf}
          onUseItem={handleUseItem}
          onStealItem={handleStealItem}
          onCancelSteal={handleCancelSteal}
          onBack={() => {}}
          onRoundAnnouncementComplete={() => {
            setRoundAnnouncement(null);
            gameBoardRef.current?.triggerReloadSpin();
          }}
        />
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
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DebugTab>('audio');

  // Protect: only admin can access
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

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
