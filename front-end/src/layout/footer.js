import Link from "next/link";
import Image from "next/image";
// internal
import logo from '@assets/img/logo/logo-n-1-black.png';
import payment from '@assets/img/footer/footer-payment.png';
import SocialLinks from "@components/social";
import CopyrightText from "./copyright-text";

// single widget
function SingleWidget({ col, col_2, col_3, title, contents }) {
  return (
    <div
      className={`col-xxl-${col} col-xl-${col} col-lg-4 col-md-${col_2} col-sm-6`}
    >
      <div className={`footer__widget mb-50 footer-col-11-${col_3}`}>
        <h3 className="footer__widget-title">{title}</h3>
        <div className="footer__widget-content">
          <ul>
            {contents.map((l, i) => {
              // Verifica se é link externo (começa com http:// ou https://)
              const isExternal = l.url && (l.url.startsWith('http://') || l.url.startsWith('https://'));
              
              if (isExternal) {
                return (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                  </li>
                );
              }
              
              return (
                <li key={i}>
                  <Link href={l.url.startsWith('/') ? l.url : `/${l.url}`}>{l.title}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const Footer = () => {
  return (
    <>
      <footer>
        <div
          className="footer__area footer__style-4"
          data-bg-color="footer-bg-white"
        >
          <div className="footer__top">
            <div className="container">
              <div className="row">
                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6 col-sm-12">
                  <div className="footer__widget footer__widget-11 mb-50 footer-col-11-1">
                    <div className="footer__logo" style={{ marginTop: '20px', marginBottom: '20px' }}>
                      <Link href="/">
                        <Image 
                          src={logo} 
                          alt="logo" 
                          width={80}
                          height={28}
                          style={{ maxWidth: '80px', height: 'auto' }}
                        />
                      </Link>
                    </div>

                    <div className="footer__widget-content">
                      <div className="footer__info">
                        <p>
                          Fundada em 2011, em parceria com a Aalto University (Finlândia), 
                          a n-1 edições chega ao cenário editorial através da produção de 
                          livros-objeto numa área transdisciplinar, entre a filosofia, a estética, 
                          a clínica, a antropologia e a política.
                        </p>
                        <div className="footer__social footer__social-11">
                          <SocialLinks/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <SingleWidget
                  col="4"
                  col_2="6"
                  col_3="2"
                  title="Links Úteis"
                  contents={[
                    { url: "https://n-1edicoes.org/catalogo", title: "Catálogo" },
                    { url: "https://n-1edicoes.org/leituras/", title: "Leituras" },
                    { url: "https://loja.n-1edicoes.org/", title: "Loja" },
                    { url: "https://n-1edicoes.org/sobre-a-n-1/", title: "Sobre a N-1" },
                    { url: "https://n-1edicoes.org/contato/", title: "Contato" },
                  ]}
                />

                <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-6 col-sm-12">
                  <div className="footer__widget mb-50 footer-col-11-5">
                    <h3 className="footer__widget-title">Contato</h3>

                    <div className="footer__widget-content">
                      <p className="footer__text">
                        Entre em contato conosco através do e-mail ou visite nossa sede.
                      </p>
                      <div className="footer__contact">
                        <div className="footer__contact-mail">
                          <span>
                            <a href="mailto:comercial@n-1edicoes.org">
                              comercial@n-1edicoes.org
                            </a>
                          </span>
                        </div>
                        <div className="footer__contact-address" style={{ marginTop: '15px' }}>
                          <span style={{ display: 'block', lineHeight: '1.6' }}>
                            Rua 7 de Abril, 235, Conjunto 105<br />
                            República, São Paulo - SP, 01043-904
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <div className="container">
              <div className="footer__bottom-inner">
                <div className="row">
                  <div className="col-sm-6">
                    <div className="footer__copyright">
                      <CopyrightText />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="footer__payment text-sm-end">
                      <Image src={payment} alt="payment" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
