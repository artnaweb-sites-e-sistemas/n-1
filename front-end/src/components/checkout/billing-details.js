import ErrorMessage from "@components/error-message/error";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
// internal

const BillingDetails = ({ register, errors, calculateShippingByPostcode, watch, isCalculatingShipping, setValue }) => {
  const {user} = useSelector(state => state.auth);
  const { shipping_info } = useSelector((state) => state.order);
  const zipCodeValue = watch('zipCode');
  const [localCep, setLocalCep] = useState('');
  
  // Função para aplicar máscara de CEP (00000-000)
  const applyCepMask = (value) => {
    if (!value) return '';
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
  };
  
  // Inicializar CEP com máscara se já houver valor
  useEffect(() => {
    const initialCep = zipCodeValue || shipping_info?.zipCode || user?.zipCode || user?.cep || '';
    if (initialCep && !localCep) {
      const masked = applyCepMask(initialCep);
      setLocalCep(masked);
      // Atualizar o valor no formulário
      const cleanValue = initialCep.replace(/\D/g, '');
      if (cleanValue) {
        setValue('zipCode', cleanValue, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCodeValue, shipping_info, user]);
  
  // Handler para mudança no campo CEP
  const handleCepChange = (e) => {
    const value = e.target.value;
    const maskedValue = applyCepMask(value);
    setLocalCep(maskedValue);
    
    // Atualiza o valor no formulário (sem a máscara para validação)
    const cleanValue = maskedValue.replace(/\D/g, '');
    setValue('zipCode', cleanValue, { shouldValidate: true });
  };
  
  // Função para calcular frete ao clicar no botão
  const handleCalculateShipping = (e) => {
    e.preventDefault();
    const cepValue = localCep.replace(/\D/g, '') || watch('zipCode');
    if (cepValue && calculateShippingByPostcode) {
      calculateShippingByPostcode(cepValue);
    }
  };
  
  // checkout form list
  function CheckoutFormList({
    col,
    label,
    type = "text",
    placeholder,
    isRequired = true,
    name,
    register,
    error,
    defaultValue,
  }) {
    return (
      <div className={`col-md-${col}`}>
        <div className="checkout-form-list">
          {label && (
            <label>
              {label} {isRequired && <span className="required">*</span>}
            </label>
          )}
          <input
            {...register(`${name}`, {
              required: isRequired ? `${label} é obrigatório!` : false,
            })}
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue ? defaultValue : ""}
          />
          {error && <ErrorMessage message={error} />}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row">
        <CheckoutFormList
          name="firstName"
          col="12"
          label="Nome"
          placeholder="Nome"
          register={register}
          error={errors?.firstName?.message}
          defaultValue={user?.name?.split(' ')[0] || user?.name || ''}
        />
        <CheckoutFormList
          name="lastName"
          col="12"
          label="Sobrenome"
          placeholder="Sobrenome"
          register={register}
          error={errors?.lastName?.message}
          defaultValue={user?.lastName || user?.name?.split(' ').slice(1).join(' ') || ''}
        />
        <CheckoutFormList
          name="address"
          col="12"
          label="Endereço"
          placeholder="Rua"
          register={register}
          error={errors?.address?.message}
          defaultValue={user?.address || user?.shippingAddress}
        />
        <CheckoutFormList
          name="number"
          col="3"
          label="Nº"
          placeholder="Nº"
          register={register}
          error={errors?.number?.message}
          defaultValue={user?.number || user?.numero}
          isRequired={false}
        />
        <CheckoutFormList
          name="complement"
          col="9"
          label="Complemento"
          placeholder="Complemento"
          register={register}
          error={errors?.complement?.message}
          defaultValue={user?.complement}
          isRequired={false}
        />
        <CheckoutFormList
          col="12"
          label="Cidade"
          placeholder="Cidade"
          name="city"
          register={register}
          error={errors?.city?.message}
          defaultValue={user?.city}
        />
        <CheckoutFormList
          col="6"
          label="Estado"
          placeholder="Estado"
          name="country"
          register={register}
          error={errors?.country?.message}
          defaultValue={user?.country || user?.state}
        />
        <div className="col-md-6">
          <div className="checkout-form-list">
            <label>
              CEP <span className="required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                {...register('zipCode', {
                  required: 'CEP é obrigatório!',
                  validate: {
                    length: (value) => {
                      // O valor já vem sem máscara do setValue
                      const cleanValue = value ? String(value).replace(/\D/g, '') : '';
                      if (cleanValue.length !== 8) {
                        return 'CEP deve conter 8 dígitos';
                      }
                      return true;
                    }
                  }
                })}
                type="text"
                placeholder="00000-000"
                value={localCep}
                onChange={handleCepChange}
                maxLength={9}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleCalculateShipping}
                disabled={isCalculatingShipping}
                className="tp-btn tp-btn-black"
                style={{ 
                  padding: '10px 15px', 
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {isCalculatingShipping ? 'Calculando...' : 'Calcular Frete'}
              </button>
            </div>
            {errors?.zipCode?.message && <ErrorMessage message={errors.zipCode.message} />}
          </div>
        </div>
        <CheckoutFormList
          col="6"
          type="email"
          label="E-mail"
          placeholder="Seu e-mail"
          name="email"
          register={register}
          error={errors?.email?.message}
          defaultValue={user?.email}
        />
        <CheckoutFormList
          name="contact"
          col="6"
          label="Telefone"
          placeholder="Número de telefone"
          register={register}
          error={errors?.contact?.message}
          defaultValue={user?.phone || user?.contactNumber}
        />

        <div className="order-notes">
          <div className="checkout-form-list">
            <label>Observações do Pedido</label>
            <textarea
              id="checkout-mess"
              cols="30"
              rows="10"
              placeholder="Observações sobre seu pedido, ex: instruções especiais para entrega."
            ></textarea>
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingDetails;
