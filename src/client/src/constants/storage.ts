// ==========================================
// STORAGE CONSTANTS - Chaves e configurações de storage
// ==========================================

// ===== LocalStorage Keys =====
/** Token de autenticação */
export const AUTH_TOKEN_KEY = 'bangshot_auth_token';

/**
 * @deprecated Session não é mais usado - servidor gerencia via getRoomByUserId()
 * Mantido apenas para limpeza de dados legados
 */
export const SESSION_KEY = 'bangshot_session';
export const LEGACY_SESSION_KEY = 'bangshotSession';

/**
 * Dados de reconexão ao jogo (agora em sessionStorage para maior segurança)
 */
export const RECONNECT_KEY = 'bangshot_reconnect';
export const LEGACY_RECONNECT_KEY = 'bangshotReconnect';

// ===== Expiration Times =====
/**
 * @deprecated Session não é mais usado
 */
export const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/** Tempo de expiração dos dados de reconexão (5 minutos) */
export const RECONNECT_EXPIRY_MS = 5 * 60 * 1000;

// ===== Upload Limits =====
/** Tamanho máximo de upload (2MB) */
export const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;

/** Tamanho máximo de upload formatado */
export const MAX_UPLOAD_SIZE_DISPLAY = '2MB';

// ===== Other Constants =====
/** Duração padrão de mensagens de feedback (ms) */
export const DEFAULT_MESSAGE_DURATION_MS = 3000;

/** Intervalo de atualização da lista de salas (ms) */
export const ROOM_LIST_REFRESH_INTERVAL_MS = 3000;
