// ==========================================
// AUDIO TEST PAGE - Testar sons e animacoes
// ==========================================

import { useState, useCallback, useRef, useEffect, ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../../components/icons/items';
import './AudioTest.css';

// Tipo para item de audio
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

export default function AudioTest() {
  const navigate = useNavigate();
  const sounds = useSounds();

  // Ref for cylinder with sound
  const cylinderRef = useRef<RevolverCylinderWithSoundRef>(null);

  // Estado para RevolverCylinderWithSound (seção principal com som)
  const [unifiedCylinderState, setUnifiedCylinderState] = useState({
    totalChambers: 8,
    remainingShells: 8,
    currentPosition: 0,
    revealedChambers: [] as RevealedChamber[],
    spentChambers: [] as number[],
  });

  // Estado do ultimo som tocado
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  // Estado para controlar se o tiro está em andamento (para desabilitar botões)
  const [isShootingUnified, setIsShootingUnified] = useState(false);

  // Estado para Custom Trim Tester
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

  // Handler para mudar reverb
  const handleReverbChange = useCallback((value: number) => {
    setReverbAmount(value);
    audioTrimmer.setReverbAmount(value);
  }, []);

  // Carregar audio buffer e config quando mudar arquivo
  useEffect(() => {
    const loadAudioAndConfig = async () => {
      // Carregar config salva
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

      // Limpar resultado anterior
      setCustomTrimResult(null);

      // Carregar audio buffer para waveform
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

  // Handler para tiro - usa o componente unificado (RevolverCylinderWithSound)
  const handleShot = useCallback((isLive: boolean) => {
    if (isShootingUnified) return;

    const soundName = `shot-sequence-${isLive ? 'live' : 'blank'}`;
    setLastPlayed(soundName);
    setIsShootingUnified(true);

    // Trigger shot via ref (componente gerencia animação + som)
    cylinderRef.current?.triggerShot(isLive);

    // Atualiza estado do cilindro unificado
    setUnifiedCylinderState(prev => ({
      ...prev,
      spentChambers: [...prev.spentChambers, prev.currentPosition],
      currentPosition: (prev.currentPosition + 1) % prev.totalChambers,
      remainingShells: Math.max(0, prev.remainingShells - 1),
    }));

    // Libera botões após animação completa (~550ms para tiro realista)
    setTimeout(() => setIsShootingUnified(false), 600);
  }, [isShootingUnified]);

  // Handler para spin dramático (reload/round start)
  const handleReloadSpin = useCallback(() => {
    if (isShootingUnified) return;

    setLastPlayed('reload-spin');
    setIsShootingUnified(true);

    // Trigger spin via ref
    cylinderRef.current?.triggerReloadSpin();

    // Libera botões após spin completo (800ms)
    setTimeout(() => setIsShootingUnified(false), 900);
  }, [isShootingUnified]);

  // Reset do cilindro
  const handleResetCylinder = useCallback(() => {
    setUnifiedCylinderState({
      totalChambers: 8,
      remainingShells: 8,
      currentPosition: 0,
      revealedChambers: [],
      spentChambers: [],
    });
  }, []);

  // Revelar bala
  const handleRevealChamber = useCallback((type: 'live' | 'blank') => {
    setUnifiedCylinderState(prev => ({
      ...prev,
      revealedChambers: [...prev.revealedChambers, { position: prev.currentPosition, type }],
    }));
  }, []);

  // Custom Trim handlers
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

  // Handler para mudanças na seleção do waveform
  const handleWaveformSelectionChange = useCallback((newStart: number, newDuration: number) => {
    setCustomTrimConfig(prev => ({
      ...prev,
      start: Math.round(newStart * 100) / 100,
      duration: Math.round(newDuration * 100) / 100,
    }));
  }, []);

  return (
    <PageLayout title="Teste de Audio" onBack={() => navigate('/')}>
      <div className="audio-test">
        {/* Controle de Volume Global */}
        <section className="audio-test__section">
          <h2>Controles de Volume</h2>
          <div className="audio-test__controls">
            <SoundControl />
            {lastPlayed && (
              <div className="audio-test__last-played">
                Ultimo som: <strong>{lastPlayed}</strong>
              </div>
            )}
          </div>
        </section>

        {/* Secao de Tiros com Animacao + Som (componente unificado) */}
        <section className="audio-test__section">
          <h2>Tiros (com Animacao + Som)</h2>
          <div className="audio-test__cylinder-area">
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
            <div className="audio-test__cylinder-info">
              <span>Posicao: {unifiedCylinderState.currentPosition}</span>
              <span>Restantes: {unifiedCylinderState.remainingShells}</span>
            </div>
          </div>
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn audio-test__btn--live"
              onClick={() => handleShot(true)}
              disabled={isShootingUnified}
            >
              Tiro LIVE (Real)
            </button>
            <button
              className="audio-test__btn audio-test__btn--blank"
              onClick={() => handleShot(false)}
              disabled={isShootingUnified}
            >
              Tiro BLANK (Vazio)
            </button>
            <button
              className="audio-test__btn audio-test__btn--secondary"
              onClick={handleResetCylinder}
            >
              Reset Cilindro
            </button>
          </div>
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn audio-test__btn--sequence"
              onClick={handleReloadSpin}
              disabled={isShootingUnified}
            >
              Spin Dramatico (Reload)
            </button>
            <button
              className="audio-test__btn audio-test__btn--reveal-live"
              onClick={() => handleRevealChamber('live')}
            >
              Revelar LIVE
            </button>
            <button
              className="audio-test__btn audio-test__btn--reveal-blank"
              onClick={() => handleRevealChamber('blank')}
            >
              Revelar BLANK
            </button>
          </div>
        </section>

        {/* Secao de Musica */}
        <section className="audio-test__section">
          <h2>Musica Ambiente</h2>
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn"
              onClick={() => {
                setLastPlayed('ambient-menu');
                sounds.playMusic('ambient-menu');
              }}
            >
              Musica Menu
            </button>
            <button
              className="audio-test__btn"
              onClick={() => {
                setLastPlayed('ambient-game');
                sounds.playMusic('ambient-game');
              }}
            >
              Musica Jogo
            </button>
            <button
              className="audio-test__btn audio-test__btn--secondary"
              onClick={() => {
                setLastPlayed('stop-music');
                sounds.stopMusic(true);
              }}
            >
              Parar Musica
            </button>
          </div>
        </section>

        {/* Editor de Audio - Seletor com icones + Waveform + Controles */}
        <section className="audio-test__section audio-test__section--highlight">
          <h2>Editor de Audio</h2>
          <p className="audio-test__subtitle">
            Selecione um arquivo, ajuste no waveform e copie a config!
          </p>

          <div className="audio-test__custom-trim">
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
            <div className="audio-test__sequence-controls" style={{ flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
              <div className="audio-test__control-group">
                <label>Duration (s):</label>
                <input
                  type="range"
                  min="0.05"
                  max={Math.max(5, customAudioBuffer?.duration ?? 5)}
                  step="0.05"
                  value={customTrimConfig.duration}
                  onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                />
                <span className="audio-test__value">{customTrimConfig.duration.toFixed(2)}s</span>
              </div>

              <div className="audio-test__control-group">
                <label>Speed:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={customTrimConfig.speed}
                  onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                />
                <span className="audio-test__value">{customTrimConfig.speed.toFixed(1)}x</span>
              </div>

              <div className="audio-test__control-group">
                <label>Start (s):</label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, (customAudioBuffer?.duration ?? 1) - 0.1)}
                  step="0.05"
                  value={customTrimConfig.start}
                  onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, start: parseFloat(e.target.value) }))}
                />
                <span className="audio-test__value">{customTrimConfig.start.toFixed(2)}s</span>
              </div>

              <div className="audio-test__control-group">
                <label>Fade In (s):</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={customTrimConfig.fadeIn}
                  onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, fadeIn: parseFloat(e.target.value) }))}
                />
                <span className="audio-test__value">{customTrimConfig.fadeIn.toFixed(2)}s</span>
              </div>

              <div className="audio-test__control-group">
                <label>Fade Out (s):</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={customTrimConfig.fadeOut}
                  onChange={(e) => setCustomTrimConfig(prev => ({ ...prev, fadeOut: parseFloat(e.target.value) }))}
                />
                <span className="audio-test__value">{customTrimConfig.fadeOut.toFixed(2)}s</span>
              </div>

              <div className="audio-test__control-group" style={{ borderLeft: '2px solid #10b981', paddingLeft: '1rem' }}>
                <label>Ambiente (Reverb):</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={reverbAmount}
                  onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
                />
                <span className="audio-test__value">{Math.round(reverbAmount * 100)}%</span>
              </div>
            </div>

            {/* Botoes de acao */}
            <div className="audio-test__buttons" style={{ marginTop: '1rem' }}>
              <button
                className="audio-test__btn audio-test__btn--lose"
                onClick={handleStopPlayback}
              >
                Parar
              </button>
              <button
                className="audio-test__btn"
                onClick={handlePlayOriginal}
                disabled={customAudioLoading}
              >
                Ouvir Original
              </button>
              <button
                className="audio-test__btn audio-test__btn--sequence"
                onClick={handleCustomTrim}
                disabled={customTrimLoading || customAudioLoading}
              >
                {customTrimLoading ? 'Processando...' : 'Processar'}
              </button>
              {customTrimResult && (
                <button
                  className="audio-test__btn audio-test__btn--live"
                  onClick={handlePlayCustomTrim}
                >
                  Ouvir
                </button>
              )}
              <button
                className="audio-test__btn audio-test__btn--secondary"
                onClick={handleCopyConfig}
              >
                Copiar Config
              </button>
            </div>

            {/* Resultado */}
            {customTrimResult && (
              <div className="audio-test__trimmer-result" style={{ marginTop: '1rem', padding: '0.5rem', background: '#222', borderRadius: '4px' }}>
                Original: {customTrimResult.originalDuration.toFixed(2)}s → Trimmed: {customTrimResult.trimmedDuration.toFixed(2)}s
              </div>
            )}
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
