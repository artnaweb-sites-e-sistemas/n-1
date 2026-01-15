import Link from "next/link";
// internal
import Shapes from "@components/login-register/shapes";
import ForgotForm from "@components/forms/forgot-form";

const ForgotArea = () => {
  return (
    <section className="login__area pt-110 pb-110">
      <div className="container">
        <div className="login__inner p-relative z-index-1">
          <Shapes />
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-8 col-md-10">
              <div className="login__wrapper">
                <div className="login__top mb-30 text-center">
                  <h3 className="login__title">Esqueceu a Senha?</h3>
                  <p>Digite seu endereço de e-mail para solicitar a redefinição de senha.</p>
                </div>
                <div className="login__form">
                  {/* forgot form start */}
                  <ForgotForm/>
                  {/* forgot form end */}
                  <div className="login__register-now">
                    <p>
                      Lembrou sua senha? <Link href="/login">Fazer login</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotArea;
