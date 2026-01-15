'use client';
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
// internal
import Email from "@svg/email";
import { useResetPasswordMutation } from "src/redux/features/auth/authApi";
import ErrorMessage from "@components/error-message/error";
import { notifyError, notifySuccess } from "@utils/toast";

const schema = Yup.object().shape({
  email: Yup.string().required('E-mail é obrigatório').email('E-mail inválido').label("E-mail"),
});

const ForgotForm = () => {
  const [resetPassword, {}] = useResetPasswordMutation();
  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });
  // onSubmit
  const onSubmit = (data) => {
    resetPassword({
      email: data.email, // Corrigido: backend espera 'email', não 'verifyEmail'
    }).then((result) => {
      console.log('[FORGOT PASSWORD] Resultado completo:', result);
      
      if(result?.error){
        notifyError(result?.error?.data?.message || 'Erro ao solicitar redefinição de senha')
      }
      else {
        const responseData = result.data?.data || result.data;
        const message = responseData?.message || 'Se o e-mail existir, você receberá um link para redefinir sua senha';
        
        // Se houver informações de debug (desenvolvimento ou email não enviado)
        if (responseData?.debug) {
          console.log('[FORGOT PASSWORD] Debug info:', responseData.debug);
          
          if (!responseData.debug.email_sent) {
            notifyError('Email NÃO foi enviado. Configure SMTP no WordPress. Verifique o console para mais detalhes.');
            console.error('[FORGOT PASSWORD] Email não foi enviado!');
            console.error('[FORGOT PASSWORD] Token:', responseData.debug.token);
            console.error('[FORGOT PASSWORD] Link direto:', responseData.debug.reset_link);
            console.error('[FORGOT PASSWORD] Plugin SMTP ativo:', responseData.debug.smtp_plugin_active);
            if (responseData.debug.smtp_plugin_name) {
              console.error('[FORGOT PASSWORD] Plugin SMTP:', responseData.debug.smtp_plugin_name);
            }
            if (responseData.debug.phpmailer_error) {
              console.error('[FORGOT PASSWORD] Erro PHPMailer:', responseData.debug.phpmailer_error);
            }
            console.error('[FORGOT PASSWORD] Nota:', responseData.debug.note);
          } else {
            // Email foi enviado, mas pode não ter chegado
            notifySuccess(message + ' (Verifique também a caixa de spam)');
            
            // Mostrar links de reset
            if (responseData.debug.reset_link) {
              console.log('[FORGOT PASSWORD] Link de reset (no email):', responseData.debug.reset_link);
            }
            if (responseData.debug.reset_link_debug && responseData.debug.reset_link_debug !== responseData.debug.reset_link) {
              console.log('[FORGOT PASSWORD] Link de reset (debug/teste):', responseData.debug.reset_link_debug);
              console.warn('[FORGOT PASSWORD] O email contém o link de produção. Use o link de debug apenas para testes locais.');
            }
            
            // Mostrar informações adicionais
            if (responseData.debug.smtp_plugin_active) {
              console.log('[FORGOT PASSWORD] Plugin SMTP ativo:', responseData.debug.smtp_plugin_name);
            } else {
              console.warn('[FORGOT PASSWORD] Nenhum plugin SMTP detectado. Email pode não ser enviado corretamente.');
            }
          }
        } else {
          notifySuccess(message);
        }
      }
    });
    reset();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="login__input-wrapper">
        <div className="login__input-item">
          <div className="login__input">
            <input {...register("email")} type="email" placeholder="Digite seu e-mail" />
            <span>
              <Email />
            </span>
          </div>
          <ErrorMessage message={errors.email?.message} />
        </div>
      </div>
      <div className="login__btn">
        <button type="submit" className="tp-btn w-100">
          Enviar Solicitação
        </button>
      </div>
    </form>
  );
};

export default ForgotForm;
