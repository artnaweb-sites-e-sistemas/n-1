import Footer from "@layout/footer";
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import ContactArea from "@components/contact/contact-area";

export const metadata = {
  title: "N-1 Edições - Contato",
};

export default function Contact() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <ContactArea />
      <Footer />
    </Wrapper>
  );
}
