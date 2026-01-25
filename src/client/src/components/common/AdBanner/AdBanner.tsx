import React, { useEffect, useRef, useState } from 'react';
import './AdBanner.css';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export type AdFormat = 'banner' | 'leaderboard' | 'rectangle' | 'skyscraper' | 'large_rectangle' | 'responsive';

interface AdBannerProps {
  publisherId: string;
  slotId: string;
  format?: AdFormat;
  style?: React.CSSProperties;
  className?: string;
  testMode?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const formatDimensions: Record<AdFormat, { width: string; height: string }> = {
  banner: { width: '468px', height: '60px' },
  leaderboard: { width: '728px', height: '90px' },
  rectangle: { width: '300px', height: '250px' },
  skyscraper: { width: '120px', height: '600px' },
  large_rectangle: { width: '336px', height: '280px' },
  responsive: { width: '100%', height: 'auto' },
};

export function AdBanner({
  publisherId,
  slotId,
  format = 'responsive',
  style,
  className,
  testMode = false,
  onLoad,
  onError,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    const loadScript = () => {
      const existingScript = document.querySelector(
        `script[src*="pagead2.googlesyndication.com"]`
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          pushAd();
        };

        script.onerror = () => {
          onError?.(new Error('Failed to load AdSense script'));
        };

        document.head.appendChild(script);
      } else {
        pushAd();
      }
    };

    const pushAd = () => {
      if (isLoaded.current) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
        onLoad?.();
      } catch (error) {
        onError?.(error as Error);
      }
    };

    loadScript();

    return () => {
      isLoaded.current = false;
    };
  }, [publisherId, onLoad, onError]);

  const dimensions = formatDimensions[format];
  const isResponsive = format === 'responsive';

  const containerStyle: React.CSSProperties = {
    display: isResponsive ? 'block' : 'inline-block',
    width: dimensions.width,
    height: dimensions.height,
    overflow: 'hidden',
    ...style,
  };

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ad-banner ${className || ''}`}
      style={containerStyle}
      data-ad-client={publisherId}
      data-ad-slot={slotId}
      data-ad-format={isResponsive ? 'auto' : undefined}
      data-full-width-responsive={isResponsive ? 'true' : undefined}
      data-adtest={testMode ? 'on' : undefined}
    />
  );
}

interface AdUnit {
  id: number;
  name: string;
  slot_id: string;
  format: AdFormat;
  position: string;
  ad_client: string;
  style: string;
  dimensions: { width: string | number; height: string | number };
  is_responsive: boolean;
}

export function useAdUnits(gameId?: string | number) {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAdUnits = async () => {
      try {
        const baseUrl = import.meta.env.VITE_ADMIN_API_URL || '';
        const url = gameId
          ? `${baseUrl}/api/ads/units?game=${gameId}`
          : `${baseUrl}/api/ads/units`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setAdUnits(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch ad units');
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdUnits();
  }, [gameId]);

  return { adUnits, loading, error };
}

interface AdByPositionProps {
  position: string;
  gameId?: string | number;
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AdByPosition({
  position,
  gameId = 'bangshot',
  fallback = null,
  className,
  style,
}: AdByPositionProps) {
  const { adUnits, loading, error } = useAdUnits(gameId);

  if (loading) {
    return <div className="ad-loading" />;
  }

  if (error) {
    console.error('Ad error:', error);
    return <>{fallback}</>;
  }

  const adUnit = adUnits.find((unit) => unit.position === position);

  if (!adUnit) {
    return <>{fallback}</>;
  }

  return (
    <AdBanner
      publisherId={adUnit.ad_client}
      slotId={adUnit.slot_id}
      format={adUnit.format}
      className={className}
      style={style}
    />
  );
}

export default AdBanner;
