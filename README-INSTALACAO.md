# Instalação do Tema N-1 Edições

Este guia explica como instalar e configurar o tema WordPress customizado para a loja N-1 Edições, integrado com WooCommerce e baseado no template Harri.

## Pré-requisitos

- WordPress 6.0 ou superior
- PHP 7.4 ou superior
- WooCommerce instalado e ativado
- Acesso ao banco de dados (para importação de produtos do PrestaShop)

## Instalação do Tema

### 1. Upload do Tema

1. Faça upload da pasta `n1-edicoes-theme` para `/wp-content/themes/` do seu WordPress
2. Acesse o painel administrativo do WordPress
3. Vá em **Aparência > Temas**
4. Ative o tema **N-1 Edições**

### 2. Copiar Assets do Template

Os arquivos CSS, JS e imagens do template precisam ser copiados para o tema:

```bash
# Copiar CSS
cp -r Template/harri-front-end/public/assets/css/* n1-edicoes-theme/assets/css/

# Copiar JS
cp -r Template/harri-front-end/public/assets/js/* n1-edicoes-theme/assets/js/

# Copiar imagens
cp -r Template/harri-front-end/public/assets/img/* n1-edicoes-theme/assets/img/

# Copiar fontes (se houver)
cp -r Template/harri-front-end/public/assets/fonts/* n1-edicoes-theme/assets/fonts/
```

**Nota:** Se você não tiver acesso ao terminal, pode fazer isso manualmente via FTP ou gerenciador de arquivos.

### 3. Configurar Menu

1. Vá em **Aparência > Menus**
2. Crie um novo menu chamado "Menu Principal"
3. Adicione os itens desejados (Home, Loja, etc.)
4. Atribua o menu à localização "Menu Principal"

### 4. Configurar Logo

1. Vá em **Personalizar > Identidade do Site**
2. Faça upload do logo da N-1 Edições
3. Ou copie o logo do template para `n1-edicoes-theme/assets/img/logo/logo-black.svg`

## Importação de Produtos

### Opção 1: Importar do PrestaShop (Banco de Dados)

Se você tem acesso ao banco de dados do PrestaShop:

1. Edite o arquivo `import-products-prestashop.php`
2. Configure as credenciais do banco de dados:
   ```php
   define('PS_DB_HOST', 'localhost');
   define('PS_DB_NAME', 'nome_do_banco');
   define('PS_DB_USER', 'usuario');
   define('PS_DB_PASS', 'senha');
   define('PS_DB_PREFIX', 'ps_');
   ```
3. Execute o script:
   ```bash
   php import-products-prestashop.php
   ```

### Opção 2: Importar do Site Atual (Web Scraping)

Se você não tem acesso ao banco de dados, use o script alternativo:

1. Execute o script:
   ```bash
   php import-products-from-website.php
   ```

**Nota:** Este método pode precisar de ajustes nos seletores CSS dependendo da estrutura HTML do site atual.

### Opção 3: Importação Manual via WooCommerce

1. Acesse **Produtos > Importar** no WordPress
2. Prepare um arquivo CSV com os produtos
3. Use o importador padrão do WooCommerce

## Estrutura de Arquivos

```
n1-edicoes-theme/
├── style.css                 # Arquivo principal do tema
├── functions.php             # Funções principais
├── index.php                 # Template principal
├── header.php                # Cabeçalho
├── footer.php                # Rodapé
├── inc/                      # Arquivos de suporte
│   ├── woocommerce.php      # Funções WooCommerce
│   ├── template-functions.php # Funções de template
│   └── helpers.php           # Funções auxiliares
├── template-parts/          # Partes de templates
│   ├── content-home.php     # Homepage
│   ├── content-shop.php     # Loja
│   └── content-single-product.php # Produto individual
├── woocommerce/             # Templates WooCommerce
│   ├── archive-product.php  # Arquivo de produtos
│   ├── single-product.php    # Produto único
│   └── content-product.php  # Card de produto
└── assets/                  # Assets (CSS, JS, imagens)
    ├── css/
    ├── js/
    └── img/
```

## Personalização

### Cores e Estilos

Os estilos principais estão em `assets/css/style.css`. Você pode personalizar:

- Cores do tema
- Tipografia
- Espaçamentos
- Layouts

### Templates

Os templates podem ser editados em:

- `template-parts/` - Partes reutilizáveis
- `woocommerce/` - Templates específicos do WooCommerce

### Funções

Funções customizadas estão em:

- `inc/woocommerce.php` - Integrações WooCommerce
- `inc/template-functions.php` - Funções de template
- `inc/helpers.php` - Funções auxiliares

## Configuração do WooCommerce

1. Vá em **WooCommerce > Configurações**
2. Configure:
   - Moeda: Real Brasileiro (R$)
   - Localização: Brasil
   - Formato de preço: R$ 95,00

## Suporte

Para problemas ou dúvidas:

1. Verifique se o WooCommerce está ativado
2. Verifique se os assets foram copiados corretamente
3. Verifique os logs de erro do WordPress
4. Certifique-se de que o PHP está na versão 7.4 ou superior

## Próximos Passos

Após a instalação:

1. Configure os widgets do rodapé
2. Adicione produtos ou importe do PrestaShop
3. Configure métodos de pagamento no WooCommerce
4. Configure métodos de entrega
5. Teste o checkout completo
6. Personalize cores e estilos conforme necessário

## Notas Importantes

- O tema foi desenvolvido para funcionar com WooCommerce
- Certifique-se de manter backups antes de fazer alterações
- Teste em ambiente de desenvolvimento antes de aplicar em produção
- Os produtos importados do PrestaShop manterão SKU, preços e descrições originais


