// internal
import EmailVerifyArea from "@components/email-verify-area";

export const metadata = {
  title: "N-1 Edições - Verificação de Email",
};
const EmailVerification = async ({ params }) => {
  const { token } = await params;
  return <EmailVerifyArea token={token} />;
};

export default EmailVerification;
