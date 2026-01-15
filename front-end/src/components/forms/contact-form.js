'use client';
import React from "react";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
// internal
import ErrorMessage from "@components/error-message/error";

const schema = Yup.object().shape({
  name: Yup.string().required().label("Name"),
  email: Yup.string().required().email().label("Email"),
  phone: Yup.string().required().min(11).label("Phone"),
  company: Yup.string().required().label("Company"),
  message: Yup.string().required().min(20).label("Message"),
});

const ContactForm = () => {
    // react hook form
  const { register, handleSubmit, formState:{ errors },reset } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => {
    console.log(data)
    reset();
  };

  return (
    <form id="contact-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-md-6">
          <div className="contact__input-2">
            <input
              name="name"
              {...register("name",{required:`Nome é obrigatório!`})}
              type="text"
              placeholder="Digite seu nome"
              id="name"
            />
            <ErrorMessage message={errors.name?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="contact__input-2">
            <input
              name="email"
              {...register("email",{required:`E-mail é obrigatório!`})}
              type="email"
              placeholder="Digite seu e-mail"
              id="email"
            />
            <ErrorMessage message={errors.email?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="contact__input-2">
            <input
              name="phone"
              {...register("phone",{required:`Telefone é obrigatório!`})}
              type="text"
              placeholder="Número de telefone"
              id="phone"
            />
            <ErrorMessage message={errors.phone?.message} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="contact__input-2">
            <input
              name="company"
              {...register("company",{required:`Empresa é obrigatória!`})}
              type="text"
              placeholder="Empresa"
              id="company"
            />
            <ErrorMessage message={errors.company?.message} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="contact__input-2">
            <textarea
              name="message"
              {...register("message",{required:`Mensagem é obrigatória!`})}
              id="message"
              placeholder="Sua mensagem"
            ></textarea>
            <ErrorMessage message={errors.message?.message} />
          </div>
        </div>
        <div className="col-md-12">
          <div className="contact__agree d-flex align-items-start mb-25">
            <input className="e-check-input" type="checkbox" id="e-agree" />
            <label className="e-check-label" htmlFor="e-agree">
              Estou de acordo com os termos de serviço e aceito a Política de Privacidade.
            </label>
          </div>
        </div>
        <div className="col-md-5">
          <div className="contact__btn-2">
            <button type="submit" className="tp-btn">
              Enviar Mensagem
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ContactForm;
