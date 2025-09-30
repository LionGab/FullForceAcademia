#!/bin/bash

# Script de setup automático para GitHub Pages + Actions
# Uso: bash setup-github-deploy.sh

set -e

echo "🚀 Configurando Deploy Automático no GitHub..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p .github/workflows
echo -e "${GREEN}✓${NC} Estrutura criada"
echo ""

# 2. Criar workflow do GitHub Actions
echo "⚙️  Criando workflow do GitHub Actions..."
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy Automático

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    name: 🏗️ Build
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.19.0'
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Lint
        run: npm run lint
        continue-on-error: true

      - name: 🏗️ Build
        run: npm run build

      - name: 📤 Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    name: 🚀 Deploy
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: 🌐 Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF

echo -e "${GREEN}✓${NC} Workflow criado: .github/workflows/deploy.yml"
echo ""

# 3. Verificar vite.config.js
echo "🔧 Verificando vite.config.js..."
if [ -f "vite.config.js" ]; then
    if ! grep -q "GITHUB_ACTIONS" vite.config.js; then
        echo -e "${YELLOW}⚠️${NC}  vite.config.js precisa ser atualizado"
        echo "   Adicione manualmente:"
        echo "   base: process.env.GITHUB_ACTIONS ? '/nome-do-repo/' : '/'"
    else
        echo -e "${GREEN}✓${NC} vite.config.js já está configurado"
    fi
else
    echo -e "${RED}❌${NC} vite.config.js não encontrado!"
fi
echo ""

# 4. Verificar package.json
echo "📦 Verificando package.json..."
if [ -f "package.json" ]; then
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✓${NC} Script de build encontrado"
    else
        echo -e "${RED}❌${NC} Script de build não encontrado no package.json!"
    fi
else
    echo -e "${RED}❌${NC} package.json não encontrado!"
fi
echo ""

# 5. Testar build local
echo "🏗️  Testando build local..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build local bem sucedido!"
else
    echo -e "${RED}❌${NC} Build local falhou!"
    echo "   Rode: npm run build (para ver erros)"
fi
echo ""

# 6. Verificar Git
echo "🔍 Verificando Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Repositório Git encontrado"
    
    # Pegar nome do repositório
    REPO_URL=$(git config --get remote.origin.url 2>/dev/null || echo "")
    if [ -n "$REPO_URL" ]; then
        REPO_NAME=$(basename -s .git "$REPO_URL")
        echo -e "   📦 Repositório: ${BLUE}$REPO_NAME${NC}"
    fi
    
    # Verificar branch
    BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    echo -e "   🌿 Branch atual: ${BLUE}$BRANCH${NC}"
else
    echo -e "${RED}❌${NC} Não é um repositório Git!"
    echo "   Rode: git init"
    exit 1
fi
echo ""

# 7. Status dos arquivos
echo "📋 Status dos arquivos criados:"
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✓${NC} .github/workflows/deploy.yml"
fi
if [ -f "vite.config.js" ]; then
    echo -e "${GREEN}✓${NC} vite.config.js"
fi
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json"
fi
echo ""

# 8. Instruções finais
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}✅ CONFIGURAÇÃO COMPLETA!${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1️⃣  Habilitar GitHub Pages:"
echo "   • Vá em: Settings → Pages"
echo "   • Source: GitHub Actions"
echo "   • Save"
echo ""
echo "2️⃣  Fazer commit e push:"
echo "   ${BLUE}git add .${NC}"
echo "   ${BLUE}git commit -m \"feat: adicionar deploy automático\"${NC}"
echo "   ${BLUE}git push origin $BRANCH${NC}"
echo ""
echo "3️⃣  Monitorar deploy:"
echo "   • Vá em: Actions (no GitHub)"
echo "   • Veja o workflow rodando"
echo ""
echo "4️⃣  Acessar site:"
if [ -n "$REPO_NAME" ]; then
    echo "   ${BLUE}https://[seu-usuario].github.io/$REPO_NAME/${NC}"
else
    echo "   ${BLUE}https://[seu-usuario].github.io/[nome-do-repo]/${NC}"
fi
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎉 Deploy automático configurado!${NC}"
echo "   Agora é só fazer push e o GitHub faz o resto!"
echo ""setup-github-deploy.sh
