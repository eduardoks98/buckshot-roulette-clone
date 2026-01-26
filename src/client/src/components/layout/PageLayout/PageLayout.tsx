// ==========================================
// PAGE LAYOUT - Componente de layout padronizado
// ==========================================

import { Header } from '../Header';
import { Footer } from '../Footer';
import { PageHeader } from '../PageHeader';
import './PageLayout.css';

// Debug mode para visualizar onde os ads vão ficar
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
  if (!AD_DEBUG) return null;
  const size = AD_SIZES[position] || '300x250';
  return (
    <div className={`ad-placeholder ad-placeholder--${position}`}>
      AD: {position.toUpperCase()}
      <span className="ad-size">{size}</span>
    </div>
  );
}

// Componente exportado para uso em páginas (ads inline entre seções)
export function InlineAd({ position = 'inline-top' }: { position?: 'inline-top' | 'inline-bottom' }) {
  if (!AD_DEBUG) return null;
  return <AdPlaceholder position={position} />;
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSideAds?: boolean;
}

export function PageLayout({
  children,
  title,
  showHeader = true,
  showFooter = true,
  showSideAds = true,
}: PageLayoutProps) {
  return (
    <div className="page-layout">
      {showHeader && <Header />}

      {/* ===== BREADCRUMB (full width) ===== */}
      {title && <PageHeader title={title} />}

      {/* ===== MAIN BODY WITH SIDE ADS ===== */}
      <div className="page-body">
        {showSideAds && <AdPlaceholder position="left" />}

        <main className="page-content">
          {children}
        </main>

        {showSideAds && <AdPlaceholder position="right" />}
      </div>

      {showFooter && <Footer />}
    </div>
  );
}

export default PageLayout;
