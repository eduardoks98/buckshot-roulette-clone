import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// ==========================================
// TYPES
// ==========================================

export interface Ad {
  id: string;
  placement_id: string;
  type: 'banner' | 'video' | 'interstitial' | 'native';
  format: string;
  media: {
    type: 'image' | 'gif' | 'video';
    url: string;
    thumbnail?: string;
  };
  video?: {
    duration: number;
    skip_after: number;
  };
  content: {
    title?: string;
    description?: string;
    cta_text?: string;
    cta_url: string;
  };
  sponsor: {
    name: string;
    logo?: string;
  };
  tracking: {
    impression_url: string;
    click_url: string;
  };
}

export interface AdPlacement {
  id: string;
  name: string;
  position: string;
  accepted_formats: string[];
  accepted_types: string[];
}

interface AdsContextType {
  ads: Ad[];
  placements: AdPlacement[];
  isLoading: boolean;
  fetchAds: (position?: string, type?: string) => Promise<Ad[]>;
  fetchRewardedAds: () => Promise<Ad[]>;
  trackImpression: (adId: string, placementId?: string) => Promise<void>;
  trackClick: (adId: string, placementId?: string) => Promise<void>;
  trackVideoProgress: (adId: string, percent: number, placementId?: string) => Promise<void>;
  claimReward: (adId: string, placementId?: string) => Promise<boolean>;
  getAdForPosition: (position: string) => Ad | undefined;
}

// ==========================================
// CONTEXT
// ==========================================

const AdsContext = createContext<AdsContextType | null>(null);

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://admin.mysys.shop';
const GAME_CODE = import.meta.env.VITE_GAME_CODE || 'BANGSHOT';

// ==========================================
// PROVIDER
// ==========================================

interface AdsProviderProps {
  children: ReactNode;
}

export function AdsProvider({ children }: AdsProviderProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch placements on mount
  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/placements`);
      if (response.ok) {
        const data = await response.json();
        setPlacements(data.placements || []);
      }
    } catch (error) {
      console.error('Erro ao buscar placements:', error);
    }
  };

  const fetchAds = useCallback(async (position?: string, type?: string): Promise<Ad[]> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (position) params.append('position', position);
      if (type) params.append('type', type);

      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads?${params}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedAds = data.ads || [];
        setAds(prev => {
          // Merge new ads, avoiding duplicates
          const newAds = [...prev];
          for (const ad of fetchedAds) {
            if (!newAds.find(a => a.id === ad.id)) {
              newAds.push(ad);
            }
          }
          return newAds;
        });
        return fetchedAds;
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar ads:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRewardedAds = useCallback(async (): Promise<Ad[]> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/rewarded`);
      if (response.ok) {
        const data = await response.json();
        return data.ads || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar rewarded ads:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackImpression = useCallback(async (adId: string, placementId?: string) => {
    try {
      const params = placementId ? `?placement_id=${placementId}` : '';
      await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/${adId}/track/impression${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Erro ao rastrear impressão:', error);
    }
  }, []);

  const trackClick = useCallback(async (adId: string, placementId?: string) => {
    try {
      const params = placementId ? `?placement_id=${placementId}` : '';
      await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/${adId}/track/click${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Erro ao rastrear clique:', error);
    }
  }, []);

  const trackVideoProgress = useCallback(async (adId: string, percent: number, placementId?: string) => {
    try {
      await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/${adId}/video-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent, placement_id: placementId }),
      });
    } catch (error) {
      console.error('Erro ao rastrear progresso do vídeo:', error);
    }
  }, []);

  const claimReward = useCallback(async (adId: string, placementId?: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('bangshot_auth_token');
      if (!token) return false;

      const response = await fetch(`${ADMIN_API_URL}/api/games/${GAME_CODE}/ads/${adId}/claim-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ placement_id: placementId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao reivindicar recompensa:', error);
      return false;
    }
  }, []);

  const getAdForPosition = useCallback((position: string): Ad | undefined => {
    return ads.find(ad => {
      // Find if any placement matches
      const placement = placements.find(p => p.position === position);
      return placement && ad.placement_id === placement.id;
    });
  }, [ads, placements]);

  const value: AdsContextType = {
    ads,
    placements,
    isLoading,
    fetchAds,
    fetchRewardedAds,
    trackImpression,
    trackClick,
    trackVideoProgress,
    claimReward,
    getAdForPosition,
  };

  return (
    <AdsContext.Provider value={value}>
      {children}
    </AdsContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useAds(): AdsContextType {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds deve ser usado dentro de AdsProvider');
  }
  return context;
}
