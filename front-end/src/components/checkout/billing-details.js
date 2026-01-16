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
    
    // Se não há números, retorna vazio
    if (!numbers) return '';
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
    }
  };
  
  // Flag para controlar se já inicializou
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Inicializar CEP com máscara apenas uma vez
  useEffect(() => {
    if (!isInitialized) {
      const initialCep = zipCodeValue || shipping_info?.zipCode || user?.zipCode || user?.cep || '';
      if (initialCep) {
        const masked = applyCepMask(initialCep);
        setLocalCep(masked);
        // Atualizar o valor no formulário
        const cleanValue = initialCep.replace(/\D/g, '');
        if (cleanValue) {
          setValue('zipCode', cleanValue, { shouldValidate: false });
        }
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Apenas na montagem inicial
  
  // Handler para mudança no campo CEP
  const handleCepChange = (e) => {
    const inputValue = e.target.value;
    
    // Se o campo está vazio, limpar ambos os estados
    if (!inputValue || inputValue.trim() === '') {
      setLocalCep('');
      setValue('zipCode', '', { shouldValidate: false });
      return;
    }
    
    // Extrair apenas números do valor digitado
    const numbers = inputValue.replace(/\D/g, '');
    
    // Se não há números após limpar, limpar o campo
    if (!numbers || numbers.length === 0) {
      setLocalCep('');
      setValue('zipCode', '', { shouldValidate: false });
      return;
    }
    
    // Aplicar máscara
    const maskedValue = applyCepMask(numbers);
    
    // Atualizar estado local com a máscara
    setLocalCep(maskedValue);
    
    // Atualizar valor no formulário sem máscara
    setValue('zipCode', numbers, { shouldValidate: true });
  };
  
  // Handler para quando o usuário pressiona backspace/delete
  const handleCepKeyDown = (e) => {
    // Se o campo está vazio e o usuário pressiona backspace/delete, garantir que está limpo
    if ((e.key === 'Backspace' || e.key === 'Delete') && localCep.length === 0) {
      setLocalCep('');
      setValue('zipCode', '', { shouldValidate: false });
    }
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
                onKeyDown={handleCepKeyDown}
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
