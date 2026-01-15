# 📦 Build para WordPress - Guia de Deploy

## 📍 Localização dos Arquivos

O build está localizado em: **`build-wordpress/`**

### Estrutura do Build:

```
build-wordpress/
├── n1-woocommerce-api.zip    ← Plugin WordPress (ZIP para upload)
├── plugin/                   ← Pasta do plugin (alternativa ao ZIP)
│   └── n1-woocommerce-api.php
└── front-end/                ← Build do Next.js
    ├── .next/                ← Build compilado (SSR)
    ├── public/               ← Assets estáticos
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    └── .env.local            ← Variáveis de ambiente
```

---

## 🚀 Como Fazer Upload no WordPress

### 1️⃣ Plugin WordPress

**Opção A: Upload via ZIP (Recomendado)**
1. Acesse o WordPress Admin: `https://seu-dominio.com/wp-admin`
2. Vá em **Plugins > Adicionar novo**
3. Clique em **Enviar plugin**
4. Selecione o arquivo: `build-wordpress/n1-woocommerce-api.zip`
5. Clique em **Instalar agora**
6. Ative o plugin **N-1 WooCommerce API**

**Opção B: Upload via FTP/SSH**
1. Extraia o ZIP ou copie a pasta `build-wordpress/plugin/`
2. Faça upload para: `wp-content/plugins/n1-woocommerce-api/`
3. Ative o plugin no WordPress Admin

**Arquivo do plugin:**
- 📦 **ZIP:** `build-wordpress/n1-woocommerce-api.zip`
- 📁 **Pasta:** `build-wordpress/plugin/`

---

### 2️⃣ Front-end Next.js

O front-end **NÃO vai no WordPress**. Ele roda em um servidor Node.js separado.

**Onde subir o front-end:**

#### Opção A: Servidor Node.js (Recomendado - SSR)

1. **Fazer upload da pasta `build-wordpress/front-end/` para o servidor**

2. **No servidor, executar:**
   ```bash
   cd /caminho/para/front-end
   npm ci --omit=dev
   ```

3. **Configurar `.env.local` no servidor:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/wp-json/n1/v1
   NEXT_PUBLIC_WORDPRESS_URL=https://seu-dominio.com
   NEXT_PUBLIC_STRIPE_KEY=pk_live_...
   ```

4. **Iniciar o servidor:**
   ```bash
   npm run start
   ```
   Ou com PM2:
   ```bash
   pm2 start npm --name "n1-frontend" -- start
   ```

5. **Configurar proxy reverso (Nginx/Apache)** para apontar para `localhost:3000`

#### Opção B: Export Estático (Não recomendado - limitações)

Se você quiser fazer upload direto no servidor web (sem Node.js):

1. **Modificar `next.config.js`** para adicionar:
   ```javascript
   output: 'export',
   images: { unoptimized: true }
   ```

2. **Fazer build novamente:**
   ```bash
   cd front-end
   npm run build
   ```

3. **Fazer upload da pasta `front-end/out/`** para `public_html/` do servidor

⚠️ **Atenção:** Export estático tem limitações (sem SSR, sem rotas dinâmicas complexas)

---

## 🔄 Como Gerar Build Atualizado

Se você fez alterações e precisa gerar um novo build:

### Windows (PowerShell):
```powershell
.\build-wordpress.ps1
```

### Manualmente:

1. **Build do front-end:**
   ```bash
   cd front-end
   npm run build
   ```

2. **Copiar arquivos para build-wordpress:**
   - Copiar `.next/` → `build-wordpress/front-end/.next/`
   - Copiar `public/` → `build-wordpress/front-end/public/`
   - Copiar `package.json`, `package-lock.json`, `next.config.js`
   - Copiar `.env.local` (ou criar novo)

3. **Gerar ZIP do plugin:**
   ```powershell
   Compress-Archive -Path "build-wordpress\plugin\*" -DestinationPath "build-wordpress\n1-woocommerce-api.zip" -Force
   ```

---

## ✅ Checklist de Deploy

### Plugin WordPress:
- [ ] Upload do `n1-woocommerce-api.zip` no WordPress
- [ ] Plugin ativado
- [ ] API testada: `https://seu-dominio.com/wp-json/n1/v1/products`
- [ ] Permalinks configurados (Configurações > Links Permanentes)

### Front-end Next.js:
- [ ] Upload da pasta `build-wordpress/front-end/` para servidor Node.js
- [ ] `.env.local` configurado no servidor
- [ ] `npm ci --omit=dev` executado
- [ ] Servidor iniciado (`npm start` ou PM2)
- [ ] Proxy reverso configurado (Nginx/Apache)
- [ ] Site acessível e funcionando

### Verificações:
- [ ] Páginas principais carregando
- [ ] Produtos aparecendo
- [ ] Carrinho funcionando
- [ ] Checkout funcionando
- [ ] Pagamentos funcionando (Stripe)

---

## 📝 Notas Importantes

1. **O front-end NÃO vai dentro do WordPress** - ele roda separadamente em Node.js
2. **O plugin WordPress** apenas fornece a API REST
3. **Variáveis de ambiente** devem ser configuradas no servidor Node.js
4. **Chave Stripe** deve ser movida para variável de ambiente (ver BUILD-FIX-REPORT.md)

---

## 🆘 Problemas Comuns

### API não responde:
- Verificar se plugin está ativado
- Verificar permissões do WordPress
- Verificar CORS no plugin

### Front-end não carrega:
- Verificar se Node.js está rodando
- Verificar `.env.local` configurado
- Verificar proxy reverso apontando para porta 3000

### Erro de build:
- Ver BUILD-FIX-REPORT.md para correções
- Verificar se todas as dependências estão instaladas

---

## 📞 Suporte

Para mais detalhes, consulte:
- `GUIA-DEPLOY-WORDPRESS.md` - Guia geral
- `front-end/BUILD-FIX-REPORT.md` - Relatório de correções

