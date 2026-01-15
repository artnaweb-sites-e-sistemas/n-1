# Guia Rápido - N-1 Edições

## Passos Rápidos para Instalação

### 1. Instalar o Tema (5 minutos)

```bash
# 1. Copiar pasta do tema para WordPress
cp -r n1-edicoes-theme /caminho/para/wordpress/wp-content/themes/

# 2. Copiar assets do template
# No Windows:
copy-assets.bat

# No Linux/Mac:
chmod +x copy-assets.sh
./copy-assets.sh
```

### 2. Ativar o Tema

1. Acesse: `https://loja.n-1edicoes.org/wp-admin`
2. Vá em **Aparência > Temas**
3. Ative **N-1 Edições**

### 3. Importar Produtos

**Opção A - Do PrestaShop (Recomendado):**

1. Edite `import-products-prestashop.php`
2. Configure credenciais do banco
3. Execute: `php import-products-prestashop.php`

**Opção B - Do Site Atual:**

1. Execute: `php import-products-from-website.php`

### 4. Configurar Menu

1. **Aparência > Menus**
2. Criar menu "Menu Principal"
3. Adicionar: Home, Loja
4. Salvar

### 5. Verificar WooCommerce

1. **WooCommerce > Configurações**
2. Verificar moeda: R$ (Real)
3. Configurar pagamento e entrega

## Estrutura de Arquivos Importantes

```
n1-edicoes-theme/
├── style.css              ← Informações do tema
├── functions.php          ← Funções principais
├── header.php             ← Cabeçalho
├── footer.php             ← Rodapé
├── index.php              ← Template principal
└── woocommerce/           ← Templates WooCommerce
    ├── archive-product.php
    └── single-product.php
```

## Personalização Rápida

### Mudar Cores

Edite: `n1-edicoes-theme/assets/css/style.css`

### Mudar Logo

1. **Personalizar > Identidade do Site**
2. Fazer upload do logo
3. Ou substituir: `n1-edicoes-theme/assets/img/logo/logo-black.svg`

### Adicionar Produtos Manualmente

1. **Produtos > Adicionar Novo**
2. Preencher: Nome, Descrição, Preço, Imagem
3. Publicar

## Troubleshooting

### Produtos não aparecem

- Verificar se WooCommerce está ativado
- Verificar se há produtos publicados
- Limpar cache do WordPress

### Estilos não carregam

- Verificar se assets foram copiados
- Verificar permissões dos arquivos
- Limpar cache do navegador

### Erro ao importar produtos

- Verificar credenciais do banco (PrestaShop)
- Verificar conexão com banco
- Verificar permissões de escrita em uploads

## Contato

Para suporte, verifique:
- Logs do WordPress: `wp-content/debug.log`
- Logs do servidor
- Console do navegador (F12)



