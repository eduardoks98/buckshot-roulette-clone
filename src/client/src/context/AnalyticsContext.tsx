import React, { createContext, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GameAnalytics } from '@eduardoks98/google-analytics';
import type { GameMatchParams, GameEndParams } from '@eduardoks98/google-analytics';
import { useAuth } from './AuthContext';

// Get measurement ID from environment
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

interface MatchTrackingState {
  matchId: string | null;
  startMatch: (params?: GameMatchParams) => string;
  endMatch: (params: GameEndParams) => number;
  trackAction: (actionName: string, params?: Record<string, unknown>) => void;
  isInMatch: () => boolean;
  getMatchDuration: () => number;
}

interface AnalyticsContextValue {
  analytics: GameAnalytics | null;
  isEnabled: boolean;
  match: MatchTrackingState;
  // Convenience methods
  trackLogin: (method: string) => void;
  trackSignUp: (method: string) => void;
  trackTutorialBegin: () => void;
  trackTutorialComplete: () => void;
  trackLevelUp: (level: number) => void;
  trackAchievement: (id: string, name?: string) => void;
  trackAdImpression: (format: string) => void;
  trackError: (description: string, fatal?: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const matchIdRef = useRef<string | null>(null);

  // Create analytics instance
  const analytics = useMemo(() => {
    if (!GA_MEASUREMENT_ID) return null;

    return new GameAnalytics(
      {
        measurementId: GA_MEASUREMENT_ID,
        debug: import.meta.env.DEV,
        anonymizeIp: true,
      },
      'BangShot'
    );
  }, []);

  // Initialize and set user ID when available
  useEffect(() => {
    if (analytics) {
      analytics.initialize();
    }
  }, [analytics]);

  // Track page views on navigation
  useEffect(() => {
    if (analytics) {
      analytics.pageView(location.pathname);
    }
  }, [analytics, location.pathname]);

  // Track login and set user properties when user changes
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (analytics && user?.id) {
      analytics.setUserId(user.id);
      analytics.setUserProperties({
        player_tier: user.tier,
        player_rank: user.rank,
      });

      // Track login event when user logs in (was null, now has value)
      if (prevUserIdRef.current === null && user.id) {
        analytics.trackLogin('oauth');
      }
    }
    prevUserIdRef.current = user?.id || null;
  }, [analytics, user?.id, user?.tier, user?.rank]);

  // Match tracking methods
  const startMatch = useCallback(
    (params: GameMatchParams = {}) => {
      if (!analytics) return '';
      matchIdRef.current = analytics.trackMatchStart(params);
      return matchIdRef.current;
    },
    [analytics]
  );

  const endMatch = useCallback(
    (params: GameEndParams) => {
      if (!analytics) return 0;
      const duration = analytics.trackMatchEnd(params);
      matchIdRef.current = null;
      return duration;
    },
    [analytics]
  );

  const trackAction = useCallback(
    (actionName: string, params: Record<string, unknown> = {}) => {
      if (!analytics) return;
      analytics.trackAction(actionName, params);
    },
    [analytics]
  );

  const isInMatch = useCallback(() => {
    return matchIdRef.current !== null;
  }, []);

  const getMatchDuration = useCallback(() => {
    if (!analytics) return 0;
    return analytics.getCurrentMatchDuration();
  }, [analytics]);

  // Convenience methods
  const trackLogin = useCallback(
    (method: string) => {
      analytics?.trackLogin(method);
    },
    [analytics]
  );

  const trackSignUp = useCallback(
    (method: string) => {
      analytics?.trackSignUp(method);
    },
    [analytics]
  );

  const trackTutorialBegin = useCallback(() => {
    analytics?.trackTutorialBegin();
  }, [analytics]);

  const trackTutorialComplete = useCallback(() => {
    analytics?.trackTutorialComplete();
  }, [analytics]);

  const trackLevelUp = useCallback(
    (level: number) => {
      analytics?.trackLevelUp(level);
    },
    [analytics]
  );

  const trackAchievement = useCallback(
    (id: string, name?: string) => {
      analytics?.trackUnlockAchievement(id, name);
    },
    [analytics]
  );

  const trackAdImpression = useCallback(
    (format: string) => {
      analytics?.trackAdImpression(format);
    },
    [analytics]
  );

  const trackError = useCallback(
    (description: string, fatal: boolean = false) => {
      analytics?.trackError(description, fatal);
    },
    [analytics]
  );

  const value: AnalyticsContextValue = {
    analytics,
    isEnabled: !!analytics,
    match: {
      matchId: matchIdRef.current,
      startMatch,
      endMatch,
      trackAction,
      isInMatch,
      getMatchDuration,
    },
    trackLogin,
    trackSignUp,
    trackTutorialBegin,
    trackTutorialComplete,
    trackLevelUp,
    trackAchievement,
    trackAdImpression,
    trackError,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Convenience hook for match tracking
export function useMatchTracking() {
  const { match } = useAnalytics();
  return match;
}
