# 📁 Estrutura do Repositório - Explicação

## 🎯 Por Que Precisa Rodar na Pasta `front-end/`?

### Resposta Curta:
**Cada pasta (`front-end/`, `backend/`, `admin-panel/`) é um projeto Node.js SEPARADO**, cada um com seu próprio `package.json` e dependências.

---

## 📂 Estrutura Atual do Repositório

```
Repositorio Editora N-1/
├── front-end/          ← Projeto Next.js (loja para clientes)
│   ├── package.json    ← Dependências do front-end
│   └── src/            ← Código do front-end
│
├── backend/            ← Projeto Express.js (API Node.js)
│   ├── package.json    ← Dependências do backend
│   └── index.js        ← Servidor Express
│
├── admin-panel/        ← Projeto Next.js (painel administrativo)
│   ├── package.json    ← Dependências do admin
│   └── src/            ← Código do admin
│
├── plugin-n1-woocommerce-api/  ← Plugin WordPress
│   └── n1-woocommerce-api.php
│
├── @docs/              ← Documentação (mantido)
└── loja-antiga/        ← Sistema antigo (mantido)
```

---

## ❓ Por Que Não Dá Para Rodar na Raiz?

### Problema:
**Não existe `package.json` na raiz!**

Cada projeto tem suas próprias dependências:
- `front-end/` precisa de: Next.js, React, Redux, etc.
- `backend/` precisa de: Express, MongoDB, Stripe, etc.
- `admin-panel/` precisa de: Next.js, TypeScript, Tailwind, etc.

Se você rodar `npm install` na raiz, o npm não sabe o que instalar porque não há `package.json` lá.

---

## ✅ Solução: Criar Scripts na Raiz (Opcional)

Você PODE criar scripts na raiz para facilitar, mas ainda precisa ter os `package.json` em cada pasta.

### Opção 1: Criar `package.json` na Raiz (Workspace)

Criar um `package.json` na raiz que gerencia todos os projetos:

```json
{
  "name": "n1-edicoes",
  "private": true,
  "workspaces": [
    "front-end",
    "backend",
    "admin-panel"
  ],
  "scripts": {
    "dev:front": "cd front-end && npm run dev",
    "dev:backend": "cd backend && npm start",
    "dev:admin": "cd admin-panel && npm run dev",
    "install:all": "npm install && cd front-end && npm install && cd ../backend && npm install && cd ../admin-panel && npm install"
  }
}
```

**Vantagem:** Pode rodar `npm run dev:front` da raiz  
**Desvantagem:** Mais complexo de configurar

### Opção 2: Manter Como Está (Recomendado)

**Cada projeto é independente:**
- `cd front-end && npm install && npm run dev`
- `cd backend && npm install && npm start`
- `cd admin-panel && npm install && npm run dev`

**Vantagem:** Simples, cada projeto funciona sozinho  
**Desvantagem:** Precisa entrar em cada pasta

---

## 🔍 Backend e Admin-Panel Estão Sendo Usados?

### Backend (`backend/`)

**Status:** ❌ **NÃO está sendo usado no projeto atual**

**Evidências:**
- O front-end se conecta diretamente ao **WordPress** via API REST
- URL da API: `NEXT_PUBLIC_API_BASE_URL` aponta para WordPress (`/wp-json/n1/v1`)
- Não há referências ao backend Express no código do front-end

**O que o backend fazia:**
- API Node.js com Express
- MongoDB para banco de dados
- Autenticação JWT
- Upload de imagens (Cloudinary)

**Conclusão:** O backend foi substituído pelo plugin WordPress.

### Admin-Panel (`admin-panel/`)

**Status:** ❓ **Não está claro se está em uso**

**O que o admin-panel fazia:**
- Painel administrativo em Next.js
- Gerenciamento de produtos, pedidos, usuários
- Dashboard com gráficos

**Possível uso:**
- Pode estar sendo usado separadamente
- Ou pode ter sido substituído pelo WordPress Admin

---

## 🗑️ Posso Remover Backend e Admin-Panel?

### Recomendação:

**Backend:** ✅ **Pode remover** (não está sendo usado)
- O projeto usa WordPress como backend
- O plugin WordPress substituiu a API Node.js

**Admin-Panel:** ⚠️ **Verificar antes de remover**
- Pode estar sendo usado para gerenciar o sistema
- Ou pode ter sido substituído pelo WordPress Admin

**Sugestão:**
1. Verificar se você acessa algum painel admin em `localhost:3001` ou similar
2. Se não usa, pode remover
3. Se usa, manter

---

## 📋 Resumo

### Por que rodar na pasta `front-end/`?
- Cada pasta é um projeto Node.js separado
- Cada uma tem seu próprio `package.json`
- Não há `package.json` na raiz

### Posso rodar da raiz?
- Sim, mas precisa criar um `package.json` na raiz primeiro
- Ou usar scripts que entram nas pastas

### Backend e Admin-Panel estão em uso?
- **Backend:** ❌ Não (substituído pelo WordPress)
- **Admin-Panel:** ❓ Verificar se você usa

---

## 🎯 Recomendação Final

**Manter como está:**
- Rodar `npm install` e `npm run dev` dentro de `front-end/`
- É a forma mais simples e clara

**Ou criar scripts na raiz:**
- Se quiser facilitar, posso criar um `package.json` na raiz com scripts
- Mas ainda vai precisar instalar dependências em cada pasta

**Quer que eu:**
1. ✅ Crie scripts na raiz para facilitar?
2. ✅ Remova o `backend/` (não está sendo usado)?
3. ✅ Verifique se `admin-panel/` está em uso?

