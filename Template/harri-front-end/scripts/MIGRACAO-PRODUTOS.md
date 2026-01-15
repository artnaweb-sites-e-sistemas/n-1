# Migração de Produtos - N-1 Edições

Este guia explica como migrar os produtos da loja antiga (**PrestaShop**) para o **WooCommerce**.

## Opção 1: Exportar diretamente do PrestaShop (RECOMENDADO)

Se você tem acesso ao painel administrativo do PrestaShop:

### Passo 1: Acessar o Admin do PrestaShop

1. Acesse `https://loja.n-1edicoes.org/admin` (ou similar)
2. Faça login com suas credenciais de administrador

### Passo 2: Exportar Produtos

1. Vá em **Catálogo → Produtos**
2. Clique no ícone de **Exportar** (ou vá em **Parâmetros Avançados → Importar**)
3. Selecione **Exportar produtos**
4. Escolha os campos:
   - ID
   - Nome
   - Descrição
   - Preço
   - Quantidade
   - Imagens
   - Categoria
   - SKU/Referência
5. Clique em **Exportar**

### Passo 3: Exportar Imagens

As imagens ficam em: `img/p/` (estrutura de pastas por ID)

Exemplo:
- Produto ID 123 → `img/p/1/2/3/123.jpg`
- Produto ID 1234 → `img/p/1/2/3/4/1234.jpg`

## Opção 2: Migração via Banco de Dados (Se tiver acesso ao MySQL)

Se você tem acesso ao banco de dados do PrestaShop:

### Pré-requisitos

```bash
cd Template/harri-front-end/scripts
npm install mysql2 csv-writer dotenv
```

### Configurar credenciais

Edite o arquivo `prestashop-to-woocommerce.js` e atualize:

```javascript
const DB_CONFIG = {
    host: 'seu_host',
    user: 'seu_usuario',
    password: 'sua_senha',
    database: 'nome_do_banco_prestashop',
};
```

### Executar

```bash
node prestashop-to-woocommerce.js
```

## Opção 3: Web Scraping Automático (MAIS FÁCIL)

Se você **não tem acesso ao banco de dados**, use o scraping:

### Pré-requisitos

```bash
cd Template/harri-front-end/scripts
npm install puppeteer csv-writer
```

### Executar (Recomendado)

```bash
node download-products-images.js
```

Este script irá:
- ✅ Navegar por todas as páginas da loja
- ✅ Extrair nome, preço, descrição e imagens
- ✅ Baixar todas as imagens automaticamente
- ✅ Gerar CSV compatível com WooCommerce

### Arquivos Gerados

- `n1-woocommerce-products.csv` - Dados dos produtos
- `n1-products-images/` - Pasta com todas as imagens baixadas

## Importar no WooCommerce

### 1. Upload das Imagens

1. Acesse o WordPress via FTP ou painel de hospedagem
2. Faça upload das imagens de `product-images/` para `wp-content/uploads/2025/01/`
3. Atualize o CSV com as URLs corretas:
   - De: `produto-0-0.jpg`
   - Para: `https://n-1.artnaweb.com.br/wp-content/uploads/2025/01/produto-0-0.jpg`

### 2. Importar CSV no WooCommerce

1. No WordPress, vá em **Produtos → Importar**
2. Clique em **Escolher arquivo** e selecione `woocommerce-products.csv`
3. Clique em **Continuar**
4. Mapeie os campos:
   - `SKU` → SKU
   - `Name` → Nome
   - `Description` → Descrição
   - `Regular price` → Preço normal
   - `Images` → Imagens
   - etc.
5. Clique em **Executar importador**

### 3. Verificar Produtos

1. Vá em **Produtos → Todos os produtos**
2. Verifique se os dados estão corretos
3. Ajuste manualmente se necessário

## Formato do CSV WooCommerce

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| SKU | Código único (ISBN) | 9786561190732 |
| Name | Nome do produto | UEINZZ: TERRITÓRIO DE TRANSMUTAÇÃO |
| Published | 1 = publicado | 1 |
| Visibility in catalog | visible, hidden | visible |
| Short description | Descrição curta | Texto breve... |
| Description | Descrição completa | Texto completo... |
| Regular price | Preço | 95.00 |
| Sale price | Preço promocional | 85.00 |
| Categories | Categorias | Livros > Filosofia |
| Tags | Tags | n-1, filosofia |
| Images | URLs das imagens | https://...img1.jpg, https://...img2.jpg |
| Type | simple, variable | simple |

## Dicas

1. **Imagens**: O WooCommerce aceita múltiplas imagens separadas por vírgula
2. **Categorias**: Use `>` para subcategorias (ex: `Livros > Filosofia > Contemporânea`)
3. **Variações**: Para produtos com variações (tamanho, cor), use `Type: variable`
4. **Stock**: Configure `In stock?: 1` e `Stock: 100` para produtos disponíveis

## Problemas Comuns

### "Imagens não aparecem"
- Verifique se as URLs estão acessíveis publicamente
- Verifique permissões da pasta uploads

### "Preços com vírgula"
- Use ponto como separador decimal (95.00, não 95,00)

### "Caracteres especiais"
- Salve o CSV como UTF-8

### "Muitos produtos"
- Divida em lotes de 100-200 produtos
- Use o importador em background

## Suporte

Se precisar de ajuda adicional, entre em contato ou abra uma issue.

