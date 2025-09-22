// vite.config.js - Configuração otimizada
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    react(),
    
    // Compressão Gzip/Brotli
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    
    // Otimização de imagens
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      webp: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      }
    }),
    
    // Visualizador de bundle
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  build: {
    // Code splitting otimizado
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', '@radix-ui/react-dialog'],
        }
      }
    },
    
    // Minificação agressiva
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    },
    
    // Target moderno
    target: 'es2020',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  
  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  }
});

// utils/imageOptimizer.js - Componente de imagem otimizada
import { useState, useEffect } from 'react';

export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy',
  sizes = '100vw',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isInView, setIsInView] = useState(false);
  
  // Gerar srcset para diferentes resoluções
  const generateSrcSet = (baseUrl) => {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    return widths
      .map(w => `${baseUrl}?w=${w} ${w}w`)
      .join(', ');
  };
  
  useEffect(() => {
    // Intersection Observer para lazy loading real
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    const img = document.getElementById(`img-${src}`);
    if (img) observer.observe(img);
    
    return () => observer.disconnect();
  }, [src]);
  
  useEffect(() => {
    if (isInView && !imageSrc) {
      // Converter para WebP se suportado
      const webpSupport = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;
      
      const ext = webpSupport ? '.webp' : '.jpg';
      const optimizedSrc = src.replace(/\.(png|jpg|jpeg)$/i, ext);
      
      setImageSrc(optimizedSrc);
    }
  }, [isInView, src, imageSrc]);
  
  return (
    <picture>
      {imageSrc && (
        <>
          <source 
            type="image/webp" 
            srcSet={generateSrcSet(imageSrc.replace(/\.[^.]+$/, '.webp'))}
            sizes={sizes}
          />
          <source 
            type="image/jpeg" 
            srcSet={generateSrcSet(imageSrc)}
            sizes={sizes}
          />
        </>
      )}
      <img
        id={`img-${src}`}
        src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="100%25" height="100%25" fill="%23ddd"/%3E%3C/svg%3E'}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        {...props}
      />
    </picture>
  );
};

// hooks/usePerformanceMonitor.js - Monitor de performance
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Core Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);  // Cumulative Layout Shift
        getFID(console.log);  // First Input Delay
        getFCP(console.log);  // First Contentful Paint
        getLCP(console.log);  // Largest Contentful Paint
        getTTFB(console.log); // Time to First Byte
      });
    }
    
    // Performance Observer
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((entries) => {
        entries.getEntries().forEach((entry) => {
          // Log para análise
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });
      
      perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      return () => perfObserver.disconnect();
    }
  }, []);
};

// Implementação de lazy loading para seções
import { lazy, Suspense } from 'react';

// Lazy load de componentes pesados
const HeroSection = lazy(() => import('./sections/HeroSection'));
const ServicesSection = lazy(() => import('./sections/ServicesSection'));
const PlansSection = lazy(() => import('./sections/PlansSection'));
const TestimonialsSection = lazy(() => import('./sections/TestimonialsSection'));

// Loading skeleton
const SectionLoader = () => (
  <div className="min-h-[400px] bg-gray-900 animate-pulse">
    <div className="container mx-auto px-4 py-20">
      <div className="h-8 bg-gray-800 rounded w-1/3 mx-auto mb-4"></div>
      <div className="h-4 bg-gray-800 rounded w-2/3 mx-auto"></div>
    </div>
  </div>
);

// App otimizado
export const App = () => {
  usePerformanceMonitor();
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Suspense fallback={<SectionLoader />}>
        <HeroSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <ServicesSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <PlansSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>
    </div>
  );
};