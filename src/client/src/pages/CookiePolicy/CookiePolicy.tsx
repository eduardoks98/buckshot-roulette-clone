// ==========================================
// COOKIE POLICY PAGE
// ==========================================

import { LegalPage } from '../../components/pages/LegalPage';

export default function CookiePolicy() {
  return (
    <LegalPage
      endpoint="cookies"
      defaultTitle="Politica de Cookies"
      errorMessage="Politica de cookies nao encontrada"
    />
  );
}
