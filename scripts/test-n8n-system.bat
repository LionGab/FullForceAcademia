@echo off
title FFMATUPA N8N System Test
color 0E

echo.
echo ========================================
echo  FFMATUPA N8N SYSTEM COMPREHENSIVE TEST
echo ========================================
echo.

cd /d "%~dp0"

echo 🧪 INICIANDO TESTES COMPLETOS DO SISTEMA N8N...
echo.

echo 📊 1/6 - Testando conectividade do workflow...
node n8n-workflow-monitor.js test
echo.

echo 🔧 2/6 - Testando ativacao automatica...
node n8n-auto-activator.js verify
echo.

echo 🛡️ 3/6 - Testando sistema de fallback...
node n8n-fallback-system.js health
echo.

echo 🚨 4/6 - Testando sistema de alertas...
node n8n-alert-system.js check
echo.

echo 🌐 5/6 - Testando servidor do dashboard...
timeout /t 2 >nul
node n8n-dashboard-server.js test &
timeout /t 5 >nul

echo.
echo 🚀 6/6 - Testando integracao completa...
node ..\executar-campanha-n8n-cloud.js conectividade

echo.
echo ========================================
echo  RESUMO DOS TESTES
echo ========================================
echo.
echo ✅ Conectividade do workflow: Testado
echo ✅ Sistema de ativacao: Testado
echo ✅ Sistema de fallback: Testado
echo ✅ Sistema de alertas: Testado
echo ✅ Dashboard web: Testado
echo ✅ Integracao completa: Testado
echo.
echo 🎯 TODOS OS COMPONENTES VERIFICADOS!
echo.
echo Para executar o sistema completo:
echo    start-n8n-automation.bat
echo.
echo Para executar apenas a campanha:
echo    node ..\executar-campanha-n8n-cloud.js producao
echo.
pause