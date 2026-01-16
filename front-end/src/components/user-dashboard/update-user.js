'use client';
import React, { useState, useEffect } from "react";
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
  name: Yup.string().required('Nome é obrigatório').label("Nome"),
  lastName: Yup.string().label("Sobrenome"),
  email: Yup.string().required('E-mail é obrigatório').email('E-mail inválido').label("E-mail"),
  phone: Yup.string()
    .required('Telefone é obrigatório')
    .test('phone-length', 'Telefone deve ter 10 ou 11 dígitos', function(value) {
      if (!value) return this.createError({ message: 'Telefone é obrigatório' });
      const cleanValue = String(value).replace(/\D/g, '');
      if (cleanValue.length !== 10 && cleanValue.length !== 11) {
        return this.createError({ message: 'Telefone deve ter 10 ou 11 dígitos' });
      }
      return true;
    })
    .label("Telefone"),
  address: Yup.string().required('Endereço é obrigatório').label("Endereço"),
  number: Yup.string().label("Nº"),
  complement: Yup.string().label("Complemento"),
  zipCode: Yup.string()
    .test('zipcode-length', 'CEP deve conter 8 dígitos', function(value) {
      if (!value) return true;
      const cleanValue = String(value).replace(/\D/g, '');
      if (cleanValue.length !== 8) {
        return this.createError({ message: 'CEP deve conter 8 dígitos' });
      }
      return true;
    })
    .label("CEP"),
  city: Yup.string().label("Cidade"),
  country: Yup.string().label("Estado"),
  bio: Yup.string().required('Biografia é obrigatória').min(20, 'Biografia deve ter pelo menos 20 caracteres').label("Bio"),
});

const UpdateUser = () => {
  const [bioText, setBioText] = useState("Olá, esta é minha biografia...");
  const [localPhone, setLocalPhone] = useState('');
  const [localCep, setLocalCep] = useState('');
  const { user } = useSelector((state) => state.auth);

  const [updateProfile, {}] = useUpdateProfileMutation();
  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Função para aplicar máscara de telefone: (xx) xxxx-xxxx ou (xx) xxxxx-xxxx
  const applyPhoneMask = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    if (limitedNumbers.length === 0) return '';
    if (limitedNumbers.length <= 2) {
      return `(${limitedNumbers}`;
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      // Celular com 11 dígitos
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  // Função para aplicar máscara de CEP
  const applyCepMask = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 8);
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
  };

  // Inicializar valores com máscara e preencher campos
  useEffect(() => {
    if (user) {
      // Inicializar telefone com máscara
      const phoneValue = user?.phone || user?.contactNumber || '';
      if (phoneValue) {
        const maskedPhone = applyPhoneMask(phoneValue);
        setLocalPhone(maskedPhone);
        setValue('phone', phoneValue.replace(/\D/g, ''), { shouldValidate: false });
      }
      
      // Inicializar CEP com máscara
      const cepValue = user?.zipCode || user?.cep || '';
      if (cepValue) {
        const maskedCep = applyCepMask(cepValue);
        setLocalCep(maskedCep);
        setValue('zipCode', cepValue.replace(/\D/g, ''), { shouldValidate: false });
      }
      
      // Preencher outros campos
      // Separar nome completo em nome e sobrenome
      const fullName = user?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setValue('name', firstName, { shouldValidate: false });
      setValue('lastName', lastName, { shouldValidate: false });
      setValue('email', user?.email || '', { shouldValidate: false });
      setValue('address', user?.address || user?.shippingAddress || '', { shouldValidate: false });
      setValue('number', user?.number || user?.numero || '', { shouldValidate: false });
      setValue('complement', user?.complement || '', { shouldValidate: false });
      setValue('city', user?.city || '', { shouldValidate: false });
      setValue('country', user?.country || user?.state || '', { shouldValidate: false });
      setValue('bio', user?.bio || '', { shouldValidate: false });
      if (user?.bio) {
        setBioText(user.bio);
      }
    }
  }, [user, setValue]);

  // Handler para mudança no campo telefone
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const maskedValue = applyPhoneMask(value);
    setLocalPhone(maskedValue);
    
    // Atualiza o valor no formulário (sem a máscara para validação)
    const cleanValue = maskedValue.replace(/\D/g, '');
    setValue('phone', cleanValue, { shouldValidate: true });
  };

  // Handler para mudança no campo CEP
  const handleCepChange = (e) => {
    const value = e.target.value;
    const maskedValue = applyCepMask(value);
    setLocalCep(maskedValue);
    
    // Atualiza o valor no formulário (sem a máscara para validação)
    const cleanValue = maskedValue.replace(/\D/g, '');
    setValue('zipCode', cleanValue, { shouldValidate: true });
  };

  // on submit
  const onSubmit = (data) => {
    // Limpar telefone e CEP antes de enviar
    const cleanPhone = data.phone ? String(data.phone).replace(/\D/g, '') : '';
    const cleanZipCode = data.zipCode ? String(data.zipCode).replace(/\D/g, '') : '';
    
    // Combinar nome e sobrenome para o campo name
    const fullName = data.lastName ? `${data.name} ${data.lastName}`.trim() : data.name;
    
    updateProfile({
      id:user?._id,
      name: fullName,
      lastName: data.lastName || '',
      email:data.email,
      phone: cleanPhone,
      address:data.address,
      number: data.number || '',
      complement: data.complement || '',
      zipCode: cleanZipCode,
      city: data.city,
      country: data.country,
      bio:data.bio,
    }).then((result) => {
      console.log(result);
      if(result?.error){
        notifyError(result?.error?.data?.message || result?.error?.data?.error || 'Erro ao atualizar perfil');
      }
      else {
        notifySuccess(result?.data?.message || 'Perfil atualizado com sucesso');
        // Não resetar o formulário, apenas atualizar os valores locais se necessário
        // O Redux já atualiza o estado do usuário automaticamente
      }
    })
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
                  <span>
                    <UserTwo />
                  </span>
                  <input
                    {...register("name", { required: `Nome é obrigatório!` })}
                    type="text"
                    placeholder="Primeiro nome"
                    defaultValue={user?.name?.split(' ')[0] || ''}
                  />
                  <ErrorMessage message={errors.name?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <UserTwo />
                  </span>
                  <input
                    {...register("lastName", { required: false })}
                    type="text"
                    placeholder="Digite seu sobrenome"
                    defaultValue={user?.name?.split(' ').slice(1).join(' ') || user?.lastName || ''}
                  />
                  <ErrorMessage message={errors.lastName?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <EmailTwo />
                  </span>
                  <input
                    {...register("email", { required: `E-mail é obrigatório!` })}
                    type="email"
                    placeholder="Digite seu e-mail"
                    defaultValue={user?.email}
                  />
                  <ErrorMessage message={errors.email?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <MobileTwo />
                  </span>
                  <input
                    {...register("phone", { 
                      required: 'Telefone é obrigatório!',
                      validate: {
                        length: (value) => {
                          if (!value) return 'Telefone é obrigatório!';
                          const cleanValue = String(value).replace(/\D/g, '');
                          return (cleanValue.length === 10 || cleanValue.length === 11) || 'Telefone deve ter 10 ou 11 dígitos';
                        }
                      }
                    })}
                    type="text"
                    placeholder="(xx) xxxx-xxxx"
                    value={localPhone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                  <ErrorMessage message={errors.phone?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-4 col-md-4">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("zipCode", { 
                      required: false,
                      validate: {
                        length: (value) => {
                          if (!value) return true;
                          const cleanValue = String(value).replace(/\D/g, '');
                          return cleanValue.length === 8 || 'CEP deve conter 8 dígitos';
                        }
                      }
                    })}
                    type="text"
                    placeholder="CEP (00000-000)"
                    value={localCep}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  <ErrorMessage message={errors.zipCode?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-8 col-md-8">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("address", { required: 'Endereço é obrigatório!' })}
                    type="text"
                    placeholder="Digite seu endereço"
                    defaultValue={user?.address || user?.shippingAddress || ""}
                  />
                  <ErrorMessage message={errors.address?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-3 col-md-3">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("number", { required: false })}
                    type="text"
                    placeholder="Nº"
                    defaultValue={user?.number || user?.numero || ""}
                  />
                  <ErrorMessage message={errors.number?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-9 col-md-9">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("complement", { required: false })}
                    type="text"
                    placeholder="Complemento"
                    defaultValue={user?.complement || ""}
                  />
                  <ErrorMessage message={errors.complement?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("city", { required: false })}
                    type="text"
                    placeholder="Cidade"
                    defaultValue={user?.city || ""}
                  />
                  <ErrorMessage message={errors.city?.message} />
                </div>
              </div>
            </div>

            <div className="col-xxl-6 col-md-6">
              <div className="profile__input-box">
                <div className="profile__input">
                  <span>
                    <Location />
                  </span>
                  <input
                    {...register("country", { required: false })}
                    type="text"
                    placeholder="Estado"
                    defaultValue={user?.country || user?.state || ""}
                  />
                  <ErrorMessage message={errors.country?.message} />
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
