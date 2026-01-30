import Header from "@layout/header";
import Footer from "@layout/footer";
import Wrapper from "@layout/wrapper";
import RegisterArea from "@components/login-register/register-area";

export const metadata = {
  title: "N-1 Edições - Cadastro",
};

export default function Register() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <RegisterArea />
      <Footer />
    </Wrapper>
  );
}
