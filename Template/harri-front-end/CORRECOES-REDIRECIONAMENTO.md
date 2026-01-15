# 🔧 Correções Aplicadas no Redirecionamento

## ✅ O que foi corrigido:

### 1. **Frontend (`/app/shop/[...slug]/page.js`)**
   - ✅ Agora usa a URL original do site antigo (`https://loja.n-1edicoes.org`) ao invés de `localhost:3000`
   - ✅ Extrai apenas o path da URL (sem query params e hash)
   - ✅ Adiciona logs detalhados para debug
   - ✅ Busca alternativa por ISBN se o endpoint falhar

### 2. **Backend (`get_product_by_old_url`)**
   - ✅ Melhorada a busca para comparar paths normalizados
   - ✅ Busca primeiro pelo ISBN no SKU (mais confiável)
   - ✅ Compara paths ignorando domínios diferentes
   - ✅ Adicionado endpoint alternativo `/api/products/old-url`

---

## 🧪 Como Testar:

1. **Acesse uma URL antiga:**
   ```
   http://localhost:3000/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410#attr=
   ```

2. **Abra o Console do navegador (F12)** e verifique os logs:
   - `[REDIRECT] Buscando produto para URL: ...`
   - `[REDIRECT] Path extraído: ...`
   - `[REDIRECT] ISBN extraído: ...`
   - `[REDIRECT] Tentando endpoint: ...`
   - `[REDIRECT] Resposta do endpoint: ...`

3. **Se o endpoint retornar 404:**
   - O sistema tentará buscar todos os produtos e encontrar pelo ISBN no SKU
   - Verifique se o produto tem o ISBN no SKU no WooCommerce

---

## 🔍 Debug:

### Se ainda não funcionar:

1. **Verifique se o endpoint está acessível:**
   ```
   https://n-1.artnaweb.com.br/wp-json/n1/v1/products/old-url?url=https://loja.n-1edicoes.org/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
   ```

2. **Verifique se o produto tem o ISBN no SKU:**
   - Acesse o produto no WooCommerce
   - Veja se o SKU contém o ISBN `9786561190732`

3. **Execute o script para salvar URLs externas:**
   ```bash
   wp eval-file Template/harri-front-end/scripts/save-external-urls.php
   ```

---

## 📝 Próximos Passos:

Se o redirecionamento ainda não funcionar após essas correções:

1. Execute o script `save-external-urls.php` no WordPress
2. Verifique os logs no console do navegador
3. Teste o endpoint diretamente no navegador
4. Verifique se o produto tem o ISBN correto no SKU

