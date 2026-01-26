// ==========================================
// TERMS OF SERVICE PAGE
// ==========================================

import { LegalPage } from '../../components/pages/LegalPage';

export default function TermsOfService() {
  return (
    <LegalPage
      endpoint="terms"
      defaultTitle="Termos de Uso"
      errorMessage="Termos de uso nao encontrados"
    />
  );
}
