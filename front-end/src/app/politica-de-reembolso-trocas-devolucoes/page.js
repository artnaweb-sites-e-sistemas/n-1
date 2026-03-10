import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import SectionTop from "@components/terms-policy/section-top-bar";
import Footer from "@layout/footer";

export const metadata = {
  title: "N-1 Edições - Política de Reembolso, Trocas e Devoluções",
};

export default function PoliticaDeReembolsoTrocasDevolucoes() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <SectionTop
        title="Política de Reembolso, Trocas e Devoluções"
        subtitle="Saiba em quais situações é possível solicitar troca, devolução ou reembolso de compras realizadas na loja da N-1 Edições e como proceder."
        titleClassName="policy-title-multiline"
      />
      <section className="policy__area pb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="policy__wrapper policy__translate p-relative z-index-1">
                <div className="policy__item mb-35">
                  <h3 className="policy__title">1. Direito de arrependimento</h3>
                  <p>
                    De acordo com o Código de Defesa do Consumidor, o cliente pode solicitar
                    o cancelamento da compra em até 7 dias corridos após o recebimento do
                    produto.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">2. Condições para devolução</h3>
                  <p>
                    Para que a devolução seja aceita:
                  </p>
                  <ul>
                    <li>O produto deve estar em perfeito estado</li>
                    <li>Sem sinais de uso</li>
                    <li>Com embalagem original (quando aplicável)</li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">3. Procedimento para devolução</h3>
                  <p>
                    Para solicitar devolução ou troca:
                  </p>
                  <ul>
                    <li>
                      Enviar e-mail para:{" "}
                      <a href="mailto:comercial@n-1edicoes.org">
                        comercial@n-1edicoes.org
                      </a>
                    </li>
                    <li>Informar o número do pedido</li>
                    <li>Descrever o motivo da solicitação</li>
                  </ul>
                  <p>
                    Nossa equipe fornecerá as instruções para envio do produto.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">4. Reembolso</h3>
                  <p>
                    Após o recebimento e análise do produto devolvido, o reembolso poderá
                    ocorrer por:
                  </p>
                  <ul>
                    <li>Estorno no cartão de crédito</li>
                    <li>Transferência bancária</li>
                    <li>Crédito na loja</li>
                  </ul>
                  <p>
                    O prazo para processamento do reembolso dependerá do meio de pagamento
                    utilizado.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">5. Trocas</h3>
                  <p>
                    Caso o cliente receba um produto com defeito ou com problema de
                    fabricação, poderá solicitar a troca dentro do prazo legal.
                  </p>
                  <p>
                    A solicitação deverá ser realizada através do e-mail de atendimento,
                    com envio de fotos do produto.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">6. Garantia</h3>
                  <p>
                    Todos os produtos comercializados seguem as garantias previstas no
                    Código de Defesa do Consumidor. Caso seja identificado defeito no
                    produto, o cliente poderá solicitar análise e eventual substituição.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </Wrapper>
  );
}

