/**
 * Games Admin SDK Types
 */

// ==========================================
// Auth Types
// ==========================================

export type OAuthProvider = 'google' | 'facebook' | 'discord';

export interface ProviderInfo {
  id: OAuthProvider;
  name: string;
  icon: string;
}

export interface GameUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  elo_rating: number;
  rank: string;
  games_played: number;
  games_won: number;
  is_admin: boolean;
  providers: OAuthProvider[];
}

export interface TokenValidationResult {
  valid: boolean;
  user_id?: string;
  game_code?: string;
  error?: string;
}

// ==========================================
// Ad Types
// ==========================================

export type AdType = 'banner' | 'video' | 'interstitial';
export type AdPlacementType = 'menu' | 'pause' | 'game_over' | 'loading' | 'rewarded' | 'interstitial';

export interface AdCreative {
  id: string;
  campaign_id: string;
  type: AdType;
  asset_url: string;
  click_url: string;
  alt_text: string;
  width?: number;
  height?: number;
  duration?: number;
  reward_type?: string;
  reward_amount?: number;
  track_url: string;
}

export interface AdPlacement {
  id: string;
  name: string;
  type: AdPlacementType;
  position: string;
  max_ads: number;
}

export interface RewardedAdResult {
  success: boolean;
  reward_type?: string;
  reward_amount?: number;
  error?: string;
}

export interface AdTrackingEvent {
  event: 'impression' | 'click' | 'complete' | 'skip' | 'error';
  creative_id: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ==========================================
// SDK Configuration
// ==========================================

export interface GamesAdminSDKConfig {
  baseUrl: string;
  gameCode: string;
  onAuthStateChange?: (user: GameUser | null) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
}
