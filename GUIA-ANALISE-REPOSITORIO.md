# 🔍 Guia Completo de Análise Criteriosa de Repositório GitHub

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Autor:** FullForce Academy Development Team

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Ferramentas Essenciais](#ferramentas-essenciais)
3. [Análise de Commits e Contribuições](#análise-de-commits-e-contribuições)
4. [Qualidade de Código](#qualidade-de-código)
5. [Segurança e Vulnerabilidades](#segurança-e-vulnerabilidades)
6. [Análise de Dependências](#análise-de-dependências)
7. [Performance e Otimização](#performance-e-otimização)
8. [Documentação e Estrutura](#documentação-e-estrutura)
9. [Script Automatizado](#script-automatizado)
10. [Métricas-Chave](#métricas-chave)
11. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Uma análise criteriosa de repositório GitHub deve contemplar **sete pilares fundamentais**:

1. **Estatísticas de commits** - Frequência, distribuição e padrões
2. **Qualidade de código** - Complexidade, manutenibilidade e padrões
3. **Segurança** - Vulnerabilidades, exposições e conformidade
4. **Dependências** - Atualização, vulnerabilidades e compatibilidade
5. **Performance** - Tamanho, velocidade e otimizações
6. **Documentação** - Completude, clareza e manutenção
7. **Colaboração** - Contribuidores, issues, PRs e processos

Este guia fornece um sistema completo que abrange cada dimensão com comandos específicos e ferramentas especializadas.

---

## 🛠️ Ferramentas Essenciais

### GitHub CLI (gh)

A ferramenta oficial do GitHub oferece acesso direto às funcionalidades da plataforma via linha de comando.

#### Instalação

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Windows (via winget)
winget install --id GitHub.cli
```

#### Comandos Principais

```bash
# Visualizar informações do repositório
gh repo view [owner/repo] --json description,stargazerCount,forkCount

# Listar issues
gh issue list --limit 100 --json number,title,state
gh issue list --state open --label bug

# Listar pull requests
gh pr list --state all --limit 100
gh pr list --state open --label enhancement

# Monitorar workflows
gh workflow list
gh run list --limit 50
gh run view [run-id]

# Visualizar informações de release
gh release list
gh release view [tag]

# Ver detalhes do repositório
gh repo view --json name,description,createdAt,pushedAt,stargazerCount,forkCount
```

### git-quick-stats

Ferramenta especializada que fornece estatísticas abrangentes de forma eficiente.

#### Instalação

```bash
# Via npm
npm install -g git-quick-stats

# Via curl (Linux/macOS)
curl -Ls https://git.io/git-quick-stats | sudo sh

# Clone manual
git clone https://github.com/arzzen/git-quick-stats.git
cd git-quick-stats
sudo make install
```

#### Comandos Principais

```bash
# Estatísticas detalhadas interativas
git-quick-stats

# Análise completa com saída
git-quick-stats -T

# Análise de contribuidores
git-quick-stats -C          # Lista contribuidores
git-quick-stats -a          # Commits por autor
git-quick-stats -A          # Commits por autor com detalhes

# Análise temporal
git-quick-stats -d          # Commits por dia
git-quick-stats -m          # Commits por mês
git-quick-stats -w          # Commits por dia da semana
git-quick-stats -y          # Commits por ano

# Exportação de dados
git-quick-stats -j saida.json    # Exportar para JSON
git-quick-stats -V                # CSV por branch

# Análise de arquivos
git-quick-stats -c          # Lista de changelogs
git-quick-stats -L          # Arquivos mais modificados
```

#### Variáveis de Ambiente

```bash
# Personalizar período de análise
export _GIT_SINCE='2024-01-01'
export _GIT_UNTIL='2024-12-31'

# Excluir caminhos específicos
export _GIT_PATHSPEC=':!node_modules :!dist :!build'

# Ordenação
export _GIT_SORT_BY='commits-desc'  # ou 'name-asc', 'commits-asc'

# Limite de resultados
export _GIT_LIMIT='100'

# Executar com variáveis
_GIT_SINCE='2024-01-01' _GIT_UNTIL='2024-12-31' git-quick-stats -T
```

---

## 📊 Análise de Commits e Contribuições

### Estatísticas Básicas de Commits

```bash
# Total de commits no repositório
git rev-list --all --count

# Total de commits na branch atual
git rev-list --count HEAD

# Commits por período
git log --since='1 year ago' --oneline | wc -l
git log --since='6 months ago' --oneline | wc -l
git log --since='30 days ago' --oneline | wc -l
git log --since='1 week ago' --oneline | wc -l

# Commits entre datas específicas
git log --since='2024-01-01' --until='2024-12-31' --oneline | wc -l

# Commits em uma branch específica
git log --oneline origin/main | wc -l
```

### Distribuição Temporal

```bash
# Distribuição por mês
git log --date=format:'%Y-%m' --pretty=format:'%ad' | sort | uniq -c

# Distribuição por dia da semana
git log --date=format:'%A' --pretty=format:'%ad' | sort | uniq -c | sort -rn

# Distribuição por hora do dia
git log --date=format:'%H' --pretty=format:'%ad' | sort | uniq -c

# Commits por ano
git log --date=format:'%Y' --pretty=format:'%ad' | sort | uniq -c

# Atividade nos últimos N dias (formato visual)
git log --since='30 days ago' --date=short --pretty=format:'%ad' | \
    sort | uniq -c | \
    awk '{print $2 " | " $1 " commits"}'
```

### Análise de Contribuidores

```bash
# Total de contribuidores únicos
git log --format='%aN' | sort -u | wc -l

# Lista de contribuidores únicos
git log --format='%aN' | sort -u

# Top contribuidores por número de commits
git shortlog -sn --all --no-merges | head -20

# Contribuidores com emails
git shortlog -sen --all --no-merges

# Primeiro e último commit de cada autor
git log --format='%aN' | sort -u | while read author; do
    echo "=== $author ==="
    echo "Primeiro commit:"
    git log --author="$author" --reverse --format='%h %ad %s' --date=short | head -1
    echo "Último commit:"
    git log --author="$author" --format='%h %ad %s' --date=short | head -1
    echo ""
done
```

### Análise de Linhas Modificadas

```bash
# Linhas adicionadas/removidas por autor
git log --all --numstat --format="%aN" | awk '
    /^$/ { author = "" }
    /^[0-9]/ { 
        if (author != "") {
            added[author] += $1
            removed[author] += $2
        }
    }
    /^[^0-9]/ { author = $0 }
    END {
        for (a in added) {
            printf "%s: +%d -%d (net: %+d)\n", a, added[a], removed[a], added[a]-removed[a]
        }
    }
' | sort -t':' -k2 -rn

# Linhas por autor em um período específico
git log --since='1 year ago' --numstat --format="%aN" | awk '
    /^$/ { author = "" }
    /^[0-9]/ { 
        if (author != "") {
            added[author] += $1
            removed[author] += $2
        }
    }
    /^[^0-9]/ { author = $0 }
    END {
        for (a in added) {
            printf "%s: +%d -%d\n", a, added[a], removed[a]
        }
    }
' | sort -t':' -k2 -rn
```

### Análise de Commits por Tipo

```bash
# Commits com mensagens contendo palavras-chave
git log --oneline --grep="feat" | wc -l    # Features
git log --oneline --grep="fix" | wc -l     # Bugfixes
git log --oneline --grep="docs" | wc -l    # Documentação
git log --oneline --grep="refactor" | wc -l # Refatorações

# Distribuição de tipos de commit (Conventional Commits)
git log --pretty=format:'%s' | \
    sed -n 's/^\([a-z]*\)(.*/\1/p' | \
    sort | uniq -c | sort -rn
```

---

## 🎨 Qualidade de Código

### Métricas de Complexidade

#### cloc - Contador de Linhas de Código

```bash
# Instalação
# macOS: brew install cloc
# Linux: sudo apt install cloc
# Windows: choco install cloc

# Análise básica
cloc .

# Excluir diretórios específicos
cloc . --exclude-dir=node_modules,.git,vendor,venv,dist,build

# Análise com detalhes por arquivo
cloc . --by-file --exclude-dir=node_modules,.git

# Comparar duas versões
cloc --diff old-version/ new-version/

# Saída em formato específico
cloc . --json > code-stats.json
cloc . --csv > code-stats.csv
cloc . --xml > code-stats.xml
```

#### radon - Complexidade para Python

```bash
# Instalação
pip install radon

# Complexidade ciclomática
radon cc . -a                    # Média
radon cc . -s                    # Ordenado
radon cc . --total-average       # Total e média
radon cc . -nc                   # Sem cores
radon cc . -j > complexity.json  # JSON

# Índice de manutenibilidade
radon mi . -s                    # Ordenado
radon mi . -n B                  # Apenas < B
radon mi . -j > maintainability.json

# Análise de métricas raw
radon raw . -s                   # Ordenado
radon raw . -j > raw-metrics.json

# Análise de halstead
radon hal . -f                   # Funções
```

#### lizard - Análise Multi-linguagem

```bash
# Instalação
pip install lizard

# Análise básica
lizard .

# Especificar linguagens
lizard . -l python,javascript,java

# Com detalhes
lizard . -v

# Limites de complexidade
lizard . -C 15                   # Complexidade > 15
lizard . -L 1000                 # Linhas > 1000
lizard . -a 5                    # Argumentos > 5

# Saída em formatos específicos
lizard . -o complexity.html
lizard . --csv > complexity.csv
```

### Arquivos Mais Modificados (Churn)

```bash
# Top 20 arquivos mais modificados
git log --all --name-only --format='format:' | \
    grep -v '^$' | sort | uniq -c | sort -rn | head -20

# Arquivos modificados nos últimos 30 dias
git log --since='30 days ago' --name-only --format='format:' | \
    grep -v '^$' | sort | uniq -c | sort -rn | head -20

# Churn por autor
git log --author="Nome do Autor" --name-only --format='format:' | \
    grep -v '^$' | sort | uniq -c | sort -rn

# Arquivos com mais bugs (assumindo padrão "fix:" na mensagem)
git log --all --grep="fix" --name-only --format='format:' | \
    grep -v '^$' | sort | uniq -c | sort -rn | head -20
```

### Análise de Tamanho de Arquivos

```bash
# Arquivos maiores no repositório
git ls-files | xargs -I{} du -h {} 2>/dev/null | sort -rh | head -20

# Tamanho total por tipo de arquivo
git ls-files | grep -E '\.(js|py|java|cpp)$' | \
    xargs du -ch 2>/dev/null | tail -1

# Arquivos maiores no histórico do Git
git rev-list --objects --all | \
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
    sed -n 's/^blob //p' | \
    sort -k2 -rn | head -20
```

### Análise de Duplicação

```bash
# Detecção simples de código duplicado
# Instalação: npm install -g jsinspect (para JavaScript)
jsinspect src/

# Para Python (usando pylint)
pylint --disable=all --enable=duplicate-code .

# Análise manual com grep (linhas idênticas)
find . -name "*.js" -exec cat {} \; | sort | uniq -cd | sort -rn | head -20
```

---

## 🔒 Segurança e Vulnerabilidades

### Detecção de Segredos

#### GitLeaks - Detector de Segredos

```bash
# Instalação
# macOS: brew install gitleaks
# Linux: 
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Análise completa do repositório
gitleaks detect --source . --verbose

# Gerar relatório JSON
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Gerar relatório SARIF (para GitHub)
gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif

# Análise desde commit específico
gitleaks detect --source . --log-opts="--since='30 days ago'"

# Configuração customizada
gitleaks detect --source . --config-path=.gitleaks.toml
```

#### TruffleHog - Busca de Segredos

```bash
# Instalação
# Via pip
pip install truffleHog

# Via Docker
docker pull trufflesecurity/trufflehog:latest

# Análise completa
trufflehog git file://. --json > trufflehog-results.json

# Análise apenas de commits recentes
trufflehog git file://. --since-commit HEAD~100

# Com verificação de entropia
trufflehog git file://. --entropy=True

# Via Docker
docker run -v "$PWD:/repo" trufflesecurity/trufflehog:latest git file:///repo
```

#### Verificação Manual de Padrões

```bash
# Buscar por padrões de API keys
git grep -E "api[_-]?key|apikey" --ignore-case

# Buscar por senhas
git grep -E "password|passwd|pwd" --ignore-case

# Buscar por tokens
git grep -E "token|auth[_-]?token" --ignore-case

# Buscar por credenciais AWS
git grep -E "AKIA[0-9A-Z]{16}"

# Buscar por chaves privadas
git grep -E "BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY"

# Verificar no histórico completo
git log -p | grep -E "(password|secret|key|token)" --ignore-case
```

### Code Scanning

#### GitHub Code Scanning

```bash
# Via GitHub CLI
gh api /repos/{owner}/{repo}/code-scanning/alerts

# Listar alertas com filtros
gh api /repos/{owner}/{repo}/code-scanning/alerts \
    --jq '.[] | {number, rule_id, state, created_at}'

# Detalhes de um alerta específico
gh api /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}
```

#### CodeQL - Análise Profunda

```bash
# Instalação do CodeQL CLI
# Download: https://github.com/github/codeql-cli-binaries/releases

# Criar database para análise
codeql database create ./codedb --language=javascript
codeql database create ./codedb --language=python
codeql database create ./codedb --language=java

# Analisar o database
codeql database analyze ./codedb \
    --format=sarif-latest \
    --output=results.sarif

# Com queries específicas
codeql database analyze ./codedb \
    javascript-security-and-quality \
    --format=sarif-latest \
    --output=results.sarif
```

### Análise de Dependências Vulneráveis

```bash
# GitHub Dependency Scanning
gh api /repos/{owner}/{repo}/dependabot/alerts

# Listar alertas abertos
gh api /repos/{owner}/{repo}/dependabot/alerts \
    --jq '.[] | select(.state=="open") | {package: .security_advisory.package.name, severity: .security_advisory.severity}'

# SBOM (Software Bill of Materials)
gh api /repos/{owner}/{repo}/dependency-graph/sbom
```

---

## 📦 Análise de Dependências

### GitHub Dependency Graph

```bash
# SBOM completo
gh api /repos/{owner}/{repo}/dependency-graph/sbom -H "Accept: application/vnd.github+json"

# Exportar SBOM para arquivo
gh api /repos/{owner}/{repo}/dependency-graph/sbom > sbom.json

# Análise de dependências vulneráveis
gh api /repos/{owner}/{repo}/dependabot/alerts \
    --jq '.[] | {package, severity, state}'
```

### Ferramentas Específicas por Linguagem

#### Python

```bash
# pip-audit - Auditoria de dependências
pip install pip-audit
pip-audit
pip-audit --format json > audit-report.json

# safety - Verificação de vulnerabilidades
pip install safety
safety check
safety check --json > safety-report.json
safety check --full-report

# pipdeptree - Árvore de dependências
pip install pipdeptree
pipdeptree
pipdeptree --json-tree > dependencies.json
pipdeptree --graph-output png > dependencies.png

# Verificar pacotes desatualizados
pip list --outdated
pip list --outdated --format=json
```

#### JavaScript/Node.js

```bash
# npm audit
npm audit
npm audit --json > npm-audit.json
npm audit fix                    # Corrigir automaticamente
npm audit fix --force            # Corrigir forçando atualizações

# yarn audit
yarn audit
yarn audit --json > yarn-audit.json

# Verificar pacotes desatualizados
npm outdated
npm outdated --json
yarn outdated

# depcheck - Dependências não utilizadas
npm install -g depcheck
depcheck
depcheck --json > depcheck-report.json
```

#### Java (Maven)

```bash
# Verificar vulnerabilidades
mvn dependency-check:check

# Analisar dependências
mvn dependency:tree
mvn dependency:analyze

# OWASP Dependency Check
mvn org.owasp:dependency-check-maven:check
```

### Ferramentas Universais

#### Syft - SBOM Generator

```bash
# Instalação
# macOS: brew install syft
# Linux:
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Gerar SBOM
syft . -o json > sbom.json
syft . -o spdx > sbom.spdx
syft . -o cyclonedx > sbom.cdx

# Analisar imagem Docker
syft docker:image-name -o json
```

#### Grype - Vulnerability Scanner

```bash
# Instalação
# macOS: brew install grype
# Linux:
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

# Escanear vulnerabilidades
grype .
grype . -o json > vulnerabilities.json
grype . -o table

# Escanear com severidade mínima
grype . --fail-on high
grype . --only-fixed

# Escanear SBOM
syft . -o json | grype
```

---

## ⚡ Performance e Otimização

### Análise de Tamanho do Repositório

```bash
# Informações detalhadas
git count-objects -vH

# Tamanho do diretório .git
du -sh .git

# Tamanho total do repositório
du -sh .

# Objetos maiores no pack
git verify-pack -v .git/objects/pack/*.idx | \
    sort -k 3 -n | \
    tail -20

# Identificar arquivos grandes no histórico
git rev-list --objects --all | \
    git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
    sed -n 's/^blob //p' | \
    sort -k2 -rn | \
    head -20 | \
    while read hash size path; do
        echo "$(numfmt --to=iec-i --suffix=B $size) - $path"
    done
```

### Otimização do Repositório

```bash
# Garbage collection normal
git gc

# Garbage collection agressivo
git gc --aggressive --prune=now

# Repack otimizado
git repack -a -d --depth=250 --window=250

# Limpeza de objetos soltos
git prune

# Limpeza de reflog
git reflog expire --expire=now --all
git gc --prune=now

# Verificar integridade
git fsck --full
```

### Benchmarking de Performance

#### hyperfine - Benchmarking

```bash
# Instalação
# macOS: brew install hyperfine
# Linux:
wget https://github.com/sharkdp/hyperfine/releases/download/v1.18.0/hyperfine_1.18.0_amd64.deb
sudo dpkg -i hyperfine_1.18.0_amd64.deb

# Benchmark de comandos Git
hyperfine 'git status' 'git log --oneline' 'git diff'

# Com warmup
hyperfine --warmup 3 'git log --all'

# Comparar performance
hyperfine 'git log --all' 'git log --all --no-decorate'

# Exportar resultados
hyperfine 'git status' --export-json benchmark.json
hyperfine 'git log' --export-markdown benchmark.md
```

#### Medição Manual

```bash
# Tempo de operações comuns
time git log --all
time git diff HEAD~10
time git status
time git branch -a

# Teste de clone
time git clone --depth 1 URL

# Teste de fetch
time git fetch --all
```

---

## 📚 Documentação e Estrutura

### Verificação de Arquivos Essenciais

```bash
# Script de verificação
essential_files=(
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "CODE_OF_CONDUCT.md"
    "CHANGELOG.md"
    ".gitignore"
    "SECURITY.md"
    ".github/ISSUE_TEMPLATE/"
    ".github/PULL_REQUEST_TEMPLATE.md"
)

echo "=== Verificação de Arquivos Essenciais ==="
for file in "${essential_files[@]}"; do
    if [ -e "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (ausente)"
    fi
done
```

### Análise de Documentação

```bash
# Contar arquivos Markdown
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l

# Listar todos os arquivos de documentação
find . -name "*.md" -not -path "*/node_modules/*" | sort

# Tamanho total da documentação
find . -name "*.md" -not -path "*/node_modules/*" -exec du -ch {} + | tail -1

# Arquivos Markdown modificados recentemente
find . -name "*.md" -mtime -30 -not -path "*/node_modules/*"

# Links quebrados em Markdown (requer markdown-link-check)
npm install -g markdown-link-check
find . -name "*.md" | xargs -I {} markdown-link-check {}
```

### Estrutura do Projeto

```bash
# Instalar tree
# macOS: brew install tree
# Linux: sudo apt install tree

# Estrutura básica (3 níveis)
tree -L 3 -I 'node_modules|__pycache__|.git|dist|build'

# Com tamanhos
tree -h -L 2 -I 'node_modules|.git'

# Apenas diretórios
tree -d -L 3 -I 'node_modules|.git'

# Salvar em arquivo
tree -L 3 -I 'node_modules|.git' > estrutura.txt

# Com cores e informações detalhadas
tree -C -h -D -L 2 -I 'node_modules|.git'
```

### Análise de README

```bash
# Tamanho do README
wc -l README.md
wc -w README.md

# Seções no README (headers)
grep -E '^#+ ' README.md

# Links no README
grep -oE 'https?://[^[:space:]]+' README.md

# Imagens no README
grep -oE '!\[.*\]\(.*\)' README.md

# Badges no README
grep -oE '\[!\[.*\]\(.*\)\]\(.*\)' README.md
```

---

## 🤖 Script Automatizado Completo

### Uso do Script analise-repositorio.sh

O script `analise-repositorio.sh` fornece uma análise completa automatizada.

#### Execução

```bash
# Tornar executável (primeira vez)
chmod +x analise-repositorio.sh

# Executar análise completa
./analise-repositorio.sh

# Ou via bash
bash analise-repositorio.sh
```

#### Saída

O script gera dois arquivos:

1. **Relatório Markdown**: `reports/analise-repositorio/analise_completa_TIMESTAMP.md`
2. **Dados JSON**: `reports/analise-repositorio/analise_dados_TIMESTAMP.json`

#### Seções do Relatório

1. Informações básicas do repositório
2. Estatísticas de commits (total, distribuição temporal)
3. Análise de contribuidores
4. Análise de arquivos mais modificados
5. Estatísticas de código por linguagem
6. Análise de branches
7. Verificação de segurança básica
8. Verificação de documentação
9. Atividade recente (últimos 30 dias)
10. Tamanho e performance
11. Issues e PRs (via GitHub CLI)
12. Resumo executivo

### Automação via Cron

```bash
# Editar crontab
crontab -e

# Análise diária às 2h da manhã
0 2 * * * cd /caminho/do/repositorio && ./analise-repositorio.sh >> /var/log/repo-analysis.log 2>&1

# Análise semanal toda segunda às 3h
0 3 * * 1 cd /caminho/do/repositorio && ./analise-repositorio.sh

# Análise mensal no primeiro dia do mês
0 4 1 * * cd /caminho/do/repositorio && ./analise-repositorio.sh
```

### Integração com CI/CD

#### GitHub Actions

```yaml
name: Repository Analysis

on:
  schedule:
    - cron: '0 2 * * 1'  # Toda segunda às 2h
  workflow_dispatch:      # Execução manual

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Histórico completo
      
      - name: Run Repository Analysis
        run: |
          chmod +x analise-repositorio.sh
          ./analise-repositorio.sh
      
      - name: Upload Analysis Report
        uses: actions/upload-artifact@v3
        with:
          name: analysis-report
          path: reports/analise-repositorio/
```

---

## 📊 Métricas-Chave para Monitoramento

### Métricas de Desenvolvimento

#### Velocidade

```bash
# Commits por semana (últimas 12 semanas)
for i in {0..11}; do
    start_date=$(date -d "-$((i+1)) weeks" +%Y-%m-%d)
    end_date=$(date -d "-$i weeks" +%Y-%m-%d)
    count=$(git log --since="$start_date" --until="$end_date" --oneline | wc -l)
    echo "Semana $((12-i)): $count commits ($start_date a $end_date)"
done

# Tempo médio de ciclo de PR
gh pr list --state closed --limit 100 --json number,createdAt,closedAt \
    --jq '.[] | (.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)'

# Frequência de commits por dia
git log --since='90 days ago' --date=short --pretty=format:'%ad' | \
    sort | uniq -c | awk '{print $2 ": " $1}'
```

#### Qualidade

```bash
# Complexidade ciclomática média (Python)
radon cc . -a --total-average

# Taxa de cobertura de testes (exemplo com coverage.py)
coverage run -m pytest
coverage report

# Detecção de código duplicado
jsinspect src/  # JavaScript
pylint --disable=all --enable=duplicate-code .  # Python
```

#### Colaboração

```bash
# Taxa de contribuição (commits por autor nos últimos 30 dias)
git shortlog -sn --since='30 days ago' --no-merges

# Tempo médio de review de PR
gh pr list --state closed --limit 50 --json number,createdAt,mergedAt \
    --jq '.[] | select(.mergedAt != null)'

# Merge rate (PRs merged vs criados)
CREATED=$(gh pr list --state all --limit 100 | wc -l)
MERGED=$(gh pr list --state merged --limit 100 | wc -l)
echo "Merge Rate: $(echo "scale=2; $MERGED / $CREATED * 100" | bc)%"
```

### Métricas de Segurança

```bash
# Vulnerabilidades ativas
gh api /repos/{owner}/{repo}/dependabot/alerts \
    --jq '.[] | select(.state=="open") | .security_advisory.severity' | \
    sort | uniq -c

# Tempo médio de resolução de vulnerabilidades
gh api /repos/{owner}/{repo}/dependabot/alerts \
    --jq '.[] | select(.state=="fixed")'

# Segredos expostos
gitleaks detect --source . --report-format json | \
    jq '.[] | length'

# Pacotes desatualizados
npm outdated --json | jq 'length'
```

### Métricas DORA

As métricas DORA (DevOps Research and Assessment) são indicadores-chave de performance.

#### Deploy Frequency

```bash
# Frequência de deploys (via tags de release)
TOTAL_RELEASES=$(gh release list --limit 100 | wc -l)
DAYS=$(( ($(date +%s) - $(git log --reverse --format=%ct | head -1)) / 86400 ))
echo "Deploy Frequency: $(echo "scale=2; $TOTAL_RELEASES / $DAYS * 7" | bc) por semana"
```

#### Lead Time for Changes

```bash
# Tempo médio entre commit e deploy
gh api /repos/{owner}/{repo}/deployments --jq '.[] | .created_at'
```

#### Time to Restore

```bash
# Tempo entre detecção e correção de incidents
gh issue list --label incident --state closed --json number,createdAt,closedAt
```

#### Change Failure Rate

```bash
# Taxa de deploys que causaram rollback/hotfix
TOTAL_DEPLOYS=$(gh release list | wc -l)
ROLLBACKS=$(gh release list | grep -i rollback | wc -l)
echo "Change Failure Rate: $(echo "scale=2; $ROLLBACKS / $TOTAL_DEPLOYS * 100" | bc)%"
```

---

## 💡 Boas Práticas

### Frequência de Análise Recomendada

| Tipo de Análise | Frequência | Razão |
|-----------------|------------|-------|
| Commits, PRs, Issues | Diária | Acompanhamento da atividade do time |
| Qualidade de código | Semanal | Detectar degradação cedo |
| Testes e linting | A cada commit | CI/CD automatizado |
| Segurança completa | Mensal | Varredura profunda de vulnerabilidades |
| Dependências | Semanal | Manter atualizado |
| Performance | Mensal | Otimizações planejadas |
| Análise completa | Trimestral | Relatório executivo |

### Checklist de Análise Completa

```markdown
- [ ] Estatísticas de commits e contribuidores
- [ ] Verificação de qualidade de código
- [ ] Scan de segurança (GitLeaks, TruffleHog)
- [ ] Auditoria de dependências
- [ ] Análise de performance do repositório
- [ ] Verificação de documentação
- [ ] Issues e PRs abertos
- [ ] Métricas DORA
- [ ] Análise de branches antigas
- [ ] Otimização de tamanho
```

### Automação Recomendada

#### GitHub Actions (Daily)

```yaml
# .github/workflows/daily-analysis.yml
name: Daily Repository Analysis

on:
  schedule:
    - cron: '0 6 * * *'  # Todo dia às 6h UTC
  workflow_dispatch:

jobs:
  quick-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Basic Analysis
        run: |
          echo "## Daily Analysis - $(date)" >> $GITHUB_STEP_SUMMARY
          echo "### Commits Today" >> $GITHUB_STEP_SUMMARY
          git log --since='1 day ago' --oneline | wc -l >> $GITHUB_STEP_SUMMARY
          echo "### Active Contributors" >> $GITHUB_STEP_SUMMARY
          git shortlog -sn --since='7 days ago' >> $GITHUB_STEP_SUMMARY
```

#### GitHub Actions (Weekly - Security)

```yaml
# .github/workflows/weekly-security.yml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Segunda às 2h UTC
  workflow_dispatch:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Run GitLeaks
        uses: gitleaks/gitleaks-action@v2
      
      - name: Dependency Check
        run: |
          npm audit --json > npm-audit.json || true
          pip-audit -f json -o pip-audit.json || true
      
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: '*-audit.json'
```

### Integração com Notificações

```bash
# Script com notificação via Slack
#!/bin/bash

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

./analise-repositorio.sh

MESSAGE="Análise de repositório concluída: $(date)"
curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$MESSAGE\"}" \
    $WEBHOOK_URL
```

---

## 🔧 Personalização e Extensão

### Variáveis de Ambiente

```bash
# Configurar no seu .bashrc ou .zshrc
export REPO_ANALYSIS_DIR="$HOME/repo-reports"
export REPO_ANALYSIS_RETENTION_DAYS=30
export REPO_ANALYSIS_NOTIFY_SLACK=true
export REPO_ANALYSIS_SLACK_WEBHOOK="https://hooks.slack.com/..."
```

### Criar Análises Customizadas

```bash
# Exemplo: Análise específica de frontend
analyze_frontend() {
    echo "=== Frontend Analysis ==="
    
    # Arquivos JavaScript/TypeScript
    find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | wc -l
    
    # Componentes React
    grep -r "export.*function\|export.*const.*=.*(" src/ | wc -l
    
    # Imports mais usados
    grep -rh "^import" src/ | sort | uniq -c | sort -rn | head -10
}
```

---

## 📖 Recursos Adicionais

### Links Úteis

- [Git Documentation](https://git-scm.com/doc)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitLeaks](https://github.com/gitleaks/gitleaks)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [git-quick-stats](https://github.com/arzzen/git-quick-stats)
- [CodeQL](https://codeql.github.com/)
- [Syft](https://github.com/anchore/syft)
- [Grype](https://github.com/anchore/grype)

### Comunidade

- [GitHub Community](https://github.community/)
- [Stack Overflow - Git](https://stackoverflow.com/questions/tagged/git)
- [DevOps Stack Exchange](https://devops.stackexchange.com/)

---

## 📝 Notas Finais

Este guia representa um sistema completo e criterioso de análise de repositórios GitHub. A abordagem é modular, permitindo executar análises específicas ou completas conforme necessário.

**Principais Benefícios:**

- ✅ Automação completa de análises
- ✅ Visão 360° do repositório
- ✅ Detecção proativa de problemas
- ✅ Métricas acionáveis
- ✅ Conformidade com boas práticas

**Próximos Passos:**

1. Execute o script `analise-repositorio.sh` no seu repositório
2. Revise o relatório gerado
3. Configure análises automáticas via cron ou CI/CD
4. Customize conforme necessidades específicas
5. Monitore métricas continuamente

---

**Versão:** 1.0.0  
**Última Atualização:** Outubro 2025  
**Licença:** MIT  
**Desenvolvido por:** FullForce Academy Development Team

*Análise criteriosa para repositórios de excelência! 🚀*
