// ==========================================
// PRIVACY POLICY PAGE
// ==========================================

import { LegalPage } from '../../components/pages/LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage
      endpoint="privacy"
      defaultTitle="Politica de Privacidade"
      errorMessage="Politica de privacidade nao encontrada"
    />
  );
}
