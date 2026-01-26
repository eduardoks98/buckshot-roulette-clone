// ==========================================
// CONFIG - Constantes centralizadas
// ==========================================

// Game identification
export const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';

// API URLs
export const API_URL = import.meta.env.VITE_API_URL || '';
export const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';

// AdSense configuration
export const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';
export const ADSENSE_TEST_MODE = import.meta.env.VITE_ADSENSE_TEST_MODE === 'true';

export const AD_SLOTS = {
  landing: import.meta.env.VITE_ADSENSE_SLOT_LANDING || '',
  lobby: import.meta.env.VITE_ADSENSE_SLOT_LOBBY || '',
  header: import.meta.env.VITE_ADSENSE_SLOT_HEADER || '',
  footer: import.meta.env.VITE_ADSENSE_SLOT_FOOTER || '',
};

// App info
export const APP_VERSION = '1.0';
export const APP_NAME = 'Bang Shot';
