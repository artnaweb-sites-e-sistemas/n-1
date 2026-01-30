# Instruções para Configurar Meta Fields no WordPress

Após importar o produto via CSV, você precisa configurar os meta fields manualmente no WordPress para que o conteúdo editorial apareça corretamente.

## Passo a Passo

### 1. Acessar o Produto no WordPress

1. Vá para **Produtos** → **Todos os Produtos** no painel do WordPress
2. Encontre o produto "Nas brechas de futuros cancelados" (SKU: 9786561190763)
3. Clique em **Editar**

### 2. Configurar Meta Fields

Você pode usar um plugin como **Advanced Custom Fields (ACF)** ou configurar manualmente via código/funções.

#### Opção A: Usando Advanced Custom Fields (ACF) - Recomendado

1. Instale o plugin **Advanced Custom Fields** se ainda não tiver
2. Crie os seguintes campos:
   - **catalog_content** (Tipo: Textarea/WYSIWYG)
   - **catalog_images** (Tipo: Repeater ou Textarea com URLs separadas por vírgula)
   - **catalog_pdf** (Tipo: URL ou Text)

3. Preencha os campos com os valores do arquivo `product_meta_fields.json`

#### Opção B: Usando Meta Fields Diretos (via código ou plugin)

Use um plugin como **Custom Fields Suite** ou adicione manualmente via código.

Os meta fields que precisam ser configurados são:

- **n1_catalog_content** - Conteúdo HTML completo
- **n1_catalog_images** - Array de URLs das imagens (ou string JSON)
- **n1_catalog_pdf** - URL do Issuu ou PDF

### 3. Valores dos Meta Fields

Abra o arquivo `product_meta_fields.json` e copie os valores:

#### n1_catalog_content
Cole todo o conteúdo do campo `catalog_content` (é um HTML grande)

#### n1_catalog_images  
Se usar array, configure como:
```
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_9786561190763_1.png
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_2.png
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_3.png
```

Ou se o plugin aceitar JSON:
```json
["https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_9786561190763_1.png", "https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_2.png", "https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_3.png"]
```

#### n1_catalog_pdf
```
https://e.issuu.com/embed.html?u=n-1publications&d=nas_brechas_de_futuros_cancelados_-_renan_porto
```

### 4. Verificar se Funcionou

Após salvar, acesse a página do produto no front-end. Você deve ver:
- ✅ Todo o conteúdo editorial com as imagens internas
- ✅ O visualizador Issuu embutido

## Nota Importante

O HTML do `catalog_content` já contém todas as imagens embutidas com as URLs corretas. Se as imagens não aparecerem, pode ser necessário:

1. Verificar se as URLs das imagens estão acessíveis
2. Verificar se há conflitos de CSS que estão escondendo as imagens
3. Limpar o cache do WordPress e do navegador


