#!/bin/bash
# Script para copiar assets do template para o tema WordPress

echo "Copiando assets do template para o tema WordPress..."

# Criar diretórios se não existirem
mkdir -p n1-edicoes-theme/assets/css
mkdir -p n1-edicoes-theme/assets/js
mkdir -p n1-edicoes-theme/assets/img
mkdir -p n1-edicoes-theme/assets/fonts

# Copiar CSS
echo "Copiando arquivos CSS..."
if [ -d "Template/harri-front-end/public/assets/css" ]; then
    cp -r Template/harri-front-end/public/assets/css/* n1-edicoes-theme/assets/css/
    echo "✓ CSS copiado"
else
    echo "✗ Diretório CSS não encontrado"
fi

# Copiar JS
echo "Copiando arquivos JavaScript..."
if [ -d "Template/harri-front-end/public/assets/js" ]; then
    cp -r Template/harri-front-end/public/assets/js/* n1-edicoes-theme/assets/js/
    echo "✓ JavaScript copiado"
else
    echo "✗ Diretório JS não encontrado"
fi

# Copiar imagens
echo "Copiando imagens..."
if [ -d "Template/harri-front-end/public/assets/img" ]; then
    cp -r Template/harri-front-end/public/assets/img/* n1-edicoes-theme/assets/img/
    echo "✓ Imagens copiadas"
else
    echo "✗ Diretório de imagens não encontrado"
fi

# Copiar fontes
echo "Copiando fontes..."
if [ -d "Template/harri-front-end/public/assets/fonts" ]; then
    cp -r Template/harri-front-end/public/assets/fonts/* n1-edicoes-theme/assets/fonts/
    echo "✓ Fontes copiadas"
else
    echo "✗ Diretório de fontes não encontrado"
fi

# Verificar se há arquivos SCSS que precisam ser compilados
if [ -d "Template/harri-front-end/public/assets/scss" ]; then
    echo "⚠ Arquivos SCSS encontrados. Você pode precisar compilá-los para CSS."
fi

echo ""
echo "Concluído! Verifique os arquivos em n1-edicoes-theme/assets/"



