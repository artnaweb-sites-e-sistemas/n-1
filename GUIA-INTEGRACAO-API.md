# 🔌 Guia de Integração - Template React + WooCommerce API

## Visão Geral

Este guia explica como integrar o template React/Next.js original com WooCommerce via API REST, **sem modificar o template**.

## Arquitetura

```
┌─────────────────────┐
│  WordPress          │
│  + WooCommerce      │
│  + Plugin API       │
└──────────┬──────────┘
           │
           │ API REST
           │ /wp-json/n1/v1/
           │
┌──────────▼──────────┐
│  Template Next.js   │
│  (React)            │
│  Consome API        │
└─────────────────────┘
```

## Passo 1: Instalar Plugin WordPress

### 1.1. Upload do Plugin

1. Copie a pasta `n1-woocommerce-api` para:
   ```
   /wp-content/plugins/n1-woocommerce-api/
   ```

2. No WordPress Admin:
   - Vá em **Plugins**
   - Ative **"N-1 WooCommerce API"**

### 1.2. Verificar Instalação

Acesse no navegador:
```
https://loja.n-1edicoes.org/wp-json/n1/v1/products
```

**Deve retornar JSON com produtos!**

## Passo 2: Configurar Template Next.js

### 2.1. Criar Arquivo .env.local

Na pasta `Template/harri-front-end/`, crie `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
```

**Importante:** 
- Use `https://` se seu site usa SSL
- Use `http://localhost` para desenvolvimento local

### 2.2. Verificar Configuração

O arquivo `src/redux/api/apiSlice.js` já está configurado para usar:
```javascript
baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL
```

## Passo 3: Endpoints da API

### Produtos

#### Listar Todos
```
GET /wp-json/n1/v1/products
```

**Parâmetros:**
- `per_page` - Itens por página (padrão: 12)
- `page` - Página (padrão: 1)
- `category` - Slug da categoria
- `orderby` - Ordenar por (date, price, title)
- `order` - ASC ou DESC

**Exemplo:**
```
GET /wp-json/n1/v1/products?per_page=12&page=1&category=livros
```

#### Produto Individual
```
GET /wp-json/n1/v1/products/{id}
```

**Exemplo:**
```
GET /wp-json/n1/v1/products/123
```

#### Produtos em Destaque
```
GET /wp-json/n1/v1/products/show
```

#### Produtos com Desconto
```
GET /wp-json/n1/v1/products/discount
```

#### Produtos Relacionados
```
GET /wp-json/n1/v1/products/relatedProduct?tags=tag1,tag2
```

#### Buscar Produtos
```
GET /wp-json/n1/v1/products/search?q=termo
```

### Categorias

```
GET /wp-json/n1/v1/categories
```

## Passo 4: Estrutura de Resposta

### Produto

```json
{
  "_id": "123",
  "id": 123,
  "title": "Nome do Produto",
  "description": "Descrição completa",
  "shortDescription": "Descrição curta",
  "image": "https://loja.n-1edicoes.org/wp-content/uploads/...",
  "images": ["url1", "url2"],
  "price": 95.00,
  "originalPrice": 100.00,
  "discount": 5,
  "sku": "SKU123",
  "stock": 10,
  "inStock": true,
  "tags": ["tag1", "tag2"],
  "categories": ["categoria1"],
  "itemInfo": "top-rated",
  "rating": {
    "average": 4.5,
    "count": 10
  },
  "permalink": "https://loja.n-1edicoes.org/produto/..."
}
```

### Lista de Produtos

```json
{
  "products": [...],
  "total": 50,
  "pages": 5,
  "current_page": 1
}
```

## Passo 5: Testar Integração

### 5.1. Testar API no Navegador

1. Acesse: `https://loja.n-1edicoes.org/wp-json/n1/v1/products`
2. Deve retornar JSON com produtos

### 5.2. Testar no Template

```bash
cd Template/harri-front-end
npm install
npm run dev
```

Acesse: `http://localhost:3000`

Os produtos devem aparecer automaticamente!

## Passo 6: Deploy

### 6.1. Build do Next.js

```bash
cd Template/harri-front-end
npm run build
```

### 6.2. Deploy Options

**Opção A: Vercel (Recomendado)**
```bash
npm install -g vercel
vercel
```

**Opção B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Opção C: Servidor Próprio**
- Copie pasta `.next` para servidor
- Configure servidor Node.js
- Use PM2 para gerenciar processo

### 6.3. Configurar Variáveis de Ambiente

No painel de deploy (Vercel/Netlify), configure:
```
NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
```

## Passo 7: Fluxo de Trabalho

### Adicionar Novo Produto

1. **No WordPress Admin:**
   - Vá em **Produtos > Adicionar Novo**
   - Preencha: Nome, Descrição, Preço, Imagem
   - Publique

2. **No Template:**
   - Produto aparece automaticamente!
   - API já retorna o novo produto
   - Sem necessidade de rebuild

### Atualizar Produto

1. Edite produto no WordPress
2. Salve
3. Template atualiza automaticamente (se usar cache, pode precisar limpar)

## Troubleshooting

### ❌ API retorna 404

**Solução:**
1. Verifique se plugin está ativado
2. Verifique URL: `/wp-json/n1/v1/products`
3. Verifique se WooCommerce está ativo

### ❌ CORS Error

**Solução:**
O plugin já configura CORS. Se ainda houver erro:
1. Verifique se plugin está ativado
2. Adicione no `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
```

### ❌ Produtos não aparecem

**Solução:**
1. Verifique `.env.local` está correto
2. Verifique console do navegador (F12)
3. Teste API diretamente no navegador
4. Verifique se há produtos publicados no WooCommerce

### ❌ Imagens não carregam

**Solução:**
1. Verifique `next.config.js` tem o hostname correto
2. Verifique se imagens existem no WordPress
3. Verifique permissões de uploads

## Estrutura de Arquivos

```
n1-woocommerce-api/
└── n1-woocommerce-api.php    # Plugin WordPress

Template/harri-front-end/
├── .env.local                 # Configuração API (criar)
├── next.config.js            # Config Next.js (atualizado)
└── src/
    └── redux/
        └── api/
            └── apiSlice.js   # Já configurado!
```

## Vantagens desta Abordagem

✅ **Template original intacto** - Sem modificações
✅ **Atualização automática** - Produtos aparecem sem rebuild
✅ **Separação de responsabilidades** - WordPress gerencia dados, React gerencia UI
✅ **Fácil manutenção** - Cada parte independente
✅ **Escalável** - Pode adicionar mais endpoints facilmente

## Próximos Passos

1. ✅ Instalar plugin WordPress
2. ✅ Configurar `.env.local`
3. ✅ Testar localmente
4. ✅ Fazer deploy do template
5. ✅ Adicionar produtos no WooCommerce
6. ✅ Verificar integração funcionando



