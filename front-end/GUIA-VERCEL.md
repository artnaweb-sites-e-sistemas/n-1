# 🚀 Guia de Deploy na Vercel - Solução do Erro 404

## ✅ Correções Aplicadas

O erro 404 foi causado porque o arquivo `env.js` estava tentando validar variáveis de ambiente no momento da importação, fazendo o build falhar.

**Correções feitas:**
1. ✅ `env.js` agora valida apenas em runtime (não no build)
2. ✅ Todas as referências a `API_BASE_URL` agora usam função ao invés de constante
3. ✅ Criado `vercel.json` para configuração correta

---

## 📋 Passo a Passo para Deploy na Vercel

### Passo 1: Fazer Commit das Correções

Se você ainda não fez commit das correções:

```bash
cd front-end
git add .
git commit -m "Fix: Corrigir env.js para funcionar na Vercel"
git push
```

### Passo 2: Conectar Repositório na Vercel

1. Acesse: https://vercel.com
2. Faça login (pode usar GitHub)
3. Clique em **"Add New Project"**
4. Selecione seu repositório
5. Configure:
   - **Framework Preset:** Next.js (deve detectar automaticamente)
   - **Root Directory:** `front-end` (se o repositório estiver na raiz)
   - **Build Command:** `npm run build` (já configurado)
   - **Output Directory:** `.next` (padrão do Next.js)

### Passo 3: Configurar Variáveis de Ambiente

**IMPORTANTE:** Configure estas variáveis antes de fazer o deploy!

Na Vercel, vá em **"Environment Variables"** e adicione:

1. **NEXT_PUBLIC_API_BASE_URL**
   - Valor: `https://n-1.artnaweb.com.br/wp-json/n1/v1`
   - Ambiente: Production, Preview, Development

2. **NEXT_PUBLIC_WORDPRESS_URL**
   - Valor: `https://n-1.artnaweb.com.br`
   - Ambiente: Production, Preview, Development

3. **NEXT_PUBLIC_STRIPE_KEY** (opcional)
   - Valor: Sua chave pública do Stripe
   - Ambiente: Production, Preview, Development

### Passo 4: Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Verifique os logs se houver erros

### Passo 5: Configurar Domínio

1. No projeto na Vercel, vá em **"Settings" → "Domains"**
2. Adicione seu domínio: `loja.n-1.artnaweb.com.br`
3. A Vercel vai mostrar as instruções de DNS

### Passo 6: Configurar DNS no HostGator

1. No cPanel, vá em **"Zone Editor"** ou **"DNS Zone"**
2. Adicione um registro **CNAME**:
   - **Nome:** `loja`
   - **Tipo:** `CNAME`
   - **Valor:** O que a Vercel indicar (geralmente algo como `cname.vercel-dns.com`)
3. Salve

---

## 🔍 Verificar se Está Funcionando

### Teste 1: URL da Vercel
Acesse a URL temporária que a Vercel fornece:
```
https://seu-projeto.vercel.app
```

Deve carregar a página inicial sem erro 404.

### Teste 2: Verificar Build Logs
Na Vercel, vá em **"Deployments"** → Clique no último deploy → Veja os logs.

Procure por:
- ✅ "Build Completed"
- ✅ "Compiled successfully"
- ❌ Se houver erros, copie e me envie

### Teste 3: Verificar Variáveis de Ambiente
No código, adicione temporariamente um console.log para verificar:

```javascript
// Em qualquer página (ex: src/app/page.js)
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
```

---

## 🆘 Solução de Problemas

### Erro: "Build Failed"
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Configure todas as variáveis na Vercel antes de fazer deploy

### Erro: "404 NOT_FOUND"
**Causa:** Build não gerou as páginas corretamente
**Solução:** 
1. Verifique os logs do build
2. Certifique-se que todas as variáveis estão configuradas
3. Verifique se o `next.config.js` está correto

### Erro: "Module not found"
**Causa:** Dependências não instaladas
**Solução:** A Vercel instala automaticamente, mas verifique se `package.json` está correto

### Site carrega mas API não funciona
**Causa:** Variável `NEXT_PUBLIC_API_BASE_URL` incorreta
**Solução:** Verifique se a URL está correta e se o plugin WordPress está ativo

---

## ✅ Checklist Final

- [ ] Correções aplicadas no código
- [ ] Commit e push feitos
- [ ] Projeto conectado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Site acessível na URL da Vercel
- [ ] Domínio configurado (opcional)
- [ ] DNS configurado no HostGator (opcional)

---

## 📞 Próximos Passos

Depois que o deploy funcionar:

1. **Instalar Plugin WordPress:**
   - Upload do `n1-woocommerce-api.zip` no WordPress
   - Ativar o plugin

2. **Testar Integração:**
   - Acesse a loja
   - Verifique se produtos aparecem
   - Teste carrinho e checkout

3. **Configurar Domínio Personalizado:**
   - Adicione `loja.n-1.artnaweb.com.br` na Vercel
   - Configure DNS no HostGator

---

**Boa sorte! 🚀**

