@echo off
:LOOP
echo ⏳ Verificando status da conexão da academia...
curl -s -X GET "http://localhost:3000/api/sessions/default" -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2" | findstr "WORKING"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 ACADEMIA CONECTADA COM SUCESSO!
    echo ✅ WhatsApp Business da academia vinculado
    echo 🚀 Sistema pronto para campanhas
    pause
    exit
) else (
    echo 📱 Aguardando escaneamento do QR Code...
    timeout /t 5 >nul
    goto LOOP
)