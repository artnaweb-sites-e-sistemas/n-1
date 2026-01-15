# ⚡ Setup Rápido - Integração API

## Passo a Passo Simplificado

### 1️⃣ Instalar Plugin WordPress (2 minutos)

1. Copie a pasta `n1-woocommerce-api` para:
   ```
   /wp-content/plugins/n1-woocommerce-api/
   ```

2. No WordPress Admin:
   - **Plugins > Plugins Instalados**
   - Ative **"N-1 WooCommerce API"**

3. Teste a API:
   - Acesse: `https://loja.n-1edicoes.org/wp-json/n1/v1/products`
   - Deve aparecer JSON com produtos

### 2️⃣ Configurar Template Next.js (3 minutos)

1. Vá para a pasta do template:
   ```bash
   cd Template/harri-front-end
   ```

2. Crie arquivo `.env.local`:
   ```bash
   # Windows
   copy ..\..\env.local.example .env.local
   
   # Linux/Mac
   cp ../../env.local.example .env.local
   ```

3. Edite `.env.local` e coloque sua URL WordPress:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
   NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
   ```

4. Instale dependências (se ainda não fez):
   ```bash
   npm install
   ```

5. Rode o template:
   ```bash
   npm run dev
   ```

6. Acesse: `http://localhost:3000`
   - ✅ Produtos devem aparecer!

### 3️⃣ Testar Integração

1. **Adicione um produto no WooCommerce:**
   - WordPress Admin > Produtos > Adicionar Novo
   - Preencha nome, preço, imagem
   - Publique

2. **No template:**
   - Recarregue a página
   - ✅ Produto aparece automaticamente!

## ✅ Pronto!

Agora você tem:
- ✅ Template React original intacto
- ✅ Integração com WooCommerce via API
- ✅ Produtos atualizam automaticamente

## 🚀 Deploy

Quando estiver pronto para produção:

```bash
cd Template/harri-front-end
npm run build
```

Depois faça deploy em:
- **Vercel** (recomendado): `vercel`
- **Netlify**: `netlify deploy --prod`
- Ou seu servidor Node.js

**Importante:** Configure as variáveis de ambiente no painel de deploy!

## 📚 Documentação Completa

Veja `GUIA-INTEGRACAO-API.md` para detalhes completos.

## ❓ Problemas?

### API não funciona
- Verifique se plugin está ativado
- Verifique se WooCommerce está ativo
- Teste URL: `/wp-json/n1/v1/products`

### Template não mostra produtos
- Verifique `.env.local` está correto
- Verifique console do navegador (F12)
- Verifique se há produtos no WooCommerce

### Imagens não carregam
- Verifique `next.config.js` tem o hostname correto
- Verifique se imagens existem no WordPress



