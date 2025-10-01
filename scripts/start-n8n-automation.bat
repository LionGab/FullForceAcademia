@echo off
title FFMATUPA N8N Cloud Automation System
color 0A

echo.
echo =========================================
echo  FFMATUPA N8N CLOUD AUTOMATION SYSTEM
echo =========================================
echo.
echo 🚀 Iniciando sistema completo de automacao...
echo.

cd /d "%~dp0"

echo 📊 1/4 - Verificando servicos...
node n8n-workflow-monitor.js services

echo.
echo 🔧 2/4 - Iniciando auto-ativador...
start "N8N Auto-Activator" node n8n-auto-activator.js start

echo.
echo 🛡️ 3/4 - Iniciando sistema de fallback...
start "N8N Fallback System" node n8n-fallback-system.js start

echo.
echo 🚨 4/4 - Iniciando sistema de alertas...
start "N8N Alert System" node n8n-alert-system.js start

echo.
echo 🌐 Iniciando dashboard web...
start "N8N Dashboard" node n8n-dashboard-server.js start

echo.
echo ✅ SISTEMA N8N CLOUD TOTALMENTE ATIVO!
echo.
echo 📱 Dashboard: http://localhost:3002
echo 🔍 Monitoramento: Ativo em segundo plano
echo 🔧 Auto-ativacao: Funcionando
echo 🛡️ Fallback: Pronto para emergencias
echo 🚨 Alertas: Monitorando continuamente
echo.
echo Pressione qualquer tecla para abrir o dashboard...
pause >nul

start http://localhost:3002

echo.
echo Sistema funcionando! Feche esta janela quando desejar parar.
pause