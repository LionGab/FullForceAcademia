import { useEffect } from 'react';
import PlansSection from './components/PlansSection';
import WhatsAppButton from './components/WhatsAppButton';
import { initAnalytics } from './utils/analytics';
import './styles/main.css';

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="App">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🔥 #1 ACADEMIA EM MATUPÁ-MT</div>
            <h1 className="hero-title">
              Full Force Academia
              <span className="hero-subtitle">Sua transformação começa aqui</span>
            </h1>
            <p className="hero-description">
              Academia completa em Matupá-MT com musculação, aulas coletivas,
              spinning e personal trainer. Equipamentos de última geração e
              equipe especializada para ajudar você a alcançar seus objetivos.
            </p>
            <div className="hero-cta">
              <a href="https://wa.me/5566999570328?text=Olá,%20vim%20do%20site%20e%20quero%20agendar%20uma%20aula%20teste%20grátis!" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Agendar Aula Teste Grátis
              </a>
              <a href="#planos" className="btn btn-secondary">
                Ver Planos e Preços
              </a>
            </div>
          </div>
        </div>
      </section>

      <PlansSection />

      <section className="cta-section">
        <div className="container">
          <h2>Pronto para transformar seu corpo e sua vida?</h2>
          <p>Agende hoje mesmo sua aula teste grátis e conheça nossa estrutura!</p>
          <a href="https://wa.me/5566999570328?text=Olá,%20vim%20do%20site%20e%20quero%20agendar%20uma%20aula%20teste%20grátis!" target="_blank" rel="noopener noreferrer" className="btn btn-large">
            Agendar Aula Teste Grátis no WhatsApp
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-col">
              <h3>Full Force Academia</h3>
              <p>A melhor academia de Matupá-MT</p>
            </div>
            <div className="footer-col">
              <h4>Contato</h4>
              <p>Rua 09, 203 - Matupá-MT</p>
              <p>(66) 99957-0328</p>
            </div>
            <div className="footer-col">
              <h4>Horários</h4>
              <p>Segunda a Sexta: 05:00 - 22:00</p>
              <p>Sábado: 08:00 - 12:00</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Full Force Academia. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
}

export default App;
