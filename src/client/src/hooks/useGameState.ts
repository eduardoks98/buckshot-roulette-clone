// ==========================================
// USE GAME STATE HOOK
// ==========================================

import { useState, useCallback, useMemo } from 'react';
import { PlayerPublicState, Item } from '../../../../shared/types';
import { GAME_RULES } from '../../../../shared/constants';

interface ShellInfo {
  total: number;
  live: number;
  blank: number;
}

interface GameState {
  players: PlayerPublicState[];
  currentPlayerId: string;
  round: number;
  shells: ShellInfo;
  myItems: Item[];
  revealedShell: 'live' | 'blank' | null;
  isGameOver: boolean;
  winnerId: string | null;
}

interface UseGameStateReturn {
  state: GameState;
  myId: string;
  isMyTurn: boolean;
  me: PlayerPublicState | undefined;
  alivePlayers: PlayerPublicState[];
  opponents: PlayerPublicState[];

  // Actions
  setPlayers: (players: PlayerPublicState[]) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerPublicState>) => void;
  setCurrentPlayer: (playerId: string) => void;
  setRound: (round: number) => void;
  setShells: (shells: ShellInfo) => void;
  setMyItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  removeItem: (index: number) => void;
  setRevealedShell: (shell: 'live' | 'blank' | null) => void;
  endGame: (winnerId: string) => void;
  resetState: () => void;
}

const initialState: GameState = {
  players: [],
  currentPlayerId: '',
  round: 1,
  shells: { total: 0, live: 0, blank: 0 },
  myItems: [],
  revealedShell: null,
  isGameOver: false,
  winnerId: null,
};

export function useGameState(mySocketId: string): UseGameStateReturn {
  const [state, setState] = useState<GameState>(initialState);

  // Derived values
  const isMyTurn = state.currentPlayerId === mySocketId;
  const me = state.players.find(p => p.id === mySocketId);
  const alivePlayers = useMemo(
    () => state.players.filter(p => p.alive),
    [state.players]
  );
  const opponents = useMemo(
    () => alivePlayers.filter(p => p.id !== mySocketId),
    [alivePlayers, mySocketId]
  );

  // Actions
  const setPlayers = useCallback((players: PlayerPublicState[]) => {
    setState(prev => ({ ...prev, players }));
  }, []);

  const updatePlayer = useCallback((playerId: string, updates: Partial<PlayerPublicState>) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const setCurrentPlayer = useCallback((currentPlayerId: string) => {
    setState(prev => ({ ...prev, currentPlayerId }));
  }, []);

  const setRound = useCallback((round: number) => {
    setState(prev => ({ ...prev, round }));
  }, []);

  const setShells = useCallback((shells: ShellInfo) => {
    setState(prev => ({ ...prev, shells }));
  }, []);

  const setMyItems = useCallback((myItems: Item[]) => {
    setState(prev => ({
      ...prev,
      myItems: myItems.slice(0, GAME_RULES.ITEMS.MAX_PER_PLAYER),
    }));
  }, []);

  const addItem = useCallback((item: Item) => {
    setState(prev => {
      if (prev.myItems.length >= GAME_RULES.ITEMS.MAX_PER_PLAYER) {
        return prev;
      }
      return { ...prev, myItems: [...prev.myItems, item] };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      myItems: prev.myItems.filter((_, i) => i !== index),
    }));
  }, []);

  const setRevealedShell = useCallback((revealedShell: 'live' | 'blank' | null) => {
    setState(prev => ({ ...prev, revealedShell }));
  }, []);

  const endGame = useCallback((winnerId: string) => {
    setState(prev => ({
      ...prev,
      isGameOver: true,
      winnerId,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    myId: mySocketId,
    isMyTurn,
    me,
    alivePlayers,
    opponents,

    setPlayers,
    updatePlayer,
    setCurrentPlayer,
    setRound,
    setShells,
    setMyItems,
    addItem,
    removeItem,
    setRevealedShell,
    endGame,
    resetState,
  };
}
