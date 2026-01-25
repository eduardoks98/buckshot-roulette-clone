// ==========================================
// PRIVACY POLICY PAGE
// ==========================================

import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <h1>Politica de Privacidade</h1>
        <p className="last-updated">Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}</p>

        <section>
          <h2>1. Introducao</h2>
          <p>
            Bem-vindo ao Bang Shot. Esta Politica de Privacidade descreve como coletamos,
            usamos e protegemos suas informacoes quando voce usa nosso jogo.
          </p>
        </section>

        <section>
          <h2>2. Informacoes que Coletamos</h2>

          <h3>2.1 Informacoes de Conta</h3>
          <p>Quando voce faz login com Google, coletamos:</p>
          <ul>
            <li>Nome de exibicao</li>
            <li>Endereco de email</li>
            <li>Foto de perfil (URL do Google)</li>
            <li>ID unico do Google</li>
          </ul>

          <h3>2.2 Dados de Jogo</h3>
          <p>Durante o uso do jogo, coletamos:</p>
          <ul>
            <li>Estatisticas de partidas (vitorias, derrotas, dano)</li>
            <li>Pontuacao ELO e nivel</li>
            <li>Conquistas desbloqueadas</li>
            <li>Historico de partidas</li>
          </ul>

          <h3>2.3 Dados Tecnicos</h3>
          <ul>
            <li>Endereco IP (para conexao com o servidor)</li>
            <li>Tipo de navegador e dispositivo</li>
            <li>Dados de sessao</li>
          </ul>
        </section>

        <section>
          <h2>3. Como Usamos suas Informacoes</h2>
          <ul>
            <li>Fornecer e melhorar o jogo</li>
            <li>Manter rankings e estatisticas</li>
            <li>Identificar e corrigir bugs</li>
            <li>Comunicar atualizacoes importantes</li>
            <li>Exibir anuncios relevantes (via Google AdSense)</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies e Tecnologias Similares</h2>
          <p>Utilizamos cookies para:</p>
          <ul>
            <li>Manter sua sessao de login</li>
            <li>Lembrar suas preferencias</li>
            <li>Analisar o uso do site (Google Analytics)</li>
            <li>Exibir anuncios personalizados (Google AdSense)</li>
          </ul>
          <p>
            Voce pode desativar cookies nas configuracoes do seu navegador,
            mas isso pode afetar a funcionalidade do jogo.
          </p>
        </section>

        <section>
          <h2>5. Google AdSense</h2>
          <p>
            Usamos o Google AdSense para exibir anuncios. O Google pode usar cookies
            para exibir anuncios com base em visitas anteriores a este e outros sites.
            Voce pode desativar a publicidade personalizada visitando as{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Configuracoes de Anuncios do Google
            </a>.
          </p>
        </section>

        <section>
          <h2>6. Compartilhamento de Dados</h2>
          <p>Nao vendemos suas informacoes pessoais. Compartilhamos dados apenas com:</p>
          <ul>
            <li>Google (autenticacao e anuncios)</li>
            <li>Provedores de hospedagem (para operar o servico)</li>
            <li>Autoridades legais (quando exigido por lei)</li>
          </ul>
        </section>

        <section>
          <h2>7. Seguranca</h2>
          <p>
            Implementamos medidas de seguranca para proteger suas informacoes, incluindo:
          </p>
          <ul>
            <li>Conexoes criptografadas (HTTPS)</li>
            <li>Autenticacao segura via OAuth 2.0</li>
            <li>Armazenamento seguro de dados</li>
          </ul>
        </section>

        <section>
          <h2>8. Seus Direitos</h2>
          <p>Voce tem o direito de:</p>
          <ul>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir informacoes incorretas</li>
            <li>Solicitar exclusao da sua conta</li>
            <li>Exportar seus dados</li>
          </ul>
          <p>Para exercer esses direitos, entre em contato conosco.</p>
        </section>

        <section>
          <h2>9. Menores de Idade</h2>
          <p>
            O Bang Shot nao e destinado a menores de 13 anos. Nao coletamos
            intencionalmente informacoes de criancas menores de 13 anos.
          </p>
        </section>

        <section>
          <h2>10. Alteracoes nesta Politica</h2>
          <p>
            Podemos atualizar esta politica periodicamente. Notificaremos sobre
            mudancas significativas atraves do jogo ou por email.
          </p>
        </section>

        <section>
          <h2>11. Contato</h2>
          <p>
            Para questoes sobre privacidade, entre em contato atraves do
            sistema de report de bugs no jogo ou pelo email de suporte.
          </p>
        </section>

        <div className="legal-footer">
          <p>© {new Date().getFullYear()} Bang Shot. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
