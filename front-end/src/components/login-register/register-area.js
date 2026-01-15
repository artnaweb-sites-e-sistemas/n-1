import Link from "next/link";
// internal
import Shapes from "./shapes";
import RegisterForm from "@components/forms/register-form";

const RegisterArea = () => {
  return (
    <section className="login__area pt-110 pb-110">
      <div className="container">
        <div className="login__inner p-relative z-index-1">
          <Shapes />
          <div className="row justify-content-center">
            <div className="col-xl-6 col-lg-8 col-md-10">
              <div className="login__wrapper">
                <div className="login__top mb-30 text-center">
                  <h3 className="login__title">Cadastre-se agora!</h3>
                  <p>Preencha os dados abaixo para criar sua conta</p>
                </div>
                <div className="login__form">
                  {/* register form start */}
                  <RegisterForm/>
                  {/* register form end */}
                  <div className="login__register-now">
                    <p>
                      Já tem uma conta? <Link href="/login">Fazer login</Link>
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

export default RegisterArea;
