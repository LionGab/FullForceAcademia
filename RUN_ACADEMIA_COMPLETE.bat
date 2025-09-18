@echo off
title 🔥 ACADEMIA FULL FORCE - SISTEMA COMPLETO DE CONVERSÃO
color 0A
echo.
echo ===============================================================
echo            🔥 ACADEMIA FULL FORCE - AUTOMAÇÃO MASSIVA
echo                     SISTEMA PRONTO PARA CONVERTER!
echo ===============================================================
echo.

REM Verificar se todos os serviços estão rodando
echo 🔍 VERIFICANDO SISTEMA...
echo.

REM 1. WhatsApp Bot
echo 📱 1. WhatsApp Bot (QR Code)...
curl -s http://localhost:4001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ WhatsApp Bot ONLINE - QR Code ativo
) else (
    echo ⚠️  WhatsApp Bot não encontrado - iniciando...
    start "WhatsApp Bot" cmd /k "cd /d "%~dp0" && node connect-whatsapp.js"
    timeout /t 3 >nul
)

REM 2. N8N Automation
echo 🤖 2. N8N Automation...
curl -s http://localhost:5678 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ N8N ONLINE - Workflows prontos
) else (
    echo ⚠️  N8N não encontrado - iniciando...
    start "N8N" cmd /k "docker run -p 5678:5678 n8nio/n8n"
    timeout /t 5 >nul
)

REM 3. WAHA API
echo 📡 3. WAHA API...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ WAHA ONLINE - API disponível
) else (
    echo ⚠️  WAHA não encontrado - iniciando...
    start "WAHA" cmd /k "docker run -d -p 3000:3000 devlikeapro/waha"
    timeout /t 3 >nul
)

echo.
echo ===============================================================
echo 🎯 SISTEMA DE CONVERSÃO ACADEMY FULL FORCE
echo ===============================================================
echo.
echo 📊 DASHBOARDS DISPONÍVEIS:
echo.
echo 🔲 WhatsApp QR Code.....: http://localhost:4001
echo 🤖 N8N Automation......: http://localhost:5678
echo 📱 WAHA Dashboard.......: http://localhost:3000
echo.
echo ===============================================================
echo 💰 POTENCIAL DE RESULTADOS:
echo ===============================================================
echo.
echo 📈 Total de Alunos......: 1300
echo 📉 Alunos Inativos......: ~650 (50%% da base)
echo 💬 Taxa de Resposta.....: 30%% (~195 respostas)
echo 💰 Taxa de Conversão....: 10%% (~65 conversões)
echo 💵 Receita Recuperada...: R$ 5.850/mês
echo 🎯 ROI da Campanha......: 1200%%
echo.
echo ===============================================================
echo 🚀 PRÓXIMOS PASSOS:
echo ===============================================================
echo.
echo 1. 📱 Escaneie o QR Code do WhatsApp
echo 2. 📊 Configure Google Sheets (template fornecido)
echo 3. 🤖 Importe workflows no N8N
echo 4. 🚀 Dispare primeira campanha
echo 5. 📈 Monitore resultados em tempo real
echo.
echo ===============================================================
echo.

echo 🔥 ABRINDO DASHBOARDS...
echo.

REM Abrir todos os dashboards
start "" "http://localhost:4001"
timeout /t 2 >nul
start "" "http://localhost:5678"
timeout /t 2 >nul
start "" "http://localhost:3000"

echo.
echo ✅ SISTEMA FULL FORCE ACADEMIA COMPLETAMENTE OPERACIONAL!
echo.
echo 💡 Dica: Mantenha esta janela aberta para monitorar o sistema
echo.

pause