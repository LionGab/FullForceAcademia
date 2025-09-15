@echo off
echo ====================================
echo  ACADEMIA FULL FORCE - INSTALACAO
echo  Assistente Virtual WhatsApp
echo ====================================
echo.

:: Verificar se Node.js está instalado
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js nao encontrado!
    echo.
    echo Baixe e instale Node.js de: https://nodejs.org/
    echo Versao minima requerida: 16.0.0
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado!
    node --version
)
echo.

:: Verificar se NPM está instalado
echo [2/6] Verificando NPM...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: NPM nao encontrado!
    pause
    exit /b 1
) else (
    echo ✅ NPM encontrado!
    npm --version
)
echo.

:: Instalar dependências
echo [3/6] Instalando dependencias...
echo Isso pode demorar alguns minutos...
npm install
if errorlevel 1 (
    echo ❌ ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
) else (
    echo ✅ Dependencias instaladas com sucesso!
)
echo.

:: Verificar se arquivo .env existe
echo [4/6] Verificando configuracao...
if not exist ".env" (
    echo ⚠️  Arquivo .env nao encontrado!
    echo Copiando template...
    copy ".env.example" ".env"
    echo.
    echo ✅ Arquivo .env criado!
    echo ⚠️  IMPORTANTE: Configure suas credenciais no arquivo .env
) else (
    echo ✅ Arquivo .env encontrado!
)
echo.

:: Criar diretórios necessários
echo [5/6] Criando diretorios...
if not exist "sessions" mkdir sessions
if not exist "logs" mkdir logs
if not exist "backup" mkdir backup
echo ✅ Diretorios criados!
echo.

:: Verificar configuração
echo [6/6] Verificando configuracao final...
node -e "
try {
    require('dotenv').config();
    console.log('✅ Configuracao basica OK!');

    if (!process.env.GOOGLE_CLIENT_ID) {
        console.log('⚠️  GOOGLE_CLIENT_ID nao configurado');
    }
    if (!process.env.GOOGLE_CLIENT_SECRET) {
        console.log('⚠️  GOOGLE_CLIENT_SECRET nao configurado');
    }
    if (!process.env.GOOGLE_CALENDAR_ID) {
        console.log('⚠️  GOOGLE_CALENDAR_ID nao configurado');
    }
    if (!process.env.GOOGLE_SHEETS_ID) {
        console.log('⚠️  GOOGLE_SHEETS_ID nao configurado');
    }

} catch(e) {
    console.log('❌ Erro na configuracao:', e.message);
}
"
echo.

:: Informações finais
echo ====================================
echo  INSTALACAO CONCLUIDA!
echo ====================================
echo.
echo Proximos passos:
echo.
echo 1. Configure o arquivo .env com suas credenciais:
echo    - GOOGLE_CLIENT_ID
echo    - GOOGLE_CLIENT_SECRET
echo    - GOOGLE_CALENDAR_ID
echo    - GOOGLE_SHEETS_ID
echo    - ACADEMIA_TELEFONE
echo    - ACADEMIA_ENDERECO
echo.
echo 2. Execute o sistema:
echo    npm run dev
echo.
echo 3. Escaneie o QR Code do WhatsApp
echo.
echo 4. Teste enviando uma mensagem!
echo.
echo Documentacao completa em: docs/SETUP_GUIDE.md
echo.
echo ====================================
echo  ACADEMIA FULL FORCE
echo  Transformacao em cada treino! 💪
echo ====================================
echo.
pause