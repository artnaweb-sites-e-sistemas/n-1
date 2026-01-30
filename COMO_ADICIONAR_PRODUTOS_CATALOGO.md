# 📚 Como Adicionar Produtos ao Catálogo Local

## ✅ Sistema Híbrido Implementado

Agora você tem um sistema híbrido:
- **Produtos do catálogo de referência** → Arquivo JSON local (`front-end/src/data/catalog-products.json`)
- **Produtos novos** → WooCommerce (via API)

## 🎯 Como Adicionar um Novo Produto ao Catálogo

### Passo 1: Editar o arquivo JSON

Abra o arquivo: `front-end/src/data/catalog-products.json`

### Passo 2: Adicionar um novo objeto ao array

Cada produto precisa ter esta estrutura:

```json
{
  "_id": "catalog-slug-do-produto",
  "id": "catalog-slug-do-produto",
  "title": "Título do Livro",
  "description": "Descrição completa do livro...",
  "shortDescription": "Descrição curta...",
  "image": "URL da capa",
  "images": [
    "URL da capa",
    "URL imagem interna 1",
    "URL imagem interna 2"
  ],
  "price": 79.90,
  "originalPrice": 79.90,
  "discount": 0,
  "sku": "ISBN ou SKU",
  "stock": null,
  "inStock": true,
  "tags": ["Autor"],
  "categories": ["Livros"],
  "itemInfo": "latest-product",
  "rating": {
    "average": 0,
    "count": 0
  },
  "permalink": "/livros/slug-do-produto",
  "slug": "slug-do-produto",
  "catalogContent": "<div>HTML completo do conteúdo editorial...</div>",
  "catalogImages": [
    "URL imagem interna 1",
    "URL imagem interna 2"
  ],
  "catalogPdf": "URL do Issuu ou PDF",
  "source": "catalog"
}
```

### Passo 3: Campos Importantes

- **`_id` e `id`**: Use o mesmo valor, formato `catalog-slug-do-produto`
- **`slug`**: URL amigável (ex: `nas-brechas-de-futuros-cancelados`)
- **`catalogContent`**: HTML completo com todo o conteúdo editorial (texto + imagens embutidas)
- **`catalogImages`**: Array com URLs das imagens internas
- **`catalogPdf`**: URL do Issuu (formato: `https://e.issuu.com/embed.html?u=...`) ou PDF direto
- **`source`**: Sempre `"catalog"` para produtos locais

### Passo 4: Salvar e Testar

1. Salve o arquivo JSON
2. O Next.js vai recarregar automaticamente
3. Acesse `/livros/slug-do-produto` para ver o produto

## 📝 Exemplo Completo

Veja o produto "Nas brechas de futuros cancelados" no arquivo como referência.

## ⚠️ Importante

- **Não precisa subir no WooCommerce** - esses produtos são gerenciados localmente
- **Produtos do catálogo aparecem primeiro** na home (antes dos do WooCommerce)
- **URLs das imagens** devem ser absolutas e acessíveis
- **HTML do catalogContent** já deve ter as imagens embutidas com as URLs corretas

## 🔄 Para Migrar Produtos do Catálogo

1. Use o script `extract_product_v2.py` para extrair dados do site de referência
2. Copie o `catalog_content` do `product_meta_fields.json`
3. Adicione ao `catalog-products.json` seguindo a estrutura acima


