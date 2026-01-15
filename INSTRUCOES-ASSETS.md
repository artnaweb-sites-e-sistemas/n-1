# Instruções para Copiar Assets

## ⚠️ IMPORTANTE

Os assets (CSS, JavaScript, imagens) do template **DEVEM** ser copiados para o tema WordPress antes de ativar o tema. Sem eles, o tema não funcionará corretamente.

## Método 1: Script Automático (Recomendado)

### Windows
```cmd
copy-assets.bat
```

### Linux/Mac
```bash
chmod +x copy-assets.sh
./copy-assets.sh
```

## Método 2: Manual

### 1. Criar Estrutura de Pastas

Crie as seguintes pastas no tema:
```
n1-edicoes-theme/assets/
├── css/
├── js/
├── img/
└── fonts/
```

### 2. Copiar Arquivos CSS

**Origem:** `Template/harri-front-end/public/assets/css/`
**Destino:** `n1-edicoes-theme/assets/css/`

Arquivos a copiar:
- `animate.css`
- `backtotop.css`
- `elegant-icon.css`
- `font-awesome-pro.css`
- `nice-select.css`
- `spacing.css`

**Nota:** Se houver arquivos SCSS, você precisará compilá-los para CSS primeiro.

### 3. Copiar Arquivos JavaScript

**Origem:** `Template/harri-front-end/public/assets/js/`
**Destino:** `n1-edicoes-theme/assets/js/`

Copie todos os arquivos `.js` encontrados.

### 4. Copiar Imagens

**Origem:** `Template/harri-front-end/public/assets/img/`
**Destino:** `n1-edicoes-theme/assets/img/`

Copie toda a pasta `img/` mantendo a estrutura de subpastas.

### 5. Copiar Fontes (se houver)

**Origem:** `Template/harri-front-end/public/assets/fonts/`
**Destino:** `n1-edicoes-theme/assets/fonts/`

Copie todos os arquivos de fontes.

## Compilação de SCSS (se necessário)

Se o template usar SCSS e você não tiver os arquivos CSS compilados:

### Opção 1: Usar arquivos CSS já compilados
Verifique se há uma pasta `dist/` ou `build/` com CSS compilado.

### Opção 2: Compilar SCSS
```bash
# Instalar dependências
cd Template/harri-front-end
npm install

# Compilar SCSS
npm run build
# ou
npm run sass
```

Depois copie os arquivos CSS compilados.

## Verificação

Após copiar, verifique se os seguintes arquivos existem:

```
n1-edicoes-theme/assets/
├── css/
│   ├── style.css (ou main.css - arquivo principal)
│   ├── responsive.css
│   └── outros arquivos CSS...
├── js/
│   ├── main.js (ou app.js - arquivo principal)
│   └── outros arquivos JS...
└── img/
    ├── logo/
    └── outras imagens...
```

## Arquivos CSS Principais Necessários

O tema espera encontrar estes arquivos CSS principais:

1. **style.css** ou **main.css** - Estilos principais do template
2. **responsive.css** - Estilos responsivos
3. **bootstrap.min.css** - Framework Bootstrap (pode estar incluído ou separado)

Se os nomes forem diferentes, você precisará ajustar `functions.php`:

```php
// Em n1-edicoes-theme/functions.php, linha ~30
wp_enqueue_style('n1-main', $theme_uri . '/assets/css/SEU-ARQUIVO-PRINCIPAL.css', ...);
```

## Arquivos JavaScript Principais Necessários

O tema espera encontrar:

1. **main.js** ou **app.js** - Script principal
2. **bootstrap.bundle.min.js** - Bootstrap JS
3. **jquery.nice-select.min.js** - Plugin Nice Select
4. **slick.min.js** - Plugin Slick Carousel
5. **swiper-bundle.min.js** - Plugin Swiper

## Solução de Problemas

### Erro: "Arquivo CSS não encontrado"
- Verifique se os arquivos foram copiados corretamente
- Verifique os caminhos em `functions.php`
- Verifique permissões dos arquivos

### Estilos não aparecem
- Limpe o cache do navegador (Ctrl+F5)
- Verifique console do navegador (F12) para erros
- Verifique se os arquivos CSS existem no servidor

### JavaScript não funciona
- Verifique console do navegador (F12) para erros
- Verifique se jQuery está carregado antes dos outros scripts
- Verifique se os arquivos JS existem no servidor

## Estrutura Final Esperada

```
n1-edicoes-theme/
├── assets/
│   ├── css/
│   │   ├── style.css (ou main.css)
│   │   ├── responsive.css
│   │   ├── bootstrap.min.css
│   │   └── outros...
│   ├── js/
│   │   ├── main.js (ou app.js)
│   │   ├── bootstrap.bundle.min.js
│   │   └── outros...
│   ├── img/
│   │   ├── logo/
│   │   │   └── logo-black.svg
│   │   └── outras imagens...
│   └── fonts/ (opcional)
│       └── arquivos de fontes...
```

## Checklist

Antes de ativar o tema, verifique:

- [ ] Pasta `assets/css/` existe e tem arquivos
- [ ] Pasta `assets/js/` existe e tem arquivos
- [ ] Pasta `assets/img/` existe e tem imagens
- [ ] Arquivo CSS principal existe (style.css ou main.css)
- [ ] Arquivo JS principal existe (main.js ou app.js)
- [ ] Logo existe em `assets/img/logo/` (ou ajustar caminho)

## Próximo Passo

Após copiar os assets:
1. Ative o tema no WordPress
2. Verifique se o site carrega corretamente
3. Se houver erros, verifique console do navegador



