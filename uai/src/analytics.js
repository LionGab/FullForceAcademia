/**
 * Utilitários para Google Analytics e tracking
 */

// Configuração do Google Analytics
export const GA_TRACKING_ID = 'GA_MEASUREMENT_ID'; // Substituir pelo ID real
export const GTM_ID = 'GTM_CONTAINER_ID'; // Substituir pelo ID real

/**
 * Inicializa o Google Analytics
 */
export const initGA = () => {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });
  }
};

/**
 * Envia evento personalizado para GA
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
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
      plan_type: planType,
      currency: 'BRL'
    });
  },

  // Navegação
  navigationClick: (section) => {
    trackEvent('navigation_click', {
      category: 'Navigation',
      label: section,
      value: 1
    });
  },

  // Planos
  planView: (planType) => {
    trackEvent('view_plan', {
      category: 'Plans',
      label: planType,
      value: 1
    });
  },

  planSelection: (planType, price) => {
    trackEvent('select_plan', {
      category: 'Plans',
      label: planType,
      value: parseFloat(price.replace('R$ ', '').replace(',', '.')),
      currency: 'BRL',
      plan_type: planType
    });
  },

  // Serviços
  serviceInterest: (serviceName) => {
    trackEvent('service_interest', {
      category: 'Services',
      label: serviceName,
      value: 1
    });
  },

  scheduleView: (serviceName) => {
    trackEvent('view_schedule', {
      category: 'Schedule',
      label: serviceName,
      value: 1
    });
  },

  // Formulário
  formSubmit: (formType) => {
    trackEvent('form_submit', {
      category: 'Lead',
      label: formType,
      value: 1
    });
  },

  // Scroll e engajamento
  scrollDepth: (percentage) => {
    trackEvent('scroll_depth', {
      category: 'Engagement',
      label: `${percentage}%`,
      value: percentage
    });
  },

  timeOnSite: (seconds) => {
    trackEvent('time_on_site', {
      category: 'Engagement',
      label: 'session_duration',
      value: seconds
    });
  },

  // Conversões
  conversion: (type, value = 0) => {
    trackEvent('conversion', {
      category: 'Conversion',
      label: type,
      value: value,
      currency: 'BRL'
    });
  }
};

/**
 * Monitora Core Web Vitals
 */
export const trackWebVitals = () => {
  // Performance Observer para Core Web Vitals
  if ('PerformanceObserver' in window) {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        trackEvent('web_vital_lcp', {
          category: 'Performance',
          label: 'LCP',
          value: Math.round(entry.startTime)
        });
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        trackEvent('web_vital_fid', {
          category: 'Performance',
          label: 'FID',
          value: Math.round(entry.processingStart - entry.startTime)
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Enviar CLS quando a página for fechada
    window.addEventListener('beforeunload', () => {
      trackEvent('web_vital_cls', {
        category: 'Performance',
        label: 'CLS',
        value: Math.round(clsValue * 1000)
      });
    });
  }
};

/**
 * Monitora scroll depth
 */
export const trackScrollDepth = () => {
  const scrollThresholds = [25, 50, 75, 90, 100];
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
 * Monitora tempo na página
 */
export const trackTimeOnSite = () => {
  const startTime = Date.now();
  
  const sendTimeOnSite = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    events.timeOnSite(timeSpent);
  };

  // Enviar quando a página for fechada
  window.addEventListener('beforeunload', sendTimeOnSite);
  
  // Enviar a cada 30 segundos para sessões longas
  const interval = setInterval(() => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    if (timeSpent > 30 && timeSpent % 30 === 0) {
      events.timeOnSite(timeSpent);
    }
  }, 1000);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', sendTimeOnSite);
  };
};

/**
 * Inicializa todos os trackings
 */
export const initAnalytics = () => {
  // Inicializar GA
  initGA();
  
  // Inicializar monitoramentos
  trackWebVitals();
  trackScrollDepth();
  trackTimeOnSite();

  // Log para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics initialized for Full Force Academia');
  }
};

export default {
  initGA,
  trackEvent,
  events,
  trackWebVitals,
  trackScrollDepth,
  trackTimeOnSite,
  initAnalytics
};
