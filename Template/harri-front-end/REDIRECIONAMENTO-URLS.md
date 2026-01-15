# 🔄 Solução de Redirecionamento de URLs Antigas

## ✅ O que foi implementado:

### 1. **Página de Redirecionamento** (`/app/shop/[...slug]/page.js`)
   - Intercepta todas as URLs no formato `/shop/...`
   - Busca o produto correspondente no backend
   - Redireciona automaticamente para `/livros/slug`

### 2. **Endpoint Backend** (`/products/old-url`)
   - Busca produtos pela URL antiga
   - Extrai ISBN da URL antiga
   - Busca pelo SKU ou meta field `_external_url`
   - Retorna o slug do produto para redirecionamento

### 3. **Script de Configuração** (`save-external-urls.php`)
   - Salva as URLs antigas como meta fields nos produtos
   - Facilita a busca posterior

---

## 📋 INSTRUÇÕES PARA ATIVAR:

### **PASSO 1: Salvar URLs Externas nos Produtos**

Você precisa executar o script PHP no WordPress para salvar as URLs antigas:

**Opção A - Via WP-CLI (Recomendado):**
```bash
cd /caminho/do/wordpress
wp eval-file Template/harri-front-end/scripts/save-external-urls.php
```

**Opção B - Via Plugin Temporário:**
1. Copie o conteúdo de `Template/harri-front-end/scripts/save-external-urls.php`
2. Crie um novo plugin no WordPress:
   - Vá em `Plugins > Adicionar Novo > Fazer Upload`
   - Crie um arquivo `save-external-urls-plugin.php` com:
   ```php
   <?php
   /**
    * Plugin Name: Save External URLs
    * Description: Salva URLs externas nos produtos
    * Version: 1.0
    */
   
   // Cole aqui o conteúdo de save-external-urls.php
   ```
3. Ative o plugin
4. Execute a função manualmente ou via WP-CLI

**Opção C - Via Admin do WordPress:**
1. Acesse `Ferramentas > Executar PHP`
2. Cole o conteúdo de `save-external-urls.php`
3. Execute

---

### **PASSO 2: Testar o Redirecionamento**

1. Acesse uma URL antiga no seu site:
   ```
   http://localhost:3000/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410#attr=
   ```

2. Deve redirecionar automaticamente para:
   ```
   http://localhost:3000/livros/ueinzz-territorio-de-transmutacao-poetica-e-politica
   ```

---

## 🔍 Como Funciona:

1. **Usuário acessa URL antiga:** `/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410#attr=`

2. **Next.js intercepta:** A página `/app/shop/[...slug]/page.js` captura a requisição

3. **Busca no backend:** Faz uma requisição para:
   ```
   /wp-json/n1/v1/products/old-url?url=[URL_COMPLETA]
   ```

4. **Backend processa:**
   - Extrai o ISBN da URL (ex: `9786561190732`)
   - Busca produto pelo SKU ou meta field `_external_url`
   - Retorna o `slug` do produto

5. **Redirecionamento:** Next.js redireciona para `/livros/[slug]`

---

## 🐛 Troubleshooting:

### Problema: Redirecionamento não funciona
**Solução:**
1. Verifique se o script `save-external-urls.php` foi executado
2. Verifique se os produtos têm o meta field `_external_url` salvo
3. Verifique os logs do console do navegador

### Problema: Erro 404 no endpoint
**Solução:**
1. Verifique se o plugin `n1-woocommerce-api` está ativo
2. Teste o endpoint diretamente:
   ```
   https://n-1.artnaweb.com.br/wp-json/n1/v1/products/old-url?url=https://loja.n-1edicoes.org/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
   ```

### Problema: Produto não encontrado
**Solução:**
1. Verifique se o SKU do produto corresponde ao ISBN na URL
2. Verifique se o meta field `_external_url` foi salvo corretamente
3. Verifique se o produto está publicado no WooCommerce

---

## 📝 Arquivos Criados/Modificados:

1. ✅ `Template/harri-front-end/src/app/shop/[...slug]/page.js` - Página de redirecionamento
2. ✅ `n1-woocommerce-api/n1-woocommerce-api.php` - Endpoint `get_product_by_old_url` melhorado
3. ✅ `Template/harri-front-end/scripts/save-external-urls.php` - Script para salvar URLs
4. ✅ `Template/harri-front-end/scripts/save-external-urls-to-products.js` - Gerador do script PHP

---

## ✨ Pronto!

Após executar o PASSO 1, o redirecionamento funcionará automaticamente para todas as URLs antigas!


