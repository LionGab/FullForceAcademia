const CTASection = () => {
  return (
    <section className="cta-section-enhanced">
      {/* Animated Background Elements */}
      <div className="cta-bg-elements">
        <div className="cta-circle cta-circle-1"></div>
        <div className="cta-circle cta-circle-2"></div>
        <div className="cta-circle cta-circle-3"></div>
        <div className="cta-grid-pattern"></div>
      </div>

      <div className="container">
        <div className="cta-content-enhanced">
          {/* Badge */}
          <div className="cta-badge">
            <span className="cta-badge-icon">⚡</span>
            <span>TRANSFORME SUA VIDA AGORA</span>
          </div>

          {/* Main Title */}
          <h2 className="cta-title">
            Pronto para <span className="cta-highlight">transformar</span><br />
            seu corpo e sua vida?
          </h2>

          {/* Description */}
          <p className="cta-description">
            Agende hoje sua aula teste 100% grátis e descubra por que somos a TOP 1 em Matupá-MT
          </p>

          {/* Benefits Grid */}
          <div className="cta-benefits">
            <div className="cta-benefit-item">
              <div className="cta-benefit-icon">✓</div>
              <span>Aula teste grátis</span>
            </div>
            <div className="cta-benefit-item">
              <div className="cta-benefit-icon">✓</div>
              <span>Sem taxa de matrícula</span>
            </div>
            <div className="cta-benefit-item">
              <div className="cta-benefit-icon">✓</div>
              <span>7 dias de garantia</span>
            </div>
            <div className="cta-benefit-item">
              <div className="cta-benefit-icon">✓</div>
              <span>Equipamentos premium</span>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="https://wa.me/5566991080808?text=Olá,%20vim%20do%20site%20e%20quero%20agendar%20uma%20aula%20teste%20grátis!"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button-enhanced"
          >
            <span className="cta-button-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </span>
            <span className="cta-button-text">
              <span className="cta-button-main">Agendar Minha Aula Grátis</span>
              <span className="cta-button-sub">Resposta em até 5 minutos</span>
            </span>
            <span className="cta-button-arrow">→</span>
          </a>

          {/* Trust Indicators */}
          <div className="cta-trust">
            <div className="cta-trust-item">
              <span className="cta-trust-number">650+</span>
              <span className="cta-trust-label">Alunos ativos</span>
            </div>
            <div className="cta-trust-divider"></div>
            <div className="cta-trust-item">
              <span className="cta-trust-number">98%</span>
              <span className="cta-trust-label">Satisfação</span>
            </div>
            <div className="cta-trust-divider"></div>
            <div className="cta-trust-item">
              <span className="cta-trust-number">8 anos</span>
              <span className="cta-trust-label">De experiência</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
