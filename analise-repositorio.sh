#!/bin/bash

###############################################################################
# Script de Análise Criteriosa de Repositório GitHub
# Versão: 1.0.0
# Descrição: Sistema completo para análise profunda de repositórios GitHub
# Autor: FullForce Academy Development Team
# Licença: MIT
###############################################################################

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configurações
REPORTS_DIR="reports/analise-repositorio"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="${REPORTS_DIR}/analise_completa_${TIMESTAMP}.md"
JSON_FILE="${REPORTS_DIR}/analise_dados_${TIMESTAMP}.json"

# Criar diretório de relatórios
mkdir -p "${REPORTS_DIR}"

# Função de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Função para exibir cabeçalho
print_header() {
    echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Função para inicializar relatório
init_report() {
    cat > "${REPORT_FILE}" << EOF
# Análise Criteriosa de Repositório GitHub
**Data da Análise:** $(date +"%d/%m/%Y %H:%M:%S")
**Repositório:** $(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "N/A")
**Branch Atual:** $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")

---

EOF
    
    cat > "${JSON_FILE}" << EOF
{
  "metadata": {
    "timestamp": "$(date -Iseconds)",
    "repositorio": "$(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "N/A")",
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")",
    "versao_script": "1.0.0"
  },
  "dados": {
EOF
}

# Função para adicionar seção ao relatório
add_section() {
    echo -e "\n## $1\n" >> "${REPORT_FILE}"
}

# Função para adicionar conteúdo ao relatório
add_content() {
    echo "$1" >> "${REPORT_FILE}"
}

# Verificar se estamos em um repositório Git
check_git_repo() {
    print_header "Verificando Repositório Git"
    
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        log_error "Este diretório não é um repositório Git válido!"
        exit 1
    fi
    
    log "Repositório Git válido detectado ✓"
}

# 1. Informações Básicas do Repositório
analyze_basic_info() {
    print_header "1. Informações Básicas do Repositório"
    add_section "1. Informações Básicas"
    
    REPO_PATH=$(git rev-parse --show-toplevel)
    REPO_NAME=$(basename "${REPO_PATH}")
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    REMOTE_URL=$(git config --get remote.origin.url || echo "N/A")
    
    log "Nome do Repositório: ${REPO_NAME}"
    log "Caminho: ${REPO_PATH}"
    log "Branch Atual: ${CURRENT_BRANCH}"
    log "URL Remota: ${REMOTE_URL}"
    
    add_content "- **Nome:** ${REPO_NAME}"
    add_content "- **Caminho:** ${REPO_PATH}"
    add_content "- **Branch Atual:** ${CURRENT_BRANCH}"
    add_content "- **URL Remota:** ${REMOTE_URL}"
}

# 2. Estatísticas de Commits
analyze_commits() {
    print_header "2. Estatísticas de Commits"
    add_section "2. Estatísticas de Commits"
    
    # Total de commits
    TOTAL_COMMITS=$(git rev-list --all --count 2>/dev/null || echo "0")
    log "Total de commits: ${TOTAL_COMMITS}"
    add_content "### Total de Commits: ${TOTAL_COMMITS}"
    
    # Commits últimos 30 dias
    COMMITS_30_DAYS=$(git log --since='30 days ago' --oneline 2>/dev/null | wc -l)
    log "Commits últimos 30 dias: ${COMMITS_30_DAYS}"
    add_content "- Últimos 30 dias: ${COMMITS_30_DAYS}"
    
    # Commits último ano
    COMMITS_1_YEAR=$(git log --since='1 year ago' --oneline 2>/dev/null | wc -l)
    log "Commits último ano: ${COMMITS_1_YEAR}"
    add_content "- Último ano: ${COMMITS_1_YEAR}"
    
    # Distribuição por mês (últimos 12 meses)
    add_content "\n### Distribuição Mensal (Últimos 12 meses)\n"
    add_content '```'
    git log --since='1 year ago' --date=format:'%Y-%m' --pretty=format:'%ad' 2>/dev/null | \
        sort | uniq -c | sort -rn | head -12 | \
        awk '{print $2 ": " $1 " commits"}' | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Commits por dia da semana
    add_content "\n### Commits por Dia da Semana\n"
    add_content '```'
    git log --date=format:'%A' --pretty=format:'%ad' 2>/dev/null | \
        sort | uniq -c | sort -rn | \
        awk '{print $2 ": " $1 " commits"}' | tee -a "${REPORT_FILE}"
    add_content '```'
}

# 3. Análise de Contribuidores
analyze_contributors() {
    print_header "3. Análise de Contribuidores"
    add_section "3. Análise de Contribuidores"
    
    # Total de contribuidores únicos
    TOTAL_CONTRIBUTORS=$(git log --format='%aN' 2>/dev/null | sort -u | wc -l)
    log "Total de contribuidores: ${TOTAL_CONTRIBUTORS}"
    add_content "### Total de Contribuidores: ${TOTAL_CONTRIBUTORS}"
    
    # Top 10 contribuidores
    add_content "\n### Top 10 Contribuidores por Commits\n"
    add_content '```'
    git shortlog -sn --all --no-merges 2>/dev/null | head -10 | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Contribuidores ativos últimos 30 dias
    add_content "\n### Contribuidores Ativos (Últimos 30 dias)\n"
    add_content '```'
    git shortlog -sn --since='30 days ago' --no-merges 2>/dev/null | tee -a "${REPORT_FILE}"
    add_content '```'
}

# 4. Análise de Arquivos
analyze_files() {
    print_header "4. Análise de Arquivos"
    add_section "4. Análise de Arquivos"
    
    # Top 20 arquivos mais modificados
    add_content "### Top 20 Arquivos Mais Modificados\n"
    add_content '```'
    git log --all --name-only --format='format:' 2>/dev/null | \
        grep -v '^$' | sort | uniq -c | sort -rn | head -20 | \
        awk '{print $1 " modificações: " $2}' | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Arquivos maiores
    add_content "\n### Top 20 Arquivos Maiores\n"
    add_content '```'
    git ls-files 2>/dev/null | xargs -I{} du -h {} 2>/dev/null | \
        sort -rh | head -20 | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Total de arquivos rastreados
    TOTAL_FILES=$(git ls-files 2>/dev/null | wc -l)
    log "Total de arquivos rastreados: ${TOTAL_FILES}"
    add_content "\n**Total de arquivos rastreados:** ${TOTAL_FILES}"
}

# 5. Estatísticas de Código
analyze_code_stats() {
    print_header "5. Estatísticas de Código"
    add_section "5. Estatísticas de Código"
    
    # Contar linhas de código por tipo de arquivo
    add_content "### Linhas de Código por Tipo de Arquivo\n"
    add_content '```'
    
    # JavaScript/TypeScript
    JS_LINES=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
        grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "JavaScript/TypeScript: ${JS_LINES} linhas" | tee -a "${REPORT_FILE}"
    
    # Python
    PY_LINES=$(find . -name "*.py" 2>/dev/null | \
        grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "Python: ${PY_LINES} linhas" | tee -a "${REPORT_FILE}"
    
    # HTML/CSS
    HTML_LINES=$(find . -name "*.html" -o -name "*.css" -o -name "*.scss" 2>/dev/null | \
        grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "HTML/CSS: ${HTML_LINES} linhas" | tee -a "${REPORT_FILE}"
    
    # Markdown
    MD_LINES=$(find . -name "*.md" 2>/dev/null | \
        grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "Markdown: ${MD_LINES} linhas" | tee -a "${REPORT_FILE}"
    
    # JSON
    JSON_LINES=$(find . -name "*.json" 2>/dev/null | \
        grep -v node_modules | grep -v package-lock.json | \
        xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    echo "JSON: ${JSON_LINES} linhas" | tee -a "${REPORT_FILE}"
    
    add_content '```'
}

# 6. Análise de Branches
analyze_branches() {
    print_header "6. Análise de Branches"
    add_section "6. Análise de Branches"
    
    # Branches locais
    add_content "### Branches Locais\n"
    add_content '```'
    git branch -v 2>/dev/null | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Branches remotas
    add_content "\n### Branches Remotas\n"
    add_content '```'
    git branch -r 2>/dev/null | head -20 | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Total de branches
    LOCAL_BRANCHES=$(git branch 2>/dev/null | wc -l)
    REMOTE_BRANCHES=$(git branch -r 2>/dev/null | wc -l)
    log "Branches locais: ${LOCAL_BRANCHES}"
    log "Branches remotas: ${REMOTE_BRANCHES}"
    add_content "\n**Total de branches locais:** ${LOCAL_BRANCHES}"
    add_content "\n**Total de branches remotas:** ${REMOTE_BRANCHES}"
}

# 7. Análise de Segurança Básica
analyze_security() {
    print_header "7. Análise de Segurança Básica"
    add_section "7. Análise de Segurança"
    
    add_content "### Verificação de Padrões Sensíveis\n"
    
    # Procurar por padrões suspeitos no histórico
    log "Verificando padrões sensíveis no código..."
    
    PATTERNS=("password" "secret" "api_key" "apikey" "token" "credentials")
    
    for pattern in "${PATTERNS[@]}"; do
        COUNT=$(git grep -i "${pattern}" 2>/dev/null | grep -v ".git" | wc -l || echo "0")
        if [ "${COUNT}" -gt 0 ]; then
            log_warning "Encontrado '${pattern}': ${COUNT} ocorrências"
            add_content "- ⚠️ Padrão '${pattern}': ${COUNT} ocorrências"
        fi
    done
    
    # Verificar arquivos .env no histórico
    ENV_FILES=$(git log --all --name-only --format='format:' 2>/dev/null | \
        grep -E '\.env$|\.env\.' | sort -u | wc -l)
    if [ "${ENV_FILES}" -gt 0 ]; then
        log_warning "Arquivos .env encontrados no histórico: ${ENV_FILES}"
        add_content "- ⚠️ Arquivos .env no histórico: ${ENV_FILES}"
    fi
}

# 8. Verificação de Documentação
analyze_documentation() {
    print_header "8. Verificação de Documentação"
    add_section "8. Verificação de Documentação"
    
    add_content "### Arquivos Essenciais\n"
    
    ESSENTIAL_FILES=("README.md" "LICENSE" "CONTRIBUTING.md" "CODE_OF_CONDUCT.md" "CHANGELOG.md" ".gitignore")
    
    for file in "${ESSENTIAL_FILES[@]}"; do
        if [ -f "${file}" ]; then
            log "✓ ${file} existe"
            add_content "- ✅ ${file}"
        else
            log_warning "✗ ${file} ausente"
            add_content "- ❌ ${file} (ausente)"
        fi
    done
    
    # Contar arquivos de documentação
    TOTAL_DOCS=$(find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
    log "Total de arquivos Markdown: ${TOTAL_DOCS}"
    add_content "\n**Total de arquivos Markdown:** ${TOTAL_DOCS}"
}

# 9. Atividade Recente
analyze_recent_activity() {
    print_header "9. Atividade Recente (Últimos 30 dias)"
    add_section "9. Atividade Recente"
    
    add_content "### Últimos 10 Commits\n"
    add_content '```'
    git log --oneline -10 2>/dev/null | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Arquivos modificados recentemente
    add_content "\n### Arquivos Modificados Recentemente\n"
    add_content '```'
    git log --since='30 days ago' --name-only --format='format:' 2>/dev/null | \
        grep -v '^$' | sort | uniq -c | sort -rn | head -10 | \
        awk '{print $1 " modificações: " $2}' | tee -a "${REPORT_FILE}"
    add_content '```'
}

# 10. Tamanho e Performance
analyze_size_performance() {
    print_header "10. Tamanho e Performance do Repositório"
    add_section "10. Tamanho e Performance"
    
    add_content "### Informações de Tamanho\n"
    add_content '```'
    git count-objects -vH 2>/dev/null | tee -a "${REPORT_FILE}"
    add_content '```'
    
    # Tamanho do diretório .git
    GIT_SIZE=$(du -sh .git 2>/dev/null | awk '{print $1}')
    log "Tamanho do .git: ${GIT_SIZE}"
    add_content "\n**Tamanho do diretório .git:** ${GIT_SIZE}"
    
    # Tamanho total do repositório
    REPO_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')
    log "Tamanho total: ${REPO_SIZE}"
    add_content "\n**Tamanho total do repositório:** ${REPO_SIZE}"
}

# 11. Análise de Issues e PRs (via GitHub CLI se disponível)
analyze_github_data() {
    print_header "11. Análise de Issues e Pull Requests"
    add_section "11. Issues e Pull Requests"
    
    if command -v gh &> /dev/null; then
        log "GitHub CLI detectado, coletando dados..."
        
        # Issues
        add_content "### Issues\n"
        add_content '```'
        gh issue list --limit 10 2>/dev/null | tee -a "${REPORT_FILE}" || \
            echo "Não foi possível obter issues" | tee -a "${REPORT_FILE}"
        add_content '```'
        
        # Pull Requests
        add_content "\n### Pull Requests\n"
        add_content '```'
        gh pr list --limit 10 2>/dev/null | tee -a "${REPORT_FILE}" || \
            echo "Não foi possível obter PRs" | tee -a "${REPORT_FILE}"
        add_content '```'
    else
        log_info "GitHub CLI (gh) não instalado. Pulando análise de Issues/PRs."
        add_content "GitHub CLI não disponível. Para análise completa, instale: https://cli.github.com/"
    fi
}

# 12. Resumo Executivo
generate_summary() {
    print_header "12. Gerando Resumo Executivo"
    add_section "12. Resumo Executivo"
    
    add_content "### Indicadores-Chave\n"
    add_content "| Métrica | Valor |"
    add_content "|---------|-------|"
    add_content "| Total de Commits | ${TOTAL_COMMITS} |"
    add_content "| Commits (30 dias) | ${COMMITS_30_DAYS} |"
    add_content "| Contribuidores | ${TOTAL_CONTRIBUTORS} |"
    add_content "| Arquivos Rastreados | ${TOTAL_FILES} |"
    add_content "| Branches Locais | ${LOCAL_BRANCHES} |"
    add_content "| Tamanho do Repositório | ${REPO_SIZE} |"
    
    add_content "\n### Status da Documentação\n"
    
    DOCS_SCORE=0
    for file in "${ESSENTIAL_FILES[@]}"; do
        [ -f "${file}" ] && ((DOCS_SCORE++))
    done
    
    DOCS_PERCENTAGE=$((DOCS_SCORE * 100 / ${#ESSENTIAL_FILES[@]}))
    add_content "**Score de Documentação:** ${DOCS_SCORE}/${#ESSENTIAL_FILES[@]} (${DOCS_PERCENTAGE}%)"
    
    if [ ${DOCS_PERCENTAGE} -ge 80 ]; then
        add_content "\n✅ **Excelente documentação!**"
    elif [ ${DOCS_PERCENTAGE} -ge 50 ]; then
        add_content "\n⚠️ **Documentação adequada, mas pode melhorar.**"
    else
        add_content "\n❌ **Documentação insuficiente. Recomenda-se melhorias.**"
    fi
}

# Função principal
main() {
    echo -e "${BOLD}${MAGENTA}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🔍  ANÁLISE CRITERIOSA DE REPOSITÓRIO GITHUB                   ║
║                                                                   ║
║   Sistema Completo de Análise Profunda                          ║
║   v1.0.0 - FullForce Academy                                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    # Verificar repositório Git
    check_git_repo
    
    # Inicializar relatório
    init_report
    log "Relatório inicializado: ${REPORT_FILE}"
    
    # Executar análises
    analyze_basic_info
    analyze_commits
    analyze_contributors
    analyze_files
    analyze_code_stats
    analyze_branches
    analyze_security
    analyze_documentation
    analyze_recent_activity
    analyze_size_performance
    analyze_github_data
    generate_summary
    
    # Finalizar relatório
    add_content "\n---\n"
    add_content "*Análise gerada automaticamente por analise-repositorio.sh v1.0.0*"
    add_content "\n*Data: $(date +"%d/%m/%Y %H:%M:%S")*"
    
    # Fechar JSON
    cat >> "${JSON_FILE}" << EOF
  }
}
EOF
    
    # Mensagem final
    print_header "Análise Concluída!"
    echo -e "${GREEN}${BOLD}✓ Relatório completo gerado:${NC} ${REPORT_FILE}"
    echo -e "${GREEN}${BOLD}✓ Dados em JSON:${NC} ${JSON_FILE}"
    echo -e "\n${CYAN}Para visualizar o relatório:${NC}"
    echo -e "  cat ${REPORT_FILE}"
    echo -e "\n${CYAN}Para análises adicionais, consulte:${NC}"
    echo -e "  GUIA-ANALISE-REPOSITORIO.md"
    echo ""
}

# Executar script
main "$@"
