# Script de Build para WordPress
# Este script prepara os arquivos para deploy no WordPress

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build para WordPress - N-1 Edições" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm não encontrado." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "1. Preparando plugin WordPress..." -ForegroundColor Yellow

# Criar pasta de build
$buildDir = "build-wordpress"
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir | Out-Null
New-Item -ItemType Directory -Path "$buildDir\plugin" | Out-Null

# Copiar plugin
Copy-Item "plugin-n1-woocommerce-api\*" -Destination "$buildDir\plugin\" -Recurse -Force
Write-Host "✓ Plugin copiado para $buildDir\plugin\" -ForegroundColor Green

Write-Host ""
Write-Host "2. Fazendo build do front-end Next.js..." -ForegroundColor Yellow

# Navegar para front-end
Push-Location "front-end"

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "  Instalando dependências..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erro ao instalar dependências" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# Verificar arquivo .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "  Criando .env.local a partir de env.local..." -ForegroundColor Cyan
    if (Test-Path "..\env.local") {
        Copy-Item "..\env.local" -Destination ".env.local"
    } else {
        Write-Host "  ⚠ Arquivo env.local não encontrado. Criando template..." -ForegroundColor Yellow
        @"
NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    }
}

# Fazer build
Write-Host "  Executando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build concluído com sucesso!" -ForegroundColor Green
    
    # Copiar arquivos de build
    if (Test-Path ".next") {
        Write-Host "  Copiando arquivos de build..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "..\$buildDir\front-end" | Out-Null
        Copy-Item ".next" -Destination "..\$buildDir\front-end\" -Recurse -Force
        Copy-Item "package.json" -Destination "..\$buildDir\front-end\" -Force
        Copy-Item "package-lock.json" -Destination "..\$buildDir\front-end\" -Force
        Copy-Item "next.config.js" -Destination "..\$buildDir\front-end\" -Force
        Copy-Item ".env.local" -Destination "..\$buildDir\front-end\" -Force
        Copy-Item "public" -Destination "..\$buildDir\front-end\" -Recurse -Force
        Write-Host "✓ Arquivos de build copiados" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Erro no build do Next.js" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "3. Criando arquivo ZIP do plugin..." -ForegroundColor Yellow

# Criar ZIP do plugin
$pluginZip = "$buildDir\n1-woocommerce-api.zip"
Compress-Archive -Path "$buildDir\plugin\*" -DestinationPath $pluginZip -Force
Write-Host "✓ Plugin ZIP criado: $pluginZip" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivos prontos para deploy:" -ForegroundColor Yellow
Write-Host "  1. Plugin WordPress: $pluginZip" -ForegroundColor White
Write-Host "  2. Front-end Next.js: $buildDir\front-end\" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Faça upload do plugin ZIP no WordPress" -ForegroundColor White
Write-Host "  2. Configure o servidor Node.js com os arquivos do front-end" -ForegroundColor White
Write-Host "  3. Consulte GUIA-DEPLOY-WORDPRESS.md para mais detalhes" -ForegroundColor White
Write-Host ""

