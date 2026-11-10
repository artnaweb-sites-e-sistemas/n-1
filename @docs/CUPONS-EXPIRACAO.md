# Correção da expiração de cupons

A validade é configurada em Marketing > Cupons no WooCommerce. A Olist não participa da validação do checkout Next.js. A integração listava cupons expirados, descartava horário/fuso e restaurava cupons salvos sem consultar novamente a API.

O checkout agora consulta a lista atual ao aplicar, restaurar e finalizar, remove descontos expirados com a página aberta e envia o código do cupom ao servidor. O plugin filtra expirados e verifica a validade antes de criar pagamento ou pedido. Cupons sem expiração continuam aceitos. Integrações legadas sem código de cupom mantêm a compatibilidade; esta correção não substitui uma revisão geral das regras de desconto e dos valores enviados pelo cliente.

## Publicação

O push na main publica o front-end pela Vercel. O PHP precisa ser atualizado separadamente no WordPress: instalar o ZIP `plugin-wordpress/n1-woocommerce-api-coupon-expiration.zip` substituindo a cópia existente do N-1 WooCommerce API. Fazer backup da versão instalada antes de substituir. Não instalar uma segunda cópia nem desativar o WooCommerce. O pacote não inclui banco de dados nem configurações de acesso. Ele preserva a lógica de CPF/CNPJ existente na main remota.

## Validação

Foram executados testes automatizados de expiração no navegador, sintaxe PHP/JS e verificações da função PHP com dependências simuladas. Isso não equivale a uma compra real nem confirma a instalação do plugin em produção.

Produto encontrado no catálogo público em 10/11/2026: **Ecos nietzscheanos, pensamentos nacionais**, ID **5521**, SKU **9786561191029**, em estoque, R$ 68,00 na consulta.

1. Após atualizar o plugin e concluir o deploy, criar um cupom exclusivo de teste no WooCommerce, de R$ 1,00, restrito ao produto 5521, com limite total de um uso. Permitir produtos em promoção, pois o livro consultado tem preço promocional.
2. Colocar expiração em 09/11/2026: o checkout deve rejeitá-lo.
3. Alterar para 11/11/2026: o checkout deve permitir aplicá-lo. Não é necessário pagar para conferir.
4. Com o cupom aplicado, alterar a validade para uma data passada no painel e tentar finalizar: o desconto deve ser removido e o checkout deve pedir a conferência do total, sem iniciar pagamento.
5. Recarregar a página e confirmar que o cupom vencido não é restaurado. Conferir também um cupom sem expiração.
6. Excluir o cupom de teste ao terminar.

O WooCommerce informa que a data de expiração corresponde a 00:00:00 daquela data, no fuso configurado na loja. Para permitir o dia 10 inteiro, usar o dia 11 como expiração. Referência: https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/admin/meta-boxes/class-wc-meta-box-coupon-data.php
