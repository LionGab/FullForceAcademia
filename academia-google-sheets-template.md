# 📊 ESTRUTURA GOOGLE SHEETS - ACADEMIA FULL FORCE

## 🎯 **SISTEMA DE ALTA CONVERSÃO PARA 1300 ALUNOS**

### 📋 **ABA 1: ALUNOS** (Principal)
| Nome | Telefone | Email | Plano | Status | Última Atividade | Frequência Mensal | Valor Plano |
|------|----------|-------|--------|--------|-------------------|-------------------|-------------|
| João Silva | 11999999999 | joao@email.com | Premium | Ativo | 15/09/2024 | 12 | 179.90 |
| Maria Santos | 11888888888 | maria@email.com | Básico | Inativo | 10/08/2024 | 3 | 89.90 |

### 📞 **ABA 2: CONVERSAS** (Tracking de mensagens)
| Telefone | Nome | Mensagem | Intenção | Prioridade | Data_Hora | Status | Observações |
|----------|------|----------|----------|------------|-----------|--------|-------------|
| 11999999999 | João | "quero voltar" | alta_intencao | critica | 18/09/2024 10:30 | Recebida | Auto processada |

### 🚀 **ABA 3: CAMPANHAS** (Log de envios)
| Telefone | Nome | Urgência | Data_Envio | Status | Tipo_Campanha | Observações |
|----------|------|----------|------------|--------|---------------|-------------|
| 11888888888 | Maria | CRITICA | 18/09/2024 09:00 | Enviado | Reativação | Campanha automática via n8n |

### 📤 **ABA 4: RESPOSTAS_ENVIADAS** (Controle)
| Telefone | Nome | Prioridade | Data_Hora | Status | Tipo |
|----------|------|------------|-----------|--------|------|
| 11999999999 | João | critica | 18/09/2024 10:35 | Enviado | Resposta Automática |

### 📈 **ABA 5: RESULTADOS** (Dashboard)
| Métrica | Valor | Data | Meta | % Atingido |
|---------|--------|------|------|------------|
| Total Inativos | 650 | 18/09/2024 | 600 | 108% |
| Campanhas Enviadas | 650 | 18/09/2024 | 650 | 100% |
| Respostas Recebidas | 195 | 18/09/2024 | 130 | 150% |
| Conversões | 58 | 18/09/2024 | 65 | 89% |
| Receita Recuperada | R$ 5.220 | 18/09/2024 | R$ 5.850 | 89% |

---

## 🔥 **FÓRMULAS INTELIGENTES PARA COPY/PASTE**

### **Célula CONVERSÃO TOTAL (Aba Resultados B6):**
```
=COUNTIFS(Campanhas!F:F,"Reativação",Campanhas!E:E,"Convertido")
```

### **Célula RECEITA RECUPERADA (Aba Resultados B7):**
```
=SUMIFS(Alunos!H:H,Alunos!E:E,"Reativado",Alunos!F:F,">="&TODAY()-30)
```

### **Célula TAXA DE RESPOSTA (Aba Resultados B8):**
```
=COUNTA(Conversas!A:A)/COUNTA(Campanhas!A:A)*100
```

---

## 💰 **MÉTRICAS DE SUCESSO**

### **🎯 METAS REALISTAS:**
- **Taxa de resposta:** 30% (195 de 650 inativos)
- **Taxa de conversão:** 10% (65 de 650 inativos)
- **Receita recuperada:** R$ 5.850/mês (65 × R$ 89,90)
- **ROI da campanha:** 1200% (investimento vs retorno)

### **🚀 METAS OTIMISTAS:**
- **Taxa de resposta:** 40% (260 de 650 inativos)
- **Taxa de conversão:** 15% (97 de 650 inativos)
- **Receita recuperada:** R$ 8.725/mês (97 × R$ 89,90)

---

## 📱 **CONFIGURAÇÃO RÁPIDA**

### **1. Criar Planilha Google Sheets:**
```
1. Acesse sheets.google.com
2. Crie nova planilha: "Academia Full Force - Sistema Conversão"
3. Crie as 5 abas listadas acima
4. Copie os cabeçalhos exatos
5. Anote o ID da planilha (URL)
```

### **2. Configurar Permissões:**
```
1. Compartilhar planilha com e-mail do n8n
2. Dar permissão de "Editor"
3. Ativar Google Sheets API
4. Gerar credenciais de serviço
```

### **3. Popular Base Inicial:**
```
1. Importar lista de 1300 alunos na aba "Alunos"
2. Classificar por "Última Atividade"
3. Identificar ~650 inativos (50%)
4. Validar números de telefone
```

---

## 🎯 **SEGMENTAÇÃO AUTOMÁTICA**

### **CRÍTICOS (60+ dias):** ~300 alunos
- **Desconto:** 70% (R$ 49,90 primeiro mês)
- **Urgência:** MÁXIMA
- **Follow-up:** 6h, 24h, 48h

### **MODERADOS (30-60 dias):** ~350 alunos
- **Desconto:** 50% (próximo mês)
- **Urgência:** ALTA
- **Follow-up:** 12h, 3 dias

### **BAIXA FREQUÊNCIA (ativos <8x/mês):** ~200 alunos
- **Oferta:** Personal + Avaliação grátis
- **Urgência:** MÉDIA
- **Follow-up:** 1 semana

---

## 🔄 **AUTOMAÇÃO COMPLETA**

### **FLUXO 1: CAMPANHA MASSIVA**
```
Trigger → Carregar Base → Segmentar → Enviar Mensagens → Log
```

### **FLUXO 2: RESPOSTAS AUTOMÁTICAS**
```
Webhook WAHA → Parse Mensagem → Classificar Intenção → Resposta Personalizada
```

### **FLUXO 3: FOLLOW-UP INTELIGENTE**
```
Timer → Verificar Não Responderam → Enviar 2ª Mensagem → Agendar 3ª
```

---

## 📊 **DASHBOARD EM TEMPO REAL**

### **KPIs PRINCIPAIS:**
- 📤 Mensagens enviadas: XXX
- 📱 Respostas recebidas: XXX
- 💰 Conversões: XXX
- 💵 Receita gerada: R$ XXX
- 📈 Taxa conversão: XX%

**Seu cliente vai AMAR esses resultados! 🔥**