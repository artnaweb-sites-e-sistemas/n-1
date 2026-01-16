'use client';
import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
// internal
import { EyeCut, Lock, UserTwo } from "@svg/index";
import ErrorMessage from "@components/error-message/error";
import { useLoginUserMutation } from "src/redux/features/auth/authApi";
import { notifyError, notifySuccess } from "@utils/toast";
import { useRouter } from "next/navigation";

const schema = Yup.object().shape({
  email: Yup.string().required('E-mail é obrigatório').email('E-mail inválido').label("E-mail"),
  password: Yup.string().required('Senha é obrigatória').min(6, 'A senha deve ter pelo menos 6 caracteres').label("Senha"),
});

const LoginForm = ({ onCheckoutLogin }) => {
  const [showPass, setShowPass] = useState(false);
  const [loginUser, {}] = useLoginUserMutation();
  const router = useRouter();
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
    loginUser({
      email: data.email,
      password: data.password,
    })
      .then((result) => {
        if(result?.error){
          notifyError(result?.error?.data?.error);
          console.log(result?.error?.data?.error,'error message');
        }
        else {
          notifySuccess("Login realizado com sucesso");
          // Se estiver no checkout, não redirecionar e chamar callback
          if (onCheckoutLogin) {
            onCheckoutLogin();
          } else {
            setTimeout(() => {
              router.push("/user-dashboard");
            },500)
          }
          console.log(result?.data?.message,'success message');
        }
      })
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="login__input-wrapper">
        <div className="login__input-item">
          <div className="login__input">
            <input
              {...register("email")}
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              id="email"
            />
            <span>
              <UserTwo />
            </span>
          </div>
          <ErrorMessage message={errors.email?.message} />
        </div>

        <div className="login__input-item">
          <div className="login__input-item-inner p-relative">
            <div className="login__input">
              <input
                {...register("password")}
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="Senha"
                id="password"
              />
              <span>
                <Lock />
              </span>
            </div>
            <span
              className="login-input-eye"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <i className="fa-regular fa-eye"></i> : <EyeCut />}
            </span>
            {/* error msg start */}
            <ErrorMessage message={errors.password?.message} />
            {/* error msg end */}
          </div>
        </div>
      </div>

      <div className="login__option mb-25 d-sm-flex justify-content-between">
        <div className="login__remember">
          <input type="checkbox" id="tp-remember" />
          <label htmlFor="tp-remember">Lembrar-me</label>
        </div>
        <div className="login__forgot">
          <Link href="/forgot">esqueceu a senha?</Link>
        </div>
      </div>
      <div className="login__btn">
        <button type="submit" className="tp-btn w-100">
          Entrar
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
