# 🤖 Prompt para Gerar Commits Padronizados

## 📋 Use Este Prompt no Cursor

Quando você clicar em "Generate commit" ou usar o assistente de commit, use este prompt:

---

## 🎯 Prompt Completo

```
Gere uma mensagem de commit seguindo o padrão:

Formato: <tipo>(<escopo>): <descrição curta>

Tipos disponíveis:
- feat: Nova funcionalidade
- fix: Correção de bug
- update: Atualizar algo existente
- remove: Remover arquivo/código
- refactor: Refatoração (melhorias no código)
- chore: Tarefas de manutenção/configuração
- docs: Documentação
- style: Formatação (não afeta código)
- perf: Melhorias de performance
- test: Testes
- deploy: Mudanças relacionadas a deploy

Escopos comuns:
- front-end, backend, admin-panel, plugin
- config, build, env, api
- cart, checkout, products, auth
- styles, components, utils

Regras:
1. Use português
2. Primeira letra minúscula
3. Sem ponto final
4. Seja específico e claro

Analise as mudanças e gere uma mensagem de commit apropriada.
```

---

## 🚀 Versão Curta (Para Copiar e Colar)

```
Gere mensagem de commit no formato: <tipo>(<escopo>): <descrição>

Tipos: feat, fix, update, remove, refactor, chore, docs, style, perf, test, deploy
Escopos: front-end, backend, admin-panel, plugin, config, build, env, api, cart, checkout, products, auth, styles, components, utils

Use português, primeira letra minúscula, sem ponto final. Seja específico.
```

---

## 💡 Como Usar

### No Cursor:

1. Faça suas alterações
2. Abra o painel de commit (ou use Ctrl+Shift+G)
3. Cole o prompt acima no campo de descrição
4. O Cursor vai gerar uma mensagem seguindo o padrão

### Ou Configure o Git:

O Git já está configurado para usar o template `.gitmessage` quando você fizer:

```bash
git commit
```

Isso vai abrir o template automaticamente.

---

## ✅ Exemplos de Saída Esperada

Se você mudou arquivos do carrinho:
```
feat(cart): adicionar botão de remover item
```

Se você corrigiu um erro no checkout:
```
fix(checkout): corrigir erro ao processar pagamento
```

Se você atualizou o Next.js:
```
update(nextjs): atualizar Next.js para versão 15.1.6
```

---

**Use este prompt sempre que gerar commits! 🎉**

