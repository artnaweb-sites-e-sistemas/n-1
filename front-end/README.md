# N-1 Edições - Front-end

Front-end da loja N-1 Edições desenvolvido com Next.js 15.

## 🚀 Tecnologias

- **Next.js 15.1.6** - Framework React
- **React 19** - Biblioteca UI
- **Redux Toolkit** - Gerenciamento de estado
- **Bootstrap 5** - Framework CSS
- **Stripe** - Pagamentos

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm 10.x ou superior

## 🔧 Instalação

```bash
npm install
```

## 🛠️ Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🏗️ Build

```bash
npm run build
```

## 🚀 Deploy

O projeto está configurado para deploy na Vercel:

1. Configure as variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_API_BASE_URL` - URL da API WordPress
   - `NEXT_PUBLIC_WORDPRESS_URL` - URL do WordPress
   - `NEXT_PUBLIC_STRIPE_KEY` - Chave pública do Stripe (opcional)

2. Faça push para o repositório conectado na Vercel
3. O deploy será feito automaticamente

## 📁 Estrutura

```
front-end/
├── src/
│   ├── app/          # Páginas e rotas
│   ├── components/   # Componentes React
│   ├── redux/        # Store Redux
│   ├── lib/          # Utilitários e helpers
│   └── ...
├── public/           # Assets estáticos
└── package.json
```

## 🔌 Integração

O front-end se conecta ao WordPress via API REST customizada (`plugin-n1-woocommerce-api`).
