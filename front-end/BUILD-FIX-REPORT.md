# Relatório de Correção de Build e Preparação para Deploy

**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Projeto:** Frontend Next.js 15.0.4 (App Router)  
**Status:** ✅ Build corrigido e pronto para deploy

---

## PASSO 1: Verificação de Ambiente e Erro Original

### Versões do Ambiente
- **Node.js:** v20.11.0
- **npm:** 10.2.4
- **Next.js:** 15.0.4
- **React:** 19.0.0

### Build Error Original (Log Completo)

```
⨯ ESLint: Error while loading rule '@next/next/no-html-link-for-pages': The "path" argument must be of type string. Received undefined Occurred while linting C:\Users\biras\Desktop\Repositorio Editora N-1\front-end\src\app\about\page.js

⨯ useSearchParams() should be wrapped in a suspense boundary at page "/payment/boleto". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
Error occurred prerendering page "/payment/boleto". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /payment/boleto/page: /payment/boleto, exiting the build.
⨯ Static worker exited with code: 1 and signal: null
```

**Primeiro arquivo/linha citado:** `front-end/src/app/about/page.js` (regra ESLint)  
**Erro crítico:** `front-end/src/app/payment/boleto/page.js` (useSearchParams sem Suspense)

---

## PASSO 2: Correções Aplicadas

### A) Padronização de Variáveis de Ambiente

**Problema identificado:**
- Código usava `NEXT_PUBLIC_API_URL` em alguns arquivos
- Código usava `NEXT_PUBLIC_API_BASE_URL` em outros
- Fallback hardcoded mascarava erros de configuração

**Arquivos corrigidos:**

1. **front-end/src/app/shop/[...slug]/page.js**
   - **Antes:** `process.env.NEXT_PUBLIC_API_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1'`
   - **Depois:** `API_BASE_URL` (importado de `@lib/env`)
   - **Linhas:** 36, 65

2. **front-end/src/app/livros/[slug]/page.js**
   - **Antes:** `process.env.NEXT_PUBLIC_API_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1'`
   - **Depois:** `API_BASE_URL` (importado de `@lib/env`)
   - **Linha:** 25

3. **front-end/src/redux/api/apiSlice.js**
   - **Antes:** `baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL`
   - **Depois:** `baseUrl: API_BASE_URL` (importado de `@lib/env`)
   - **Linha:** 6

### B) Criação do Helper env.js

**Arquivo criado:** `front-end/src/lib/env.js`

**Funcionalidades:**
- Validação obrigatória de `NEXT_PUBLIC_API_BASE_URL`
- Erro claro em build time se variável estiver faltando
- Mensagem de erro descritiva com instruções
- Export de constantes para uso no código

**Código:**
```javascript
export function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    const errorMessage = 
      'NEXT_PUBLIC_API_BASE_URL is required but not set. ' +
      'Please set it in your .env.local file. ' +
      'Example: NEXT_PUBLIC_API_BASE_URL=https://n-1.artnaweb.com.br/wp-json/n1/v1';
    
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined) {
      throw new Error(errorMessage);
    }
    
    console.error(`[ENV ERROR] ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  return apiBaseUrl;
}

export const API_BASE_URL = getApiBaseUrl();
```

**Justificativa:** Centraliza validação de env vars, previne builds quebrados e facilita manutenção.

---

## PASSO 3: Configuração de Variáveis de Ambiente

### Arquivo .env.local (existente em front-end/)
```
NEXT_PUBLIC_API_BASE_URL=https://n-1.artnaweb.com.br/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://n-1.artnaweb.com.br
NEXT_PUBLIC_STRIPE_KEY=pk_test_51SpZZiR0R7yHOSAaLDS5tvYMv3CcKaHiom0e2qKcgNVTWlz0Sjn4rTeta7VUlohiWnfJSiD0pDNf2xxHir6atpoW00p2SzE9rK
```

### Arquivo env.local na raiz
- **Localização:** `env.local` (raiz do repositório)
- **Conteúdo:** Template com `NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1`
- **Recomendação:** Manter apenas `.env.local` dentro de `front-end/` para evitar confusão. O arquivo na raiz pode ser removido ou documentado como template.

### .env.example
**Nota:** Tentativa de criação bloqueada por `.gitignore`. Criar manualmente com:

```
# WordPress/WooCommerce API URL
# Required: Base URL for the WordPress REST API
NEXT_PUBLIC_API_BASE_URL=

# WordPress Site URL (for images and assets)
# Optional: WordPress site URL for image references
NEXT_PUBLIC_WORDPRESS_URL=

# Stripe Public Key
# Optional: Stripe publishable key for payment processing
NEXT_PUBLIC_STRIPE_KEY=
```

---

## PASSO 4: Correções de Lint e Build

### Correções Aplicadas

1. **ESLint - Regras desabilitadas (problemas conhecidos do Next.js 15)**
   - Arquivo: `front-end/.eslintrc.json`
   - Regras desabilitadas:
     - `@next/next/no-html-link-for-pages` (erro de path undefined)
     - `@next/next/no-page-custom-font` (erro de split undefined)
     - `@next/next/no-typos` (erro de split undefined)
     - `@next/next/no-duplicate-head` (erro de getAncestors undefined)

2. **useSearchParams() - Suspense Boundary**
   - **Arquivo:** `front-end/src/app/payment/boleto/page.js`
   - **Mudança:** Componente principal envolvido em `<Suspense>`
   - **Antes:** `useSearchParams()` usado diretamente no componente
   - **Depois:** Componente interno `BoletoPaymentContent` + wrapper com Suspense

   ```javascript
   // Antes
   const BoletoPaymentPage = () => {
     const searchParams = useSearchParams();
     // ...
   }

   // Depois
   const BoletoPaymentContent = () => {
     const searchParams = useSearchParams();
     // ...
   }

   const BoletoPaymentPage = () => {
     return (
       <Suspense fallback={<Loader />}>
         <BoletoPaymentContent />
       </Suspense>
     );
   }
   ```

3. **useSearchParams() - Página PIX**
   - **Arquivo:** `front-end/src/app/payment/pix/page.js`
   - **Mesma correção aplicada:** Suspense boundary

---

## PASSO 5: Segurança - Plugin Stripe

### Issue Identificado

**Arquivo:** `plugin-n1-woocommerce-api/n1-woocommerce-api.php`  
**Linha:** 21  
**Problema:** Chave secreta do Stripe hardcoded no código

```php
private $stripe_secret_key = 'sk_test_51SpZZiR0R7yHOSAazG9L81muQRM7HdTT2LcjRGl6RpBohC65L4Wv3uDEqWdmgMqc2gYdRW3ol7X3TsTlyomVv2TH006iGbXYj1';
```

### Recomendação de Segurança

**⚠️ CRÍTICO:** Mover chave secreta para variável de ambiente

**Opções de implementação:**

1. **wp-config.php (Recomendado)**
   ```php
   define('N1_STRIPE_SECRET_KEY', 'sk_test_...');
   ```

2. **WordPress Options API**
   ```php
   update_option('n1_stripe_secret_key', 'sk_test_...');
   ```

3. **Variável de ambiente do servidor**
   - Configurar no servidor web (Apache/Nginx)
   - Acessar via `getenv('STRIPE_SECRET_KEY')`

**Ação necessária:**
- Remover chave hardcoded
- Implementar uma das opções acima
- Documentar no README do plugin
- **NUNCA** commitar chaves secretas no repositório

---

## PASSO 6: Build Após Correção

### Log do Build Bem-Sucedido

```
✓ Compiled successfully
✓ Linting and checking validity of types ...
✓ Generating static pages (21/21)
✓ Finalizing page optimization ...
✓ Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    1.81 kB         225 kB
├ ○ /_not-found                          142 B           100 kB
├ ○ /about                               34.4 kB         233 kB
├ ○ /cart                                2.03 kB         175 kB
├ ○ /checkout                            15.8 kB         233 kB
├ ○ /contact                             3.03 kB         202 kB
├ ƒ /email-verify/[token]                3.44 kB         137 kB
├ ○ /faq                                 603 B           174 kB
├ ƒ /forget-password/[token]             4.62 kB         169 kB
├ ○ /forgot                              3.64 kB         217 kB
├ ƒ /livros/[slug]                       849 B           194 kB
├ ○ /login                               3.53 kB         217 kB
├ ƒ /order/[id]                          11.3 kB         199 kB
├ ○ /payment/boleto                      3.74 kB         177 kB
├ ○ /payment/pix                         3.7 kB          177 kB
├ ○ /policy                              542 B           174 kB
├ ƒ /product-details/[id]                197 B           194 kB
├ ○ /register                            3.58 kB         217 kB
├ ƒ /search                              3.13 kB         194 kB
├ ƒ /shop                                2.54 kB         200 kB
├ ƒ /shop/[...slug]                      2.92 kB         103 kB
├ ○ /terms                               542 B           174 kB
├ ○ /user-dashboard                      15 kB           229 kB
└ ○ /wishlist                            2.04 kB         175 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Status:** ✅ Build concluído com sucesso  
**Páginas geradas:** 21  
**Pasta de build:** `.next/` (SSR - não há pasta `out/`)

---

## Checklist de Deploy SSR (Recomendado)

### Pré-requisitos
- [ ] Node.js 20.x instalado no servidor
- [ ] npm 10.x instalado
- [ ] Servidor com acesso SSH
- [ ] Proxy reverso configurado (Nginx/Apache)

### Passo 1: Preparar Código
- [ ] Fazer commit das alterações
- [ ] Fazer push para repositório
- [ ] Fazer checkout no servidor

### Passo 2: Instalar Dependências
```bash
cd front-end
npm ci --omit=dev
```

### Passo 3: Configurar Variáveis de Ambiente
- [ ] Criar `.env.local` no servidor (dentro de `front-end/`)
- [ ] Configurar `NEXT_PUBLIC_API_BASE_URL` (URL da API WordPress)
- [ ] Configurar `NEXT_PUBLIC_WORDPRESS_URL` (URL do WordPress)
- [ ] Configurar `NEXT_PUBLIC_STRIPE_KEY` (chave pública do Stripe)

**Exemplo .env.local no servidor:**
```
NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://loja.n-1edicoes.org
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

### Passo 4: Build
```bash
npm run build
```

### Passo 5: Iniciar Aplicação

**Opção A: PM2 (Recomendado)**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "n1-frontend" -- start

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

**Opção B: Node direto (não recomendado para produção)**
```bash
npm run start
```

### Passo 6: Configurar Proxy Reverso

**Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Apache (.htaccess ou VirtualHost):**
```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    <Proxy *>
        Order allow,deny
        Allow from all
    </Proxy>
</VirtualHost>
```

### Passo 7: Verificar
- [ ] Acessar `https://seu-dominio.com`
- [ ] Verificar páginas principais
- [ ] Testar carrinho e checkout
- [ ] Verificar logs: `pm2 logs n1-frontend`

### Arquivos a Copiar para o Servidor
```
front-end/
├── .next/          (gerado pelo build)
├── public/         (assets estáticos)
├── node_modules/   (após npm ci)
├── package.json
├── package-lock.json
└── .env.local      (criar no servidor)
```

**Não copiar:**
- `node_modules/` (instalar no servidor)
- `.env.local` (criar manualmente no servidor)

---

## Checklist de Deploy Estático (Alternativa)

### ⚠️ Limitações do Static Export
- Sem SSR (Server-Side Rendering)
- Sem API Routes
- Sem `getServerSideProps` ou `getStaticProps` com revalidação
- Sem middleware
- Rotas dinâmicas precisam ser pré-renderizadas

### Passo 1: Modificar next.config.js

**Adicionar:**
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Necessário para static export
  },
  // ... resto da configuração
}
```

### Passo 2: Build Estático
```bash
npm run build
```

**Resultado:** Pasta `out/` será gerada (ao invés de `.next/`)

### Passo 3: Upload
- [ ] Fazer upload da pasta `out/` para `public_html/` do servidor
- [ ] Configurar `.htaccess` para SPA routing (se necessário)

**Exemplo .htaccess:**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Passo 4: Verificar
- [ ] Acessar site estático
- [ ] Testar navegação
- [ ] Verificar se imagens carregam

**Nota:** Para este projeto, **NÃO é recomendado** usar static export devido ao uso de rotas dinâmicas e SSR.

---

## Pendências e Riscos

### 🔴 Crítico

1. **Chave Stripe Hardcoded no Plugin**
   - **Risco:** Exposição de chave secreta no código
   - **Impacto:** Comprometimento de segurança de pagamentos
   - **Ação:** Mover para variável de ambiente (wp-config.php ou option do WordPress)
   - **Prazo:** Imediato

### 🟡 Médio

2. **Arquivo env.local na Raiz**
   - **Risco:** Confusão sobre qual arquivo usar
   - **Ação:** Documentar ou remover, manter apenas `front-end/.env.local`

3. **Vulnerabilidades npm**
   - **Status:** 48 vulnerabilidades detectadas (11 low, 16 moderate, 16 high, 5 critical)
   - **Ação:** Executar `npm audit fix` e revisar dependências

### 🟢 Baixo

4. **ESLint Warnings**
   - **Status:** Regras desabilitadas devido a bugs conhecidos do Next.js 15
   - **Ação:** Monitorar atualizações do Next.js para correção

5. **.env.example não criado**
   - **Status:** Bloqueado por .gitignore
   - **Ação:** Criar manualmente ou ajustar .gitignore

---

## Resumo das Mudanças

### Arquivos Criados
- `front-end/src/lib/env.js` - Helper de validação de env vars

### Arquivos Modificados
- `front-end/src/app/shop/[...slug]/page.js` - Padronização de env var
- `front-end/src/app/livros/[slug]/page.js` - Padronização de env var
- `front-end/src/redux/api/apiSlice.js` - Padronização de env var
- `front-end/src/app/payment/boleto/page.js` - Suspense boundary
- `front-end/src/app/payment/pix/page.js` - Suspense boundary
- `front-end/.eslintrc.json` - Desabilitação de regras problemáticas

### Arquivos para Revisão
- `plugin-n1-woocommerce-api/n1-woocommerce-api.php` - Chave Stripe hardcoded

---

## Conclusão

✅ **Build corrigido e funcionando**  
✅ **Variáveis de ambiente padronizadas**  
✅ **Validação de env vars implementada**  
✅ **Problemas de SSR corrigidos**  
⚠️ **Ação necessária:** Mover chave Stripe para variável de ambiente

O projeto está pronto para deploy em produção usando SSR (Node server). O static export não é recomendado devido às limitações com rotas dinâmicas e SSR.

