# 📋 Passo a Passo - Configurar Meta Fields no WordPress

## ✅ O que já foi feito:
- ✅ CSV criado e importado no WooCommerce
- ✅ Mídias baixadas e você já fez upload no WordPress
- ✅ Produto importado com sucesso

## 🎯 O que você precisa fazer AGORA:

### Passo 1: Encontrar o Produto no WordPress

1. Acesse o **WordPress Admin** (painel administrativo)
2. Vá em **Produtos** → **Todos os Produtos**
3. Procure pelo produto: **"Nas brechas de futuros cancelados"** (SKU: 9786561190763)
4. Clique em **Editar**

---

### Passo 2: Adicionar os Meta Fields

Você precisa adicionar 3 campos personalizados no produto. Existem 2 formas:

#### **Opção A: Usando a tela de edição do produto (mais fácil)**

1. Na página de edição do produto, role até a seção **"Campos Personalizados"** (Custom Fields)
2. Se não aparecer, clique em **"Opções da Tela"** (Screen Options) no topo e marque **"Campos Personalizados"**

3. Adicione os seguintes campos:

**Campo 1:**
- **Nome:** `n1_catalog_content`
- **Valor:** Copie TODO o conteúdo do arquivo `product_meta_fields.json`, campo `catalog_content` (é um HTML grande)

**Campo 2:**
- **Nome:** `n1_catalog_images`  
- **Valor:** Cole exatamente isso (uma URL por linha ou separadas por vírgula):
```
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_9786561190763_1.png
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_2.png
https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_3.png
```

**Campo 3:**
- **Nome:** `n1_catalog_pdf`
- **Valor:** Cole exatamente isso:
```
https://e.issuu.com/embed.html?u=n-1publications&d=nas_brechas_de_futuros_cancelados_-_renan_porto
```

4. Clique em **"Adicionar Campo Personalizado"** para cada um
5. Clique em **"Atualizar"** para salvar o produto

---

#### **Opção B: Usando um plugin (recomendado se a Opção A não funcionar)**

Se não conseguir adicionar via Campos Personalizados, instale o plugin **"Advanced Custom Fields"** ou **"Custom Fields Suite"** e crie os campos lá.

---

### Passo 3: Verificar se Funcionou

1. Acesse a página do produto no site (front-end)
2. Você deve ver:
   - ✅ Todo o texto descritivo do livro
   - ✅ As imagens internas do livro (3 imagens)
   - ✅ O visualizador Issuu embutido (onde você pode folhear o livro)

---

## ⚠️ IMPORTANTE:

- O campo `n1_catalog_content` é MUITO grande (tem todo o HTML). Certifique-se de copiar tudo!
- Se as imagens não aparecerem, verifique se as URLs estão corretas e acessíveis
- Limpe o cache do WordPress após salvar

---

## 📁 Arquivos que você vai usar:

- `product_meta_fields.json` - Contém todos os valores que você precisa copiar
- `woocommerce_product_import.csv` - Já foi importado ✅


