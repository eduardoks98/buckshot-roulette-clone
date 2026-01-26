// ==========================================
// FOOTER - Componente de footer reutilizável
// ==========================================

import { useNavigate } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <span className="app-footer__logo">BANGSHOT</span>
          <p>Um jogo de estrategia e sorte.</p>
        </div>
        <div className="app-footer__links">
          <button onClick={() => navigate('/privacy')}>Privacidade</button>
          <button onClick={() => navigate('/terms')}>Termos de Uso</button>
          <button onClick={() => navigate('/cookies')}>Cookies</button>
        </div>
      </div>
      <div className="app-footer__bottom">
        <p>© {new Date().getFullYear()} Bang Shot. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
