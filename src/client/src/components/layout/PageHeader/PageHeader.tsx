// ==========================================
// PAGE HEADER - Sub-header com breadcrumb
// ==========================================

import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  onBack?: () => void;
}

export function PageHeader({ title, backTo = '/', onBack }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backTo);
    }
  };

  return (
    <div className="page-header">
      <div className="page-header__inner">
        <button className="page-header__back" onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="page-header__title">{title}</h1>
      </div>
    </div>
  );
}

export default PageHeader;
