# Estrutura do Projeto - N-1 Edições

## Visão Geral

Este projeto migra a loja N-1 Edições do PrestaShop para WordPress/WooCommerce, mantendo o design do template Harri.

## Estrutura de Diretórios

```
Repositorio Editora N-1/
│
├── loja-antiga/                    # Loja PrestaShop antiga (referência)
│   ├── classes/                    # Classes PHP do PrestaShop
│   ├── img/                        # Imagens dos produtos
│   └── ...
│
├── Template/                       # Template Harri (design)
│   ├── harri-front-end/            # Front-end React/Next.js
│   │   └── public/assets/          # Assets (CSS, JS, imagens)
│   └── ...
│
├── n1-edicoes-theme/               # Tema WordPress (NOVO)
│   ├── style.css                   # Arquivo principal do tema
│   ├── functions.php               # Funções do tema
│   ├── index.php                   # Template principal
│   ├── header.php                  # Cabeçalho
│   ├── footer.php                  # Rodapé
│   ├── inc/                        # Arquivos de suporte
│   │   ├── woocommerce.php        # Funções WooCommerce
│   │   ├── template-functions.php  # Funções de template
│   │   └── helpers.php            # Funções auxiliares
│   ├── template-parts/             # Partes de templates
│   │   ├── content-home.php       # Homepage
│   │   ├── content-shop.php       # Loja
│   │   └── content-single-product.php # Produto
│   ├── woocommerce/               # Templates WooCommerce
│   │   ├── archive-product.php    # Arquivo de produtos
│   │   ├── single-product.php     # Produto único
│   │   └── content-product.php    # Card de produto
│   └── assets/                    # Assets do tema
│       ├── css/                   # Estilos
│       ├── js/                    # Scripts
│       └── img/                   # Imagens
│
├── import-products-prestashop.php   # Script: Importar do PrestaShop
├── import-products-from-website.php # Script: Importar do site atual
├── copy-assets.sh                  # Script: Copiar assets (Linux/Mac)
├── copy-assets.bat                 # Script: Copiar assets (Windows)
├── .htaccess                       # Configuração Apache
├── README-INSTALACAO.md            # Guia completo de instalação
├── GUIA-RAPIDO.md                 # Guia rápido
└── ESTRUTURA-PROJETO.md           # Este arquivo
```

## Fluxo de Trabalho

### 1. Preparação
- ✅ Tema WordPress criado
- ✅ Templates WooCommerce criados
- ✅ Scripts de importação criados

### 2. Instalação
1. Copiar `n1-edicoes-theme` para WordPress
2. Executar `copy-assets.sh` ou `copy-assets.bat`
3. Ativar tema no WordPress
4. Configurar menu e logo

### 3. Importação de Produtos
- Opção A: `import-products-prestashop.php` (banco de dados)
- Opção B: `import-products-from-website.php` (web scraping)

### 4. Configuração
- Configurar WooCommerce (moeda, pagamento, entrega)
- Personalizar cores e estilos
- Adicionar widgets ao rodapé

## Arquivos Principais

### Tema WordPress

| Arquivo | Descrição |
|---------|-----------|
| `style.css` | Informações do tema e estilos básicos |
| `functions.php` | Funções principais, enqueues, suporte WooCommerce |
| `index.php` | Template principal (rota para outros templates) |
| `header.php` | Cabeçalho com menu e busca |
| `footer.php` | Rodapé com widgets |

### Templates WooCommerce

| Arquivo | Descrição |
|---------|-----------|
| `woocommerce/archive-product.php` | Página da loja (lista de produtos) |
| `woocommerce/single-product.php` | Página de produto individual |
| `woocommerce/content-product.php` | Card de produto (usado no loop) |

### Funções de Suporte

| Arquivo | Descrição |
|---------|-----------|
| `inc/woocommerce.php` | Customizações WooCommerce |
| `inc/template-functions.php` | Funções para templates (n1_product_card, etc.) |
| `inc/helpers.php` | Funções auxiliares |

## Scripts de Importação

### import-products-prestashop.php
- **Uso**: Quando você tem acesso ao banco de dados PrestaShop
- **Requisitos**: Credenciais do banco de dados
- **Funcionalidade**: 
  - Conecta ao banco PrestaShop
  - Extrai produtos, preços, descrições, imagens
  - Importa para WooCommerce
  - Copia imagens para uploads do WordPress

### import-products-from-website.php
- **Uso**: Quando você não tem acesso ao banco de dados
- **Requisitos**: Acesso ao site atual (https://loja.n-1edicoes.org)
- **Funcionalidade**:
  - Faz scraping do site atual
  - Extrai informações dos produtos
  - Importa para WooCommerce
  - Baixa imagens dos produtos

## Assets

Os assets (CSS, JS, imagens) devem ser copiados do template para o tema:

```
Template/harri-front-end/public/assets/
    ↓ (copiar)
n1-edicoes-theme/assets/
```

**Scripts disponíveis:**
- `copy-assets.sh` (Linux/Mac)
- `copy-assets.bat` (Windows)

## Integração WooCommerce

O tema está totalmente integrado com WooCommerce:

- ✅ Suporte a produtos simples
- ✅ Galeria de imagens
- ✅ Preços e descontos
- ✅ Categorias
- ✅ Carrinho
- ✅ Checkout (usa templates padrão do WooCommerce)

## Personalização

### Cores
Editar: `n1-edicoes-theme/assets/css/theme-custom.css`

### Layout
Editar templates em:
- `template-parts/` - Partes reutilizáveis
- `woocommerce/` - Templates WooCommerce

### Funcionalidades
Editar: `n1-edicoes-theme/inc/`

## Próximos Passos

1. **Testar localmente** antes de subir para produção
2. **Importar produtos** usando um dos scripts
3. **Configurar pagamento** no WooCommerce
4. **Configurar entrega** no WooCommerce
5. **Personalizar design** conforme necessário
6. **Testar checkout completo**

## Notas Importantes

- ⚠️ Sempre faça backup antes de fazer alterações
- ⚠️ Teste em ambiente de desenvolvimento primeiro
- ⚠️ Os scripts de importação podem precisar de ajustes dependendo da estrutura do banco/site
- ⚠️ Certifique-se de que os assets foram copiados corretamente
- ⚠️ Verifique permissões de arquivos no servidor

## Suporte

Para problemas:
1. Verificar logs do WordPress
2. Verificar console do navegador (F12)
3. Verificar se WooCommerce está ativado
4. Verificar se assets foram copiados


