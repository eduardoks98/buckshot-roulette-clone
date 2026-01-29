import { useState, useEffect, useCallback } from 'react';
import { initSDK } from './config';
import {
  getAvailableProviders,
  login,
  handleCallback,
  getCurrentUser,
  logout,
  isLoggedIn,
} from './auth';
import {
  getAds,
  getPlacements,
  getAdsForPlacement,
  getRewardedAds,
} from './ads';
import type {
  GamesAdminSDKConfig,
  GameUser,
  ProviderInfo,
  AdCreative,
  AdPlacement,
} from './types';

/**
 * Hook to initialize the Games Admin SDK
 */
export function useGamesAdminSDK(config: GamesAdminSDKConfig): boolean {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initSDK(config);
    setInitialized(true);
  }, [config.baseUrl, config.gameCode]);

  return initialized;
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const [user, setUser] = useState<GameUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  // Load providers on mount
  useEffect(() => {
    getAvailableProviders().then(setProviders);
  }, []);

  // Check for callback token on mount
  useEffect(() => {
    const token = handleCallback();
    if (token) {
      loadUser();
    } else if (isLoggedIn()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const userData = await getCurrentUser();
    setUser(userData);
    setLoading(false);
  }, []);

  const handleLogin = useCallback(async (provider: 'google' | 'facebook' | 'discord') => {
    await login(provider);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isLoggedIn: user !== null,
    providers,
    login: handleLogin,
    logout: handleLogout,
    refreshUser: loadUser,
  };
}

/**
 * Hook for ads
 */
export function useAds() {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = useCallback(async () => {
    setLoading(true);
    const [adsData, placementsData] = await Promise.all([
      getAds(),
      getPlacements(),
    ]);
    setAds(adsData);
    setPlacements(placementsData);
    setLoading(false);
  }, []);

  const getAdsByPlacement = useCallback(async (placementId: string) => {
    return getAdsForPlacement(placementId);
  }, []);

  return {
    ads,
    placements,
    loading,
    refreshAds: loadAds,
    getAdsByPlacement,
  };
}

/**
 * Hook for rewarded ads
 */
export function useRewardedAds() {
  const [rewardedAds, setRewardedAds] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRewardedAds();
  }, []);

  const loadRewardedAds = useCallback(async () => {
    setLoading(true);
    const ads = await getRewardedAds();
    setRewardedAds(ads);
    setLoading(false);
  }, []);

  const getRandomRewardedAd = useCallback(() => {
    if (rewardedAds.length === 0) return null;
    return rewardedAds[Math.floor(Math.random() * rewardedAds.length)];
  }, [rewardedAds]);

  return {
    rewardedAds,
    loading,
    refreshRewardedAds: loadRewardedAds,
    getRandomRewardedAd,
  };
}

/**
 * Hook for a specific ad placement
 */
export function usePlacementAds(placementId: string) {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (placementId) {
      loadAds();
    }
  }, [placementId]);

  const loadAds = useCallback(async () => {
    setLoading(true);
    const adsData = await getAdsForPlacement(placementId);
    setAds(adsData);
    setLoading(false);
  }, [placementId]);

  const getRandomAd = useCallback(() => {
    if (ads.length === 0) return null;
    return ads[Math.floor(Math.random() * ads.length)];
  }, [ads]);

  return {
    ads,
    loading,
    refreshAds: loadAds,
    getRandomAd,
  };
}
