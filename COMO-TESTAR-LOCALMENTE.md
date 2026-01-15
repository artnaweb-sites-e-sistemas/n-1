# 🚀 Como Testar Localmente

## Passo a Passo Completo

### 1. Preparar Ambiente Local

**Opção A: XAMPP (Windows)**
- Baixe e instale XAMPP
- Inicie Apache e MySQL
- WordPress vai em: `C:\xampp\htdocs\seu-site\`

**Opção B: Local by Flywheel (Recomendado)**
- Baixe: https://localwp.com/
- Crie um novo site WordPress
- Mais fácil de usar!

**Opção C: Docker**
```bash
docker-compose up -d
```

### 2. Instalar WordPress

1. Baixe WordPress: https://wordpress.org/download/
2. Extraia na pasta do servidor local
3. Acesse: `http://localhost/seu-site/`
4. Siga o instalador do WordPress
5. Crie banco de dados e usuário

### 3. Instalar WooCommerce

1. No WordPress Admin, vá em **Plugins > Adicionar Novo**
2. Busque "WooCommerce"
3. Instale e ative

### 4. Copiar Assets (IMPORTANTE!)

**No Windows:**
```cmd
cd "C:\Users\biras\Desktop\Repositorio Editora N-1"
copy-assets.bat
```

**No Linux/Mac:**
```bash
cd ~/Desktop/Repositorio\ Editora\ N-1
chmod +x copy-assets.sh
./copy-assets.sh
```

**Ou manualmente:**
- Copie `Template/harri-front-end/public/assets/css/*` para `n1-edicoes-theme/assets/css/`
- Copie `Template/harri-front-end/public/assets/js/*` para `n1-edicoes-theme/assets/js/`
- Copie `Template/harri-front-end/public/assets/img/*` para `n1-edicoes-theme/assets/img/`

### 5. Instalar o Tema

1. Copie a pasta `n1-edicoes-theme` para:
   - XAMPP: `C:\xampp\htdocs\seu-site\wp-content\themes\`
   - Local: Pasta do site > `wp-content\themes\`

2. No WordPress Admin:
   - Vá em **Aparência > Temas**
   - Ative "N-1 Edições"

### 6. Verificar se Funcionou

Acesse: `http://localhost/seu-site/`

**Deve aparecer:**
- ✅ Header com logo e menu
- ✅ Estilos aplicados (não mais sem estilo)
- ✅ Footer

### 7. Adicionar Produtos de Teste

1. **Produtos > Adicionar Novo**
2. Preencha:
   - Nome: "Livro Teste"
   - Descrição: "Descrição do livro"
   - Preço: 95.00
   - Imagem: Faça upload
3. Publique

### 8. Verificar Loja

Acesse: `http://localhost/seu-site/shop/`

**Deve aparecer:**
- ✅ Lista de produtos
- ✅ Cards de produtos com design do template
- ✅ Preços formatados

## Problemas Comuns

### ❌ Tema sem estilos

**Solução:**
1. Verifique se os assets foram copiados:
   - `n1-edicoes-theme/assets/css/style.css` existe?
   - `n1-edicoes-theme/assets/js/main.js` existe?

2. Limpe cache do navegador: `Ctrl + F5`

3. Verifique console do navegador (F12) para erros

### ❌ WooCommerce não aparece

**Solução:**
1. Verifique se WooCommerce está ativado
2. Vá em **WooCommerce > Configurações**
3. Configure página da loja

### ❌ Erro 404 nas páginas

**Solução:**
1. Vá em **Configurações > Links Permanentes**
2. Clique em "Salvar alterações" (sem mudar nada)

### ❌ Imagens não aparecem

**Solução:**
1. Verifique permissões da pasta `wp-content/uploads/`
2. Verifique se as imagens foram copiadas para `assets/img/`

## Checklist de Teste

- [ ] WordPress instalado e funcionando
- [ ] WooCommerce instalado e ativado
- [ ] Assets copiados (CSS, JS, imagens)
- [ ] Tema ativado
- [ ] Homepage carrega com estilos
- [ ] Loja mostra produtos
- [ ] Página de produto funciona
- [ ] Carrinho funciona
- [ ] Menu funciona
- [ ] Footer aparece

## Próximos Passos Após Teste Local

1. ✅ Testar tudo localmente
2. ✅ Corrigir problemas encontrados
3. ✅ Importar produtos reais
4. ✅ Fazer backup
5. ✅ Subir para produção

## Dicas

- Use **Local by Flywheel** - é mais fácil!
- Sempre teste localmente antes de subir
- Faça backup antes de mudanças grandes
- Use F12 (DevTools) para debugar problemas



