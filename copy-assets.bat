@echo off
REM Script para copiar assets do template para o tema WordPress (Windows)

echo Copiando assets do template para o tema WordPress...

REM Criar diretórios se não existirem
if not exist "n1-edicoes-theme\assets\css" mkdir "n1-edicoes-theme\assets\css"
if not exist "n1-edicoes-theme\assets\js" mkdir "n1-edicoes-theme\assets\js"
if not exist "n1-edicoes-theme\assets\img" mkdir "n1-edicoes-theme\assets\img"
if not exist "n1-edicoes-theme\assets\fonts" mkdir "n1-edicoes-theme\assets\fonts"

REM Copiar CSS
echo Copiando arquivos CSS...
if exist "Template\harri-front-end\public\assets\css" (
    xcopy /E /I /Y "Template\harri-front-end\public\assets\css\*" "n1-edicoes-theme\assets\css\"
    echo CSS copiado
) else (
    echo Diretório CSS não encontrado
)

REM Copiar JS
echo Copiando arquivos JavaScript...
if exist "Template\harri-front-end\public\assets\js" (
    xcopy /E /I /Y "Template\harri-front-end\public\assets\js\*" "n1-edicoes-theme\assets\js\"
    echo JavaScript copiado
) else (
    echo Diretório JS não encontrado
)

REM Copiar imagens
echo Copiando imagens...
if exist "Template\harri-front-end\public\assets\img" (
    xcopy /E /I /Y "Template\harri-front-end\public\assets\img\*" "n1-edicoes-theme\assets\img\"
    echo Imagens copiadas
) else (
    echo Diretório de imagens não encontrado
)

REM Copiar fontes
echo Copiando fontes...
if exist "Template\harri-front-end\public\assets\fonts" (
    xcopy /E /I /Y "Template\harri-front-end\public\assets\fonts\*" "n1-edicoes-theme\assets\fonts\"
    echo Fontes copiadas
) else (
    echo Diretório de fontes não encontrado
)

echo.
echo Concluído! Verifique os arquivos em n1-edicoes-theme\assets\

pause



