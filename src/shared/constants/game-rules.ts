// ==========================================
// GAME RULES - CONSTANTES DO JOGO
// ==========================================

export const GAME_RULES = {
  // Jogadores
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,

  // Rodadas
  MAX_ROUNDS: 3,
  WINS_NEEDED: 2, // Vitórias necessárias para ganhar o jogo

  // HP (Charges)
  HP: {
    MIN: 2,
    MAX: 4,
  },

  // Cartuchos (Shells)
  SHELLS: {
    MIN_TOTAL: 2,
    MAX_TOTAL: 8,
    MIN_LIVE: 1,
    MIN_BLANK: 1,
  },

  // Itens
  ITEMS: {
    MAX_PER_PLAYER: 8, // Máximo de itens no inventário (regra oficial: 8 slots)
    PER_RELOAD: {
      MIN: 1,
      MAX: 5,
    },
  },

  // Timers (em milissegundos)
  TIMERS: {
    TURN_DURATION_MS: 120000, // 2 minutos por turno
    RECONNECT_GRACE_MS: 60000, // 60 segundos para reconectar
    MESSAGE_DURATION_MS: 2500, // Duração padrão de mensagens
    ROUND_START_DELAY_MS: 3000, // Delay antes de iniciar rodada
  },

  // Dano
  DAMAGE: {
    NORMAL: 1,
    SAWED_OFF: 2, // Dano dobrado com serra
  },
} as const;

// Tipo para as regras
export type GameRules = typeof GAME_RULES;
