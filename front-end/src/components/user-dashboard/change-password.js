'use client';
import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as Yup from "yup";
// internal
import { useChangePasswordMutation } from "src/redux/features/auth/authApi";
import ErrorMessage from "@components/error-message/error";
import { notifyError, notifySuccess } from "@utils/toast";

const schema = Yup.object().shape({
  password: Yup.string().required().min(6).label("Senha"),
  newPassword: Yup.string().required().min(6).label("Nova Senha"),
  confirmPassword: Yup.string()
     .oneOf([Yup.ref('newPassword'), null], 'As senhas devem coincidir')
});

const ChangePassword = () => {
  const { user } = useSelector((state) => state.auth);
  const [changePassword, {}] = useChangePasswordMutation();
  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // on submit
  const onSubmit = (data) => {
    changePassword({
      currentPassword: data.password,
      newPassword: data.newPassword,
    }).then((result) => {
      console.log(result)
      if (result?.error) {
        notifyError(result?.error?.data?.message || 'Erro ao alterar senha')
      }
      else {
        notifySuccess(result?.data?.message || 'Senha alterada com sucesso!')
      }
    });
    reset();
  };
  return (
    <div className="profile__password">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-xxl-12">
            <div className="profile__input-box">
              <h4>Senha Atual</h4>
              <div className="profile__input">
                <input
                  {...register("password", {
                    required: `Senha atual é obrigatória!`,
                  })}
                  type="password"
                  placeholder="Digite a senha atual"
                />
                <ErrorMessage message={errors.password?.message} />
              </div>
            </div>
          </div>
          <div className="col-xxl-6 col-md-6">
            <div className="profile__input-box">
              <h4>Nova Senha</h4>
              <div className="profile__input">
                <input
                  {...register("newPassword", {
                    required: `Nova senha é obrigatória!`,
                  })}
                  type="password"
                  placeholder="Digite a nova senha"
                />
                <ErrorMessage message={errors.newPassword?.message} />
              </div>
            </div>
          </div>
          {/* confirm password */}
          <div className="col-xxl-6 col-md-6">
            <div className="profile__input-box">
              <h4>Confirmar Senha</h4>
              <div className="profile__input">
                <input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Confirme a nova senha"
                />
                <ErrorMessage message={errors.confirmPassword?.message} />
              </div>
            </div>
          </div>
          <div className="col-xxl-6 col-md-6">
            <div className="profile__btn">
              <button type="submit" className="tp-btn-3">
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
