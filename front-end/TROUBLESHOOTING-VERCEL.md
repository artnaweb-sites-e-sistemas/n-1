# 🔧 Troubleshooting - Erro 404 na Vercel

## ❌ Problema: 404 NOT_FOUND após deploy

Se você está vendo erro 404 mesmo após configurar tudo, siga estes passos:

---

## ✅ PASSO 1: Verificar Configuração do Projeto na Vercel

### 1.1 Verificar Root Directory

Na Vercel, vá em **Settings → General → Root Directory**

**Se seu repositório tem a estrutura:**
```
repositorio/
├── front-end/    ← código Next.js está aqui
├── backend/
└── outros arquivos
```

**Então configure:**
- **Root Directory:** `front-end`

**Se você fez upload direto da pasta front-end:**
- **Root Directory:** Deixe vazio (ou `/`)

### 1.2 Verificar Framework

Na Vercel, vá em **Settings → General → Framework Preset**
- Deve estar: **Next.js**

---

## ✅ PASSO 2: Verificar Variáveis de Ambiente

Na Vercel, vá em **Settings → Environment Variables**

Certifique-se que TODAS estas variáveis estão configuradas:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://n-1.artnaweb.com.br/wp-json/n1/v1` | ✅ Production<br>✅ Preview<br>✅ Development |
| `NEXT_PUBLIC_WORDPRESS_URL` | `https://n-1.artnaweb.com.br` | ✅ Production<br>✅ Preview<br>✅ Development |
| `NEXT_PUBLIC_STRIPE_KEY` | Sua chave (opcional) | ✅ Production<br>✅ Preview<br>✅ Development |

⚠️ **IMPORTANTE:** Marque TODOS os ambientes (Production, Preview, Development)!

---

## ✅ PASSO 3: Verificar Logs do Build

1. Na Vercel, vá em **Deployments**
2. Clique no último deploy
3. Veja a aba **"Build Logs"**

### O que procurar:

✅ **Sucesso:**
```
✓ Compiled successfully
✓ Generating static pages (21/21)
✓ Build completed
```

❌ **Erro comum:**
```
✗ Error: NEXT_PUBLIC_API_BASE_URL is required
```
**Solução:** Configure as variáveis de ambiente (Passo 2)

❌ **Erro comum:**
```
✗ Module not found
```
**Solução:** Verifique se o Root Directory está correto (Passo 1.1)

---

## ✅ PASSO 4: Verificar Estrutura de Arquivos

Certifique-se que estes arquivos existem na pasta do projeto:

```
front-end/
├── package.json          ← Deve existir
├── next.config.js        ← Deve existir
├── vercel.json          ← Deve existir (criado)
├── src/
│   └── app/
│       ├── layout.js    ← Deve existir
│       ├── page.js      ← Deve existir
│       └── ...
└── public/              ← Deve existir
```

---

## ✅ PASSO 5: Fazer Deploy Limpo

### Opção A: Deletar e Recriar Projeto

1. Na Vercel, vá em **Settings → Danger Zone**
2. Clique em **"Delete Project"**
3. Crie um novo projeto
4. Configure tudo novamente

### Opção B: Limpar Cache e Redeploy

1. Na Vercel, vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. Selecione **"Redeploy"**
4. Marque **"Use existing Build Cache"** como **DESMARCADO**
5. Clique em **"Redeploy"**

---

## ✅ PASSO 6: Testar Build Localmente

Antes de fazer deploy, teste localmente:

```bash
cd front-end

# Criar .env.local
echo "NEXT_PUBLIC_API_BASE_URL=https://n-1.artnaweb.com.br/wp-json/n1/v1" > .env.local
echo "NEXT_PUBLIC_WORDPRESS_URL=https://n-1.artnaweb.com.br" >> .env.local

# Instalar dependências
npm install

# Fazer build
npm run build

# Testar
npm run start
```

Se funcionar localmente, deve funcionar na Vercel.

---

## ✅ PASSO 7: Verificar URL de Acesso

Após o deploy, acesse:

1. **URL da Vercel:** `https://seu-projeto.vercel.app`
2. **Não acesse:** `https://seu-projeto.vercel.app/index` (pode dar 404)

Se a URL raiz (`/`) der 404, o problema é no build ou na configuração.

---

## 🔍 DIAGNÓSTICO: Checklist Rápido

Marque o que você já fez:

- [ ] Root Directory configurado corretamente na Vercel
- [ ] Framework Preset = Next.js
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Variáveis marcadas para Production, Preview E Development
- [ ] Build completou sem erros (verificar logs)
- [ ] Estrutura de arquivos está correta
- [ ] Build funciona localmente
- [ ] Acessando a URL raiz (não /index)

---

## 🆘 Se NADA Funcionar

### Solução Alternativa: Deploy Manual via CLI

1. Instale Vercel CLI:
```bash
npm install -g vercel
```

2. No terminal, dentro da pasta `front-end`:
```bash
vercel login
vercel --prod
```

3. Siga as instruções e configure as variáveis quando perguntado.

---

## 📞 Informações para Suporte

Se precisar de ajuda, forneça:

1. **Screenshot dos Build Logs** (aba "Build Logs" na Vercel)
2. **Screenshot das Environment Variables** (Settings → Environment Variables)
3. **Screenshot das configurações do projeto** (Settings → General)
4. **URL do projeto na Vercel**

---

## 🎯 Solução Mais Provável

**90% dos casos de 404 na Vercel são causados por:**

1. ❌ **Root Directory errado** → Configure como `front-end` (se aplicável)
2. ❌ **Variáveis de ambiente não configuradas** → Configure todas
3. ❌ **Build falhou silenciosamente** → Verifique os logs

**Comece verificando esses 3 pontos!**

