@echo off
echo ========================================
echo    FULLFORCE ACADEMIA - SISTEMA WHATSAPP
echo ========================================
echo.

echo 🐳 Iniciando container WAHA...
docker run -d --rm -p 3000:3000 --name waha-academia devlikeapro/waha

echo.
echo ⏳ Aguardando WAHA inicializar (30 segundos)...
timeout /t 30 /nobreak > nul

echo.
echo 🚀 Iniciando sistema da academia...
start "" "whatsapp-production-dashboard.html"

echo.
echo 📱 Iniciando servidor...
node whatsapp-waha-production.js

pause