import { useState } from 'react';

const WhatsAppButton = ({ message = "Olá, vim do site e quero agendar uma aula teste!" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const whatsappNumber = "5566999570328";

  const createWhatsAppLink = () => {
    const fullMessage = `${message} | Origem: floating_button`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
  };

  const handleClick = () => {
    window.open(createWhatsAppLink(), '_blank');
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      className="whatsapp-button"
      aria-label="Entrar em contato via WhatsApp"
      title="Fale conosco no WhatsApp"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    </button>
  );
};

export default WhatsAppButton;
