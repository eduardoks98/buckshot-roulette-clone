import { useState, useEffect, useCallback } from 'react';
import { useAds, Ad } from '../../context/AdsContext';
import './InterstitialAd.css';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  position?: string;
  autoCloseAfter?: number; // seconds
}

export function InterstitialAd({
  isOpen,
  onClose,
  position = 'between_matches',
  autoCloseAfter = 5,
}: InterstitialAdProps) {
  const { fetchAds, trackImpression, trackClick } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(autoCloseAfter);
  const [canClose, setCanClose] = useState(false);

  // Fetch ad when modal opens
  useEffect(() => {
    if (!isOpen) {
      setAd(null);
      setCountdown(autoCloseAfter);
      setCanClose(false);
      return;
    }

    const loadAd = async () => {
      setIsLoading(true);
      const ads = await fetchAds(position, 'interstitial');
      if (ads.length > 0) {
        setAd(ads[0]);
      }
      setIsLoading(false);
    };
    loadAd();
  }, [isOpen, position, fetchAds, autoCloseAfter]);

  // Track impression when ad loads
  useEffect(() => {
    if (ad && isOpen) {
      trackImpression(ad.id, ad.placement_id);
    }
  }, [ad, isOpen, trackImpression]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !ad || countdown <= 0) {
      if (countdown <= 0) setCanClose(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, ad, countdown]);

  const handleClick = useCallback(() => {
    if (!ad) return;
    trackClick(ad.id, ad.placement_id);
    window.open(ad.content.cta_url, '_blank', 'noopener,noreferrer');
  }, [ad, trackClick]);

  const handleClose = useCallback(() => {
    if (canClose) {
      onClose();
    }
  }, [canClose, onClose]);

  if (!isOpen) return null;

  // If no ad available, close immediately
  if (!isLoading && !ad) {
    onClose();
    return null;
  }

  return (
    <div className="interstitial-overlay">
      <div className="interstitial-modal">
        <div className="interstitial-header">
          <span className="interstitial-label">Anúncio</span>
          {ad?.sponsor.name && (
            <span className="interstitial-sponsor">{ad.sponsor.name}</span>
          )}
          <button
            className={`interstitial-close ${canClose ? 'can-close' : ''}`}
            onClick={handleClose}
            disabled={!canClose}
          >
            {canClose ? '✕' : countdown}
          </button>
        </div>

        <div className="interstitial-content" onClick={handleClick}>
          {isLoading ? (
            <div className="interstitial-loading">
              <div className="spinner"></div>
            </div>
          ) : ad ? (
            <>
              {ad.media.type === 'video' ? (
                <video
                  src={ad.media.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="interstitial-media"
                />
              ) : (
                <img
                  src={ad.media.url}
                  alt={ad.content.title || 'Advertisement'}
                  className="interstitial-media"
                />
              )}

              <div className="interstitial-info">
                {ad.content.title && (
                  <h3 className="interstitial-title">{ad.content.title}</h3>
                )}
                {ad.content.description && (
                  <p className="interstitial-description">{ad.content.description}</p>
                )}
                {ad.content.cta_text && (
                  <button className="interstitial-cta">
                    {ad.content.cta_text}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default InterstitialAd;
