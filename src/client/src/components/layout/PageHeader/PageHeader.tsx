// ==========================================
// PAGE HEADER - Sub-header com breadcrumb
// ==========================================

import { useNavigate } from 'react-router-dom';
import { BackArrowIcon } from '../../icons';
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
          <BackArrowIcon size={16} />
          Voltar
        </button>
        <h1 className="page-header__title">{title}</h1>
      </div>
    </div>
  );
}

export default PageHeader;
