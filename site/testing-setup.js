// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
      ],
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// src/test/setup.js
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock do gtag
global.gtag = vi.fn();

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// src/components/__tests__/ServiceCard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCard } from '../common/ServiceCard';

describe('ServiceCard', () => {
  const mockProps = {
    id: 'musculacao',
    icon: <div>Icon</div>,
    title: 'Musculação',
    description: 'Descrição do serviço',
    features: ['Feature 1', 'Feature 2'],
    image: '/test-image.jpg',
    schedules: {
      manha: '06:00 - 11:00',
      tarde: '14:00 - 18:00',
      noite: '18:30 - 22:00'
    }
  };

  it('deve renderizar o componente corretamente', () => {
    render(<ServiceCard {...mockProps} />);
    
    expect(screen.getByText('Musculação')).toBeInTheDocument();
    expect(screen.getByText('Descrição do serviço')).toBeInTheDocument();
  });

  it('deve exibir as features corretamente', () => {
    render(<ServiceCard {...mockProps} />);
    
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });

  it('deve alternar a visibilidade dos horários', () => {
    render(<ServiceCard {...mockProps} />);
    
    const toggleButton = screen.getByText(/Ver horários/);
    
    // Horários inicialmente ocultos
    expect(screen.queryByText('06:00 - 11:00')).not.toBeInTheDocument();
    
    // Clicar para mostrar
    fireEvent.click(toggleButton);
    expect(screen.getByText('06:00 - 11:00')).toBeInTheDocument();
    
    // Clicar para ocultar
    fireEvent.click(toggleButton);
    expect(screen.queryByText('06:00 - 11:00')).not.toBeInTheDocument();
  });

  it('deve rastrear evento ao clicar em reservar', () => {
    const trackEvent = vi.fn();
    vi.mock('@/hooks/useAnalytics', () => ({
      useAnalytics: () => ({ trackEvent })
    }));
    
    render(<ServiceCard {...mockProps} />);
    
    const reserveButton = screen.getByText(/Reservar no WhatsApp/);
    fireEvent.click(reserveButton);
    
    expect(trackEvent).toHaveBeenCalledWith('click_reserve_schedule', {
      category: 'CTA',
      label: 'musculacao'
    });
  });
});

// .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://fullforceacademia.com.br
          budgetPath: ./lighthouse-budget.json
          temporaryPublicStorage: true

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for production
        run: npm run build
        env:
          VITE_GTM_ID: ${{ secrets.GTM_ID }}
          VITE_GA4_ID: ${{ secrets.GA4_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

// lighthouse-budget.json
{
  "performance": 90,
  "accessibility": 100,
  "best-practices": 95,
  "seo": 100,
  "pwa": 90,
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "stylesheet",
          "budget": 50
        },
        {
          "resourceType": "image",
          "budget": 500
        },
        {
          "resourceType": "total",
          "budget": 1000
        }
      ],
      "resourceCounts": [
        {
          "resourceType": "third-party",
          "budget": 10
        }
      ]
    }
  ]
}