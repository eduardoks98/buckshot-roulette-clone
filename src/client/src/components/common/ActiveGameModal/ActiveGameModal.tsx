// ==========================================
// ACTIVE GAME MODAL - Modal global de reconexao
// ==========================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../../context/SocketContext';
import { useLobbyActions } from '../../../hooks';
import { WarningIcon } from '../../icons';
import './ActiveGameModal.css';

export function ActiveGameModal() {
  const navigate = useNavigate();
  const {
    activeGame,
    isReconnecting,
    isConnected,
    reconnectedGameData,
    abandonGame,
    setReconnecting,
    clearReconnectedGameData,
  } = useSocket();
  const { rejoinGame } = useLobbyActions();

  // Navegar quando reconectado com sucesso
  useEffect(() => {
    if (reconnectedGameData && activeGame === null) {
      const data = reconnectedGameData as { roomCode: string };
      clearReconnectedGameData();
      navigate('/multiplayer/game', {
        state: { roomCode: data.roomCode, reconnected: true, gameState: reconnectedGameData },
      });
    }
  }, [reconnectedGameData, activeGame, navigate, clearReconnectedGameData]);

  // Se nao tem jogo ativo, nao renderizar
  if (!activeGame) return null;

  const handleReconnect = () => {
    setReconnecting(true);
    rejoinGame(activeGame.roomCode);
  };

  const handleAbandon = () => {
    // Usa abandonGame do contexto que ja faz tudo (emite evento + limpa estado + marca ref)
    abandonGame(activeGame.roomCode);
  };

  return (
    <div className="active-game-modal-overlay">
      <div className="active-game-modal">
        <div className="active-game-modal__icon">
          <WarningIcon size={48} color="#d4a418" />
        </div>
        <h2 className="active-game-modal__title">
          {activeGame.gameStarted ? 'Partida em Andamento!' : 'Voce esta em uma Sala!'}
        </h2>
        <p className="active-game-modal__room">
          Sala: <strong>{activeGame.roomCode}</strong>
        </p>
        <div className="active-game-modal__actions">
          <button
            className="active-game-modal__btn active-game-modal__btn--primary"
            onClick={handleReconnect}
            disabled={isReconnecting || !isConnected}
          >
            {isReconnecting ? 'Reconectando...' : 'RECONECTAR'}
          </button>
          <button
            className="active-game-modal__btn active-game-modal__btn--secondary"
            onClick={handleAbandon}
            disabled={isReconnecting}
          >
            ABANDONAR
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveGameModal;
