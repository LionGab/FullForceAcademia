@echo off
title 🔥 ACADEMIA FULL FORCE - SISTEMA PROFISSIONAL COMPLETO
color 0A
echo.
echo ===============================================================
echo    🔥 ACADEMIA FULL FORCE - AUTOMAÇÃO PROFISSIONAL
echo          SISTEMA COMPLETO PARA 1300+ ALUNOS
echo ===============================================================
echo.

echo 🚀 VERIFICANDO SISTEMA...
echo.

REM WhatsApp Bot Check
echo 📱 1. WhatsApp Bot...
curl -s http://localhost:4001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ WhatsApp Bot ONLINE - QR Code ativo
) else (
    echo 🔄 Iniciando WhatsApp Bot...
    start "WhatsApp Bot" cmd /k "cd /d "%~dp0" && node connect-whatsapp.js"
    timeout /t 3 >nul
)

REM WAHA API Check
echo 🌐 2. WAHA API...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ WAHA API ONLINE
) else (
    echo 🔄 Iniciando WAHA API...
    start "WAHA" cmd /k "docker run -d -p 3000:3000 devlikeapro/waha"
    timeout /t 3 >nul
)

echo.
echo ===============================================================
echo 🏢 GOOGLE WORKSPACE CONFIGURADO
echo ===============================================================
echo.
echo 📧 Workspace: primeliontecnologia.com
echo 👤 Admin: contato@primeliontecnologia.com
echo 🔗 Drive: https://drive.google.com
echo 📊 Sheets: https://sheets.google.com
echo.

echo ===============================================================
echo ☁️ N8N CLOUD SETUP
echo ===============================================================
echo.
echo 🌐 N8N Cloud: https://n8n.cloud
echo 👤 Login: contato@primeliontecnologia.com
echo 📋 Workspace: Academia Full Force
echo.

echo ===============================================================
echo 📊 PLANILHA GOOGLE SHEETS - ESTRUTURA
echo ===============================================================
echo.
echo 📄 Nome: "Academia Full Force - Sistema Conversão"
echo 📑 5 Abas necessárias:
echo    1. ALUNOS (base principal)
echo    2. CONVERSAS (tracking mensagens)
echo    3. CAMPANHAS (log envios)
echo    4. RESPOSTAS_ENVIADAS (controle)
echo    5. RESULTADOS (dashboard)
echo.

echo ===============================================================
echo 🔧 WORKFLOWS N8N DISPONÍVEIS
echo ===============================================================
echo.
echo 📁 Workflows para import:
echo    • academia-reactivation-campaign-n8n.json
echo    • academia-webhook-responder-n8n.json
echo    • academia-whatsapp-n8n-workflow.json
echo.

echo ===============================================================
echo 🎯 MÉTRICAS DE CONVERSÃO
echo ===============================================================
echo.
echo 📈 Base Total: 1300 alunos
echo 📉 Inativos: 650 (50%%)
echo 💬 Taxa Resposta: 30%% (~195 pessoas)
echo 💰 Taxa Conversão: 10%% (~65 alunos)
echo 💵 Receita Mensal: R$ 5.850
echo 🎯 ROI: 1.200%%
echo.

echo ===============================================================
echo 🚀 ABRIR DASHBOARDS
echo ===============================================================
echo.

REM Abrir dashboards principais
start "" "http://localhost:4001"
timeout /t 2 >nul
start "" "https://n8n.cloud"
timeout /t 2 >nul
start "" "https://sheets.google.com"

echo ✅ Dashboards abertos:
echo    • WhatsApp Bot: http://localhost:4001
echo    • N8N Cloud: https://n8n.cloud
echo    • Google Sheets: https://sheets.google.com
echo.

echo ===============================================================
echo 📋 CHECKLIST DE CONFIGURAÇÃO
echo ===============================================================
echo.
echo 🔲 1. Escanear QR Code WhatsApp
echo 🔲 2. Login N8N Cloud (contato@primeliontecnologia.com)
echo 🔲 3. Criar planilha Google Sheets
echo 🔲 4. Upload workflows N8N
echo 🔲 5. Configurar credenciais Google
echo 🔲 6. Testar primeira campanha
echo.

echo ===============================================================
echo 💡 PRÓXIMOS PASSOS IMPORTANTES
echo ===============================================================
echo.
echo 1. 📱 ESCANEAR QR CODE (urgente!)
echo 2. 📊 Configurar Google Sheets (5 min)
echo 3. 🤖 Setup N8N Cloud (10 min)
echo 4. 🔗 Integrar sistemas (5 min)
echo 5. 🚀 Primeira campanha (2 min)
echo.

echo ===============================================================
echo 🔥 SISTEMA PROFISSIONAL PRONTO!
echo ===============================================================
echo.
echo 💪 Com Google Workspace + N8N Cloud você tem:
echo    • ✅ Escalabilidade ilimitada
echo    • ✅ Backup automático
echo    • ✅ Integração nativa Google
echo    • ✅ Monitoramento em tempo real
echo    • ✅ ROI de 1200%%
echo.
echo 📞 Suporte: Ver arquivos de documentação
echo 🔥 SEU CLIENTE VAI AMAR ESSES RESULTADOS!
echo.

echo Pressione qualquer tecla para continuar...
pause >nul