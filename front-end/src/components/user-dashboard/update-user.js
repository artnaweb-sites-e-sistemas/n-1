'use client';
import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as Yup from "yup";
// internal
import { EmailTwo, Location, MobileTwo, UserTwo } from "@svg/index";
import { useUpdateProfileMutation } from "src/redux/features/auth/authApi";
import { notifyError, notifySuccess } from "@utils/toast";
import ErrorMessage from "@components/error-message/error";

// yup  schema
const schema = Yup.object().shape({
  name: Yup.string().required().label("Nome"),
  email: Yup.string().required().email().label("E-mail"),
  phone: Yup.string().required().min(11).label("Telefone"),
  address: Yup.string().required().label("Endereço"),
  bio: Yup.string().required().min(20).label("Bio"),
});

const UpdateUser = () => {
  const [bioText, setBioText] = useState("Olá, esta é minha biografia...");
  const { user } = useSelector((state) => state.auth);

  const [updateProfile, {}] = useUpdateProfileMutation();
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
    updateProfile({
      id:user?._id,
      name:data.name,
      email:data.email,
      phone:data.phone,
      address:data.address,
      bio:data.bio,
    }).then((result) => {
      console.log(result);
      if(result?.error){
        notifyError(result?.error?.data?.message);
      }
      else {
        notifySuccess(result?.data?.message);
      }
    })
    reset();
  };

  return (
    <div className="profile__info">
      <h3 className="profile__info-title">Detalhes Pessoais</h3>
      <div className="profile__info-content">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <input
                    {...register("name", { required: `Nome é obrigatório!` })}
                    type="text"
                    placeholder="Digite seu nome"
                    defaultValue={user?.name}
                  />
                  <span>
                    <UserTwo />
                  </span>
                  <ErrorMessage message={errors.name?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <input
                    {...register("email", { required: `E-mail é obrigatório!` })}
                    type="email"
                    placeholder="Digite seu e-mail"
                    defaultValue={user?.email}
                  />
                  <span>
                    <EmailTwo />
                  </span>
                  <ErrorMessage message={errors.email?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-12">
              <div className="profile__input-box">
                <div className="profile__input">
                  <input
                    {...register("phone", { required: true })}
                    type="text"
                    placeholder="Digite seu telefone"
                    defaultValue=""
                  />
                  <span>
                    <MobileTwo />
                  </span>
                  <ErrorMessage message={errors.phone?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-12">
              <div className="profile__input-box">
                <div className="profile__input">
                  <input
                    {...register("address", { required: true })}
                    type="text"
                    placeholder="Digite seu endereço"
                    defaultValue=""
                  />
                  <span>
                    <Location />
                  </span>
                  <ErrorMessage message={errors.address?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-12">
              <div className="profile__input-box">
                <div className="profile__input">
                  <textarea
                    {...register("bio", { required: true })}
                    placeholder="Digite sua biografia"
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                  >
                    Olá, esta é minha biografia...
                  </textarea>
                  <ErrorMessage message={errors.bio?.message} />
                </div>
              </div>
            </div>
            <div className="col-xxl-12">
              <div className="profile__btn">
                <button type="submit" className="tp-btn">
                  Atualizar Perfil
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateUser;
