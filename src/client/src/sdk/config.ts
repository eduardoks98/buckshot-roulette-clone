import type { GamesAdminSDKConfig } from './types';

let config: GamesAdminSDKConfig | null = null;

/**
 * Initialize the Games Admin SDK
 */
export function initSDK(sdkConfig: GamesAdminSDKConfig): void {
  config = {
    ...sdkConfig,
    baseUrl: sdkConfig.baseUrl.replace(/\/$/, ''), // Remove trailing slash
  };

  if (config.debug) {
    console.log('[GamesAdminSDK] Initialized with config:', {
      baseUrl: config.baseUrl,
      gameCode: config.gameCode,
    });
  }
}

/**
 * Get SDK configuration
 */
export function getConfig(): GamesAdminSDKConfig {
  if (!config) {
    throw new Error('[GamesAdminSDK] SDK not initialized. Call initSDK() first.');
  }
  return config;
}

/**
 * Get the base API URL for the current game
 */
export function getGameApiUrl(): string {
  const cfg = getConfig();
  return `${cfg.baseUrl}/api/games/${cfg.gameCode}`;
}

/**
 * Log debug messages if debug mode is enabled
 */
export function debugLog(message: string, ...args: unknown[]): void {
  const cfg = getConfig();
  if (cfg.debug) {
    console.log(`[GamesAdminSDK] ${message}`, ...args);
  }
}

/**
 * Handle SDK errors
 */
export function handleError(error: Error): void {
  const cfg = getConfig();
  if (cfg.onError) {
    cfg.onError(error);
  }
  if (cfg.debug) {
    console.error('[GamesAdminSDK] Error:', error);
  }
}
