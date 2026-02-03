// ==========================================
// SINGLEPLAYER PAGE
// Usa bots do servidor (mesmo sistema do multiplayer)
// Progressao: Stats + XP, sem rank
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useRoomActions } from '../../hooks';
import { GameMode } from '../../../../shared/types';
import { useSounds } from '../../audio';
import SinglePlayerSetup, { SinglePlayerConfig } from './SinglePlayerSetup';
import './SinglePlayer.css';

// ==========================================
// TYPES
// ==========================================

type SinglePlayerState = 'setup' | 'connecting' | 'creating_room' | 'adding_bots' | 'starting';

// ==========================================
// COMPONENT
// ==========================================

export default function SinglePlayer() {
  const navigate = useNavigate();
  const { socket, isConnected, connect } = useSocket();
  const { user } = useAuth();
  const { addBot, startGame } = useRoomActions();
  const { playMusic } = useSounds();

  // State
  const [state, setState] = useState<SinglePlayerState>('setup');
  const [config, setConfig] = useState<SinglePlayerConfig | null>(null);
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Refs para evitar duplicacao de eventos
  const botsAddedRef = useRef(0);
  const gameStartedRef = useRef(false);
  const setupCompleteRef = useRef(false);

  // Tocar musica do menu
  useEffect(() => {
    playMusic('ambient-menu');
  }, [playMusic]);

  // Conectar ao socket quando necessario
  useEffect(() => {
    if (state === 'connecting' && !isConnected) {
      console.log('[SinglePlayer] Conectando ao socket...');
      connect();
    }
  }, [state, isConnected, connect]);

  // Quando conectar, criar sala
  useEffect(() => {
    if (state === 'connecting' && isConnected && config && !setupCompleteRef.current) {
      console.log('[SinglePlayer] Conectado! Criando sala...');
      setState('creating_room');

      // Criar sala no modo singleplayer
      socket?.emit('createRoom', {
        playerName: user?.display_name || 'Player',
        gameMode: GameMode.SINGLEPLAYER,
      });
    }
  }, [state, isConnected, config, socket, user?.display_name]);

  // Listener para eventos de sala
  useEffect(() => {
    if (!socket) return;

    // Sala criada com sucesso
    const handleRoomCreated = (data: { code: string; players: unknown[]; isHost: boolean }) => {
      console.log('[SinglePlayer] Sala criada:', data.code);
      setRoomCode(data.code);
      setState('adding_bots');
      botsAddedRef.current = 0;

      // Adicionar bots conforme config
      if (config) {
        config.bots.forEach((bot, index) => {
          setTimeout(() => {
            console.log(`[SinglePlayer] Adicionando bot ${index + 1}: ${bot.name} (${bot.difficulty})`);
            addBot(bot.difficulty);
          }, index * 300); // Pequeno delay entre bots
        });
      }
    };

    // Bot adicionado
    const handleBotAdded = () => {
      botsAddedRef.current++;
      console.log(`[SinglePlayer] Bot adicionado (${botsAddedRef.current}/${config?.bots.length || 0})`);

      // Quando todos os bots forem adicionados, iniciar jogo
      if (config && botsAddedRef.current >= config.bots.length && !gameStartedRef.current) {
        gameStartedRef.current = true;
        console.log('[SinglePlayer] Todos os bots adicionados! Iniciando jogo...');
        setState('starting');

        setTimeout(() => {
          startGame();
        }, 500);
      }
    };

    // Round iniciado = jogo comecou, navegar para tela de jogo
    const handleRoundStarted = (gameState: unknown) => {
      console.log('[SinglePlayer] Jogo iniciado! Navegando para o game...');
      setupCompleteRef.current = true;

      // Navegar para o jogo multiplayer (reutilizando a mesma tela)
      navigate('/multiplayer/game', {
        state: {
          roomCode,
          gameState,
          isSinglePlayer: true, // Flag para comportamento diferenciado
        },
        replace: true, // Substituir historico para nao voltar ao setup
      });
    };

    // Erros
    const handleJoinError = (message: string) => {
      console.error('[SinglePlayer] Erro:', message);
      setError(message);
      setState('setup');
      resetRefs();
    };

    const handleBotError = (data: { message: string }) => {
      console.error('[SinglePlayer] Erro ao adicionar bot:', data.message);
      setError(data.message);
    };

    // Registrar listeners
    socket.on('roomCreated', handleRoomCreated);
    socket.on('botAdded', handleBotAdded);
    socket.on('roundStarted', handleRoundStarted);
    socket.on('joinError', handleJoinError);
    socket.on('botError', handleBotError);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('botAdded', handleBotAdded);
      socket.off('roundStarted', handleRoundStarted);
      socket.off('joinError', handleJoinError);
      socket.off('botError', handleBotError);
    };
  }, [socket, config, addBot, startGame, navigate, roomCode]);

  // Reset refs
  const resetRefs = () => {
    botsAddedRef.current = 0;
    gameStartedRef.current = false;
    setupCompleteRef.current = false;
  };

  // Handler para iniciar jogo do setup
  const handleStartGame = useCallback((newConfig: SinglePlayerConfig) => {
    console.log('[SinglePlayer] Iniciando com config:', newConfig);
    setConfig(newConfig);
    setError('');
    resetRefs();

    if (isConnected) {
      // Ja conectado, criar sala direto
      setState('creating_room');
      socket?.emit('createRoom', {
        playerName: user?.display_name || 'Player',
        gameMode: GameMode.SINGLEPLAYER,
      });
    } else {
      // Precisa conectar primeiro
      setState('connecting');
    }
  }, [isConnected, socket, user?.display_name]);

  // ==========================================
  // RENDER
  // ==========================================

  // Mostrar setup
  if (state === 'setup') {
    return <SinglePlayerSetup onStartGame={handleStartGame} />;
  }

  // Tela de loading enquanto prepara o jogo
  return (
    <div className="singleplayer-loading">
      <div className="singleplayer-loading__container">
        <h2 className="singleplayer-loading__title">
          {state === 'connecting' && 'Conectando ao servidor...'}
          {state === 'creating_room' && 'Criando sala...'}
          {state === 'adding_bots' && `Adicionando bots (${botsAddedRef.current}/${config?.bots.length || 0})...`}
          {state === 'starting' && 'Iniciando partida...'}
        </h2>

        <div className="singleplayer-loading__spinner" />

        {error && (
          <div className="singleplayer-loading__error">
            <p>{error}</p>
            <button onClick={() => { setState('setup'); setError(''); }}>
              Tentar Novamente
            </button>
          </div>
        )}

        <p className="singleplayer-loading__tip">
          Dica: No modo treino voce ganha XP mas nao afeta seu ranking
        </p>
      </div>
    </div>
  );
}
