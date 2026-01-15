# 📚 Integração Template React + WooCommerce

## Resumo

Este projeto mantém o **template React/Next.js original intacto** e integra com WooCommerce via **API REST**.

## O que foi criado

### 1. Plugin WordPress (`n1-woocommerce-api/`)
- API REST customizada
- Endpoints para produtos, categorias, busca
- CORS configurado
- Formato compatível com template React

### 2. Configuração do Template
- `.env.local.example` - Exemplo de configuração
- `next.config.js` - Atualizado para permitir imagens WordPress
- API já configurada em `src/redux/api/apiSlice.js`

## Instalação Rápida

### 1. Plugin WordPress

```bash
# Copiar para WordPress
cp -r n1-woocommerce-api /caminho/wordpress/wp-content/plugins/

# Ativar no WordPress Admin > Plugins
```

### 2. Template Next.js

```bash
cd Template/harri-front-end

# Criar .env.local
cp .env.local.example .env.local

# Editar .env.local com sua URL WordPress
# NEXT_PUBLIC_API_BASE_URL=https://loja.n-1edicoes.org/wp-json/n1/v1

# Instalar dependências
npm install

# Rodar desenvolvimento
npm run dev
```

## Estrutura

```
Projeto/
├── n1-woocommerce-api/          # Plugin WordPress
│   └── n1-woocommerce-api.php
│
├── Template/                     # Template React (ORIGINAL)
│   └── harri-front-end/
│       ├── .env.local            # Config API (criar)
│       ├── next.config.js        # Config atualizado
│       └── src/                  # Código original intacto
│
└── Documentação/
    ├── GUIA-INTEGRACAO-API.md   # Guia completo
    └── README-INTEGRACAO.md     # Este arquivo
```

## Como Funciona

1. **WordPress/WooCommerce** gerencia produtos
2. **Plugin API** expõe produtos via REST
3. **Template React** consome API e exibe produtos
4. **Novo produto no WooCommerce** → Aparece automaticamente no template

## Endpoints Disponíveis

- `GET /wp-json/n1/v1/products` - Listar produtos
- `GET /wp-json/n1/v1/products/{id}` - Produto individual
- `GET /wp-json/n1/v1/products/show` - Produtos em destaque
- `GET /wp-json/n1/v1/products/discount` - Produtos com desconto
- `GET /wp-json/n1/v1/categories` - Categorias
- `GET /wp-json/n1/v1/products/search?q=termo` - Buscar

## Teste Rápido

1. Ative plugin no WordPress
2. Acesse: `https://loja.n-1edicoes.org/wp-json/n1/v1/products`
3. Deve retornar JSON com produtos

## Documentação Completa

Veja `GUIA-INTEGRACAO-API.md` para:
- Instalação detalhada
- Configuração completa
- Troubleshooting
- Deploy
- Exemplos de uso

## Vantagens

✅ Template original não modificado
✅ Atualização automática de produtos
✅ Fácil manutenção
✅ Escalável



