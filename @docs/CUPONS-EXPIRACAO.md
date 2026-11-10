# Cupons: expiração, restrições e limites — plugin 1.1.0

A configuração continua em Marketing > Cupons do WooCommerce. A Olist não participa da validação do checkout Next.js.

## Comportamento

- POST /wp-json/n1/v1/api/coupon/validate calcula o desconto no servidor com WC_Discounts e os filtros nativos de marcas. Não cria pedidos, salva itens ou consome usos nessa consulta.
- O cálculo respeita produtos/categorias/marcas incluídos e excluídos, ofertas, gasto mínimo/máximo, e-mails permitidos (incluindo curingas), expiração, limite global, limite por cliente e limite de quantidade de itens descontados.
- Descontos percentuais e fixos por produto seguem a quantidade e apenas os itens elegíveis. Frete não recebe desconto de produto. O checkout trabalha com um cupom por vez, respeitando uso individual.
- É necessário preencher o e-mail para aplicar o cupom. Alterações no carrinho, e-mail ou frete revalidam o desconto; respostas antigas não autorizam descontos em outro contexto. A finalização consulta novamente o servidor.
- No Mercado Pago, pedidos COM cupom são criados e validados antes da cobrança, com endereço e cliente definidos antes de aplicar o cupom. O erro da aplicação nativa é tratado. Uma trava MySQL por cupom serializa validação e consumo entre compras deste checkout; o WooCommerce registra o uso no pedido pendente.
- A resposta do pagamento referencia o pedido já criado, evitando duplicá-lo. Uma tentativa tem identificador persistido na sessão e chave de pagamento estável. Repetições recuperam o resultado anterior; respostas incertas ficam pendentes para conciliação, sem recobrar automaticamente.
- Recusas definitivas liberam o uso do cupom pelos eventos nativos de status e restauram o estoque. Webhooks podem encontrar o pedido pelo identificador enviado nos metadados do pagamento caso a resposta inicial se perca.
- O fluxo SEM cupom, CPF/CNPJ, cadastro, cálculo de frete e meios de pagamento existentes são preservados. Descontos de cupom sem código passam a ser recusados. Cupons em produtos externos sem cadastro no WooCommerce são recusados, pois não é possível validar suas regras. Pedidos zerados continuam sem suporte no pagamento atual e são bloqueados antes de cobrar.

## Publicação

O push na main publica apenas o front-end na Vercel. Instalar no WordPress o ZIP plugin-wordpress/n1-woocommerce-api-restricoes-cupons.zip (versão 1.1.0), substituindo a cópia existente após backup. Não instalar uma segunda cópia. O pacote contém apenas o plugin, sem banco de dados, credenciais ou testes. Se o WordPress responder explicitamente rest_no_route para o novo endpoint (plugin antigo), o site mantém temporariamente o comportamento anterior de cupons. Recusas, erros de rede e falhas do novo endpoint NÃO acionam essa compatibilidade. As restrições completas só entram em vigor após instalar o plugin 1.1.0. Não considerar apenas o push como conclusão da ativação.

## Testes executados e limites da validação

Os testes isolados usam o motor oficial WC_Discounts, a elegibilidade de produto do WC_Coupon e os filtros oficiais de marcas. Produtos, persistência, usuários e gateway são simulados. Foram cobertos múltiplos produtos sem IDs de item persistidos, quantidades, inclusões/exclusões, ofertas, mínimo/máximo, e-mails/curingas, usos por conta e por e-mail de convidado, descontos fixos/percentuais, quantidade máxima descontada, expiração, código obrigatório, sequência antes da cobrança, repetição, recusa e timeout. Não equivalem a uma compra real nem comprovam instalação no servidor.

Executar da raiz:

    node plugin-wordpress/tests/prepare-fixtures.mjs
    php plugin-wordpress/tests/coupon-checkout.php
    node --test front-end/src/utils/coupon-expiry.test.mjs front-end/src/utils/legacy-coupon-quote.test.mjs
    php -l plugin-wordpress/n1-woocommerce-api.php

As fontes de teste são baixadas de WooCommerce/woocommerce, tag 9.9.5, com hashes SHA-256 conferidos. A versão exata instalada em produção e a operação concorrente com outros canais de venda precisam de validação na loja; a trava introduzida cobre este checkout.

## Conferência na loja após instalar

Produto disponível consultado: Ecos nietzscheanos, pensamentos nacionais, ID 5521, SKU 9786561191029. Estava em oferta e em estoque na consulta de 10/11/2026.

1. Criar cupons exclusivos para teste, com desconto baixo e limite global de um uso. Não editar cupons de campanhas ativas.
2. Restringir ao produto 5521 e montar um carrinho com ele e outro livro: desconto percentual/fixo por produto deve atingir somente o produto elegível.
3. Conferir exclusões de produtos, categorias, marcas e ofertas; valores mínimo/máximo; e-mail permitido e não permitido; limite de itens para desconto por produto.
4. Conferir a expiração com data passada e futura, inclusive recarregar um cupom salvo.
5. Fazer uma compra controlada para conferir o limite global e por cliente. Uma segunda tentativa deve ser recusada antes da cobrança. Cancelar um pedido pendente de teste e conferir a devolução da disponibilidade do cupom e do estoque.
6. Conferir separadamente PIX e cartão e uma compra sem cupom. Não foi feito pagamento real durante a implementação.
7. Excluir os cupons de teste ao terminar.

O WooCommerce expira o cupom às 00:00:00 da data selecionada, no fuso da loja. Referências oficiais: https://woocommerce.com/document/coupon-management/ e https://github.com/woocommerce/woocommerce/tree/9.9.5/plugins/woocommerce/includes
