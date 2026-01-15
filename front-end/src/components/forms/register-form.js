'use client';
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from "yup";
import { useRouter } from "next/navigation";
// internal
import { Email, EyeCut, Lock, UserTwo } from "@svg/index";
import ErrorMessage from "@components/error-message/error";
import { useRegisterUserMutation } from "src/redux/features/auth/authApi";
import { notifyError, notifySuccess } from "@utils/toast";


const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório').label("Nome"),
  email: Yup.string().required('E-mail é obrigatório').email('E-mail inválido').label("E-mail"),
  password: Yup.string().required('Senha é obrigatória').min(6, 'A senha deve ter pelo menos 6 caracteres').label("Senha"),
  confirmPassword: Yup.string()
     .required('Confirmação de senha é obrigatória')
     .oneOf([Yup.ref('password'), null], 'As senhas devem coincidir')
     .label("Confirmar Senha")
});


const RegisterForm = () => {
  const [showPass, setShowPass] = useState(false);
  const [showConPass, setShowConPass] = useState(false);
  const [registerUser, {}] = useRegisterUserMutation();
  const router = useRouter();
  // react hook form
  const { register, handleSubmit, formState:{ errors },reset } = useForm({
    resolver: yupResolver(schema)
  });
  // on submit
  const onSubmit = (data) => {
    registerUser({
      name:data.name,
      email:data.email,
      password:data.password,
      confirmPassword:data.confirmPassword,
    }).then((result) => {
      if(result?.error){
        notifyError(result?.error?.data?.error || 'Falha no cadastro');
      }
      else {
        notifySuccess(result?.data?.message || 'Cadastro realizado com sucesso');
        setTimeout(() => {
          router.push("/user-dashboard");
        }, 500);
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
              {...register("name",{required:`Nome é obrigatório!`})}
              name="name"
              type="text"
              placeholder="Digite seu nome"
              id="name"
            />
            <span>
              <UserTwo />
            </span>
          </div>
           <ErrorMessage message={errors.name?.message} />
        </div>

        <div className="login__input-item">
          <div className="login__input">
            <input
             {...register("email",{required:`E-mail é obrigatório!`})}
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              id="email"
            />
            <span>
              <Email />
            </span>
          </div>
          <ErrorMessage message={errors.email?.message} />
        </div>

        <div className="login__input-item">
          <div className="login__input-item-inner p-relative">
            <div className="login__input">
              <input
                {...register("password",{required:`Senha é obrigatória!`})}
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
          </div>
          <ErrorMessage message={errors.password?.message} />
        </div>

        <div className="login__input-item">
          <div className="login__input-item-inner p-relative">
            <div className="login__input">
              <input
               {...register("confirmPassword")}
                name="confirmPassword"
                type={showConPass ? "text" : "password"}
                placeholder="Confirmar Senha"
                id="confirmPassword"
              />
              <span>
                <Lock />
              </span>
            </div>
            <span
              className="login-input-eye"
              onClick={() => setShowConPass(!showConPass)}
            >
              {showConPass ? <i className="fa-regular fa-eye"></i> : <EyeCut />}
            </span>
          </div>
          <ErrorMessage message={errors.confirmPassword?.message} />
        </div>
      </div>


      <div className="login__btn mt-25">
        <button type="submit" className="tp-btn w-100">
          Cadastrar
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
