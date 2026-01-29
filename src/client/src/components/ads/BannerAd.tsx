import { useEffect, useRef, useState } from 'react';
import { useAds, Ad } from '../../context/AdsContext';
import './BannerAd.css';

interface BannerAdProps {
  position: string;
  className?: string;
  fallback?: React.ReactNode;
  onAdLoaded?: (ad: Ad) => void;
  onAdClick?: (ad: Ad) => void;
}

export function BannerAd({ position, className = '', fallback, onAdLoaded, onAdClick }: BannerAdProps) {
  const { fetchAds, trackImpression, trackClick } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // Fetch ad for this position
  useEffect(() => {
    const loadAd = async () => {
      setIsLoading(true);
      const ads = await fetchAds(position, 'banner');
      if (ads.length > 0) {
        setAd(ads[0]);
        onAdLoaded?.(ads[0]);
      }
      setIsLoading(false);
    };
    loadAd();
  }, [position, fetchAds, onAdLoaded]);

  // Track impression when ad is visible
  useEffect(() => {
    if (!ad || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackImpression(ad.id, ad.placement_id);
          setHasTrackedImpression(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [ad, hasTrackedImpression, trackImpression]);

  const handleClick = () => {
    if (!ad) return;
    trackClick(ad.id, ad.placement_id);
    onAdClick?.(ad);
    window.open(ad.content.cta_url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return <div className={`banner-ad banner-ad-loading ${className}`}>Carregando...</div>;
  }

  if (!ad) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div ref={adRef} className={`banner-ad banner-ad-${position} ${className}`}>
      <div className="banner-ad-content" onClick={handleClick}>
        {ad.media.type === 'video' ? (
          <video
            src={ad.media.url}
            autoPlay
            loop
            muted
            playsInline
            className="banner-ad-media"
          />
        ) : (
          <img
            src={ad.media.url}
            alt={ad.content.title || 'Advertisement'}
            className="banner-ad-media"
          />
        )}
        {ad.content.cta_text && (
          <div className="banner-ad-cta">
            <span>{ad.content.cta_text}</span>
          </div>
        )}
      </div>
      <div className="banner-ad-sponsor">
        <span>Ad</span>
        {ad.sponsor.name && <span>• {ad.sponsor.name}</span>}
      </div>
    </div>
  );
}

export default BannerAd;
