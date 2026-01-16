'use client';
import * as dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
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
  useCreatePaymentIntentMutation,
  useCalculateShippingMutation,
} from "src/redux/features/order/orderApi";
import { useUpdateProfileMutation } from "src/redux/features/auth/authApi";

const useCheckoutSubmit = () => {
  const { data: offerCoupons, isError, isLoading } = useGetOfferCouponsQuery();
  const [addOrder, {}] = useAddOrderMutation();
  const [createPaymentIntent, {}] = useCreatePaymentIntentMutation();
  const [calculateShipping, { isLoading: isCalculatingShipping }] = useCalculateShippingMutation();
  const [updateProfile, {}] = useUpdateProfileMutation();
  
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
  const { total, setTotal } = useCartInfo();
  const [couponInfo, setCouponInfo] = useState({});
  const [cartTotal, setCartTotal] = useState("");
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
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'pix', 'boleto'
  const [shippingError, setShippingError] = useState(false);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const store = useStore();
  const stripe = useStripe();
  const elements = useElements();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const couponRef = useRef("");

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
    if (minimumAmount - discountAmount > total || cart_products.length === 0) {
      setDiscountPercentage(0);
      localStorage.removeItem("couponInfo");
    }
  }, [minimumAmount, total, discountAmount, cart_products]);

  //calculate total and discount value
  useEffect(() => {
    // Se não houver cupom aplicado, não calcular desconto
    if (!couponInfo || Object.keys(couponInfo).length === 0) {
      let subTotal = Number((total + shippingCost).toFixed(2));
      setDiscountAmount(0);
      setCartTotal(subTotal);
      return;
    }

    // Determinar quais produtos aplicar o desconto
    let productsToDiscount = [];
    if (discountProductType === 'all' || !discountProductType) {
      // Se for 'all', aplicar em todos os produtos
      productsToDiscount = cart_products || [];
    } else {
      // Caso contrário, filtrar por tipo
      productsToDiscount = cart_products?.filter((p) => p.type === discountProductType) || [];
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

    let subTotal = Number((total + shippingCost).toFixed(2));
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
    total,
    shippingCost,
    discountPercentage,
    cart_products,
    discountProductType,
    couponInfo,
  ]);

  // create payment intent
  useEffect(() => {
    if (cartTotal && cartTotal > 0) {
      createPaymentIntent({
        price: parseInt(cartTotal),
      })
        .then((response) => {
          // RTK Query retorna { data: {...}, error: {...} }
          const responseData = response?.data;
          const paymentIntentData = responseData?.data || responseData;
          
          // Verificar diferentes estruturas de resposta
          const clientSecretValue = paymentIntentData?.clientSecret || paymentIntentData?.data?.clientSecret;
          
          if (clientSecretValue) {
            setClientSecret(clientSecretValue);
          } else {
            // Se não houver clientSecret, apenas loga (não quebra a aplicação)
            console.warn("Payment intent endpoint não retornou clientSecret. O pagamento pode não estar configurado no backend.");
            // Não mostra erro para o usuário, pois pode ser que o pagamento não esteja implementado ainda
          }
        })
        .catch((error) => {
          // Erro silencioso - o endpoint pode não existir ainda
          console.warn("Payment intent endpoint não disponível:", error);
          // Não mostra erro para o usuário
        });
    }
  }, [createPaymentIntent, cartTotal]);

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
      return;
    }

    console.log('[FRETE] Calculando frete para CEP:', cleanPostcode);

    try {
      const result = await calculateShipping({
        postcode: cleanPostcode,
        cart_products: cart_products,
      });

      console.log('[FRETE] Resultado completo:', result);

      if (result?.error) {
        console.error('[FRETE] Erro na resposta:', result.error);
        notifyError(result.error?.data?.message || "Erro ao calcular frete");
        setShippingOptions([]);
        return;
      }

      const options = result?.data?.shipping_options || [];
      console.log('[FRETE] Opções de frete recebidas:', options);
      
      if (options.length === 0) {
        notifyError(result?.data?.message || "Nenhum método de envio disponível para este CEP");
        setShippingOptions([]);
        setShippingCost(0);
        setSelectedShippingId('');
        return;
      }

      setShippingOptions(options);
      setShippingError(false); // Limpar erro quando frete for calculado
      notifySuccess(`${options.length} opção(ões) de frete encontrada(s)`);
      
      // Selecionar a primeira opção automaticamente
      handleShippingCost(options[0].cost, options[0].id);
      
    } catch (error) {
      console.error('[FRETE] Erro ao calcular frete:', error);
      notifyError("Erro ao calcular frete. Verifique o CEP e tente novamente.");
      setShippingOptions([]);
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
      setValue("country", shipping_info.country || user.country || user.state || '');
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
      setValue("country", shipping_info.country || '');
      setValue("zipCode", shipping_info.zipCode || '');
      setValue("email", shipping_info.email || '');
      setValue("contact", shipping_info.contact || '');
    }
  }, [user, setValue, shipping_info]);

  //set values - preencher com dados do usuário se estiver logado, senão usar shipping_info
  useEffect(() => {
    fillCheckoutFields();
  }, [fillCheckoutFields]);

  // Limpar opções de frete quando o CEP mudar
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'zipCode') {
        const cleanZipCode = value.zipCode ? String(value.zipCode).replace(/\D/g, '') : '';
        // Se o CEP mudou e tem 8 dígitos, limpar opções de frete para forçar novo cálculo
        if (cleanZipCode.length === 8 && shippingOptions.length > 0) {
          setShippingOptions([]);
          setSelectedShippingId('');
          setShippingCost(0);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, shippingOptions.length]);

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
    
    // Validar se o frete foi calculado
    // Verificar se há opções de frete disponíveis e se uma foi selecionada
    if (shippingOptions.length === 0 || !selectedShippingId) {
      console.log('[CHECKOUT] Erro: Frete não calculado. shippingOptions:', shippingOptions.length, 'selectedShippingId:', selectedShippingId);
      setShippingError(true);
      notifyError("Por favor, calcule o frete antes de finalizar o pedido. Clique no botão 'Calcular Frete' após informar o CEP.");
      setIsCheckoutSubmit(false);
      return;
    }
    
    // Limpar erro de frete se tudo estiver ok
    setShippingError(false);
    
    console.log('[CHECKOUT] Validações passadas. Prosseguindo com checkout...');
    dispatch(set_shipping(data));
    setIsCheckoutSubmit(true);
    
    // Limpar CPF/CNPJ (remover pontos, traços e barras)
    const cleanCpf = data.cpf ? String(data.cpf).replace(/\D/g, '') : '';

    let orderInfo = {
      name: `${data.firstName} ${data.lastName}`,
      address: data.address,
      number: data.number || '',
      complement: data.complement || '',
      contact: data.contact,
      email: data.email,
      city: data.city,
      country: data.country,
      zipCode: cleanZipCode,
      cpf: cleanCpf, // CPF/CNPJ para Boleto
      shippingOption: data.shippingOption,
      status: "pending",
      cart: cart_products,
      subTotal: total,
      shippingCost: shippingCost,
      discount: discountAmount,
      totalAmount: cartTotal,
      user:`${user?._id}`,
      paymentMethod: paymentMethod,
    };

    // Processar conforme o método de pagamento selecionado
    if (paymentMethod === 'card') {
      if (!stripe || !elements) {
        setIsCheckoutSubmit(false);
        return;
      }
      const card = elements.getElement(CardElement);
      if (card == null) {
        setIsCheckoutSubmit(false);
        return;
      }
      const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (error) {
        setCardError(error?.message);
        setIsCheckoutSubmit(false);
      } else {
        setCardError("");
        const orderData = {
          ...orderInfo,
          cardInfo: pm,
        };
        handlePaymentWithStripe(orderData);
        setIsCheckoutSubmit(false);
        return;
      }
    } else if (paymentMethod === 'boleto') {
      // Processar Boleto (PIX temporariamente desabilitado)
      handlePaymentWithStripe(orderInfo);
      setIsCheckoutSubmit(false);
    } else if (paymentMethod === 'pix') {
      // PIX temporariamente desabilitado - redirecionar para cartão
      setPaymentMethod('card');
      notifyError('PIX temporariamente indisponível. Por favor, escolha outra forma de pagamento.');
      setIsCheckoutSubmit(false);
    }
  };

  // handlePaymentWithStripe
  const handlePaymentWithStripe = async (order) => {
    const orderPaymentMethod = order.paymentMethod || paymentMethod;
    
    // PIX temporariamente desabilitado
    if (orderPaymentMethod === 'pix') {
      notifyError('PIX temporariamente indisponível. Por favor, escolha outra forma de pagamento.');
      setPaymentMethod('card');
      setIsCheckoutSubmit(false);
      return;
    }
    
    // Preparar dados no formato esperado pelo backend
    const orderData = {
      cart_products: order.cart || cart_products,
      shipping_info: {
        firstName: order.name ? order.name.split(' ')[0] : shipping_info.firstName || '',
        lastName: order.name ? order.name.split(' ').slice(1).join(' ') : shipping_info.lastName || '',
        email: order.email || shipping_info.email || user?.email || '',
        phone: order.contact || shipping_info.contact || shipping_info.phone || '',
        address: order.address || shipping_info.address || '',
        city: order.city || shipping_info.city || '',
        country: order.country || shipping_info.country || 'BR',
        postcode: order.zipCode || shipping_info.zipCode || shipping_info.postcode || '',
      },
      paymentMethod: orderPaymentMethod,
      paymentIntent: null,
      paymentStatus: 'pending',
      couponInfo: couponInfo && Object.keys(couponInfo).length > 0 ? couponInfo : null,
    };

    // Se for cartão de crédito, precisa do Stripe
    if (orderPaymentMethod === 'card') {
      if (!stripe || !elements) {
        notifyError("Stripe não está disponível. Por favor, recarregue a página.");
        setIsCheckoutSubmit(false);
        return;
      }
      
      const card = elements.getElement(CardElement);
      if (!card) {
        notifyError("Elemento do cartão não encontrado.");
        setIsCheckoutSubmit(false);
        return;
      }
      
      // Sempre criar um novo payment intent para evitar conflitos
      try {
        // Criar payment intent com método de pagamento específico
        const paymentIntentResult = await createPaymentIntent({
          price: parseInt(cartTotal),
          payment_method: 'card',
        });
        
        if (paymentIntentResult?.error) {
          const errorMsg = paymentIntentResult.error?.data?.message || paymentIntentResult.error?.data || 'Erro ao criar Payment Intent';
          notifyError(errorMsg);
          setIsCheckoutSubmit(false);
          return;
        }
        
        const paymentIntentResponse = paymentIntentResult?.data?.data || paymentIntentResult?.data || paymentIntentResult;
        const newClientSecret = paymentIntentResponse?.clientSecret;
        
        if (!newClientSecret) {
          console.error("Payment Intent criado mas sem clientSecret:", paymentIntentResponse);
          notifyError("Erro ao processar pagamento. Tente novamente.");
          setIsCheckoutSubmit(false);
          return;
        }
        
        // Confirmar o payment intent com os dados do cartão
        // O Stripe requer código de país ISO 3166-1 alpha-2 (2 caracteres), sempre usar 'BR' para Brasil
        const countryCode = 'BR'; // Sempre Brasil, não usar estado como 'SP'
        
        const { paymentIntent, error: intentErr } = await stripe.confirmCardPayment(newClientSecret, {
          payment_method: {
            card: card,
            billing_details: {
              name: user?.name || order.name || `${order.shipping_info?.firstName || ''} ${order.shipping_info?.lastName || ''}`.trim(),
              email: user?.email || order.email || order.shipping_info?.email || '',
              address: {
                line1: order.address || order.shipping_info?.address || '',
                city: order.city || order.shipping_info?.city || '',
                postal_code: order.zipCode || order.shipping_info?.postcode || '',
                state: order.country || order.shipping_info?.country || '', // Estado vai aqui (SP, RJ, etc)
                country: countryCode, // País sempre 'BR'
              },
            },
          },
        });
        
        if (intentErr) {
          console.error("Erro ao confirmar pagamento:", intentErr);
          notifyError(intentErr.message || "Erro ao processar pagamento. Verifique os dados do cartão.");
          setIsCheckoutSubmit(false);
          return;
        }
        
        if (!paymentIntent) {
          notifyError("Erro ao processar pagamento. Tente novamente.");
          setIsCheckoutSubmit(false);
          return;
        }
        
        orderData.paymentIntent = paymentIntent;
        orderData.paymentStatus = paymentIntent?.status || 'succeeded';
        
        // Limpar clientSecret após uso para evitar reutilização
        setClientSecret('');
      } catch (err) {
        console.error("Erro ao processar pagamento com cartão:", err);
        notifyError(err.message || "Erro ao processar pagamento. Tente novamente.");
        setIsCheckoutSubmit(false);
        return;
      }
    } else if (orderPaymentMethod === 'pix') {
      // Processar PIX
      let pixPaymentResult = null;
      try {
        // 1. Criar payment intent para PIX
        pixPaymentResult = await createPaymentIntent({
          price: parseInt(cartTotal),
          payment_method: 'pix',
        });
        
        console.log('[PIX] Resultado completo do createPaymentIntent:', pixPaymentResult);
        
        // Verificar se houve erro na resposta
        if (pixPaymentResult?.error) {
          const errorMsg = pixPaymentResult.error?.data?.message || pixPaymentResult.error?.data || pixPaymentResult.error?.message || '';
          console.error('[PIX] Erro retornado pelo backend:', errorMsg);
          throw new Error(errorMsg || 'Erro ao criar Payment Intent para PIX');
        }
        
        // Extrair dados da resposta
        const paymentIntentResponse = pixPaymentResult?.data?.data || pixPaymentResult?.data || pixPaymentResult;
        const pixClientSecret = paymentIntentResponse?.clientSecret;
        const paymentIntentId = paymentIntentResponse?.paymentIntentId;
        
        if (!pixClientSecret) {
          console.error('[PIX] clientSecret não encontrado:', paymentIntentResponse);
          throw new Error('Não foi possível criar payment intent para PIX. Resposta inválida do servidor.');
        }
        
        // 2. Para PIX, o QR Code deve vir diretamente na resposta do backend
        const pixAction = paymentIntentResponse?.next_action?.pix_display_qr_code;
        
        if (!pixAction) {
          console.error('[PIX] QR Code não encontrado na resposta do backend:', {
            response: paymentIntentResponse,
            fullResult: pixPaymentResult,
          });
          
          throw new Error('QR Code do PIX não foi gerado. Verifique se o PIX está habilitado na sua conta Stripe.');
        }
        
        console.log('[PIX] QR Code obtido do backend:', pixAction);
        
        // 3. Preparar dados do pedido
        orderData.paymentIntent = {
          id: paymentIntentId,
          client_secret: pixClientSecret,
          payment_method: 'pix',
          status: paymentIntentResponse?.status || 'requires_payment_method',
        };
        orderData.paymentStatus = 'pending';
        orderData.pixData = {
          qr_code: pixAction.data,
          qr_code_url: pixAction.image_url_png || pixAction.image_url_svg,
          hosted_instructions_url: pixAction.hosted_instructions_url,
          expires_at: pixAction.expires_at || (Math.floor(Date.now() / 1000) + 1800),
        };
        
        console.log('[PIX] QR Code preparado para envio:', orderData.pixData);
        
      } catch (err) {
        console.error('Erro ao processar PIX:', err);
        
        let errorMessage = err.message || 'Erro ao processar pagamento via PIX.';
        
        // Verificar erros específicos
        if (err.message?.includes('test') || err.message?.includes('Test mode')) {
          errorMessage = 'PIX não está disponível em modo de teste. Use chaves de produção.';
        } else if (err.message?.includes('disabled') || err.message?.includes('not enabled')) {
          errorMessage = 'PIX não está habilitado na sua conta Stripe.';
        } else if (pixPaymentResult?.error) {
          errorMessage = pixPaymentResult.error?.data?.message || pixPaymentResult.error?.data || errorMessage;
        }
        
        notifyError(errorMessage);
        setIsCheckoutSubmit(false);
        return;
      }
    } else if (orderPaymentMethod === 'boleto') {
      // Processar Boleto
      let boletoPaymentResult = null;
      try {
        // 1. Criar payment intent para Boleto
        boletoPaymentResult = await createPaymentIntent({
          price: parseInt(cartTotal),
          payment_method: 'boleto',
        });
        
        console.log('[BOLETO] Resultado completo do createPaymentIntent:', boletoPaymentResult);
        
        // Verificar se houve erro na resposta
        if (boletoPaymentResult?.error) {
          const errorMsg = boletoPaymentResult.error?.data?.message || boletoPaymentResult.error?.data || boletoPaymentResult.error?.message || '';
          console.error('[BOLETO] Erro retornado pelo backend:', errorMsg);
          throw new Error(errorMsg || 'Erro ao criar Payment Intent para Boleto');
        }
        
        const paymentIntentResponse = boletoPaymentResult?.data?.data || boletoPaymentResult?.data || boletoPaymentResult;
        const boletoClientSecret = paymentIntentResponse?.clientSecret;
        
        if (!boletoClientSecret) {
          console.error('[BOLETO] clientSecret não encontrado:', paymentIntentResponse);
          throw new Error('Não foi possível criar payment intent para Boleto. Resposta inválida do servidor.');
        }
        
        // 2. Confirmar o pagamento Boleto para obter os dados do boleto
        // CPF/CNPJ é obrigatório para Boleto
        const taxId = order.cpf || '';
        
        if (!taxId || taxId.length < 11) {
          throw new Error('CPF/CNPJ é obrigatório para pagamento via Boleto');
        }
        
        if (!stripe) {
          throw new Error('Stripe não está disponível. Por favor, recarregue a página.');
        }
        
        const { paymentIntent: confirmedIntent, error: boletoError } = await stripe.confirmBoletoPayment(
          boletoClientSecret,
          {
            payment_method: {
              billing_details: {
                name: order.name || `${shipping_info.firstName} ${shipping_info.lastName}`,
                email: order.email || shipping_info.email || user?.email,
                address: {
                  line1: order.address || shipping_info.address,
                  city: order.city || shipping_info.city,
                  state: 'SP',
                  postal_code: order.zipCode || shipping_info.postcode,
                  country: 'BR',
                },
              },
              boleto: {
                tax_id: taxId.replace(/\D/g, ''),
              },
            },
          }
        );
        
        if (boletoError) {
          console.error('Erro ao confirmar Boleto:', boletoError);
          throw new Error(boletoError.message || 'Erro ao gerar Boleto');
        }
        
        // 3. Extrair dados do Boleto
        const boletoAction = confirmedIntent?.next_action?.boleto_display_details;
        
        orderData.paymentIntent = {
          id: confirmedIntent.id,
          client_secret: boletoClientSecret,
          payment_method: 'boleto',
          status: confirmedIntent.status,
        };
        orderData.paymentStatus = 'pending';
        orderData.boletoData = boletoAction ? {
          number: boletoAction.number,
          hosted_voucher_url: boletoAction.hosted_voucher_url,
          expires_at: boletoAction.expires_at,
        } : null;
        
        console.log('[BOLETO] Payment confirmado:', confirmedIntent);
        console.log('[BOLETO] Boleto data:', orderData.boletoData);
        
      } catch (err) {
        console.error('Erro ao processar Boleto:', err);
        
        let errorMessage = err.message || 'Erro ao processar pagamento via Boleto.';
        
        if (boletoPaymentResult?.error) {
          errorMessage = boletoPaymentResult.error?.data?.message || boletoPaymentResult.error?.data || errorMessage;
        }
        
        notifyError(errorMessage);
        setIsCheckoutSubmit(false);
        return;
      }
    }

    // Salvar pedido
    try {
      console.log('[PEDIDO] Preparando para salvar pedido. orderData:', orderData);
      console.log('[PEDIDO] User ID:', user?._id || 'Não logado');
      console.log('[PEDIDO] Token de autenticação presente:', !!store.getState()?.auth?.accessToken);
      
      const result = await addOrder(orderData);
      
      console.log('[PEDIDO] Resultado do addOrder:', result);
      
      if (result?.error) {
        console.error('[PEDIDO] Erro ao salvar pedido:', result.error);
        console.error('[PEDIDO] Status do erro:', result.error?.status);
        console.error('[PEDIDO] Mensagem do erro:', result.error?.data);
        notifyError(result.error?.data?.message || "Erro ao processar pedido. Tente novamente.");
        setIsCheckoutSubmit(false);
      } else {
        const orderId = result.data?.order?._id || result.data?._id || 'success';
        
        // Salvar dados do checkout no perfil do usuário se estiver logado
        if (user && user._id) {
          try {
            // Limpar CEP do orderData se disponível
            const orderZipCode = orderData.shipping_info?.postcode || order.zipCode || '';
            const cleanOrderZipCode = orderZipCode ? String(orderZipCode).replace(/\D/g, '') : '';
            
            // Extrair dados do orderData ou order original
            const firstName = orderData.shipping_info?.firstName || order.name?.split(' ')[0] || '';
            const lastName = orderData.shipping_info?.lastName || order.name?.split(' ').slice(1).join(' ') || '';
            const fullName = firstName && lastName ? `${firstName} ${lastName}` : (order.name || user.name);
            
            const profileData = {
              id: user._id,
              name: fullName,
              lastName: lastName || user.lastName || '',
              email: orderData.shipping_info?.email || order.email || user.email,
              phone: orderData.shipping_info?.phone || order.contact || user.phone || user.contactNumber || '',
              address: orderData.shipping_info?.address || order.address || user.address || user.shippingAddress || '',
              number: order.number || user.number || user.numero || '',
              complement: order.complement || user.complement || '',
              zipCode: cleanOrderZipCode || order.zipCode || user.zipCode || user.cep || '',
              city: orderData.shipping_info?.city || order.city || user.city || '',
              country: orderData.shipping_info?.country || order.country || user.country || user.state || '',
            };
            
            // Só atualizar se houver dados novos para salvar
            const hasNewData = profileData.address || profileData.city || profileData.country || profileData.zipCode || profileData.phone;
            if (hasNewData) {
              updateProfile(profileData)
                .then((result) => {
                  if (result?.error) {
                    console.log("Erro ao salvar dados no perfil:", result.error);
                  } else {
                    console.log("Dados do checkout salvos no perfil com sucesso");
                  }
                })
                .catch((err) => {
                  console.log("Erro ao salvar dados no perfil (não crítico):", err);
                });
            }
          } catch (profileErr) {
            console.log("Erro ao salvar dados no perfil (não crítico):", profileErr);
          }
        }
        
        // Se for PIX, redirecionar com dados do QR Code
        if (orderPaymentMethod === 'pix' && orderData.pixData) {
          // Salvar dados do PIX no localStorage para a página de pagamento
          localStorage.setItem('pendingPixPayment', JSON.stringify({
            orderId: orderId,
            pixData: orderData.pixData,
            amount: cartTotal,
            createdAt: new Date().toISOString(),
          }));
          router.push(`/payment/pix?order=${orderId}`);
        } 
        // Se for Boleto, redirecionar com dados do boleto
        else if (orderPaymentMethod === 'boleto' && orderData.boletoData) {
          // Salvar dados do Boleto no localStorage para a página de pagamento
          localStorage.setItem('pendingBoletoPayment', JSON.stringify({
            orderId: orderId,
            boletoData: orderData.boletoData,
            amount: cartTotal,
            createdAt: new Date().toISOString(),
          }));
          router.push(`/payment/boleto?order=${orderId}`);
        } else {
          router.push(`/order/${orderId}`);
        }
        notifySuccess("Seu pedido foi confirmado!");
        setIsCheckoutSubmit(false);
      }
    } catch (err) {
      console.error("Erro ao processar pedido:", err);
      notifyError("Erro ao processar pedido. Tente novamente.");
      setIsCheckoutSubmit(false);
    }
  };

  return {
    handleCouponCode,
    couponRef,
    handleShippingCost,
    calculateShippingByPostcode,
    discountAmount,
    total,
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
    register,
    watch,
    setValue,
    errors,
    cardError,
    submitHandler,
    stripe,
    handleSubmit,
    clientSecret,
    setClientSecret,
    cartTotal,
    paymentMethod,
    setPaymentMethod,
  };
};

export default useCheckoutSubmit;
