import ErrorMessage from "@components/error-message/error";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { notifyError, notifySuccess } from "@utils/toast";
import {
  useCheckEmailExistsMutation,
  useLoginUserMutation,
} from "src/redux/features/auth/authApi";
import { fetchAddressByCep } from "@utils/cep";

const BillingDetails = ({
  register,
  errors,
  calculateShippingByPostcode,
  watch,
  isCalculatingShipping,
  setValue,
  getValues,
  fillCheckoutFields,
  openLoginModalEmail,
  onConsumeOpenLoginModalEmail,
}) => {
  const { user } = useSelector((state) => state.auth);
  const { shipping_info } = useSelector((state) => state.order);
  const zipCodeValue = watch("zipCode");
  const [localCep, setLocalCep] = useState("");

  const [checkEmailExists] = useCheckEmailExistsMutation();
  const [loginUser, { isLoading: isLoginLoading }] = useLoginUserMutation();

  const [showExistingEmailModal, setShowExistingEmailModal] = useState(false);
  const [modalEmailDisplay, setModalEmailDisplay] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const emailBlurTimerRef = useRef(null);
  const modalEmailRef = useRef("");
  const cepLookupAbortRef = useRef(null);
  const calculateShippingRef = useRef(calculateShippingByPostcode);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);

  calculateShippingRef.current = calculateShippingByPostcode;

  // Função para aplicar máscara de CEP (00000-000)
  const applyCepMask = (value) => {
    if (!value) return "";
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const limitedNumbers = numbers.slice(0, 8);
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    }
    return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`;
  };

  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const initialCep =
        zipCodeValue || shipping_info?.zipCode || user?.zipCode || user?.cep || "";
      if (initialCep) {
        const masked = applyCepMask(initialCep);
        setLocalCep(masked);
        const cleanValue = initialCep.replace(/\D/g, "");
        if (cleanValue) {
          setValue("zipCode", cleanValue, { shouldValidate: false });
        }
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCepChange = (e) => {
    const inputValue = e.target.value;
    if (!inputValue || inputValue.trim() === "") {
      setLocalCep("");
      setValue("zipCode", "", { shouldValidate: false });
      return;
    }
    const numbers = inputValue.replace(/\D/g, "");
    if (!numbers || numbers.length === 0) {
      setLocalCep("");
      setValue("zipCode", "", { shouldValidate: false });
      return;
    }
    const maskedValue = applyCepMask(numbers);
    setLocalCep(maskedValue);
    setValue("zipCode", numbers, { shouldValidate: true });
  };

  const handleCepKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const cepDigits =
        String(watch("zipCode") || "").replace(/\D/g, "") || localCep.replace(/\D/g, "");
      if (cepDigits.length === 8 && calculateShippingByPostcode) {
        calculateShippingByPostcode(cepDigits);
      }
      return;
    }
    if ((e.key === "Backspace" || e.key === "Delete") && localCep.length === 0) {
      setLocalCep("");
      setValue("zipCode", "", { shouldValidate: false });
    }
  };

  const handleEmailBlurCheck = useCallback(() => {
    if (user) return;
    if (typeof getValues !== "function") return;
    const email = String(getValues("email") || "")
      .trim()
      .toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    emailBlurTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkEmailExists({ email }).unwrap();
        if (res?.exists) {
          modalEmailRef.current = email;
          setModalEmailDisplay(email);
          setShowExistingEmailModal(true);
        }
      } catch {
        notifyError(
          "Não foi possível verificar o e-mail. Confira sua conexão ou tente novamente em instantes."
        );
      }
    }, 450);
  }, [user, getValues, checkEmailExists]);

  const clearEmailBlurTimer = () => {
    if (emailBlurTimerRef.current) {
      clearTimeout(emailBlurTimerRef.current);
      emailBlurTimerRef.current = null;
    }
  };

  useEffect(() => () => clearEmailBlurTimer(), []);

  useEffect(() => {
    if (!openLoginModalEmail || user) return;
    const em = String(openLoginModalEmail).trim().toLowerCase();
    if (!em) return;
    modalEmailRef.current = em;
    setModalEmailDisplay(em);
    setShowExistingEmailModal(true);
    onConsumeOpenLoginModalEmail?.();
  }, [openLoginModalEmail, user, onConsumeOpenLoginModalEmail]);

  // ViaCEP: ao completar 8 dígitos, preenche logradouro, cidade e UF (campo "Estado").
  useEffect(() => {
    const clean = localCep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setCepLookupLoading(false);
      return undefined;
    }

    if (cepLookupAbortRef.current) {
      cepLookupAbortRef.current.abort();
    }

    const controller = new AbortController();
    cepLookupAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setCepLookupLoading(true);
      try {
        const addr = await fetchAddressByCep(clean, controller.signal);
        if (controller.signal.aborted) return;

        if (!addr) {
          notifyError("CEP não encontrado. Confira os números.");
          return;
        }

        if (addr.street) {
          setValue("address", addr.street, { shouldValidate: true, shouldDirty: true });
        }
        if (addr.city) {
          setValue("city", addr.city, { shouldValidate: true, shouldDirty: true });
        }
        if (addr.state) {
          setValue("state", addr.state, { shouldValidate: true, shouldDirty: true });
        }
        if (addr.neighborhood) {
          setValue("neighborhood", addr.neighborhood, { shouldValidate: true, shouldDirty: true });
        }

        const shipFn = calculateShippingRef.current;
        if (typeof shipFn === "function") {
          shipFn(clean);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        notifyError("Não foi possível buscar o endereço pelo CEP. Tente de novo.");
      } finally {
        if (!controller.signal.aborted) {
          setCepLookupLoading(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [localCep, setValue, getValues]);

  const handleModalLogin = async (e) => {
    e.preventDefault();
    const email = modalEmailRef.current || getValues?.("email");
    if (!email || !modalPassword) {
      notifyError("Informe sua senha.");
      return;
    }
    try {
      await loginUser({ email, password: modalPassword }).unwrap();
      notifySuccess("Login realizado! Complete seu pedido.");
      setModalPassword("");
      setModalEmailDisplay("");
      setShowExistingEmailModal(false);
      if (typeof fillCheckoutFields === "function") {
        fillCheckoutFields();
      }
    } catch {
      notifyError("E-mail ou senha inválidos.");
    }
  };

  function CheckoutFormList({
    col,
    label,
    type = "text",
    placeholder,
    isRequired = true,
    name,
    register: reg,
    error,
    defaultValue,
    readOnly = false,
    helpText,
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
            {...reg(`${name}`, {
              required: isRequired ? `${label} é obrigatório!` : false,
            })}
            type={type}
            placeholder={placeholder}
            defaultValue={defaultValue ? defaultValue : ""}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            aria-readonly={readOnly || undefined}
            style={
              readOnly
                ? {
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    cursor: "not-allowed",
                  }
                : undefined
            }
          />
          {helpText && (
            <small
              style={{
                display: "block",
                marginTop: "4px",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              {helpText}
            </small>
          )}
          {error && <ErrorMessage message={error} />}
        </div>
      </div>
    );
  }

  const emailRegister = register("email", {
    required: "E-mail é obrigatório!",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "E-mail inválido",
    },
  });

  return (
    <>
      <div className="row">
        <CheckoutFormList
          name="firstName"
          col="6"
          label="Nome"
          placeholder="Nome"
          register={register}
          error={errors?.firstName?.message}
          defaultValue={user?.name?.split(" ")[0] || user?.name || ""}
        />
        <CheckoutFormList
          name="lastName"
          col="6"
          label="Sobrenome"
          placeholder="Sobrenome"
          register={register}
          error={errors?.lastName?.message}
          defaultValue={
            user?.lastName || user?.name?.split(" ").slice(1).join(" ") || ""
          }
        />

        <div className="col-md-6">
          <div className="checkout-form-list" style={{ position: "relative" }}>
            <label>
              CEP <span className="required">*</span>
            </label>
            {(cepLookupLoading || isCalculatingShipping) && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  fontSize: "12px",
                  color: "#64748b",
                  fontStyle: "italic",
                  whiteSpace: "nowrap",
                  lineHeight: "26px",
                }}
              >
                {cepLookupLoading ? "Buscando endereço…" : "Calculando frete…"}
              </span>
            )}
            <input
              {...register("zipCode", {
                required: "CEP é obrigatório!",
                validate: {
                  length: (value) => {
                    const cleanValue = value ? String(value).replace(/\D/g, "") : "";
                    if (cleanValue.length !== 8) {
                      return "CEP deve conter 8 dígitos";
                    }
                    return true;
                  },
                },
              })}
              type="text"
              placeholder="00000-000"
              value={localCep}
              onChange={handleCepChange}
              onKeyDown={handleCepKeyDown}
              maxLength={9}
              style={{ width: "100%" }}
            />
            {errors?.zipCode?.message && <ErrorMessage message={errors.zipCode.message} />}
          </div>
        </div>
        <CheckoutFormList
          col="6"
          label="Estado"
          placeholder="UF"
          name="state"
          register={register}
          error={errors?.state?.message}
          defaultValue={user?.state || user?.country}
          readOnly
        />

        <CheckoutFormList
          col="6"
          label="Cidade"
          placeholder="Cidade"
          name="city"
          register={register}
          error={errors?.city?.message}
          defaultValue={user?.city}
          readOnly
        />
        <CheckoutFormList
          col="6"
          label="Bairro"
          placeholder="Bairro"
          name="neighborhood"
          register={register}
          error={errors?.neighborhood?.message}
          defaultValue={user?.neighborhood}
          readOnly
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

        <div className="col-md-6">
          <div className="checkout-form-list">
            <label>
              E-mail <span className="required">*</span>
            </label>
            <input
              {...emailRegister}
              type="email"
              placeholder="Seu e-mail"
              defaultValue={user?.email}
              onFocus={clearEmailBlurTimer}
              onBlur={(ev) => {
                emailRegister.onBlur(ev);
                handleEmailBlurCheck();
              }}
            />
            {errors?.email && <ErrorMessage message={errors.email.message} />}
          </div>
        </div>

        {!user && (
          <>
            <div className="col-md-6">
              <div className="checkout-form-list">
                <label>
                  Cadastrar Senha <span className="required">*</span>
                </label>
                <input
                  {...register("checkoutPassword", {
                    required: "Defina uma senha para criar sua conta (mín. 6 caracteres).",
                    minLength: {
                      value: 6,
                      message: "A senha deve ter pelo menos 6 caracteres",
                    },
                  })}
                  type="password"
                  placeholder="Senha para sua conta"
                  autoComplete="new-password"
                />
                {errors?.checkoutPassword && (
                  <ErrorMessage message={errors.checkoutPassword.message} />
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="checkout-form-list">
                <label>
                  Confirmar senha <span className="required">*</span>
                </label>
                <input
                  {...register("checkoutConfirmPassword", {
                    required: "Confirme sua senha",
                    validate: (val) => {
                      if (typeof getValues !== "function") return true;
                      const p = getValues("checkoutPassword");
                      return val === p || "As senhas não coincidem";
                    },
                  })}
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />
                {errors?.checkoutConfirmPassword && (
                  <ErrorMessage message={errors.checkoutConfirmPassword.message} />
                )}
              </div>
            </div>
          </>
        )}

        <CheckoutFormList
          name="contact"
          col="6"
          label="Telefone"
          placeholder="Número de telefone"
          register={register}
          error={errors?.contact?.message}
          defaultValue={user?.phone || user?.contactNumber}
        />

        <div className="col-md-12">
          <div className="checkout-form-list">
            <label>
              CPF ou CNPJ <span className="required">*</span>
              <span style={{ fontWeight: 400, color: "#666", fontSize: 12, marginLeft: 8 }}>
                (obrigatório para pagamento com cartão — Mercado Pago)
              </span>
            </label>
            <input
              {...register("taxDocument", {
                required: "CPF ou CNPJ é obrigatório",
                validate: (v) => {
                  const d = String(v || "").replace(/\D/g, "");
                  if (d.length !== 11 && d.length !== 14) {
                    return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido";
                  }
                  return true;
                },
              })}
              type="text"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              defaultValue=""
            />
            {errors?.taxDocument && <ErrorMessage message={errors.taxDocument.message} />}
          </div>
        </div>

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

      <Modal
        show={showExistingEmailModal}
        onHide={() => {
          setShowExistingEmailModal(false);
          setModalPassword("");
          setModalEmailDisplay("");
        }}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.1rem" }}>E-mail já cadastrado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ marginBottom: 16 }}>
            Você já está cadastrado com esse e-mail. Deseja fazer login para continuar o checkout?
          </p>
          <form onSubmit={handleModalLogin}>
            <div className="checkout-form-list mb-3">
              <label>E-mail</label>
              <input
                type="email"
                className="form-control"
                value={modalEmailDisplay}
                readOnly
                disabled
              />
            </div>
            <div className="checkout-form-list mb-3">
              <label>Senha</label>
              <input
                type="password"
                className="form-control"
                placeholder="Sua senha"
                value={modalPassword}
                onChange={(ev) => setModalPassword(ev.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="submit"
                className="tp-btn"
                disabled={isLoginLoading}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "1px solid #000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#333";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.color = "#fff";
                }}
              >
                {isLoginLoading ? "Entrando..." : "Entrar e continuar"}
              </button>
              <button
                type="button"
                className="tp-btn"
                style={{
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "1px solid #000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.color = "#000";
                }}
                onClick={() => {
                  setShowExistingEmailModal(false);
                  setModalPassword("");
                  setModalEmailDisplay("");
                }}
              >
                Alterar e-mail
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BillingDetails;
