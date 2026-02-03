import { useState, useRef, useEffect, useCallback } from 'react';
import { useAds, Ad } from '../../context/AdsContext';
import './VideoRewardedAd.css';

interface VideoRewardedAdProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (reward: { type: string; amount: number }) => void;
  rewardType?: string;
  rewardAmount?: number;
}

export function VideoRewardedAd({
  isOpen,
  onClose,
  onRewardClaimed,
  rewardType = 'coins',
  rewardAmount = 100,
}: VideoRewardedAdProps) {
  const { fetchRewardedAds, trackImpression, trackVideoProgress, claimReward } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTrackedProgress = useRef(0);

  // Fetch rewarded ad when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setAd(null);
      setProgress(0);
      setCanSkip(false);
      setCanClaim(false);
      setError(null);
      lastTrackedProgress.current = 0;
      return;
    }

    const loadAd = async () => {
      setIsLoading(true);
      setError(null);
      const ads = await fetchRewardedAds();
      if (ads.length > 0) {
        setAd(ads[0]);
      } else {
        setError('Nenhum anúncio disponível no momento.');
      }
      setIsLoading(false);
    };
    loadAd();
  }, [isOpen, fetchRewardedAds]);

  // Track impression when ad loads
  useEffect(() => {
    if (ad && isOpen) {
      trackImpression(ad.id, ad.placement_id);
    }
  }, [ad, isOpen, trackImpression]);

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !ad) return;

    const video = videoRef.current;
    const percent = Math.floor((video.currentTime / video.duration) * 100);
    setProgress(percent);

    // Check if can skip
    if (ad.video?.skip_after && video.currentTime >= ad.video.skip_after) {
      setCanSkip(true);
    }

    // Track progress at milestones
    const milestones = [0, 25, 50, 75, 100];
    for (const milestone of milestones) {
      if (percent >= milestone && lastTrackedProgress.current < milestone) {
        trackVideoProgress(ad.id, milestone, ad.placement_id);
        lastTrackedProgress.current = milestone;
      }
    }
  }, [ad, trackVideoProgress]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    setCanClaim(true);
    if (ad) {
      trackVideoProgress(ad.id, 100, ad.placement_id);
    }
  }, [ad, trackVideoProgress]);

  // Handle claim reward
  const handleClaimReward = async () => {
    if (!ad || isClaiming) return;

    setIsClaiming(true);
    const success = await claimReward(ad.id, ad.placement_id);

    if (success) {
      onRewardClaimed({ type: rewardType, amount: rewardAmount });
      onClose();
    } else {
      setError('Erro ao reivindicar recompensa. Tente novamente.');
    }
    setIsClaiming(false);
  };

  // Handle skip
  const handleSkip = () => {
    onClose();
  };

  // Handle click on ad
  const handleAdClick = () => {
    if (ad) {
      window.open(ad.content.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-rewarded-overlay">
      <div className="video-rewarded-modal">
        <div className="video-rewarded-header">
          <span className="video-rewarded-label">Anúncio</span>
          {ad?.sponsor.name && (
            <span className="video-rewarded-sponsor">{ad.sponsor.name}</span>
          )}
          {canSkip && !canClaim && (
            <button className="video-rewarded-skip" onClick={handleSkip}>
              Pular
            </button>
          )}
        </div>

        <div className="video-rewarded-content">
          {isLoading && (
            <div className="video-rewarded-loading">
              <div className="spinner"></div>
              <p>Carregando anúncio...</p>
            </div>
          )}

          {error && (
            <div className="video-rewarded-error">
              <p>{error}</p>
              <button onClick={onClose}>Fechar</button>
            </div>
          )}

          {ad && !isLoading && !error && (
            <>
              <video
                ref={videoRef}
                src={ad.media.url}
                poster={ad.media.thumbnail}
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                onClick={handleAdClick}
                className="video-rewarded-video"
              />

              <div className="video-rewarded-progress">
                <div
                  className="video-rewarded-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {!canClaim && ad.video?.skip_after && !canSkip && (
                <div className="video-rewarded-countdown">
                  Pular em {Math.max(0, Math.ceil((ad.video.skip_after) - (videoRef.current?.currentTime || 0)))}s
                </div>
              )}
            </>
          )}
        </div>

        {canClaim && (
          <div className="video-rewarded-reward">
            <div className="video-rewarded-reward-info">
              <span className="video-rewarded-reward-icon">🎁</span>
              <div>
                <p className="video-rewarded-reward-title">Recompensa disponível!</p>
                <p className="video-rewarded-reward-amount">
                  +{rewardAmount} {rewardType}
                </p>
              </div>
            </div>
            <button
              className="video-rewarded-claim-btn"
              onClick={handleClaimReward}
              disabled={isClaiming}
            >
              {isClaiming ? 'Reivindicando...' : 'Reivindicar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoRewardedAd;
