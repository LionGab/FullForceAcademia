# 🚀 FullForce Site

Site moderno construído com React 19 e Vite 7.

## 🛠️ Stack Tecnológica

- **React 19.1.1** - Biblioteca JavaScript para interfaces
- **Vite 7.1.7** - Build tool ultrarrápida
- **ESLint 9** - Linter para qualidade de código
- **Netlify** - Deploy e hospedagem

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint do código
npm run lint

# Fix automático de lint
npm run lint:fix
```

## 🌐 Deploy

Este projeto está configurado para deploy automático no Netlify. O arquivo `netlify.toml` já está configurado com:

- Build command: `npm run build`
- Publish directory: `dist`
- Redirects para SPA
- Headers otimizados para cache

## 📁 Estrutura de Pastas

```
fullforce-site/
├── public/          # Arquivos estáticos
├── src/
│   ├── assets/      # Imagens, ícones, etc
│   ├── App.jsx      # Componente principal
│   ├── App.css      # Estilos do App
│   ├── index.css    # Estilos globais
│   └── main.jsx     # Entry point
├── index.html       # HTML principal
├── vite.config.js   # Configuração do Vite
├── eslint.config.js # Configuração do ESLint
└── package.json     # Dependências
```

## 🎨 Próximos Passos

- [ ] Adicionar roteamento (React Router)
- [ ] Configurar Tailwind CSS
- [ ] Criar estrutura de componentes
- [ ] Adicionar testes (Vitest)
- [ ] Implementar SEO

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento na porta 3000 |
| `npm run build` | Cria build otimizado para produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Verifica erros de lint |
| `npm run lint:fix` | Corrige erros de lint automaticamente |

## 📄 Licença

Este projeto é privado.

---

Desenvolvido com ❤️ usando React e Vite
