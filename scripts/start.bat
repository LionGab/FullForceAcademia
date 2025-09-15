@echo off
title Academia Full Force - Assistente Virtual
color 0A

echo ====================================
echo  ACADEMIA FULL FORCE
echo  Assistente Virtual WhatsApp
echo ====================================
echo.

:: Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo ❌ ERRO: Dependencias nao instaladas!
    echo.
    echo Execute primeiro: install.bat
    echo Ou execute: npm install
    echo.
    pause
    exit /b 1
)

:: Verificar arquivo .env
if not exist ".env" (
    echo ❌ ERRO: Arquivo .env nao encontrado!
    echo.
    echo Execute primeiro: install.bat
    echo Ou copie .env.example para .env e configure
    echo.
    pause
    exit /b 1
)

echo ✅ Iniciando sistema...
echo.
echo 📱 Aguarde o QR Code do WhatsApp aparecer
echo 🔥 Pressione Ctrl+C para parar o sistema
echo.
echo ====================================
echo.

:: Iniciar o sistema
npm start

:: Se chegou aqui, o sistema foi finalizado
echo.
echo ====================================
echo Sistema finalizado.
echo ====================================
pause