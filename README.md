# N-1 Edições - Repositório Principal

Repositório contendo todos os projetos da N-1 Edições.

## 📁 Estrutura do Projeto

```
├── front-end/              # Loja Next.js (projeto principal)
├── backend/                # API Node.js (não está em uso - substituído por WordPress)
├── admin-panel/            # Painel administrativo Next.js
├── plugin-n1-woocommerce-api/  # Plugin WordPress (API REST)
├── @docs/                  # Documentação
└── loja-antiga/            # Sistema antigo (PrestaShop)
```

## 🚀 Projeto Principal: Front-end

O projeto principal é o **front-end** (loja para clientes).

### Desenvolvimento Local

```bash
# Opção 1: Usando scripts da raiz
npm run dev:front

# Opção 2: Entrar na pasta
cd front-end
npm install
npm run dev
```

### Deploy

O front-end está configurado para deploy na **Vercel**.

---

## 📋 Scripts Disponíveis (da Raiz)

### Front-end
- `npm run dev:front` - Inicia servidor de desenvolvimento
- `npm run build:front` - Faz build de produção
- `npm run start:front` - Inicia servidor de produção
- `npm run install:front` - Instala dependências

### Backend (não está em uso)
- `npm run dev:backend` - Inicia backend em modo desenvolvimento
- `npm run start:backend` - Inicia backend em produção
- `npm run install:backend` - Instala dependências

### Admin Panel
- `npm run dev:admin` - Inicia admin panel em desenvolvimento
- `npm run build:admin` - Faz build do admin panel
- `npm run install:admin` - Instala dependências

### Todos os Projetos
- `npm run install:all` - Instala dependências de todos os projetos

---

## 🔌 Integração

O **front-end** se conecta ao **WordPress** via API REST customizada (`plugin-n1-woocommerce-api`).

**Backend Node.js** (`backend/`) não está sendo usado - foi substituído pelo plugin WordPress.

---

## 📝 Notas

- Cada pasta é um projeto Node.js independente
- Cada projeto tem seu próprio `package.json`
- O script na raiz apenas facilita o acesso aos comandos

## 📝 Convenções de Commit

Para padronizar as mensagens de commit, consulte `CONVENCOES-COMMIT.md`.

**Formato rápido:**
```bash
<tipo>(<escopo>): <descrição>

# Exemplos:
feat(cart): adicionar botão de remover item
fix(checkout): corrigir erro ao processar pagamento
update(nextjs): atualizar para versão 15.1.6
remove(scripts): remover scripts antigos
```

