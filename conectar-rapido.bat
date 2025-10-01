@echo off
echo 🚀 CONECTAR WHATSAPP CLIENTE - SCRIPT RAPIDO
echo ==========================================
echo.

echo ⚡ Abrindo interface WAHA...
start http://localhost:3000

echo.
echo 📋 INSTRUÇÕES:
echo 1. Use a interface web que acabou de abrir
echo 2. Encontre POST /api/sessions
echo 3. Use o JSON: {"name":"cliente-academia","config":{"webhooks":[]}}
echo 4. Execute POST /api/sessions/cliente-academia/start
echo 5. Execute GET /api/screenshot?session=cliente-academia
echo 6. Baixe e escaneie o QR Code
echo.

echo 🔧 Ou use os comandos curl:
echo.

echo Criando sessão...
curl -X POST "http://localhost:3000/api/sessions" -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2" -H "Content-Type: application/json" -d "{\"name\":\"cliente-academia\",\"config\":{\"webhooks\":[]}}"

echo.
echo Iniciando sessão...
curl -X POST "http://localhost:3000/api/sessions/cliente-academia/start" -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2"

echo.
echo ⏳ Aguardando 10 segundos para gerar QR...
timeout /t 10

echo.
echo Obtendo QR Code...
curl -X GET "http://localhost:3000/api/screenshot?session=cliente-academia" -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2" --output qr-code-cliente.png

echo.
echo 📱 QR Code salvo em: qr-code-cliente.png
echo 🔍 Abrindo imagem...
start qr-code-cliente.png

echo.
echo 📋 AGORA:
echo 1. Escaneie o QR Code com WhatsApp
echo 2. Aguarde conexão
echo 3. WhatsApp estará conectado!
echo.

pause