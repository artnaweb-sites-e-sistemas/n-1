# 🌐 Configuração de Domínios - Desenvolvimento e Produção

## Situação Atual

- **Frontend Next.js (Desenvolvimento)**: `https://n-1.artnaweb.com.br/`
- **Backend WordPress/WooCommerce (Produção)**: `https://loja.n-1edicoes.org/`

## O que foi configurado

### 1. Plugin WordPress - CORS

O plugin `n1-woocommerce-api` foi atualizado para aceitar requisições de múltiplos domínios:

- ✅ `https://n-1.artnaweb.com.br` (subdomínio temporário)
- ✅ `http://n-1.artnaweb.com.br` (HTTP para testes)
- ✅ `https://loja.n-1edicoes.org` (produção)
- ✅ `http://localhost:3000` (desenvolvimento local)
- ✅ `http://localhost:3001` (desenvolvimento local alternativo)

### 2. Arquivo `.env.local` (Frontend)

O arquivo está configurado para apontar para o WordPress em produção:

```env
NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
```

## Como funciona

```
┌─────────────────────────────────────┐
│  Frontend Next.js                   │
│  https://n-1.artnaweb.com.br/       │
└──────────────┬──────────────────────┘
               │
               │ Requisições API
               │ (CORS permitido)
               │
┌──────────────▼──────────────────────┐
│  Backend WordPress/WooCommerce      │
│  https://loja.n-1edicoes.org/       │
│  /wp-json/n1/v1/                    │
└─────────────────────────────────────┘
```

## Passos para Atualizar

### 1. Atualizar Plugin no WordPress

Faça upload do arquivo atualizado `n1-woocommerce-api/n1-woocommerce-api.php` para:
```
/wp-content/plugins/n1-woocommerce-api/n1-woocommerce-api.php
```

Ou edite diretamente no servidor WordPress.

### 2. Verificar Plugin Ativado

No WordPress Admin:
- Vá em **Plugins**
- Certifique-se que **"N-1 WooCommerce API"** está ativado

### 3. Testar CORS

Abra o console do navegador (F12) em `https://n-1.artnaweb.com.br/` e verifique se não há mais erros de CORS.

### 4. Testar API Diretamente

Acesse no navegador:
```
https://loja.n-1edicoes.org/wp-json/n1/v1/products/show
```

Deve retornar JSON com produtos.

## Quando Migrar para Produção

Quando for migrar o frontend para `https://loja.n-1edicoes.org/`:

1. **Atualizar `.env.local`** (ou variáveis de ambiente no servidor):
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
   NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
   ```

2. **Rebuild do Next.js**:
   ```bash
   npm run build
   ```

3. **Deploy** para o servidor de produção

4. **CORS já está configurado** - não precisa alterar nada no plugin WordPress!

## Troubleshooting

### ❌ Erro de CORS ainda aparece

**Solução:**
1. Verifique se o plugin está ativado no WordPress
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique se a URL no `.env.local` está correta
4. Reinicie o servidor Next.js

### ❌ Produtos não aparecem

**Solução:**
1. Verifique se há produtos **publicados** no WooCommerce
2. Para aparecer em `/products/show`, marque o produto como **"Destaque"** (Featured)
3. Teste a API diretamente no navegador
4. Verifique o console do navegador para erros

### ❌ Imagens não carregam

**Solução:**
1. Verifique `next.config.js` - o hostname `loja.n-1edicoes.org` já está configurado
2. Verifique se as imagens existem no WordPress
3. Verifique permissões de uploads no WordPress

## Notas Importantes

- ⚠️ O CORS está configurado para aceitar ambos os domínios (desenvolvimento e produção)
- ✅ Não é necessário alterar nada quando migrar para produção
- ✅ O plugin WordPress funciona tanto para desenvolvimento quanto produção
- 🔒 Em produção, considere restringir o CORS apenas aos domínios necessários



