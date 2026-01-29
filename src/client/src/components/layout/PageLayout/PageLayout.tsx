// ==========================================
// PAGE LAYOUT - Componente de layout padronizado
// ==========================================

import { Header } from '../Header';
import { Footer } from '../Footer';
import { PageHeader } from '../PageHeader';
import { BannerAd } from '../../ads';
import './PageLayout.css';

// Debug mode para visualizar onde os ads vão ficar quando não há ads reais
const AD_DEBUG = import.meta.env.DEV;

// Tamanhos padrão dos ads
const AD_SIZES = {
  left: '160x600',
  right: '160x600',
  'inline-top': '728x90',
  'inline-bottom': '728x90',
};

interface AdPlaceholderProps {
  position: 'left' | 'right' | 'inline-top' | 'inline-bottom';
}

function AdPlaceholder({ position }: AdPlaceholderProps) {
  const size = AD_SIZES[position] || '300x250';
  return (
    <div className={`ad-placeholder ad-placeholder--${position}`}>
      AD: {position.toUpperCase()}
      <span className="ad-size">{size}</span>
    </div>
  );
}

// Side Ad component - uses real BannerAd with fallback to placeholder in dev
function SideAd({ position }: { position: 'left' | 'right' }) {
  const positionName = position === 'left' ? 'sidebar_left' : 'sidebar_right';
  return (
    <div className={`page-layout__side-ad page-layout__side-ad--${position}`}>
      <BannerAd
        position={positionName}
        className="side-banner-ad"
        fallback={AD_DEBUG ? <AdPlaceholder position={position} /> : null}
      />
    </div>
  );
}

// Componente exportado para uso em páginas (ads inline entre seções)
export function InlineAd({ position = 'inline-top' }: { position?: 'inline-top' | 'inline-bottom' }) {
  const positionName = position === 'inline-top' ? 'inline_top' : 'inline_bottom';
  return (
    <div className={`inline-ad-container inline-ad-container--${position}`}>
      <BannerAd
        position={positionName}
        className="inline-banner-ad"
        fallback={AD_DEBUG ? <AdPlaceholder position={position} /> : null}
      />
    </div>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  showSideAds?: boolean;
}

export function PageLayout({
  children,
  title,
  onBack,
  showHeader = true,
  showFooter = true,
  showSideAds = true,
}: PageLayoutProps) {
  return (
    <div className="page-layout">
      {showHeader && <Header />}

      {/* ===== BREADCRUMB (full width) ===== */}
      {title && <PageHeader title={title} onBack={onBack} />}

      {/* ===== MAIN BODY WITH SIDE ADS ===== */}
      <div className="page-body">
        {showSideAds && <SideAd position="left" />}

        <main className="page-content">
          {children}
        </main>

        {showSideAds && <SideAd position="right" />}
      </div>

      {showFooter && <Footer />}
    </div>
  );
}

export default PageLayout;
