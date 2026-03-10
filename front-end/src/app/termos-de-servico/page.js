import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import SectionTop from "@components/terms-policy/section-top-bar";
import Footer from "@layout/footer";

export const metadata = {
  title: "N-1 Edições - Termos de Serviço",
};

export default function TermosDeServico() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <SectionTop
        title="Termos de Serviço"
        subtitle="Ao acessar e utilizar o site da n-1 Edições, o usuário declara ter lido, compreendido e concordado com os presentes Termos de Serviço."
      />
      <section className="policy__area pb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="policy__wrapper policy__translate p-relative z-index-1">
                <div className="policy__item mb-35">
                  <h4 className="policy__meta">1. Aceitação dos Termos</h4>
                  <p>
                    Ao acessar e utilizar o site da n-1 Edições, o usuário declara ter
                    lido, compreendido e concordado com os presentes Termos de Serviço.
                    Caso não concorde com quaisquer disposições aqui descritas,
                    recomendamos que não utilize o site.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">2. Sobre a n-1 Edições</h3>
                  <p>
                    Este e-commerce é operado por n-1 Edições, responsável pela
                    comercialização de livros e publicações editoriais por meio de sua
                    plataforma digital.
                  </p>
                  <p>Informações da empresa:</p>
                  <ul>
                    <li>Razão Social: N-1 Edições</li>
                    <li>CNPJ: 16509486000128</li>
                    <li>
                      Endereço: Rua Milton Ribeiro, 61 - Vila Guilherme - São Paulo
                    </li>
                    <li>
                      Contato:{" "}
                      <a href="mailto:comercial@n-1edicoes.org">
                        comercial@n-1edicoes.org
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">3. Uso do Site</h3>
                  <p>
                    O usuário compromete-se a utilizar o site apenas para finalidades
                    legítimas, respeitando a legislação vigente e os direitos de terceiros.
                  </p>
                  <p>É proibido:</p>
                  <ul>
                    <li>Utilizar o site para fins ilegais ou fraudulentos</li>
                    <li>Tentar acessar áreas restritas do sistema</li>
                    <li>Copiar ou reproduzir conteúdos sem autorização</li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">4. Produtos</h3>
                  <p>
                    Os produtos comercializados no site são livros e publicações editoriais.
                    A n-1 Edições se esforça para apresentar descrições e imagens precisas,
                    porém pequenas variações podem ocorrer.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">5. Preços</h3>
                  <p>
                    Todos os preços apresentados no site estão expressos em Reais (R$). Os
                    valores podem ser alterados sem aviso prévio, exceto para pedidos já
                    confirmados.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">6. Pagamentos</h3>
                  <p>
                    Os pagamentos podem ser realizados através dos meios disponibilizados
                    na plataforma, podendo incluir:
                  </p>
                  <ul>
                    <li>Cartão de crédito</li>
                    <li>Pix</li>
                    <li>Boleto bancário</li>
                    <li>Outros meios disponibilizados no checkout</li>
                  </ul>
                  <p>
                    O processamento do pagamento é realizado por provedores externos de
                    pagamento.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">7. Propriedade Intelectual</h3>
                  <p>
                    Todos os conteúdos presentes no site — incluindo textos, imagens, capas
                    de livros, logotipos e elementos gráficos — são protegidos por direitos
                    autorais e pertencem à n-1 Edições ou aos respectivos autores.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">8. Limitação de Responsabilidade</h3>
                  <p>
                    A n-1 Edições não se responsabiliza por:
                  </p>
                  <ul>
                    <li>Problemas decorrentes de uso inadequado do site</li>
                    <li>Interrupções temporárias da plataforma</li>
                    <li>Problemas técnicos externos</li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">9. Alterações dos Termos</h3>
                  <p>
                    Estes Termos de Serviço podem ser alterados a qualquer momento.
                    Recomendamos a revisão periódica desta página.
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

