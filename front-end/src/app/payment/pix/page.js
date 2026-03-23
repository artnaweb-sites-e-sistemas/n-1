'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@layout/header';
import Footer from '@layout/footer';
import Wrapper from '@layout/wrapper';
import Loader from '@components/loader/loader';
import { useGetUserOrderByIdQuery } from 'src/redux/features/orderApi';

/** Status WooCommerce após PIX/cartão aprovado (via webhook ou retorno MP). */
const PAID_ORDER_STATUSES = new Set(['processing', 'completed']);

function normalizeWcStatus(status) {
  if (!status) return '';
  return String(status).toLowerCase().replace(/^wc-/, '');
}

const PixPaymentContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const redirectDoneRef = useRef(false);

  const [pixData, setPixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const timeExpired = timeLeft !== null && timeLeft <= 0;

  const orderQueryArg =
    pixData && orderId
      ? pixData.orderKey && String(pixData.orderKey).trim() !== ''
        ? { id: orderId, key: String(pixData.orderKey).trim() }
        : orderId
      : '';

  const { data: polledOrder } = useGetUserOrderByIdQuery(orderQueryArg, {
    skip: !pixData || !orderId || loading || timeExpired,
    pollingInterval: 4000,
    refetchOnFocus: true,
  });

  // Quando o WooCommerce atualizar o pedido (webhook MP), redireciona para a página do pedido
  useEffect(() => {
    if (!polledOrder?.order?.status || !orderId || redirectDoneRef.current) return;
    const status = normalizeWcStatus(polledOrder.order.status);
    if (!PAID_ORDER_STATUSES.has(status)) return;

    redirectDoneRef.current = true;
    setRedirecting(true);
    try {
      localStorage.removeItem('pendingPixPayment');
    } catch (e) {
      /* ignore */
    }
    const keyQs =
      pixData?.orderKey && String(pixData.orderKey).trim() !== ''
        ? `?key=${encodeURIComponent(String(pixData.orderKey).trim())}`
        : '';
    router.replace(`/order/${orderId}${keyQs}`);
  }, [polledOrder, orderId, router, pixData?.orderKey]);

  useEffect(() => {
    // Carregar dados do PIX do localStorage
    const storedData = localStorage.getItem('pendingPixPayment');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.orderId === orderId) {
          setPixData(parsed);
          
          // Calcular tempo restante (expires_at em segundos UNIX, se existir)
          if (parsed.pixData?.expires_at) {
            const expiresAt = new Date(Number(parsed.pixData.expires_at) * 1000);
            const now = new Date();
            const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setTimeLeft(diff);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar dados do PIX:', e);
      }
    }
    setLoading(false);
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  /** Exibe tempo legível: abaixo de 1h = MM:SS; a partir de 1h = H:MM:SS (evita "1439:41"). */
  const formatTime = (totalSeconds) => {
    if (totalSeconds == null || totalSeconds <= 0) return '0:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyCode = () => {
    if (pixData?.pixData?.qr_code) {
      // O qr_code é uma string que pode ser copiada para "copia e cola"
      navigator.clipboard.writeText(pixData.pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <Header style_2={true} />
        <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
          <Loader loading={true} />
        </div>
        <Footer />
      </Wrapper>
    );
  }

  if (!pixData) {
    return (
      <Wrapper>
        <Header style_2={true} />
        <section className="pt-120 pb-120">
          <div className="container">
            <div className="text-center">
              <i className="fa fa-exclamation-circle" style={{ fontSize: '60px', color: '#dc3545', marginBottom: '20px' }}></i>
              <h2>Dados do PIX não encontrados</h2>
              <p className="mt-20">Os dados do pagamento PIX expiraram ou não foram encontrados.</p>
              <Link href="/" className="tp-btn mt-30">
                Voltar para a Loja
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header style_2={true} />
      <section className="pt-80 pb-80" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <div className="pix-payment-card" style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                {redirecting && (
                  <div
                    className="text-center mb-30"
                    style={{
                      backgroundColor: '#d4edda',
                      padding: '16px 20px',
                      borderRadius: '8px',
                      border: '1px solid #c3e6cb',
                    }}
                  >
                    <i className="fa fa-check-circle" style={{ marginRight: '10px', color: '#155724' }} />
                    <span style={{ color: '#155724', fontWeight: 600 }}>
                      Pagamento confirmado! Redirecionando para o seu pedido…
                    </span>
                  </div>
                )}
                {/* Header */}
                <div className="text-center mb-40">
                  <div style={{
                    backgroundColor: '#00D4AA',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <i className="fa fa-qrcode" style={{ fontSize: '36px', color: 'white' }}></i>
                  </div>
                  <h2 style={{ marginBottom: '10px' }}>Pague com PIX</h2>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    Escaneie o QR Code ou copie o código para realizar o pagamento
                  </p>
                </div>

                {/* Timer */}
                {!timeExpired && timeLeft && (
                  <div className="text-center mb-30" style={{
                    backgroundColor: '#fff3cd',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #ffc107',
                  }}>
                    <i className="fa fa-clock" style={{ marginRight: '10px', color: '#856404' }}></i>
                    <span style={{ color: '#856404', fontWeight: '500' }}>
                      Tempo restante para pagamento: <strong>{formatTime(timeLeft)}</strong>
                    </span>
                    {timeLeft >= 3600 && (
                      <div style={{ fontSize: '13px', color: '#856404', marginTop: '8px', opacity: 0.95 }}>
                        (horas : minutos : segundos — prazo típico do PIX é até 24 horas)
                      </div>
                    )}
                  </div>
                )}

                {timeExpired && (
                  <div className="text-center mb-30" style={{
                    backgroundColor: '#f8d7da',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb',
                  }}>
                    <i className="fa fa-exclamation-triangle" style={{ marginRight: '10px', color: '#721c24' }}></i>
                    <span style={{ color: '#721c24', fontWeight: '500' }}>
                      Este QR Code expirou. Por favor, faça um novo pedido.
                    </span>
                  </div>
                )}

                {/* Valor */}
                <div className="text-center mb-30">
                  <p style={{ color: '#666', marginBottom: '5px' }}>Valor a pagar:</p>
                  <h3 style={{ fontSize: '32px', color: '#000', fontWeight: 'bold' }}>
                    R$ {Number(pixData.amount).toFixed(2).replace('.', ',')}
                  </h3>
                </div>

                {/* QR Code */}
                {!timeExpired && (
                  <>
                    <div className="text-center mb-30">
                      <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        border: '2px solid #e0e0e0',
                      }}>
                        {pixData.pixData?.qr_code_base64 ? (
                          // Mercado Pago: imagem PNG em base64
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`data:image/png;base64,${pixData.pixData.qr_code_base64}`}
                            alt="QR Code PIX"
                            width={260}
                            height={260}
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                          />
                        ) : pixData.pixData?.qr_code_url ? (
                          <Image
                            src={pixData.pixData.qr_code_url}
                            alt="QR Code PIX"
                            width={250}
                            height={250}
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        ) : pixData.pixData?.hosted_instructions_url ? (
                          <iframe
                            src={pixData.pixData.hosted_instructions_url}
                            width="300"
                            height="400"
                            style={{ border: 'none' }}
                            title="PIX Payment Instructions"
                          />
                        ) : (
                          <div style={{ padding: '40px', textAlign: 'center' }}>
                            <i className="fa fa-qrcode" style={{ fontSize: '100px', color: '#ccc' }}></i>
                            <p className="mt-20">QR Code não disponível — use o código copia e cola abaixo.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Copia e Cola */}
                    {pixData.pixData?.qr_code && (
                      <div className="mb-30">
                        <p style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '500' }}>
                          Ou copie o código PIX:
                        </p>
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '15px',
                          borderRadius: '8px',
                          wordBreak: 'break-all',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          maxHeight: '100px',
                          overflow: 'auto',
                          marginBottom: '15px',
                        }}>
                          {pixData.pixData.qr_code}
                        </div>
                        <div className="text-center">
                          <button
                            onClick={handleCopyCode}
                            className="tp-btn"
                            style={{
                              backgroundColor: copied ? '#28a745' : '#000',
                              minWidth: '200px',
                            }}
                          >
                            <i className={`fa ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: '10px' }}></i>
                            {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                          </button>
                        </div>
                      </div>
                    )}

                    {(pixData.pixData?.hosted_instructions_url || pixData.pixData?.ticket_url) && (
                      <div className="text-center mb-30">
                        <a
                          href={pixData.pixData.ticket_url || pixData.pixData.hosted_instructions_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tp-btn tp-btn-border"
                          style={{ display: 'inline-block' }}
                        >
                          <i className="fa fa-external-link" style={{ marginRight: '10px' }}></i>
                          Abrir comprovante / instruções (Mercado Pago)
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* Instruções */}
                <div style={{
                  backgroundColor: '#e8f5e9',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px',
                }}>
                  <h5 style={{ marginBottom: '15px', color: '#2e7d32' }}>
                    <i className="fa fa-info-circle" style={{ marginRight: '10px' }}></i>
                    Como pagar com PIX:
                  </h5>
                  <ol style={{ paddingLeft: '20px', marginBottom: '0', color: '#333' }}>
                    <li style={{ marginBottom: '8px' }}>Abra o app do seu banco ou carteira digital</li>
                    <li style={{ marginBottom: '8px' }}>Escolha pagar com PIX e escaneie o QR Code</li>
                    <li style={{ marginBottom: '8px' }}>Ou copie e cole o código PIX</li>
                    <li style={{ marginBottom: '0' }}>Confirme o pagamento no app</li>
                  </ol>
                </div>

                {/* Número do Pedido */}
                <div className="text-center mt-30">
                  <p style={{ color: '#666' }}>
                    Número do pedido: <strong>#{orderId}</strong>
                  </p>
                  <Link
                    href={
                      pixData.orderKey
                        ? `/order/${orderId}?key=${encodeURIComponent(pixData.orderKey)}`
                        : `/order/${orderId}`
                    }
                    style={{ color: '#007bff' }}
                  >
                    Ver detalhes do pedido
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </Wrapper>
  );
};

const PixPaymentPage = () => {
  return (
    <Suspense fallback={
      <Wrapper>
        <Header style_2={true} />
        <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
          <Loader loading={true} />
        </div>
        <Footer />
      </Wrapper>
    }>
      <PixPaymentContent />
    </Suspense>
  );
};

export default PixPaymentPage;



