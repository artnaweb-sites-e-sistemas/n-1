'use client';
import { isCouponExpired } from "@utils/coupon-expiry.mjs";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//internal import
import { notifyError, notifySuccess } from "@utils/toast";
import { useValidateCouponMutation } from "src/redux/features/coupon/couponApi";
import { set_coupon } from "src/redux/features/coupon/couponSlice";
import useCartInfo from "./use-cart-info";
import { set_shipping } from "src/redux/features/order/orderSlice";
import {
  useAddOrderMutation,
  useCreateMercadoPagoTransparentPaymentMutation,
  useCalculateShippingMutation,
} from "src/redux/features/order/orderApi";
import {
  useUpdateProfileMutation,
  useRegisterUserMutation,
  useCheckEmailExistsMutation,
} from "src/redux/features/auth/authApi";

const useCheckoutSubmit = (directProduct = null) => {
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();
  const paymentRunningRef = useRef(false);
  const couponAttemptRef = useRef(null);
  const [addOrder, {}] = useAddOrderMutation();
  const [createMercadoPagoTransparentPayment, {}] =
    useCreateMercadoPagoTransparentPaymentMutation();
  const [calculateShipping, { isLoading: isCalculatingShipping }] = useCalculateShippingMutation();
  const mercadoPagoCardRef = useRef(null);
  const [updateProfile, {}] = useUpdateProfileMutation();
  const [registerUser] = useRegisterUserMutation();
  const [checkEmailExists] = useCheckEmailExistsMutation();
  const lastShippingPostcodeRef = useRef("");
  
  const { cart_products } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { shipping_info } = useSelector((state) => state.order);
  
  // Se houver produto direto, usar apenas ele, senão usar o carrinho
  const productsToUse = directProduct ? [directProduct] : cart_products;
  
  // Calcular total manualmente se for produto direto
  const calculateDirectTotal = () => {
    if (!directProduct) return null;
    const { originalPrice, orderQuantity = 1, discount } = directProduct;
    let itemPrice = originalPrice;
    if (discount && discount > 0) {
      itemPrice = originalPrice - (originalPrice * discount / 100);
    }
    return itemPrice * orderQuantity;
  };
  
  const directTotal = directProduct ? calculateDirectTotal() : null;
  const { total, setTotal } = useCartInfo();
  const finalTotal = directTotal !== null ? directTotal : total;
  const [couponInfo, setCouponInfo] = useState({});
  const [cartTotal, setCartTotal] = useState(0);
  const [minimumAmount, setMinimumAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountProductType, setDiscountProductType] = useState("");
  const [isCheckoutSubmit, setIsCheckoutSubmit] = useState(false);
  const [cardError, setCardError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'pix' (boleto removido)
  const [shippingError, setShippingError] = useState(false);
  /** Quando o submit detecta e-mail já cadastrado, abre o modal de login no BillingDetails */
  const [openLoginModalEmail, setOpenLoginModalEmail] = useState(null);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const store = useStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm();

  const couponRef = useRef("");

  useEffect(() => {
    if (paymentMethod === "boleto") {
      setPaymentMethod("card");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod === "pix") {
      clearErrors("cardholderName");
    }
  }, [paymentMethod, clearErrors]);

  const clearCoupon = () => {
    couponAttemptRef.current = null;
    setCouponInfo({});
    setDiscountPercentage(0);
    setMinimumAmount(0);
    setDiscountProductType("");
    setDiscountAmount(0);
    dispatch(set_coupon(null));
  };

  const checkoutEmail = watch("email") || user?.email || "";
  const couponContext = JSON.stringify({
    cart: productsToUse.map((item) => [item._id || item.id, item.orderQuantity || 1, item.originalPrice, item.discount]),
    email: checkoutEmail.trim().toLowerCase(),
    shippingCost,
  });
  const [verifiedCouponContext, setVerifiedCouponContext] = useState("");
  const makeCouponRequest = (code, email = checkoutEmail) => {
    let attempt;
    try {
      const saved = JSON.parse(sessionStorage.getItem("couponCheckoutAttempt") || "null");
      const [context, savedCode] = JSON.parse(saved?.context || "[]");
      if (context === couponContext && savedCode?.toLowerCase() === code.toLowerCase()) attempt = saved.id;
    } catch {}
    return { couponInfo: { couponCode: code }, cart: productsToUse, email, shippingCost, checkoutAttempt: attempt };
  };
  const saveCouponQuote = (quote) => {
    setCouponInfo(quote);
    setVerifiedCouponContext(couponContext);
    dispatch(set_coupon(quote));
  };
  const couponError = (error) => error?.data?.message || "Não foi possível validar o cupom. Tente novamente.";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("couponInfo") || "null");
      if (saved?.couponCode) setCouponInfo({ couponCode: saved.couponCode });
    } catch { clearCoupon(); }
  }, []);

  // Revalidar ao alterar produtos, quantidades, e-mail ou frete. Ignorar respostas antigas.
  useEffect(() => {
    if (!couponInfo?.couponCode || !checkoutEmail) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const quote = await validateCoupon(makeCouponRequest(couponInfo.couponCode)).unwrap();
        if (active) saveCouponQuote(quote);
      } catch (error) {
        if (active) {
          setVerifiedCouponContext("");
          if (error?.status === 400) clearCoupon();
          notifyError(couponError(error));
        }
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [couponContext, couponInfo?.couponCode]);

  useEffect(() => {
    if (!couponInfo?.couponCode) return;
    const check = () => {
      if (isCouponExpired(couponInfo)) {
        clearCoupon();
        notifyError("Este cupom está expirado e foi removido.");
      }
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [couponInfo]);

  useEffect(() => {
    const verified = couponInfo?.couponCode && verifiedCouponContext === couponContext;
    const discount = verified ? Number(couponInfo.discountValue || 0) : 0;
    const subtotal = verified ? Number(couponInfo.subTotal) : finalTotal;
    setDiscountAmount(discount);
    setCartTotal(Number((Math.max(0, subtotal - discount) + shippingCost).toFixed(2)));
  }, [couponInfo, verifiedCouponContext, couponContext, finalTotal, shippingCost]);

  const handleCouponCode = async (e) => {
    e.preventDefault();
    const code = couponRef.current?.value?.trim();
    if (!code) return notifyError("Por favor, insira um código de cupom!");
    try {
      couponAttemptRef.current = null;
      const quote = await validateCoupon(makeCouponRequest(code)).unwrap();
      saveCouponQuote(quote);
      notifySuccess(`Cupom ${quote.couponCode} aplicado com sucesso!`);
    } catch (error) {
      notifyError(couponError(error));
    }
  };

  // handleShippingCost
  const handleShippingCost = (value, shippingId = '') => {
    setShippingCost(value);
    setSelectedShippingId(shippingId);
  };

  /** Mensagem amigável para falha ao salvar pedido (ex.: 409 estoque). */
  const getAddOrderErrorMessage = (error, fallback) => {
    const status = error?.status ?? error?.data?.status ?? error?.data?.data?.status;
    const message =
      error?.data?.message ||
      error?.data?.data?.message ||
      error?.error ||
      "";
    if (status === 409 || error?.data?.code === "products_unavailable") {
      return (
        message ||
        "Alguns produtos do carrinho estão indisponíveis. Atualize o carrinho e tente novamente."
      );
    }
    return message || fallback;
  };

  // calculateShippingByPostcode
  const calculateShippingByPostcode = async (postcode) => {
    if (!postcode) {
      notifyError("Por favor, digite o CEP");
      return;
    }

    // Limpar CEP (remover traços e espaços)
    const cleanPostcode = postcode.replace(/[^0-9]/g, '');
    
    if (cleanPostcode.length !== 8) {
      notifyError("CEP inválido. Deve conter 8 dígitos.");
      lastShippingPostcodeRef.current = "";
      setShippingOptions([]);
      setSelectedShippingId("");
      setShippingCost(0);
      return;
    }

    console.log('[FRETE] Calculando frete para CEP:', cleanPostcode);

    try {
      const result = await calculateShipping({
        postcode: cleanPostcode,
        cart_products: productsToUse,
      });

      console.log('[FRETE] Resultado completo:', result);

      if (result?.error) {
        console.error('[FRETE] Erro na resposta:', result.error);
        notifyError(result.error?.data?.message || "Erro ao calcular frete");
        setShippingOptions([]);
        lastShippingPostcodeRef.current = "";
        return;
      }

      const options = result?.data?.shipping_options || [];
      console.log('[FRETE] Opções de frete recebidas:', options);
      
      if (options.length === 0) {
        notifyError(result?.data?.message || "Nenhum método de envio disponível para este CEP");
        setShippingOptions([]);
        setShippingCost(0);
        setSelectedShippingId('');
        lastShippingPostcodeRef.current = "";
        return;
      }

      lastShippingPostcodeRef.current = cleanPostcode;
      setShippingOptions(options);
      setShippingError(false); // Limpar erro quando frete for calculado
      notifySuccess(`${options.length} opção(ões) de frete encontrada(s)`);
      
      // Selecionar a primeira opção automaticamente
      handleShippingCost(options[0].cost, options[0].id);
      
    } catch (error) {
      console.error('[FRETE] Erro ao calcular frete:', error);
      notifyError("Erro ao calcular frete. Verifique o CEP e tente novamente.");
      setShippingOptions([]);
      lastShippingPostcodeRef.current = "";
    }
  };

  // Função para preencher campos do checkout
  const fillCheckoutFields = React.useCallback(() => {
    if (user) {
      // Se o usuário estiver logado, preencher com seus dados
      // Usar lastName do usuário se disponível, senão separar do name
      const userLastName = user.lastName || '';
      const userName = user.name || '';
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = userLastName || nameParts.slice(1).join(' ') || '';
      
      setValue("firstName", shipping_info.firstName || firstName);
      setValue("lastName", shipping_info.lastName || lastName);
      setValue("address", shipping_info.address || user.address || user.shippingAddress || '');
      setValue("number", shipping_info.number || user.number || user.numero || '');
      setValue("complement", shipping_info.complement || user.complement || '');
      setValue("city", shipping_info.city || user.city || '');
      // Campo do formulário é "state" (UF). Aceita legado shipping_info.country / user.country.
      setValue(
        "state",
        shipping_info.state || shipping_info.country || user.state || user.country || ''
      );
      setValue("zipCode", shipping_info.zipCode || user.zipCode || user.cep || '');
      setValue("email", shipping_info.email || user.email || '');
      setValue("contact", shipping_info.contact || user.phone || user.contactNumber || '');
    } else {
      // Se não estiver logado, usar shipping_info
      setValue("firstName", shipping_info.firstName || '');
      setValue("lastName", shipping_info.lastName || '');
      setValue("address", shipping_info.address || '');
      setValue("number", shipping_info.number || '');
      setValue("complement", shipping_info.complement || '');
      setValue("city", shipping_info.city || '');
      setValue("state", shipping_info.state || shipping_info.country || '');
      setValue("zipCode", shipping_info.zipCode || '');
      setValue("email", shipping_info.email || '');
      setValue("contact", shipping_info.contact || '');
    }
  }, [user, setValue, shipping_info]);

  //set values - preencher com dados do usuário se estiver logado, senão usar shipping_info
  useEffect(() => {
    fillCheckoutFields();
  }, [fillCheckoutFields]);

  // Limpar frete só quando o CEP mudar de fato (evita perder seleção após erro de validação)
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name !== "zipCode") return;
      const cleanZipCode = value.zipCode ? String(value.zipCode).replace(/\D/g, "") : "";
      const calculatedFor = lastShippingPostcodeRef.current;

      if (cleanZipCode.length !== 8) {
        if (calculatedFor) {
          setShippingOptions([]);
          setSelectedShippingId("");
          setShippingCost(0);
          lastShippingPostcodeRef.current = "";
        }
        return;
      }

      if (
        calculatedFor &&
        cleanZipCode !== calculatedFor
      ) {
        setShippingOptions([]);
        setSelectedShippingId("");
        setShippingCost(0);
        lastShippingPostcodeRef.current = "";
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // submitHandler
  const submitHandler = async (data) => {
    console.log('[CHECKOUT] submitHandler iniciado com dados:', data);
    
    if (paymentRunningRef.current) return;

    // Garantir que o CEP está sem máscara
    const cleanZipCode = data.zipCode ? String(data.zipCode).replace(/\D/g, '') : '';
    console.log('[CHECKOUT] CEP limpo:', cleanZipCode);
    
    // Validar CEP
    if (!cleanZipCode || cleanZipCode.length !== 8) {
      console.log('[CHECKOUT] Erro: CEP inválido');
      notifyError("Por favor, informe um CEP válido");
      setIsCheckoutSubmit(false);
      return;
    }
    
    if (!user) {
      let chk;
      try {
        chk = await checkEmailExists({ email: data.email }).unwrap();
      } catch {
        notifyError(
          "Não foi possível verificar o e-mail. Confira sua conexão, atualize a página e tente novamente."
        );
        setIsCheckoutSubmit(false);
        return;
      }
      if (chk?.exists) {
        const em = String(data.email || "")
          .trim()
          .toLowerCase();
        setOpenLoginModalEmail(em);
        notifyError(
          "Este e-mail já possui cadastro. Informe sua senha no modal para entrar e concluir o pedido."
        );
        setIsCheckoutSubmit(false);
        return;
      }

      const pwd = (data.checkoutPassword || "").trim();
      const confirm = (data.checkoutConfirmPassword || "").trim();
      if (!pwd || pwd.length < 6) {
        notifyError(
          "Defina uma senha com pelo menos 6 caracteres para criar sua conta ao finalizar."
        );
        setIsCheckoutSubmit(false);
        return;
      }
      if (pwd !== confirm) {
        notifyError("As senhas não coincidem.");
        setIsCheckoutSubmit(false);
        return;
      }
    }

    // Validar se o frete foi calculado
    // Verificar se há opções de frete disponíveis e se uma foi selecionada
    if (shippingOptions.length === 0 || !selectedShippingId) {
      console.log('[CHECKOUT] Erro: Frete não calculado. shippingOptions:', shippingOptions.length, 'selectedShippingId:', selectedShippingId);
      setShippingError(true);
      notifyError(
        "Informe um CEP válido e aguarde o cálculo do frete; em seguida escolha uma opção de envio antes de finalizar."
      );
      setIsCheckoutSubmit(false);
      return;
    }
    
    // Limpar erro de frete se tudo estiver ok
    setShippingError(false);
    
    console.log('[CHECKOUT] Validações passadas. Prosseguindo com checkout...');
    dispatch(set_shipping(data));
    setIsCheckoutSubmit(true);
    
    const cleanTaxDoc = data.taxDocument
      ? String(data.taxDocument).replace(/\D/g, "")
      : "";

    if (paymentMethod === "card") {
      if (!cleanTaxDoc || (cleanTaxDoc.length !== 11 && cleanTaxDoc.length !== 14)) {
        notifyError("Informe CPF ou CNPJ válido nos dados de cobrança.");
        setIsCheckoutSubmit(false);
        return;
      }
      if (!data.cardholderName || !String(data.cardholderName).trim()) {
        notifyError("Informe o nome impresso no cartão.");
        setIsCheckoutSubmit(false);
        return;
      }
    }

    if (paymentMethod === "pix") {
      if (!cleanTaxDoc || (cleanTaxDoc.length !== 11 && cleanTaxDoc.length !== 14)) {
        notifyError("Informe CPF ou CNPJ válido nos dados de cobrança para pagar com PIX.");
        setIsCheckoutSubmit(false);
        return;
      }
    }

    // UF fica em data.state (antes o form usava o nome "country").
    const uf = String(data.state || data.country || "").trim().toUpperCase();

    let confirmedQuote = null;
    if (couponInfo?.couponCode) {
      try {
        confirmedQuote = await validateCoupon(makeCouponRequest(couponInfo.couponCode, data.email)).unwrap();
        saveCouponQuote(confirmedQuote);
        if (Math.abs(confirmedQuote.totalAmount - cartTotal) > 0.01) {
          notifyError("O desconto ou total mudou. Confira os valores e finalize novamente.");
          setIsCheckoutSubmit(false);
          return;
        }
      } catch (error) {
        clearCoupon();
        notifyError(couponError(error));
        setIsCheckoutSubmit(false);
        return;
      }
    }

    if (confirmedQuote) {
      const attemptContext = JSON.stringify([couponContext, confirmedQuote.couponCode, confirmedQuote.totalAmount, paymentMethod]);
      let savedAttempt;
      try { savedAttempt = JSON.parse(sessionStorage.getItem("couponCheckoutAttempt") || "null"); } catch {}
      couponAttemptRef.current = savedAttempt?.context === attemptContext ? savedAttempt.id : crypto.randomUUID();
      sessionStorage.setItem("couponCheckoutAttempt", JSON.stringify({ context: attemptContext, id: couponAttemptRef.current }));
    }
    let orderInfo = {
      checkoutAttempt: confirmedQuote ? couponAttemptRef.current : undefined,
      name: `${data.firstName} ${data.lastName}`,
      address: data.address,
      number: data.number || "",
      complement: data.complement || "",
      neighborhood: data.neighborhood || "",
      contact: data.contact,
      email: data.email,
      city: data.city,
      state: uf,
      country: "BR",
      zipCode: cleanZipCode,
      cpf: cleanTaxDoc,
      taxDocument: cleanTaxDoc,
      orderNote: data.orderNote ? String(data.orderNote).trim() : "",
      cardholderName: data.cardholderName,
      shippingOption: data.shippingOption,
      status: "pending",
      cart: productsToUse,
      subTotal: finalTotal,
      shippingCost: shippingCost,
      discount: confirmedQuote?.discountValue || 0,
      couponInfo: confirmedQuote,
      totalAmount: confirmedQuote?.totalAmount ?? cartTotal,
      user: user?._id ? `${user._id}` : null,
      paymentMethod: paymentMethod,
      _guestPassword: !user ? String(data.checkoutPassword || "").trim() : undefined,
    };

    if (paymentRunningRef.current) return;
    paymentRunningRef.current = true;
    try { await handleCheckoutPayment(orderInfo); }
    finally { paymentRunningRef.current = false; }
  };

  const handleCheckoutPayment = async (order) => {
    const orderPaymentMethod = order.paymentMethod || paymentMethod;

    if (orderPaymentMethod === "pix") {
      try {
        const nameParts = (order.name || "").trim().split(/\s+/);
        const payer_first_name = nameParts[0] || "Cliente";
        const payer_last_name = nameParts.slice(1).join(" ") || payer_first_name;

        const payResult = await createMercadoPagoTransparentPayment({
          payment_type: "pix",
          transaction_amount: Number(order.totalAmount || cartTotal || 0),
          couponInfo: order.couponInfo,
        checkoutAttempt: order.checkoutAttempt,
          cart: order.cart,
          shippingCost: order.shippingCost,
          checkout: { ...order, _guestPassword: undefined },
          payer_email: order.email,
          payer_first_name,
          payer_last_name,
          identification_number: order.taxDocument,
          description: `N-1 Edições — ${(order.cart || productsToUse || []).length} item(ns)`,
          metadata: { checkout: "pix" },
        });

        if (payResult?.error) {
          const errData = payResult.error?.data;
          const msg =
            errData?.message ||
            errData?.error?.message ||
            errData?.data?.message ||
            "Erro ao gerar PIX.";
          notifyError(msg);
          setIsCheckoutSubmit(false);
          return;
        }

        const pdata = payResult.data;
        if (!pdata?.success || !pdata.pix) {
          notifyError(pdata?.message || "Não foi possível gerar o PIX.");
          setIsCheckoutSubmit(false);
          return;
        }

        const orderPayload = {
        checkoutOrder: pdata.checkoutOrder,
          name: order.name,
          address: order.address,
          number: order.number,
          complement: order.complement,
          neighborhood: order.neighborhood,
          contact: order.contact,
          email: order.email,
          city: order.city,
          state: order.state || "",
          country: order.country || "BR",
          zipCode: order.zipCode,
          cpf: order.cpf || order.taxDocument || "",
          taxDocument: order.taxDocument || order.cpf || "",
          orderNote: order.orderNote || "",
          subTotal: order.subTotal,
          shippingCost: order.shippingCost,
          discount: order.discount,
        couponInfo: order.couponInfo,
        checkoutAttempt: order.checkoutAttempt,
          totalAmount: order.totalAmount,
          shippingOption: order.shippingOption,
          cart: order.cart,
          user: order.user,
          status: "pending",
          paymentIntent: {
            mercadoPago: pdata.payment,
            paymentMethod: "mercadopago_pix",
            pix: pdata.pix,
          },
        };

        const result = await addOrder(orderPayload);

        if (result?.error) {
          notifyError(
            getAddOrderErrorMessage(
              result.error,
              "Pedido não salvo após gerar PIX. Entre em contato com o suporte."
            )
          );
          setIsCheckoutSubmit(false);
          return;
        }

        sessionStorage.removeItem("couponCheckoutAttempt");
        const orderId =
          result.data?.order?._id || result.data?.order?.id || result.data?._id || "";
        const orderKey =
          result.data?.order?.order_key || result.data?.order?.orderKey || "";

        if (!user && order._guestPassword && order.email) {
          try {
            await registerUser({
              name: order.name,
              email: order.email,
              password: order._guestPassword,
              confirmPassword: order._guestPassword,
            }).unwrap();
          } catch (regErr) {
            console.warn("[CHECKOUT] Auto-cadastro pós-pedido (PIX):", regErr);
          }
        }

        const profileUser = store.getState().auth.user || user;
        if (profileUser && profileUser._id) {
          try {
            const orderZipCode = order.zipCode || "";
            const cleanOrderZipCode = orderZipCode
              ? String(orderZipCode).replace(/\D/g, "")
              : "";
            const firstName = order.name?.split(" ")[0] || "";
            const lastName = order.name?.split(" ").slice(1).join(" ") || "";
            const fullName =
              firstName && lastName ? `${firstName} ${lastName}` : order.name || profileUser.name;

            const profileData = {
              id: profileUser._id,
              name: fullName,
              lastName: lastName || profileUser.lastName || "",
              email: order.email || profileUser.email,
              phone: order.contact || profileUser.phone || profileUser.contactNumber || "",
              address: order.address || profileUser.address || profileUser.shippingAddress || "",
              number: order.number || profileUser.number || profileUser.numero || "",
              complement: order.complement || profileUser.complement || "",
              zipCode:
                cleanOrderZipCode || order.zipCode || profileUser.zipCode || profileUser.cep || "",
              city: order.city || profileUser.city || "",
              country: order.state || profileUser.country || profileUser.state || "",
            };

            const emailChanged =
              String(order.email || "").toLowerCase() !==
              String(profileUser.email || "").toLowerCase();
            const hasNewData =
              profileData.address ||
              profileData.city ||
              profileData.country ||
              profileData.zipCode ||
              profileData.phone ||
              emailChanged;
            if (hasNewData) {
              updateProfile(profileData).catch(() => {});
            }
          } catch (_) {
            /* ignore */
          }
        }

        if (typeof localStorage !== "undefined") {
          localStorage.setItem(
            "pendingPixPayment",
            JSON.stringify({
              orderId: String(orderId),
              orderKey: orderKey || "",
              amount: order.totalAmount,
              pixData: {
                qr_code: pdata.pix.qr_code || "",
                qr_code_base64: pdata.pix.qr_code_base64 || "",
                ticket_url: pdata.pix.ticket_url || "",
                expires_at: pdata.expires_at || null,
              },
            })
          );
        }

        if (directProduct) {
          sessionStorage.removeItem("directCheckoutProduct");
        }
        notifySuccess("Pedido registrado! Escaneie o PIX ou copie o código na próxima tela.");
        router.push(`/payment/pix?order=${encodeURIComponent(String(orderId))}`);
        setIsCheckoutSubmit(false);
        return;
      } catch (err) {
        console.error("Erro checkout PIX:", err);
        notifyError(err?.message || "Erro ao gerar PIX. Tente novamente.");
        setIsCheckoutSubmit(false);
        return;
      }
    }

    if (orderPaymentMethod !== "card") {
      setIsCheckoutSubmit(false);
      return;
    }

    try {
      let tokenRes;
      try {
        tokenRes = await mercadoPagoCardRef.current?.createToken({
          cardholderName: order.cardholderName || order.name,
          identificationType: order.taxDocument?.length > 11 ? "CNPJ" : "CPF",
          identificationNumber: order.taxDocument,
        });
      } catch (tokenErr) {
        notifyError(tokenErr?.message || "Não foi possível validar o cartão.");
        setIsCheckoutSubmit(false);
        return;
      }

      if (!tokenRes?.token) {
        notifyError("Token do cartão não gerado. Verifique os dados e tente novamente.");
        setIsCheckoutSubmit(false);
        return;
      }

      const nameParts = (order.name || "").trim().split(/\s+/);
      const payer_first_name = nameParts[0] || "Cliente";
      const payer_last_name = nameParts.slice(1).join(" ") || payer_first_name;

      const payResult = await createMercadoPagoTransparentPayment({
        token: tokenRes.token,
        transaction_amount: Number(order.totalAmount || cartTotal || 0),
        couponInfo: order.couponInfo,
          checkoutAttempt: order.checkoutAttempt,
        cart: order.cart,
        shippingCost: order.shippingCost,
        checkout: { ...order, _guestPassword: undefined },
        installments: 1,
        payer_email: order.email,
        payer_first_name,
        payer_last_name,
        identification_number: order.taxDocument,
        description: `N-1 Edições — ${(order.cart || productsToUse || []).length} item(ns)`,
        metadata: { checkout: "transparent" },
      });

      if (payResult?.error) {
        const msg =
          payResult.error?.data?.message ||
          payResult.error?.data?.error?.message ||
          "Erro ao processar pagamento.";
        notifyError(msg);
        setIsCheckoutSubmit(false);
        return;
      }

      const pdata = payResult.data;
      if (!pdata?.success) {
        notifyError(pdata?.message || "Pagamento não autorizado.");
        setIsCheckoutSubmit(false);
        return;
      }

      if (pdata.status === "rejected") {
        sessionStorage.removeItem("couponCheckoutAttempt");
        couponAttemptRef.current = null;
        notifyError(
          pdata.status_detail || pdata.payment?.status_detail || "Pagamento recusado."
        );
        setIsCheckoutSubmit(false);
        return;
      }

      const orderPayload = {
        checkoutOrder: pdata.checkoutOrder,
        name: order.name,
        address: order.address,
        number: order.number,
        complement: order.complement,
        neighborhood: order.neighborhood,
        contact: order.contact,
        email: order.email,
        city: order.city,
        state: order.state || "",
        country: order.country || "BR",
        zipCode: order.zipCode,
        cpf: order.cpf || order.taxDocument || "",
        taxDocument: order.taxDocument || order.cpf || "",
        orderNote: order.orderNote || "",
        subTotal: order.subTotal,
        shippingCost: order.shippingCost,
        discount: order.discount,
          couponInfo: order.couponInfo,
          checkoutAttempt: order.checkoutAttempt,
        totalAmount: order.totalAmount,
        shippingOption: order.shippingOption,
        cart: order.cart,
        user: order.user,
        status: pdata.approved ? "processing" : "pending",
        paymentIntent: {
          mercadoPago: pdata.payment,
          paymentMethod: "mercadopago_card",
        },
      };

      const result = await addOrder(orderPayload);

      if (result?.error) {
        notifyError(
          getAddOrderErrorMessage(
            result.error,
            "Pedido não salvo após pagamento. Entre em contato com o suporte."
          )
        );
        setIsCheckoutSubmit(false);
        return;
      }

      sessionStorage.removeItem("couponCheckoutAttempt");
      const orderId = result.data?.order?._id || result.data?.order?.id || result.data?._id || "success";
      const orderKey = result.data?.order?.order_key || result.data?.order?.orderKey || "";

      if (!user && order._guestPassword && order.email) {
        try {
          await registerUser({
            name: order.name,
            email: order.email,
            password: order._guestPassword,
            confirmPassword: order._guestPassword,
          }).unwrap();
        } catch (regErr) {
          console.warn("[CHECKOUT] Auto-cadastro pós-pedido:", regErr);
        }
      }

      const profileUser = store.getState().auth.user || user;
      if (profileUser && profileUser._id) {
        try {
          const orderZipCode = order.zipCode || "";
          const cleanOrderZipCode = orderZipCode
            ? String(orderZipCode).replace(/\D/g, "")
            : "";
          const firstName = order.name?.split(" ")[0] || "";
          const lastName = order.name?.split(" ").slice(1).join(" ") || "";
          const fullName =
            firstName && lastName ? `${firstName} ${lastName}` : order.name || profileUser.name;

          const profileData = {
            id: profileUser._id,
            name: fullName,
            lastName: lastName || profileUser.lastName || "",
            email: order.email || profileUser.email,
            phone: order.contact || profileUser.phone || profileUser.contactNumber || "",
            address: order.address || profileUser.address || profileUser.shippingAddress || "",
            number: order.number || profileUser.number || profileUser.numero || "",
            complement: order.complement || profileUser.complement || "",
            zipCode: cleanOrderZipCode || order.zipCode || profileUser.zipCode || profileUser.cep || "",
            city: order.city || profileUser.city || "",
            country: order.state || profileUser.country || profileUser.state || "",
          };

          const emailChanged =
            String(order.email || "").toLowerCase() !==
            String(profileUser.email || "").toLowerCase();
          const hasNewData =
            profileData.address ||
            profileData.city ||
            profileData.country ||
            profileData.zipCode ||
            profileData.phone ||
            emailChanged;
          if (hasNewData) {
            updateProfile(profileData).catch(() => {});
          }
        } catch (_) {
          /* ignore */
        }
      }

      if (directProduct) {
        sessionStorage.removeItem("directCheckoutProduct");
      }
      notifySuccess(
        pdata.approved ? "Pagamento aprovado! Redirecionando…" : "Pedido registrado. Aguardando confirmação."
      );
      const keyParam =
        orderKey && String(orderKey).trim() !== ""
          ? `?key=${encodeURIComponent(String(orderKey).trim())}`
          : "";
      router.push(`/order/${orderId}${keyParam}`);
      setIsCheckoutSubmit(false);
    } catch (err) {
      console.error("Erro checkout MP:", err);
      notifyError(err?.message || "Erro ao processar pedido. Tente novamente.");
      setIsCheckoutSubmit(false);
    }
  };

  return {
    clearCoupon,
    isValidatingCoupon,
    isCouponVerified: Boolean(couponInfo?.couponCode && verifiedCouponContext === couponContext),
    handleCouponCode,
    couponRef,
    handleShippingCost,
    calculateShippingByPostcode,
    discountAmount,
    total: finalTotal,
    shippingCost,
    shippingOptions,
    selectedShippingId,
    isCalculatingShipping,
    shippingError,
    discountPercentage,
    fillCheckoutFields,
    discountProductType,
    isCheckoutSubmit,
    setTotal,
    productsToUse,
    register,
    watch,
    setValue,
    getValues,
    errors,
    cardError,
    submitHandler,
    mercadoPagoCardRef,
    handleSubmit,
    clientSecret,
    setClientSecret,
    cartTotal,
    paymentMethod,
    setPaymentMethod,
    openLoginModalEmail,
    onConsumeOpenLoginModalEmail: () => setOpenLoginModalEmail(null),
  };
};

export default useCheckoutSubmit;
