// Configuração simplificada de Analytics para Full Force Academia
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Substituir pelo ID real do Google Analytics

/**
 * Envia evento personalizado para GA
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'General',
      event_label: parameters.label || '',
      value: parameters.value || 0,
      ...parameters
    });
  }

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, parameters);
  }
};

/**
 * Eventos específicos da Full Force Academia
 */
export const events = {
  // WhatsApp
  whatsappClick: (source, planType = null) => {
    trackEvent('click_whatsapp', {
      category: 'CTA',
      label: source,
      value: 1,
      plan_type: planType
    });
  },

  // Planos
  planSelection: (planType, price) => {
    trackEvent('select_plan', {
      category: 'Plans',
      label: planType,
      value: parseFloat(price.replace('R$ ', '').replace(',', '.')),
      plan_type: planType
    });
  },

  // Scroll
  scrollDepth: (percentage) => {
    trackEvent('scroll_depth', {
      category: 'Engagement',
      label: `${percentage}%`,
      value: percentage
    });
  }
};

/**
 * Monitora scroll depth
 */
export const trackScrollDepth = () => {
  const scrollThresholds = [25, 50, 75, 100];
  const triggeredThresholds = new Set();

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );

    scrollThresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !triggeredThresholds.has(threshold)) {
        triggeredThresholds.add(threshold);
        events.scrollDepth(threshold);
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => window.removeEventListener('scroll', handleScroll);
};

/**
 * Inicializa todos os trackings
 */
export const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    trackScrollDepth();

    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics initialized for Full Force Academia');
    }
  }
};

export default {
  trackEvent,
  events,
  trackScrollDepth,
  initAnalytics
};
