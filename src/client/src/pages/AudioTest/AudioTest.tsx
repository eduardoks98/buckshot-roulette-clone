// ==========================================
// AUDIO TEST PAGE - Testar sons e animacoes
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
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

// Configuracoes dos itens para teste
const ITEMS = [
  { id: 'magnifying_glass', name: 'Lupa', Icon: MagnifyingGlassIcon },
  { id: 'beer', name: 'Cerveja', Icon: BeerIcon },
  { id: 'cigarette', name: 'Cigarro', Icon: CigaretteIcon },
  { id: 'handcuffs', name: 'Algemas', Icon: HandcuffsIcon },
  { id: 'handsaw', name: 'Serra', Icon: HandSawIcon },
  { id: 'phone', name: 'Telefone', Icon: PhoneIcon },
  { id: 'inverter', name: 'Inversor', Icon: InverterIcon },
  { id: 'adrenaline', name: 'Adrenalina', Icon: AdrenalineIcon },
  { id: 'medicine', name: 'Remedio', Icon: MedicineIcon },
  { id: 'turn_reverser', name: 'Inversor Turno', Icon: TurnReverserIcon },
] as const;

// Sons de jogo para teste
const GAME_SOUNDS = [
  { id: 'round-start', name: 'Inicio Round', action: 'playRoundStart' },
  { id: 'round-win', name: 'Vitoria Round', action: 'playRoundWin' },
  { id: 'turn-change', name: 'Mudanca Turno', action: 'playTurnChange' },
  { id: 'timer-warning', name: 'Timer Warning', action: 'playTimerWarning' },
  { id: 'reload', name: 'Reload', action: 'playReload' },
  { id: 'damage', name: 'Dano', action: 'playDamage' },
  { id: 'heal', name: 'Cura', action: 'playHeal' },
] as const;

// Sons de UI para teste
const UI_SOUNDS = [
  { id: 'click', name: 'Click', action: 'playClick' },
  { id: 'hover', name: 'Hover', action: 'playHover' },
  { id: 'success', name: 'Sucesso', action: 'playSuccess' },
  { id: 'error', name: 'Erro', action: 'playError' },
  { id: 'join-room', name: 'Entrar Sala', action: 'playJoinRoom' },
  { id: 'leave-room', name: 'Sair Sala', action: 'playLeaveRoom' },
] as const;

export default function AudioTest() {
  const navigate = useNavigate();
  const sounds = useSounds();

  // Ref for cylinder with sound
  const cylinderRef = useRef<RevolverCylinderWithSoundRef>(null);

  // Estado do cilindro para sequencias (seção manual)
  const [cylinderState, setCylinderState] = useState({
    totalChambers: 8,
    remainingShells: 8,
    currentPosition: 0,
    revealedChambers: [] as RevealedChamber[],
    spentChambers: [] as number[],
    isSpinning: false,
    shotResult: null as 'live' | 'blank' | null,
  });

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

  // Estado para sequencias
  const [shellCount, setShellCount] = useState(8);
  const [isSawed, setIsSawed] = useState(false);

  // Estado para controlar se o tiro está em andamento (para desabilitar botões)
  const [isShootingUnified, setIsShootingUnified] = useState(false);

  // Handler para mudar quantidade de balas (sincroniza slider com ambos cilindros)
  const handleShellCountChange = useCallback((newCount: number) => {
    setShellCount(newCount);
    // Sync cylinderState (for sequence section)
    setCylinderState(prev => ({
      ...prev,
      totalChambers: newCount,
      remainingShells: Math.min(prev.remainingShells, newCount),
      currentPosition: prev.currentPosition % newCount,
      spentChambers: prev.spentChambers.filter(p => p < newCount),
      revealedChambers: prev.revealedChambers.filter(c => c.position < newCount),
    }));
    // Sync unifiedCylinderState (for main section)
    setUnifiedCylinderState(prev => ({
      ...prev,
      totalChambers: newCount,
      remainingShells: Math.min(prev.remainingShells, newCount),
      currentPosition: prev.currentPosition % newCount,
      spentChambers: prev.spentChambers.filter(p => p < newCount),
      revealedChambers: prev.revealedChambers.filter(c => c.position < newCount),
    }));
  }, []);

  // Estado para Custom Trim Tester
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

  // Handler para itens
  const handleItemSound = useCallback((itemId: string) => {
    setLastPlayed(`item-${itemId}`);
    sounds.playItem(itemId);
  }, [sounds]);

  // Handler para sons de jogo
  const handleGameSound = useCallback((action: string) => {
    setLastPlayed(action);
    const fn = sounds[action as keyof typeof sounds];
    if (typeof fn === 'function') {
      (fn as () => void)();
    }
  }, [sounds]);

  // Handler para sons de UI
  const handleUISound = useCallback((action: string) => {
    setLastPlayed(action);
    const fn = sounds[action as keyof typeof sounds];
    if (typeof fn === 'function') {
      (fn as () => void)();
    }
  }, [sounds]);

  // Handler para game over
  const handleGameOver = useCallback((won: boolean) => {
    const name = won ? 'game-over-win' : 'game-over-lose';
    setLastPlayed(name);
    sounds.playGameOver(won);
  }, [sounds]);

  // Handlers para sequencias - SINCRONIZADOS com audio
  // Timeline: spin(0-600ms) -> shot result(600-1000ms) -> reset
  const handleShotSequence = useCallback((isLive: boolean) => {
    const name = `shot-sequence-${isLive ? 'live' : 'blank'}${isSawed ? '-sawed' : ''}`;
    setLastPlayed(name);
    sounds.playShotSequence(isLive, isSawed);

    // 1. Avança posição E inicia spin JUNTOS (um único movimento)
    // A câmara atual é marcada como gasta, depois avança para próxima
    setCylinderState(prev => ({
      ...prev,
      isSpinning: true,
      spentChambers: [...prev.spentChambers, prev.currentPosition],
      currentPosition: (prev.currentPosition + 1) % prev.totalChambers,
      remainingShells: Math.max(0, prev.remainingShells - 1),
    }));

    // 2. Após spin terminar (600ms), para de girar e mostra resultado
    setTimeout(() => {
      setCylinderState(prev => ({
        ...prev,
        isSpinning: false,
        shotResult: isLive ? 'live' : 'blank',
      }));
    }, 600);

    // 3. Após mais 400ms (1000ms total), limpa o resultado
    setTimeout(() => {
      setCylinderState(prev => ({
        ...prev,
        shotResult: null,
      }));
    }, 1000);
  }, [sounds, isSawed]);

  const handleReloadSequence = useCallback(() => {
    setLastPlayed('reload-sequence');
    sounds.playReloadSequence();

    // Animação: spin por 300ms
    setCylinderState(prev => ({
      ...prev,
      isSpinning: true,
    }));

    setTimeout(() => {
      setCylinderState(prev => ({
        ...prev,
        isSpinning: false,
      }));
    }, 600);
  }, [sounds]);

  const handleCockingSequence = useCallback(() => {
    setLastPlayed(`cocking-sequence-${shellCount}`);
    sounds.playCockingSequence(shellCount);

    // Reset e adiciona balas uma a uma (sincronizado com cocking sounds)
    setCylinderState(prev => ({
      ...prev,
      remainingShells: 0,
      spentChambers: [],
      revealedChambers: [],
    }));

    // Adiciona cada bala com delay de 200ms (igual ao áudio)
    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        setCylinderState(prev => ({
          ...prev,
          remainingShells: i + 1,
        }));
      }, i * 200);
    }
  }, [sounds, shellCount]);

  const handleRoundStartSequence = useCallback(() => {
    setLastPlayed(`round-start-sequence-${shellCount}`);
    sounds.playRoundStartSequence(shellCount);

    // 1. Spin começa imediatamente
    setCylinderState(prev => ({
      ...prev,
      isSpinning: true,
      remainingShells: 0,
      spentChambers: [],
      revealedChambers: [],
      currentPosition: 0,
    }));

    // 2. Após spin (300ms), para de girar e começa a carregar balas
    setTimeout(() => {
      setCylinderState(prev => ({
        ...prev,
        isSpinning: false,
      }));
    }, 300);

    // 3. Adiciona cada bala com delay de 180ms (sincronizado com cocking)
    const cockingDelay = 300; // Após spin
    const delayBetween = 180; // Entre cada bala

    for (let i = 0; i < shellCount; i++) {
      setTimeout(() => {
        setCylinderState(prev => ({
          ...prev,
          remainingShells: i + 1,
        }));
      }, cockingDelay + (i * delayBetween));
    }
  }, [sounds, shellCount]);

  // Reset do cilindro (usa quantidade atual do slider) - reseta ambos os estados
  const handleResetCylinder = useCallback(() => {
    const baseState = {
      totalChambers: shellCount,
      remainingShells: shellCount,
      currentPosition: 0,
      revealedChambers: [] as RevealedChamber[],
      spentChambers: [] as number[],
    };
    setCylinderState({
      ...baseState,
      isSpinning: false,
      shotResult: null,
    });
    setUnifiedCylinderState(baseState);
  }, [shellCount]);

  // Revelar bala - atualiza ambos os estados
  const handleRevealChamber = useCallback((type: 'live' | 'blank') => {
    setCylinderState(prev => ({
      ...prev,
      revealedChambers: [...prev.revealedChambers, { position: prev.currentPosition, type }],
    }));
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
              isSawed={isSawed}
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

        {/* Secao de Sequencias (Spin + Sons) */}
        <section className="audio-test__section audio-test__section--highlight">
          <h2>Sequencias de Audio (Spin + Sons)</h2>
          <p className="audio-test__subtitle">Testa as sequencias completas com spin do cilindro</p>

          {/* Controles */}
          <div className="audio-test__sequence-controls">
            <div className="audio-test__control-group">
              <label>Quantidade de balas:</label>
              <input
                type="range"
                min="2"
                max="8"
                value={shellCount}
                onChange={(e) => handleShellCountChange(Number(e.target.value))}
              />
              <span className="audio-test__value">{shellCount}</span>
            </div>
            <div className="audio-test__control-group">
              <label>
                <input
                  type="checkbox"
                  checked={isSawed}
                  onChange={(e) => setIsSawed(e.target.checked)}
                />
                Com Serra (2x tiro)
              </label>
            </div>
          </div>

          {/* Botoes de Sequencia */}
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn audio-test__btn--sequence"
              onClick={handleRoundStartSequence}
            >
              Round Start (Spin + {shellCount}x Cocking)
            </button>
            <button
              className="audio-test__btn audio-test__btn--sequence"
              onClick={handleCockingSequence}
            >
              Apenas Cocking ({shellCount}x)
            </button>
            <button
              className="audio-test__btn audio-test__btn--sequence"
              onClick={handleReloadSequence}
            >
              Reload Sequence (Spin + Reload)
            </button>
          </div>

          <div className="audio-test__buttons">
            <button
              className={`audio-test__btn audio-test__btn--live ${isSawed ? 'audio-test__btn--sawed' : ''}`}
              onClick={() => handleShotSequence(true)}
              disabled={cylinderState.isSpinning}
            >
              Tiro LIVE Sequence {isSawed ? '(2x)' : ''}
            </button>
            <button
              className="audio-test__btn audio-test__btn--blank"
              onClick={() => handleShotSequence(false)}
              disabled={cylinderState.isSpinning}
            >
              Tiro BLANK Sequence (teck-teck)
            </button>
          </div>
        </section>

        {/* Secao de Itens */}
        <section className="audio-test__section">
          <h2>Sons de Itens</h2>
          <div className="audio-test__items-grid">
            {ITEMS.map(({ id, name, Icon }) => (
              <button
                key={id}
                className="audio-test__item-btn"
                onClick={() => handleItemSound(id)}
                title={name}
              >
                <Icon size={32} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Secao de Sons de Jogo */}
        <section className="audio-test__section">
          <h2>Sons de Jogo</h2>
          <div className="audio-test__buttons-grid">
            {GAME_SOUNDS.map(({ id, name, action }) => (
              <button
                key={id}
                className="audio-test__btn"
                onClick={() => handleGameSound(action)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        {/* Secao de Game Over */}
        <section className="audio-test__section">
          <h2>Game Over</h2>
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn audio-test__btn--win"
              onClick={() => handleGameOver(true)}
            >
              Vitoria Final
            </button>
            <button
              className="audio-test__btn audio-test__btn--lose"
              onClick={() => handleGameOver(false)}
            >
              Derrota Final
            </button>
          </div>
        </section>

        {/* Secao de Sons de UI */}
        <section className="audio-test__section">
          <h2>Sons de UI</h2>
          <div className="audio-test__buttons-grid">
            {UI_SOUNDS.map(({ id, name, action }) => (
              <button
                key={id}
                className="audio-test__btn audio-test__btn--ui"
                onClick={() => handleUISound(action)}
              >
                {name}
              </button>
            ))}
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

        {/* Custom Trim Tester - Ajuste manual de parametros */}
        <section className="audio-test__section audio-test__section--highlight">
          <h2>Custom Trim Tester</h2>
          <p className="audio-test__subtitle">
            Clique e arraste no waveform para selecionar a regiao. Ajuste os parametros e copie a config!
          </p>

          <div className="audio-test__custom-trim">
            {/* Seletor de arquivo */}
            <div className="audio-test__control-group" style={{ marginBottom: '1rem' }}>
              <label>Arquivo:</label>
              <select
                value={customTrimFile}
                onChange={(e) => setCustomTrimFile(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555', minWidth: '200px' }}
              >
                {Object.keys(AUDIO_TRIM_CONFIGS).map(path => (
                  <option key={path} value={path}>{path.split('/').pop()}</option>
                ))}
              </select>
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
