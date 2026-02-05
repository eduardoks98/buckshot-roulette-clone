import './Footer.css';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:8000';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__logo">MySys Games</div>
        <nav className="footer__links">
          <a href={`${PORTAL_URL}/legal/about`} className="footer__link">
            Sobre Nos
          </a>
          <a href={`${PORTAL_URL}/legal/contact`} className="footer__link">
            Contato
          </a>
          <a href={`${PORTAL_URL}/legal/privacy`} className="footer__link">
            Privacidade
          </a>
          <a href={`${PORTAL_URL}/legal/terms`} className="footer__link">
            Termos de Uso
          </a>
          <a href={`${PORTAL_URL}/legal/cookies`} className="footer__link">
            Cookies
          </a>
        </nav>
        <p className="footer__copy">
          &copy; {currentYear} MySys Games. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
