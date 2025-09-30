#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==== Configurando Deploy Automático para GitHub Pages ====${NC}"

# Criar diretório de workflows
echo -e "${YELLOW}Criando estrutura de diretórios...${NC}"
mkdir -p .github/workflows

# Criar arquivo de workflow
echo -e "${YELLOW}Criando arquivo de workflow...${NC}"
cat > .github/workflows/deploy.yml << 'EOL'
# Workflow para fazer deploy automático no GitHub Pages
name: Deploy to GitHub Pages

on:
  # Executa em pushes para a branch main
  push:
    branches: [ "main" ]
  
  # Permite executar manualmente a partir da aba Actions
  workflow_dispatch:

# Define permissões necessárias para o deploy
permissions:
  contents: read
  pages: write
  id-token: write

# Permite apenas um deploy simultâneo
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  # Job de build
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: './fullforce-site/package-lock.json'
      
      - name: Install dependencies
        run: cd fullforce-site && npm ci
      
      - name: Lint
        run: cd fullforce-site && npm run lint
      
      - name: Build
        run: cd fullforce-site && npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './fullforce-site/dist'
  
  # Job de deploy
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
EOL

# Atualizar ou criar vite.config.js
echo -e "${YELLOW}Configurando vite.config.js...${NC}"
cd fullforce-site
if [ -f vite.config.js ]; then
  # Verificar se já tem configuração de base
  if grep -q "base:" vite.config.js; then
    sed -i 's|base:.*|base: "/FullForceAcademia/",|g' vite.config.js
  else
    # Adicionar configuração de base
    sed -i '/plugins: \[react()\],/a \ \ base: "/FullForceAcademia/",  // Nome do repositório' vite.config.js
  fi
else
  echo "Arquivo vite.config.js não encontrado. Verifique se está no diretório correto."
  exit 1
fi
cd ..

echo -e "${GREEN}Configuração finalizada! Agora execute:${NC}"
echo -e "${YELLOW}git add .github/workflows/deploy.yml fullforce-site/vite.config.js${NC}"
echo -e "${YELLOW}git commit -m \"feat: adicionar deploy automático\"${NC}"
echo -e "${YELLOW}git push origin main${NC}"

echo -e "${BLUE}==== IMPORTANTE =====${NC}"
echo -e "1. Vá até as configurações do repositório no GitHub"
echo -e "2. Navegue até Settings -> Pages"
echo -e "3. Em Source, selecione \"GitHub Actions\""
echo -e "4. Certifique-se que as permissões estejam corretas em Settings -> Actions -> General"
echo -e "   Em \"Workflow permissions\", selecione \"Read and write permissions\""
echo -e "${GREEN}Pronto! Após o próximo push, seu site será deployado automaticamente.${NC}"
