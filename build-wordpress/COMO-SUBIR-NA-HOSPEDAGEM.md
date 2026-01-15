# 📤 COMO SUBIR NA SUA HOSPEDAGEM - GUIA SIMPLES

## 🎯 O QUE VOCÊ TEM AGORA

Você já fez o build! Agora você tem 2 coisas para subir:

1. **Plugin do WordPress** (vai dentro do WordPress)
2. **Front-end** (vai em um servidor separado, NÃO no WordPress)

---

## 📍 ONDE ESTÃO OS ARQUIVOS

Tudo está na pasta: **`build-wordpress`**

Dentro dela você tem:
- ✅ `n1-woocommerce-api.zip` ← **ISSO VAI NO WORDPRESS**
- ✅ `front-end/` ← **ISSO VAI EM SERVIDOR NODE.JS (separado)**

---

## 🚀 PASSO A PASSO - PARTE 1: PLUGIN NO WORDPRESS

### O que fazer:
Subir o arquivo ZIP do plugin no seu WordPress.

### Como fazer:

1. **Abra o painel do WordPress**
   - Acesse: `https://seu-dominio.com/wp-admin`
   - Faça login

2. **Vá em Plugins**
   - No menu lateral esquerdo, clique em **"Plugins"**
   - Clique em **"Adicionar novo"**

3. **Envie o plugin**
   - Clique no botão **"Enviar plugin"** (no topo da página)
   - Clique em **"Escolher arquivo"**
   - Selecione: `build-wordpress\n1-woocommerce-api.zip`
   - Clique em **"Instalar agora"**

4. **Ative o plugin**
   - Depois de instalar, clique em **"Ativar plugin"**

✅ **Pronto! O plugin está instalado no WordPress.**

---

## 🚀 PASSO A PASSO - PARTE 2: FRONT-END (SITE)

### ⚠️ IMPORTANTE:
O front-end **NÃO vai dentro do WordPress**. Ele precisa rodar em um servidor Node.js separado.

### Você precisa de:
- Um servidor com Node.js instalado (pode ser o mesmo servidor do WordPress ou outro)
- Acesso SSH ou FTP ao servidor

### Como fazer:

#### Opção A: Se você tem servidor Node.js (Recomendado)

1. **Fazer upload da pasta `front-end`**
   - Use FTP (FileZilla) ou SSH
   - Faça upload de **TODA a pasta** `build-wordpress\front-end\` para o servidor
   - Exemplo: `/var/www/meu-site/` ou onde você quiser

2. **Conectar no servidor via SSH**
   - Use Putty ou terminal
   - Entre na pasta onde você fez upload:
     ```bash
     cd /caminho/para/front-end
     ```

3. **Instalar dependências**
   - Execute:
     ```bash
     npm ci --omit=dev
     ```
   - Isso vai instalar o que precisa (pode demorar alguns minutos)

4. **Criar arquivo de configuração**
   - Crie um arquivo chamado `.env.local` dentro da pasta `front-end`
   - Coloque dentro:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/wp-json/n1/v1
     NEXT_PUBLIC_WORDPRESS_URL=https://seu-dominio.com
     NEXT_PUBLIC_STRIPE_KEY=pk_live_sua_chave_aqui
     ```
   - ⚠️ **Substitua `seu-dominio.com` pelo seu domínio real!**

5. **Iniciar o servidor**
   - Execute:
     ```bash
     npm run start
     ```
   - O site vai rodar na porta 3000

6. **Configurar proxy reverso** (para acessar pelo seu domínio)
   - Configure Nginx ou Apache para apontar para `localhost:3000`
   - Isso geralmente é feito pelo painel da hospedagem ou pedindo ajuda ao suporte

#### Opção B: Se você NÃO tem servidor Node.js

Se sua hospedagem não suporta Node.js, você precisa:
- Contratar um serviço que suporte Node.js (Vercel, Netlify, Railway, etc.)
- Ou pedir ajuda para configurar Node.js na sua hospedagem atual

---

## ✅ CHECKLIST - O QUE VOCÊ JÁ FEZ E O QUE FALTA

Marque conforme for fazendo:

### Plugin WordPress:
- [ ] Fiz upload do `n1-woocommerce-api.zip` no WordPress
- [ ] Plugin instalado
- [ ] Plugin ativado

### Front-end:
- [ ] Tenho servidor Node.js disponível
- [ ] Fiz upload da pasta `front-end` para o servidor
- [ ] Executei `npm ci --omit=dev` no servidor
- [ ] Criei arquivo `.env.local` com as configurações corretas
- [ ] Iniciei o servidor com `npm run start`
- [ ] Configurei proxy reverso (ou pedi ajuda)

### Testes:
- [ ] Acessei o site e ele carregou
- [ ] Produtos aparecem na loja
- [ ] Carrinho funciona
- [ ] Checkout funciona

---

## 🆘 PRECISA DE AJUDA?

### Se você não tem servidor Node.js:
- Contrate um serviço como **Vercel** (grátis) ou **Netlify** (grátis)
- Ou peça ajuda ao suporte da sua hospedagem para instalar Node.js

### Se não sabe usar SSH/FTP:
- Use o **FileZilla** (grátis) para FTP
- Use o **Putty** (grátis) para SSH
- Ou peça ajuda a alguém que saiba

### Se o site não funciona:
1. Verifique se o plugin está ativado no WordPress
2. Verifique se o arquivo `.env.local` está correto
3. Verifique se o servidor Node.js está rodando
4. Verifique os logs de erro

---

## 📝 RESUMO RÁPIDO

1. **Plugin WordPress:**
   - Arquivo: `build-wordpress\n1-woocommerce-api.zip`
   - Onde: WordPress Admin → Plugins → Enviar plugin
   - ✅ Fácil de fazer sozinho

2. **Front-end:**
   - Pasta: `build-wordpress\front-end\`
   - Onde: Servidor Node.js (separado do WordPress)
   - ⚠️ Precisa de servidor Node.js e conhecimento técnico básico

---

## 🎯 PRÓXIMOS PASSOS

1. **Agora:** Suba o plugin no WordPress (Parte 1) - é fácil!
2. **Depois:** Configure o front-end (Parte 2) - pode precisar de ajuda técnica

**Boa sorte! 🚀**

