# ✅ Correções Aplicadas - Configuração Local

## Problemas Identificados

1. ❌ **`.env.local` apontando para domínio errado**
   - Estava: `https://loja.n-1edicoes.org`
   - Correto: `https://n-1.artnaweb.com.br`

2. ❌ **Endpoints faltando prefixo `/api/` no plugin WordPress**
   - O código React usa: `/api/category/show`, `/api/products/show`, `/api/coupon`
   - O plugin só tinha: `/category/show`, `/products/show`, `/coupon`

3. ❌ **CORS não incluía `localhost:3000`**
   - Já estava configurado, mas verificado novamente

4. ❌ **`next.config.js` não tinha hostname para imagens do novo domínio**
   - Faltava: `n-1.artnaweb.com.br`

## Correções Aplicadas

### 1. ✅ Arquivo `.env.local` Atualizado

```env
NEXT_PUBLIC_API_BASE_URL=https://n-1.artnaweb.com.br/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://n-1.artnaweb.com.br
```

### 2. ✅ Plugin WordPress - Endpoints com `/api/` Adicionados

Adicionados endpoints com prefixo `/api/` para compatibilidade:

- ✅ `/api/category/show` → Retorna categorias
- ✅ `/api/coupon` → Retorna cupons
- ✅ `/api/products/show` → Retorna produtos em destaque
- ✅ `/api/products/discount` → Retorna produtos com desconto
- ✅ `/api/products/{id}` → Retorna produto específico
- ✅ `/api/products/relatedProduct` → Retorna produtos relacionados

### 3. ✅ `next.config.js` Atualizado

Adicionado hostname para imagens:
```javascript
{
  protocol: "https",
  hostname: 'n-1.artnaweb.com.br',
  pathname: "**",
}
```

### 4. ✅ CORS Configurado

O plugin já aceita requisições de:
- ✅ `http://localhost:3000`
- ✅ `https://n-1.artnaweb.com.br`
- ✅ `http://n-1.artnaweb.com.br`

## Próximos Passos

### 1. Atualizar Plugin no WordPress

**IMPORTANTE:** Faça upload do arquivo atualizado `n1-woocommerce-api/n1-woocommerce-api.php` para:
```
/wp-content/plugins/n1-woocommerce-api/n1-woocommerce-api.php
```

No WordPress Admin:
- Vá em **Plugins**
- **Desative** o plugin "N-1 WooCommerce API"
- Faça upload do arquivo atualizado
- **Ative** o plugin novamente

### 2. Reiniciar Servidor Next.js

```bash
cd Template/harri-front-end
# Pare o servidor (Ctrl+C)
npm run dev
```

### 3. Verificar Produto no WooCommerce

No WordPress Admin:
- Vá em **Produtos**
- Certifique-se que o produto está:
  - ✅ **Publicado** (status: Publicado)
  - ✅ **Marcado como "Destaque"** (Featured) - para aparecer em `/products/show`
  - ✅ Com **preço** definido
  - ✅ Com **imagem** adicionada

### 4. Testar API Diretamente

Abra no navegador e teste:
```
https://n-1.artnaweb.com.br/wp-json/n1/v1/api/products/show
```

Deve retornar JSON com produtos.

### 5. Verificar no Frontend

1. Acesse `http://localhost:3000`
2. Abra o Console do navegador (F12)
3. Verifique se não há mais erros de CORS ou 404
4. Os produtos devem aparecer na página

## Troubleshooting

### ❌ Ainda aparece erro 404

**Solução:**
1. Verifique se o plugin está **ativado** no WordPress
2. Verifique se fez upload do arquivo **atualizado**
3. Tente acessar a API diretamente no navegador
4. Limpe o cache do WordPress (se usar plugin de cache)

### ❌ Erro de CORS ainda aparece

**Solução:**
1. Verifique se o plugin está ativado
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Reinicie o servidor Next.js

### ❌ Produto não aparece

**Solução:**
1. Verifique se o produto está **publicado** e **em destaque**
2. Teste a API diretamente: `https://n-1.artnaweb.com.br/wp-json/n1/v1/api/products/show`
3. Verifique o console do navegador para erros
4. Verifique se há produtos no WooCommerce

## Estrutura Final

```
Frontend Next.js (localhost:3000)
    ↓
.env.local → https://n-1.artnaweb.com.br/wp-json/n1/v1
    ↓
WordPress/WooCommerce (n-1.artnaweb.com.br)
    ↓
Plugin N-1 WooCommerce API
    ↓
Endpoints: /api/products/show, /api/category/show, /api/coupon
```



