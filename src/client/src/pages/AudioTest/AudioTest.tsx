// ==========================================
// AUDIO TEST PAGE - Testar sons e animacoes
// ==========================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { RevolverCylinder, RevealedChamber } from '../../components/game/RevolverCylinder';
import { SoundControl } from '../../components/common/SoundControl';
import { useSounds } from '../../audio/useSounds';
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

  // Estado do cilindro
  const [cylinderState, setCylinderState] = useState({
    totalChambers: 6,
    remainingShells: 4,
    currentPosition: 0,
    isSpinning: false,
    shotResult: null as 'live' | 'blank' | null,
    revealedChambers: [] as RevealedChamber[],
    spentChambers: [] as number[],
  });

  // Estado do ultimo som tocado
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  // Handler para tiro
  const handleShot = useCallback((isLive: boolean) => {
    const soundName = isLive ? 'shot-live' : 'shot-blank';
    setLastPlayed(soundName);
    sounds.playShot(isLive);

    // Animacao do cilindro
    setCylinderState(prev => ({
      ...prev,
      isSpinning: true,
      shotResult: isLive ? 'live' : 'blank',
    }));

    // Reset apos animacao
    setTimeout(() => {
      setCylinderState(prev => ({
        ...prev,
        isSpinning: false,
        shotResult: null,
        currentPosition: (prev.currentPosition + 1) % prev.totalChambers,
        spentChambers: [...prev.spentChambers, prev.currentPosition],
        remainingShells: Math.max(0, prev.remainingShells - 1),
      }));
    }, 1000);
  }, [sounds]);

  // Handler para itens
  const handleItemSound = useCallback((itemId: string, itemName: string) => {
    setLastPlayed(`item-${itemId}`);
    sounds.playItem(itemId);
  }, [sounds]);

  // Handler para sons de jogo
  const handleGameSound = useCallback((action: string, name: string) => {
    setLastPlayed(action);
    const fn = sounds[action as keyof typeof sounds];
    if (typeof fn === 'function') {
      (fn as () => void)();
    }
  }, [sounds]);

  // Handler para sons de UI
  const handleUISound = useCallback((action: string, name: string) => {
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

  // Reset do cilindro
  const handleResetCylinder = useCallback(() => {
    setCylinderState({
      totalChambers: 6,
      remainingShells: 4,
      currentPosition: 0,
      isSpinning: false,
      shotResult: null,
      revealedChambers: [],
      spentChambers: [],
    });
  }, []);

  // Revelar bala
  const handleRevealChamber = useCallback((type: 'live' | 'blank') => {
    setCylinderState(prev => ({
      ...prev,
      revealedChambers: [...prev.revealedChambers, { position: prev.currentPosition, type }],
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

        {/* Secao de Tiros com Animacao */}
        <section className="audio-test__section">
          <h2>Tiros (com Animacao do Cilindro)</h2>
          <div className="audio-test__cylinder-area">
            <RevolverCylinder
              totalChambers={cylinderState.totalChambers}
              remainingShells={cylinderState.remainingShells}
              currentPosition={cylinderState.currentPosition}
              isSpinning={cylinderState.isSpinning}
              shotResult={cylinderState.shotResult}
              revealedChambers={cylinderState.revealedChambers}
              spentChambers={cylinderState.spentChambers}
              isActive={true}
              size="lg"
            />
            <div className="audio-test__cylinder-info">
              <span>Posicao: {cylinderState.currentPosition}</span>
              <span>Restantes: {cylinderState.remainingShells}</span>
            </div>
          </div>
          <div className="audio-test__buttons">
            <button
              className="audio-test__btn audio-test__btn--live"
              onClick={() => handleShot(true)}
              disabled={cylinderState.isSpinning}
            >
              Tiro LIVE (Real)
            </button>
            <button
              className="audio-test__btn audio-test__btn--blank"
              onClick={() => handleShot(false)}
              disabled={cylinderState.isSpinning}
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

        {/* Secao de Itens */}
        <section className="audio-test__section">
          <h2>Sons de Itens</h2>
          <div className="audio-test__items-grid">
            {ITEMS.map(({ id, name, Icon }) => (
              <button
                key={id}
                className="audio-test__item-btn"
                onClick={() => handleItemSound(id, name)}
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
                onClick={() => handleGameSound(action, name)}
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
                onClick={() => handleUISound(action, name)}
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

        {/* Status dos Arquivos */}
        <section className="audio-test__section">
          <h2>Status dos Arquivos</h2>
          <div className="audio-test__file-status">
            <p>Arquivos encontrados em <code>/audio/sfx/</code>:</p>
            <ul>
              <li>shot-live.mp3</li>
              <li>shot-blank.mp3</li>
              <li>reload.mp3</li>
            </ul>
            <p className="audio-test__note">
              Os demais arquivos precisam ser baixados de fontes gratuitas (Pixabay, Freesound CC0).
              Consulte o arquivo <code>AUDIO_FILES_NEEDED.md</code> para a lista completa.
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
