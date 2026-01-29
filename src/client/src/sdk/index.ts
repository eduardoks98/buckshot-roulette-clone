/**
 * Games Admin SDK
 *
 * SDK for integrating games with the Games Admin platform.
 * Provides authentication, ad delivery, and tracking functionality.
 *
 * Usage:
 * ```typescript
 * import { initSDK, auth, ads } from './sdk';
 *
 * // Initialize the SDK
 * initSDK({
 *   baseUrl: 'https://admin.mysys.shop',
 *   gameCode: 'BANGSHOT',
 *   debug: true,
 *   onAuthStateChange: (user) => console.log('Auth changed:', user),
 * });
 *
 * // Use authentication
 * await auth.login('google');
 * const user = await auth.getCurrentUser();
 *
 * // Use ads
 * const ads = await ads.getAds();
 * ads.onAdImpression(ad);
 * ```
 */

// Config
export { initSDK, getConfig, getGameApiUrl } from './config';

// Types
export type {
  // Auth types
  OAuthProvider,
  ProviderInfo,
  GameUser,
  TokenValidationResult,
  // Ad types
  AdType,
  AdPlacementType,
  AdCreative,
  AdPlacement,
  RewardedAdResult,
  AdTrackingEvent,
  // SDK types
  GamesAdminSDKConfig,
  ApiResponse,
  PaginatedResponse,
} from './types';

// Auth module
import * as auth from './auth';
export { auth };

// Individual auth exports for convenience
export {
  getAvailableProviders,
  login,
  handleCallback,
  validateToken,
  getCurrentUser,
  logout,
  isLoggedIn,
  getToken,
  setToken,
  removeToken,
} from './auth';

// Ads module
import * as ads from './ads';
export { ads };

// Individual ads exports for convenience
export {
  getAds,
  getPlacements,
  getAdsForPlacement,
  getRewardedAds,
  trackAdEvent,
  trackVideoProgress,
  claimReward,
  onAdImpression,
  onAdClick,
  onVideoComplete,
  onVideoSkip,
  batchTrackEvents,
} from './ads';

// React Hooks
export {
  useGamesAdminSDK,
  useAuth,
  useAds,
  useRewardedAds,
  usePlacementAds,
} from './hooks';
