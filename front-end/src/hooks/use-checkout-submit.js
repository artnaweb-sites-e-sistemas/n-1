'use client';
import * as dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//internal import
import { notifyError, notifySuccess } from "@utils/toast";
import { useGetOfferCouponsQuery } from "src/redux/features/coupon/couponApi";
import Loader from "@components/loader/loader";
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
  const { data: offerCoupons, isError, isLoading } = useGetOfferCouponsQuery();
  const [addOrder, {}] = useAddOrderMutation();
  const [createMercadoPagoTransparentPayment, {}] =
    useCreateMercadoPagoTransparentPaymentMutation();
  const [calculateShipping, { isLoading: isCalculatingShipping }] = useCalculateShippingMutation();
  const mercadoPagoCardRef = useRef(null);
  const [updateProfile, {}] = useUpdateProfileMutation();
  const [registerUser] = useRegisterUserMutation();
  const [checkEmailExists] = useCheckEmailExistsMutation();
  const lastShippingPostcodeRef = useRef("");
  
  // Log quando os dados dos cupons chegam
  useEffect(() => {
    console.log('[CUPOM] useEffect - offerCoupons atualizado:', offerCoupons);
    console.log('[CUPOM] useEffect - isLoading:', isLoading, 'isError:', isError);
    if (offerCoupons) {
      const couponsArray = Array.isArray(offerCoupons) 
        ? offerCoupons 
        : (offerCoupons?.coupons || offerCoupons?.data?.coupons || []);
      console.log('[CUPOM] useEffect - couponsArray extraído:', couponsArray);
      console.log('[CUPOM] useEffect - Quantidade de cupons:', couponsArray?.length || 0);
      if (Array.isArray(couponsArray) && couponsArray.length > 0) {
        const codes = couponsArray.map(c => c.code || c.couponCode || 'SEM CÓDIGO');
        console.log('[CUPOM] useEffect - Códigos dos cupons:', codes);
      }
    }
  }, [offerCoupons, isLoading, isError]);
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

  useEffect(() => {
    if (localStorage.getItem("couponInfo")) {
      const data = localStorage.getItem("couponInfo");
      const coupon = JSON.parse(data);
      setCouponInfo(coupon);
      setDiscountPercentage(coupon.discountPercentage);
      setMinimumAmount(coupon.minimumAmount);
      setDiscountProductType(coupon.productType);
    }
  }, []);

  useEffect(() => {
    if (minimumAmount - discountAmount > finalTotal || productsToUse.length === 0) {
      setDiscountPercentage(0);
      localStorage.removeItem("couponInfo");
    }
  }, [minimumAmount, finalTotal, discountAmount, productsToUse]);

  //calculate total and discount value
  useEffect(() => {
    // Se não houver cupom aplicado, não calcular desconto
    if (!couponInfo || Object.keys(couponInfo).length === 0) {
      let subTotal = Number((finalTotal + shippingCost).toFixed(2));
      setDiscountAmount(0);
      setCartTotal(subTotal);
      return;
    }

    // Determinar quais produtos aplicar o desconto
    let productsToDiscount = [];
    if (discountProductType === 'all' || !discountProductType) {
      // Se for 'all', aplicar em todos os produtos
      productsToDiscount = productsToUse || [];
    } else {
      // Caso contrário, filtrar por tipo
      productsToDiscount = productsToUse?.filter((p) => p.type === discountProductType) || [];
    }

    // Calcular total dos produtos que receberão desconto
    // IMPORTANTE: Usar o preço JÁ COM DESCONTO do produto, não o originalPrice
    const discountProductTotal = productsToDiscount.reduce(
      (preValue, currentValue) => {
        const { originalPrice, orderQuantity, discount } = currentValue;
        let itemPrice = originalPrice;
        
        // Se o produto já tem desconto, usar o preço com desconto
        if (discount && discount > 0) {
          itemPrice = originalPrice - (originalPrice * discount / 100);
        }
        
        return preValue + itemPrice * orderQuantity;
      },
      0
    );

    let subTotal = Number((finalTotal + shippingCost).toFixed(2));
    let discountTotal = 0;

    // Calcular desconto baseado no tipo
    const discountType = couponInfo.discountType || 'fixed_cart';
    
    if (discountType === 'percent' || discountType === 'percent_product') {
      // Desconto percentual
      discountTotal = Number(discountProductTotal * (discountPercentage / 100));
    } else if (discountType === 'fixed_cart') {
      // Desconto fixo no carrinho todo
      discountTotal = Number(couponInfo.discountValue || couponInfo.amount || 0);
      // Não pode ser maior que o subtotal
      if (discountTotal > subTotal) {
        discountTotal = subTotal;
      }
    } else if (discountType === 'fixed_product') {
      // Desconto fixo por produto (aplicar no total dos produtos)
      discountTotal = Number(couponInfo.discountValue || couponInfo.amount || 0);
      // Não pode ser maior que o total dos produtos
      if (discountTotal > discountProductTotal) {
        discountTotal = discountProductTotal;
      }
    }

    let totalValue = Number(subTotal - discountTotal);
    // Garantir que o total não seja negativo
    if (totalValue < 0) {
      totalValue = 0;
    }

    setDiscountAmount(discountTotal);
    setCartTotal(totalValue);
    
    console.log('[CUPOM] Cálculo do desconto:', {
      discountType,
      discountPercentage,
      discountValue: couponInfo.discountValue || couponInfo.amount,
      discountProductTotal,
      subTotal,
      discountTotal,
      totalValue
    });
  }, [
    finalTotal,
    shippingCost,
    discountPercentage,
    productsToUse,
    discountProductType,
    couponInfo,
  ]);

  // handleCouponCode
  const handleCouponCode = (e) => {
    e.preventDefault();

    const inputValue = couponRef.current?.value;
    console.log('[CUPOM] handleCouponCode chamado com código:', inputValue);
    console.log('[CUPOM] offerCoupons recebido:', offerCoupons);
    console.log('[CUPOM] isLoading:', isLoading, 'isError:', isError);

    if (!inputValue) {
      console.log('[CUPOM] Erro: Código vazio');
      notifyError("Por favor, insira um código de cupom!");
      return;
    }
    if (isLoading) {
      console.log('[CUPOM] Ainda carregando...');
      return <Loader loading={isLoading} />;
    }
    if (isError) {
      console.log('[CUPOM] Erro na requisição');
      return notifyError("Algo deu errado");
    }
    
    // A API retorna { coupons: [...] }, então precisamos acessar offerCoupons?.coupons
    const couponsArray = Array.isArray(offerCoupons) 
      ? offerCoupons 
      : (offerCoupons?.coupons || offerCoupons?.data?.coupons || []);
    
    console.log('[CUPOM] couponsArray processado:', couponsArray);
    console.log('[CUPOM] Tipo de couponsArray:', Array.isArray(couponsArray) ? 'Array' : typeof couponsArray);
    console.log('[CUPOM] Tamanho do array:', couponsArray?.length || 0);
    
    if (!Array.isArray(couponsArray) || couponsArray.length === 0) {
      console.log('[CUPOM] Erro: Nenhum cupom disponível. Array:', couponsArray);
      notifyError("Nenhum cupom disponível no momento!");
      return;
    }
    
    // Log dos códigos disponíveis
    const availableCodes = couponsArray.map(c => c.code || c.couponCode || 'SEM CÓDIGO');
    console.log('[CUPOM] Códigos de cupons disponíveis:', availableCodes);
    
    // O backend retorna 'code' mas o código antigo esperava 'couponCode'
    const inputUpper = inputValue.toUpperCase();
    console.log('[CUPOM] Procurando código (uppercase):', inputUpper);
    
    const result = couponsArray.filter(
      (coupon) => {
        const couponCode = (coupon.code || coupon.couponCode || '').toUpperCase();
        const matches = couponCode === inputUpper;
        console.log('[CUPOM] Comparando:', couponCode, '===', inputUpper, '?', matches);
        return matches;
      }
    );

    console.log('[CUPOM] Resultado do filter:', result);
    console.log('[CUPOM] Quantidade de matches:', result.length);

    if (result.length < 1) {
      console.log('[CUPOM] Erro: Cupom não encontrado. Código procurado:', inputUpper, 'Códigos disponíveis:', availableCodes);
      notifyError("Por favor, insira um cupom válido!");
      return;
    }

    const coupon = result[0];
    
    // Verificar se o cupom está expirado (usar expiryDate do backend)
    if (coupon.expiryDate) {
      if (dayjs().isAfter(dayjs(coupon.expiryDate))) {
        notifyError("Este cupom está expirado!");
        return;
      }
    }

    // Converter amount para minimumAmount se necessário
    const minimumAmountValue = coupon.minimumAmount || 0;
    if (total < minimumAmountValue) {
      notifyError(
        `Valor mínimo de R$ ${minimumAmountValue.toFixed(2)} necessário para aplicar este cupom!`
      );
      return;
    }
    
    // Preparar dados do cupom no formato esperado
    const couponData = {
      _id: coupon._id || coupon.id,
      couponCode: coupon.code || coupon.couponCode,
      title: coupon.code || coupon.couponCode,
      discountValue: coupon.amount || 0,
      discountType: coupon.discountType || 'fixed_cart',
      minimumAmount: minimumAmountValue,
      productType: 'all', // WooCommerce não tem productType específico por padrão
      discountPercentage: coupon.discountType === 'percent' || coupon.discountType === 'percent_product' ? coupon.amount : 0,
      endTime: coupon.expiryDate || null,
    };
    
    console.log('[CUPOM] Dados do cupom preparados:', couponData);
    
    notifySuccess(
      `Cupom ${couponData.couponCode} aplicado com sucesso!`
    );
    
    // Salvar no localStorage para persistir
    localStorage.setItem("couponInfo", JSON.stringify(couponData));
    
    setCouponInfo(couponData);
    setMinimumAmount(couponData.minimumAmount);
    setDiscountProductType(couponData.productType);
    setDiscountPercentage(couponData.discountPercentage);
    dispatch(set_coupon(couponData));
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

    let orderInfo = {
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
      discount: discountAmount,
      totalAmount: cartTotal,
      user: user?._id ? `${user._id}` : null,
      paymentMethod: paymentMethod,
      _guestPassword: !user ? String(data.checkoutPassword || "").trim() : undefined,
    };

    handleCheckoutPayment(orderInfo);
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
        notifyError(
          pdata.status_detail || pdata.payment?.status_detail || "Pagamento recusado."
        );
        setIsCheckoutSubmit(false);
        return;
      }

      const orderPayload = {
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
