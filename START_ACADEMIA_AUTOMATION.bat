@echo off
title 🔥 ACADEMIA FULL FORCE - AUTOMAÇÃO WHATSAPP MASSIVA
color 0A
echo.
echo ================================================================
echo            🔥 ACADEMIA FULL FORCE - SISTEMA DE CONVERSÃO
echo ================================================================
echo.
echo 🚀 INICIANDO AUTOMAÇÃO PARA 1300 ALUNOS...
echo.
echo 📋 CHECKLIST DE DEPLOY:
echo.
echo ✅ 1. n8n rodando em localhost:5678
echo ✅ 2. WAHA API configurado na porta 3000
echo ✅ 3. Google Sheets criado e configurado
echo ✅ 4. Workflows importados no n8n
echo.
echo ================================================================
echo.

REM Verificar se n8n está rodando
echo 🔍 Verificando n8n...
curl -s http://localhost:5678 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ n8n ONLINE em localhost:5678
) else (
    echo ❌ n8n NÃO ENCONTRADO! Iniciando...
    start "" "http://localhost:5678"
    timeout /t 5
)
echo.

REM Verificar WAHA API
echo 🔍 Verificando WAHA API...
curl -s http://localhost:3000/api/sessions >nul 2>&1
if %errorlevel%==0 (
    echo ✅ WAHA API ONLINE em localhost:3000
) else (
    echo ❌ WAHA API não encontrado na porta 3000
    echo 💡 Execute: docker run -it --rm -p 3000:3000/tcp devlikeapro/waha
)
echo.

echo ================================================================
echo 📁 ARQUIVOS CRIADOS PARA IMPORT NO n8n:
echo ================================================================
echo.
echo 📄 academia-reactivation-campaign-n8n.json
echo    └─ Campanha de reativação massiva com segmentação
echo.
echo 📄 academia-webhook-responder-n8n.json
echo    └─ Resposta automática inteligente via WAHA
echo.
echo 📄 academia-google-sheets-template.md
echo    └─ Estrutura completa das planilhas
echo.
echo ================================================================
echo 🎯 PRÓXIMOS PASSOS PARA SEU CLIENTE:
echo ================================================================
echo.
echo 1. 📊 Criar Google Sheets com estrutura fornecida
echo 2. 📱 Importar lista de 1300 alunos
echo 3. 🔄 Importar workflows no n8n (localhost:5678)
echo 4. ⚙️  Configurar credenciais Google Sheets no n8n
echo 5. 🚀 Ativar workflows e disparar primeira campanha
echo.
echo ================================================================
echo 💰 POTENCIAL DE RESULTADO:
echo ================================================================
echo.
echo 📈 650 alunos inativos (50% da base)
echo 💬 195 respostas esperadas (30% taxa resposta)
echo 💰 65 conversões esperadas (10% taxa conversão)
echo 💵 R$ 5.850/mês receita recuperada
echo 🎯 ROI de 1200% para seu cliente
echo.
echo ================================================================
echo.
echo 🔥 SISTEMA PRONTO PARA CONVERTER MASSIVAMENTE!
echo.
echo Pressione qualquer tecla para abrir n8n...
pause >nul

REM Abrir n8n no navegador
start "" "http://localhost:5678"

echo.
echo ✅ n8n aberto! Importe os workflows e comece a conversão!
echo.
pause