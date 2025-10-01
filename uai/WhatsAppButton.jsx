import { useState, useEffect } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WhatsAppButton - Botão flutuante otimizado com tracking
 */
export const WhatsAppButton = ({ 
  message = "Olá, vim do site e quero agendar uma aula teste!",
  source = "floating_button",
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const whatsappNumber = "5566999570328";

  // UTM tracking automático
  const getUTMParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      if (urlParams.get(param)) {
        utmParams[param] = urlParams.get(param);
      }
    });
    
    return utmParams;
  };

  const createWhatsAppLink = () => {
    const utmParams = getUTMParams();
    const utmString = Object.keys(utmParams).length > 0 
      ? ` | UTM: ${Object.entries(utmParams).map(([k, v]) => `${k}=${v}`).join(', ')}`
      : '';
    
    const fullMessage = `${message} | Origem: ${source}${utmString}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fullMessage)}`;
  };

  const handleClick = () => {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'click_whatsapp', {
        event_category: 'CTA',
        event_label: source,
        value: 1
      });
    }

    // Abrir WhatsApp
    window.open(createWhatsAppLink(), '_blank');
  };

  // Mostrar após scroll ou delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`fixed bottom-6 right-6 z-50 ${className}`}
        >
          <motion.button
            onClick={handleClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative bg-gradient-to-r from-green-500 to-green-600 
                     hover:from-green-600 hover:to-green-700 text-white 
                     rounded-full p-4 shadow-lg hover:shadow-xl 
                     transition-all duration-300 focus:outline-none focus:ring-4 
                     focus:ring-green-500/50"
            aria-label="Entrar em contato via WhatsApp"
          >
            {/* Ícone principal */}
            <MessageCircle className="w-6 h-6" />
            
            {/* Indicador de pulso */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-green-500 rounded-full opacity-30"
            />
            
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-full mr-3 top-1/2 -translate-y-1/2 
                           bg-gray-900 text-white px-3 py-2 rounded-lg text-sm 
                           whitespace-nowrap shadow-lg"
                >
                  Fale conosco no WhatsApp
                  <div className="absolute left-full top-1/2 -translate-y-1/2 
                                border-l-4 border-l-gray-900 border-y-4 
                                border-y-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;
