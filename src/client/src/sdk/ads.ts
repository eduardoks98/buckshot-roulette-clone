import { getGameApiUrl, debugLog, handleError } from './config';
import { getToken } from './auth';
import type {
  AdCreative,
  AdPlacement,
  RewardedAdResult,
  AdTrackingEvent,
} from './types';

/**
 * Get all available ads for the current game
 */
export async function getAds(): Promise<AdCreative[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/ads`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Fetched ads:', data.ads?.length || 0);
    return data.ads || [];
  } catch (error) {
    handleError(error as Error);
    return [];
  }
}

/**
 * Get available ad placements
 */
export async function getPlacements(): Promise<AdPlacement[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/ads/placements`);

    if (!response.ok) {
      throw new Error(`Failed to fetch placements: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Fetched placements:', data.placements?.length || 0);
    return data.placements || [];
  } catch (error) {
    handleError(error as Error);
    return [];
  }
}

/**
 * Get ads for a specific placement
 */
export async function getAdsForPlacement(placementId: string): Promise<AdCreative[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/ads/placement/${placementId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ads for placement: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Fetched ads for placement:', placementId, data.ads?.length || 0);
    return data.ads || [];
  } catch (error) {
    handleError(error as Error);
    return [];
  }
}

/**
 * Get rewarded video ads
 */
export async function getRewardedAds(): Promise<AdCreative[]> {
  try {
    const response = await fetch(`${getGameApiUrl()}/ads/rewarded`);

    if (!response.ok) {
      throw new Error(`Failed to fetch rewarded ads: ${response.status}`);
    }

    const data = await response.json();
    debugLog('Fetched rewarded ads:', data.ads?.length || 0);
    return data.ads || [];
  } catch (error) {
    handleError(error as Error);
    return [];
  }
}

/**
 * Track an ad event (impression, click, etc.)
 */
export async function trackAdEvent(
  creativeId: string,
  event: 'impression' | 'click' | 'complete' | 'skip' | 'error',
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch(
      `${getGameApiUrl()}/ads/${creativeId}/track/${event}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          metadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to track event: ${response.status}`);
    }

    debugLog('Tracked event:', event, 'for creative:', creativeId);
    return true;
  } catch (error) {
    handleError(error as Error);
    return false;
  }
}

/**
 * Track video progress
 */
export async function trackVideoProgress(
  creativeId: string,
  progress: number,
  duration: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${getGameApiUrl()}/ads/${creativeId}/video-progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress,
          duration,
          percentage: Math.round((progress / duration) * 100),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to track video progress: ${response.status}`);
    }

    debugLog('Tracked video progress:', `${Math.round((progress / duration) * 100)}%`);
    return true;
  } catch (error) {
    handleError(error as Error);
    return false;
  }
}

/**
 * Claim reward after watching a rewarded video
 * Requires user authentication
 */
export async function claimReward(creativeId: string): Promise<RewardedAdResult> {
  try {
    const token = getToken();

    if (!token) {
      return {
        success: false,
        error: 'User must be logged in to claim rewards',
      };
    }

    const response = await fetch(
      `${getGameApiUrl()}/ads/${creativeId}/claim-reward`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `Failed to claim reward: ${response.status}`,
      };
    }

    const data = await response.json();
    debugLog('Reward claimed:', data);

    return {
      success: true,
      reward_type: data.reward_type,
      reward_amount: data.reward_amount,
    };
  } catch (error) {
    handleError(error as Error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Helper: Track impression when ad is viewed
 */
export function onAdImpression(creative: AdCreative): void {
  trackAdEvent(creative.id, 'impression');
}

/**
 * Helper: Track click when ad is clicked
 */
export function onAdClick(creative: AdCreative): void {
  trackAdEvent(creative.id, 'click');

  // Open click URL in new tab
  if (creative.click_url) {
    window.open(creative.click_url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Helper: Track video completion
 */
export function onVideoComplete(creative: AdCreative): void {
  trackAdEvent(creative.id, 'complete');
}

/**
 * Helper: Track video skip
 */
export function onVideoSkip(creative: AdCreative): void {
  trackAdEvent(creative.id, 'skip');
}

/**
 * Batch track multiple events
 */
export async function batchTrackEvents(events: AdTrackingEvent[]): Promise<boolean> {
  try {
    const promises = events.map((event) =>
      trackAdEvent(event.creative_id, event.event, event.metadata)
    );

    await Promise.all(promises);
    debugLog('Batch tracked events:', events.length);
    return true;
  } catch (error) {
    handleError(error as Error);
    return false;
  }
}
