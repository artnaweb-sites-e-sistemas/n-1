import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import SectionTop from "@components/terms-policy/section-top-bar";
import Footer from "@layout/footer";

export const metadata = {
  title: "N-1 Edições - Política de Privacidade",
};

export default function PoliticaDePrivacidade() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <SectionTop
        title="Política de Privacidade"
        subtitle="A n-1 Edições respeita a privacidade de seus usuários e está comprometida em proteger seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
      />
      <section className="policy__area pb-120">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="policy__wrapper policy__translate p-relative z-index-1">
                <div className="policy__item mb-35">
                  <h4 className="policy__meta">1. Introdução</h4>
                  <p>
                    Esta Política de Privacidade descreve como coletamos, utilizamos e
                    protegemos as informações fornecidas pelos usuários em nosso site.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">2. Dados coletados</h3>
                  <p>
                    Durante a navegação e realização de compras em nosso site, podemos
                    coletar os seguintes dados:
                  </p>
                  <ul>
                    <li>Nome completo</li>
                    <li>E-mail</li>
                    <li>CPF ou CNPJ</li>
                    <li>Endereço de entrega</li>
                    <li>Telefone</li>
                    <li>Informações de pagamento</li>
                    <li>Dados de navegação (IP, dispositivo, páginas visitadas)</li>
                  </ul>
                  <p>
                    Essas informações são necessárias para o funcionamento do e-commerce e
                    para a realização das compras.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">3. Uso das informações</h3>
                  <p>Os dados coletados podem ser utilizados para:</p>
                  <ul>
                    <li>Processamento de pedidos</li>
                    <li>Entrega de produtos</li>
                    <li>Comunicação com clientes</li>
                    <li>Envio de confirmações e atualizações de pedidos</li>
                    <li>Melhorar a experiência de navegação no site</li>
                    <li>Análise estatística de uso do site</li>
                  </ul>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">4. Compartilhamento de dados</h3>
                  <p>
                    Os dados pessoais podem ser compartilhados com parceiros necessários
                    para a operação da loja, como:
                  </p>
                  <ul>
                    <li>Plataformas de pagamento</li>
                    <li>Transportadoras ou serviços logísticos</li>
                    <li>Ferramentas de análise e marketing digital</li>
                  </ul>
                  <p>
                    Esses parceiros também devem cumprir as normas de proteção de dados
                    aplicáveis.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">5. Segurança dos dados</h3>
                  <p>
                    Adotamos medidas técnicas e administrativas para proteger os dados
                    pessoais contra acessos não autorizados, perda ou alteração indevida.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">6. Cookies</h3>
                  <p>
                    Nosso site utiliza cookies para melhorar a experiência do usuário.
                    Cookies são pequenos arquivos armazenados no navegador que permitem:
                  </p>
                  <ul>
                    <li>Reconhecer preferências do usuário</li>
                    <li>Melhorar a navegação no site</li>
                    <li>Analisar o comportamento de uso da plataforma</li>
                    <li>Personalizar conteúdos e funcionalidades</li>
                  </ul>
                  <p>Os tipos de cookies utilizados podem incluir:</p>
                  <ul>
                    <li>
                      <strong>Cookies essenciais</strong>: necessários para o funcionamento
                      do site.
                    </li>
                    <li>
                      <strong>Cookies de desempenho</strong>: utilizados para análise de
                      navegação e melhorias no site.
                    </li>
                    <li>
                      <strong>Cookies de funcionalidade</strong>: armazenam preferências do
                      usuário.
                    </li>
                  </ul>
                  <p>
                    O usuário pode configurar seu navegador para bloquear cookies, embora
                    isso possa afetar algumas funcionalidades do site.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">7. Direitos do titular de dados</h3>
                  <p>
                    Nos termos da LGPD, o usuário pode solicitar:
                  </p>
                  <ul>
                    <li>Acesso aos seus dados pessoais</li>
                    <li>Correção de dados incorretos</li>
                    <li>Exclusão de dados pessoais</li>
                    <li>Revogação de consentimento</li>
                    <li>Informações sobre compartilhamento de dados</li>
                  </ul>
                  <p>
                    Solicitações podem ser enviadas para:{" "}
                    <a href="mailto:comercial@n-1edicoes.org">comercial@n-1edicoes.org</a>.
                  </p>
                </div>

                <div className="policy__item mb-35">
                  <h3 className="policy__title">8. Alterações desta política</h3>
                  <p>
                    Esta Política de Privacidade pode ser atualizada periodicamente. A
                    versão mais recente estará sempre disponível no site.
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

