# 📝 Convenções de Commit - N-1 Edições

## 🎯 Padrão de Mensagens de Commit

Use este formato para facilitar a identificação do que foi feito:

```
<tipo>(<escopo>): <descrição curta>

<descrição detalhada (opcional)>
```

---

## 📋 Tipos de Commit

### ✨ `feat` - Nova funcionalidade
```bash
feat(cart): adicionar botão de remover item
feat(checkout): implementar pagamento com PIX
feat(products): adicionar filtro por categoria
```

### 🐛 `fix` - Correção de bug
```bash
fix(env): corrigir validação de variáveis de ambiente
fix(cart): corrigir cálculo de desconto
fix(api): corrigir erro ao buscar produtos
```

### 🔧 `refactor` - Refatoração (melhorias no código)
```bash
refactor(components): reorganizar estrutura de componentes
refactor(api): simplificar chamadas à API
refactor(styles): otimizar CSS
```

### 📝 `docs` - Documentação
```bash
docs(readme): atualizar instruções de instalação
docs(api): adicionar documentação da API
```

### 🎨 `style` - Formatação, espaços, etc (não afeta código)
```bash
style(components): corrigir indentação
style: formatar código com prettier
```

### ♻️ `chore` - Tarefas de manutenção
```bash
chore(deps): atualizar dependências
chore(build): configurar scripts de build
chore(gitignore): atualizar arquivos ignorados
```

### 🗑️ `remove` - Remover arquivos/código
```bash
remove(scripts): remover scripts antigos de migração
remove(docs): remover documentação temporária
remove(backend): remover backend não utilizado
```

### 🔄 `update` - Atualizar algo existente
```bash
update(nextjs): atualizar Next.js para 15.1.6
update(env): atualizar variáveis de ambiente
update(config): atualizar configuração do Vercel
```

### 🚀 `deploy` - Mudanças relacionadas a deploy
```bash
deploy(vercel): configurar variáveis de ambiente
deploy: preparar build para produção
```

### ⚡ `perf` - Melhorias de performance
```bash
perf(images): otimizar carregamento de imagens
perf(api): melhorar tempo de resposta
```

### ✅ `test` - Adicionar ou corrigir testes
```bash
test(cart): adicionar testes do carrinho
test(api): corrigir testes da API
```

---

## 📍 Escopos (Opcional mas Recomendado)

Use escopos para indicar onde a mudança foi feita:

- `front-end` - Mudanças no front-end
- `backend` - Mudanças no backend
- `admin-panel` - Mudanças no admin panel
- `plugin` - Mudanças no plugin WordPress
- `config` - Mudanças de configuração
- `build` - Mudanças no build
- `env` - Variáveis de ambiente
- `api` - API/endpoints
- `cart` - Carrinho
- `checkout` - Checkout
- `products` - Produtos
- `auth` - Autenticação
- `styles` - Estilos/CSS
- `components` - Componentes
- `utils` - Utilitários

---

## ✅ Exemplos Práticos

### Exemplo 1: Nova Funcionalidade
```bash
feat(cart): adicionar opção de salvar para depois
```

### Exemplo 2: Correção de Bug
```bash
fix(checkout): corrigir erro ao processar pagamento com cartão
```

### Exemplo 3: Atualização
```bash
update(nextjs): atualizar Next.js para versão 15.1.6
```

### Exemplo 4: Remoção
```bash
remove(scripts): remover scripts antigos de migração
```

### Exemplo 5: Refatoração
```bash
refactor(api): padronizar chamadas à API WordPress
```

### Exemplo 6: Configuração
```bash
chore(vercel): configurar variáveis de ambiente
```

### Exemplo 7: Documentação
```bash
docs(readme): atualizar instruções de deploy
```

---

## 🎯 Regras Simples

1. **Use português** (ou inglês, mas seja consistente)
2. **Primeira letra minúscula** na descrição
3. **Sem ponto final** na descrição curta
4. **Seja específico** - "corrigir bug" é vago, "corrigir cálculo de desconto" é melhor
5. **Use o tipo correto** - escolha o tipo que melhor descreve a mudança

---

## 📊 Exemplos do Seu Projeto

### Commits que você já fez (melhorados):

**Antes:**
```
Fix: Atualizar Next.js 15.1.6 e corrigir erro ESLint
```

**Depois (padronizado):**
```
fix(eslint): corrigir erro de regra no about page
update(nextjs): atualizar Next.js para 15.1.6
```

**Antes:**
```
Enhance Next.js configuration
```

**Depois:**
```
chore(config): suprimir warnings de deprecação do Sass
```

**Antes:**
```
Refactor project configuration
```

**Depois:**
```
refactor(env): padronizar variáveis de ambiente
fix(api): usar API_BASE_URL centralizado
```

---

## 🚀 Template Rápido

Copie e cole, substituindo os valores:

```bash
git commit -m "tipo(escopo): descrição curta"
```

**Exemplos prontos:**
```bash
feat(cart): adicionar botão de remover item
fix(checkout): corrigir erro ao processar pagamento
update(nextjs): atualizar para versão 15.1.6
remove(scripts): remover scripts antigos
chore(deps): atualizar dependências
refactor(api): padronizar chamadas à API
docs(readme): atualizar instruções
```

---

## 💡 Dica Extra

Se a mudança afetar múltiplas áreas, use múltiplos commits:

```bash
fix(env): corrigir validação de variáveis
fix(api): atualizar chamadas para usar API_BASE_URL
```

Isso facilita identificar o que mudou e reverter se necessário.

---

## ✅ Checklist Antes de Commitar

- [ ] Tipo de commit escolhido (`feat`, `fix`, `update`, etc.)
- [ ] Escopo identificado (`cart`, `checkout`, `api`, etc.)
- [ ] Descrição clara e específica
- [ ] Mensagem em português (ou inglês, mas consistente)
- [ ] Sem ponto final na descrição

---

**Use este padrão e seus commits ficarão muito mais organizados! 🎉**

