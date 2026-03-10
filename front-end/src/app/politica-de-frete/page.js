import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import SectionTop from "@components/terms-policy/section-top-bar";
import Footer from "@layout/footer";

export const metadata = {
  title: "N-1 Edições - Política de Frete",
};

export default function PoliticaDeFrete() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <SectionTop
        title="Política de Frete"
        subtitle="Informações sobre modalidades de envio, prazos de entrega e processamento dos pedidos realizados na loja da n-1 Edições."
      />
      <section className="policy__area pb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="policy__wrapper policy__translate p-relative z-index-1">
                <div className="policy__item mb-35">
                  <h3 className="policy__title">1. Formas de envio</h3>
                  <p>
                    Os pedidos realizados na loja virtual da n-1 Edições podem ser enviados
                    através de:
                  </p>
                  <ul>
                    <li>Correios</li>
                    <li>Transportadoras parceiras</li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">2. Prazo de entrega</h3>
                  <p>
                    O prazo de entrega varia de acordo com:
                  </p>
                  <ul>
                    <li>Localização do cliente</li>
                    <li>Modalidade de frete escolhida</li>
                  </ul>
                  <p>
                    O prazo estimado será informado no momento da compra.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">3. Prazo de processamento</h3>
                  <p>
                    Os pedidos são processados em até 2 dias úteis após confirmação do
                    pagamento.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">4. Rastreamento</h3>
                  <p>
                    Quando disponível, o código de rastreamento será enviado ao cliente por
                    e-mail.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">5. Problemas na entrega</h3>
                  <p>
                    Caso o pedido apresente atraso ou extravio, o cliente deve entrar em
                    contato pelo e-mail{" "}
                    <a href="mailto:comercial@n-1edicoes.org">
                      comercial@n-1edicoes.org
                    </a>.
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

