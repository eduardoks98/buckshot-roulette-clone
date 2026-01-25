// ==========================================
// TERMS OF SERVICE PAGE
// ==========================================

import { useNavigate } from 'react-router-dom';
import '../PrivacyPolicy/PrivacyPolicy.css'; // Reuse legal page styles

export default function TermsOfService() {
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

        <h1>Termos de Uso</h1>
        <p className="last-updated">Ultima atualizacao: {new Date().toLocaleDateString('pt-BR')}</p>

        <section>
          <h2>1. Aceitacao dos Termos</h2>
          <p>
            Ao acessar e usar o Bang Shot, voce concorda em cumprir estes Termos de Uso.
            Se voce nao concordar com qualquer parte destes termos, nao use o jogo.
          </p>
        </section>

        <section>
          <h2>2. Descricao do Servico</h2>
          <p>
            O Bang Shot e um jogo online multiplayer gratuito inspirado no conceito de
            "roleta russa" com espingarda. O jogo e oferecido "como esta" para fins de
            entretenimento.
          </p>
        </section>

        <section>
          <h2>3. Requisitos de Idade</h2>
          <p>
            Voce deve ter pelo menos <strong>13 anos</strong> para usar o Bang Shot.
            Se voce for menor de 18 anos, deve ter permissao de um responsavel legal.
          </p>
          <p>
            O jogo contem temas de violencia simulada e nao e recomendado para
            criancas pequenas.
          </p>
        </section>

        <section>
          <h2>4. Conta de Usuario</h2>

          <h3>4.1 Criacao de Conta</h3>
          <p>
            Para jogar online, voce precisa fazer login com uma conta Google.
            Voce e responsavel por manter a seguranca da sua conta.
          </p>

          <h3>4.2 Informacoes da Conta</h3>
          <p>
            Voce concorda em fornecer informacoes verdadeiras e manter seus
            dados atualizados.
          </p>
        </section>

        <section>
          <h2>5. Regras de Conduta</h2>
          <p>Ao usar o Bang Shot, voce concorda em NAO:</p>
          <ul>
            <li>Usar hacks, cheats, bots ou exploits</li>
            <li>Manipular o sistema de ranking ou estatisticas</li>
            <li>Assediar, ameacar ou intimidar outros jogadores</li>
            <li>Usar linguagem ofensiva, discriminatoria ou de odio</li>
            <li>Criar multiplas contas para burlar banimentos</li>
            <li>Interferir no funcionamento do jogo ou servidores</li>
            <li>Vender, trocar ou transferir sua conta</li>
            <li>Fazer engenharia reversa do codigo do jogo</li>
          </ul>
        </section>

        <section>
          <h2>6. Fair Play</h2>
          <p>
            Esperamos que todos os jogadores joguem de forma justa e respeitosa.
            Abandono frequente de partidas ou comportamento antidesportivo pode
            resultar em penalidades.
          </p>
        </section>

        <section>
          <h2>7. Propriedade Intelectual</h2>
          <p>
            Todo o conteudo do Bang Shot, incluindo codigo, graficos, sons e design,
            e protegido por direitos autorais. Voce nao pode copiar, modificar,
            distribuir ou usar comercialmente qualquer parte do jogo sem autorizacao.
          </p>
          <p>
            O Bang Shot e um projeto independente inspirado em conceitos de jogos
            existentes, mas com implementacao propria.
          </p>
        </section>

        <section>
          <h2>8. Anuncios</h2>
          <p>
            O Bang Shot exibe anuncios atraves do Google AdSense para manter o
            servico gratuito. Ao usar o jogo, voce concorda com a exibicao de
            anuncios durante a experiencia de jogo.
          </p>
        </section>

        <section>
          <h2>9. Suspensao e Encerramento</h2>
          <p>
            Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer
            momento, com ou sem aviso, por violacao destes termos ou por qualquer
            outro motivo.
          </p>
          <p>
            Em caso de encerramento, voce perdera acesso a todos os dados,
            estatisticas e conquistas associados a sua conta.
          </p>
        </section>

        <section>
          <h2>10. Isencao de Garantias</h2>
          <p>
            O Bang Shot e fornecido "como esta", sem garantias de qualquer tipo.
            Nao garantimos que o servico sera ininterrupto, seguro ou livre de erros.
          </p>
        </section>

        <section>
          <h2>11. Limitacao de Responsabilidade</h2>
          <p>
            Em nenhuma circunstancia seremos responsaveis por danos indiretos,
            incidentais, especiais ou consequentes decorrentes do uso do jogo.
          </p>
        </section>

        <section>
          <h2>12. Alteracoes nos Termos</h2>
          <p>
            Podemos modificar estes termos a qualquer momento. Alteracoes
            significativas serao notificadas atraves do jogo. O uso continuado
            apos alteracoes constitui aceitacao dos novos termos.
          </p>
        </section>

        <section>
          <h2>13. Legislacao Aplicavel</h2>
          <p>
            Estes termos sao regidos pelas leis do Brasil. Qualquer disputa sera
            resolvida nos tribunais competentes do Brasil.
          </p>
        </section>

        <section>
          <h2>14. Contato</h2>
          <p>
            Para questoes sobre estes termos, use o sistema de report de bugs
            no jogo ou entre em contato pelo email de suporte.
          </p>
        </section>

        <div className="legal-footer">
          <p>© {new Date().getFullYear()} Bang Shot. Todos os direitos reservados.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>
              Politica de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
