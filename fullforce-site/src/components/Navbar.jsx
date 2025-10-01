import { useState, useEffect } from 'react';
import Logo from './Logo';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Início' },
    { href: '#servicos', label: 'Serviços' },
    { href: '#planos', label: 'Planos' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#contato', label: 'Contato' }
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#home" className="navbar-logo">
          <Logo showText={true} width={140} />
        </a>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="navbar-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://wa.me/5566991080808?text=Olá,%20vim%20do%20site!"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-cta"
          >
            Agende sua aula
          </a>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
