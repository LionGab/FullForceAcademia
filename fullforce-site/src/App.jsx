import { useEffect } from 'react';
import Navbar from './components/Navbar';
import PlansSection from './components/PlansSection';
import ServicesSection from './components/ServicesSection';
import StatsSection from './components/StatsSection';
import BenefitsSection from './components/BenefitsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQSection from './components/FAQSection';
import WhatsAppButton from './components/WhatsAppButton';
import { initAnalytics } from './utils/analytics';
import './styles/main.css';

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="App">
      <Navbar />

      <section id="home" className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span className="badge-pulse"></span>
              🔥 #1 ACADEMIA EM MATUPÁ-MT
            </div>
            <h1 className="hero-title animate-slide-up">
              Full Force Academia
              <span className="hero-subtitle">Sua transformação começa aqui</span>
            </h1>
            <p className="hero-description animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Academia completa em Matupá-MT com musculação, aulas coletivas,
              spinning e personal trainer. Equipamentos de última geração e
              equipe especializada para ajudar você a alcançar seus objetivos.
            </p>
            <div className="hero-cta animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <a href="https://wa.me/5566999570328?text=Olá,%20vim%20do%20site%20e%20quero%20agendar%20uma%20aula%20teste%20grátis!" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-glow">
                <span className="btn-icon">🎯</span>
                Agendar Aula Teste Grátis
              </a>
              <a href="#planos" className="btn btn-secondary btn-glass">
                Ver Planos e Preços
              </a>
            </div>
            <div className="hero-info animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="info-badge">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Sem taxa de matrícula
              </div>
              <div className="info-badge">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Aula teste grátis
              </div>
              <div className="info-badge">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                7 dias de garantia
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Role para descobrir</span>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      <StatsSection />

      <ServicesSection />

      <PlansSection />

      <BenefitsSection />

      <TestimonialsSection />

      <FAQSection />

      <section className="cta-section">
        <div className="cta-background"></div>
        <div className="container">
          <div className="cta-content">
            <h2>Pronto para transformar seu corpo e sua vida?</h2>
            <p>Agende hoje mesmo sua aula teste grátis e conheça nossa estrutura!</p>
            <a href="https://wa.me/5566999570328?text=Olá,%20vim%20do%20site%20e%20quero%20agendar%20uma%20aula%20teste%20grátis!" target="_blank" rel="noopener noreferrer" className="btn btn-large btn-pulse">
              Agendar Aula Teste Grátis no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer id="contato" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-col footer-about">
              <h3>
                <span className="footer-logo">💪</span>
                Full Force Academia
              </h3>
              <p>A melhor academia de Matupá-MT. Transformando vidas através do fitness desde 2016.</p>
              <div className="footer-social">
                <a href="https://instagram.com/fullforceacademia" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/fullforceacademia" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Links Rápidos</h4>
              <ul className="footer-links">
                <li><a href="#home">Início</a></li>
                <li><a href="#servicos">Serviços</a></li>
                <li><a href="#planos">Planos</a></li>
                <li><a href="#depoimentos">Depoimentos</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contato</h4>
              <ul className="footer-contact">
                <li>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h18v14a2 2 0 01-2 2H5a2 2 0 01-2-2V3zm0 0l9 6 9-6"/>
                  </svg>
                  Rua 09, 203 - Matupá-MT
                </li>
                <li>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  (66) 99957-0328
                </li>
                <li>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Seg-Sex: 05:00-22:00
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Horários</h4>
              <ul className="footer-schedule">
                <li>Segunda a Sexta: <strong>05:00 - 22:00</strong></li>
                <li>Sábado: <strong>08:00 - 12:00</strong></li>
                <li>Domingo: <strong>Fechado</strong></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Full Force Academia. Todos os direitos reservados.</p>
            <p className="footer-dev">Desenvolvido com 💪 para transformar vidas</p>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
}

export default App;
