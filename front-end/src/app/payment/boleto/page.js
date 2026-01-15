'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@layout/header';
import Footer from '@layout/footer';
import Wrapper from '@layout/wrapper';
import Loader from '@components/loader/loader';

const BoletoPaymentPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  
  const [boletoData, setBoletoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    // Carregar dados do Boleto do localStorage
    const storedData = localStorage.getItem('pendingBoletoPayment');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.orderId === orderId) {
          setBoletoData(parsed);
          
          // Calcular dias restantes
          if (parsed.boletoData?.expires_at) {
            const expiresAt = new Date(parsed.boletoData.expires_at * 1000);
            const now = new Date();
            const diffTime = expiresAt - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(Math.max(0, diffDays));
          }
        }
      } catch (e) {
        console.error('Erro ao carregar dados do Boleto:', e);
      }
    }
    setLoading(false);
  }, [orderId]);

  const handleCopyBarcode = () => {
    if (boletoData?.boletoData?.number) {
      navigator.clipboard.writeText(boletoData.boletoData.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatBarcode = (code) => {
    if (!code) return '';
    // Formatar código de barras para melhor visualização (grupos de 5)
    return code.replace(/(.{5})/g, '$1 ').trim();
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

  if (!boletoData) {
    return (
      <Wrapper>
        <Header style_2={true} />
        <section className="pt-120 pb-120">
          <div className="container">
            <div className="text-center">
              <i className="fa fa-exclamation-circle" style={{ fontSize: '60px', color: '#dc3545', marginBottom: '20px' }}></i>
              <h2>Dados do Boleto não encontrados</h2>
              <p className="mt-20">Os dados do boleto expiraram ou não foram encontrados.</p>
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

  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <Wrapper>
      <Header style_2={true} />
      <section className="pt-80 pb-80" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <div className="boleto-payment-card" style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                {/* Header */}
                <div className="text-center mb-40">
                  <div style={{
                    backgroundColor: '#1a237e',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <i className="fa fa-barcode" style={{ fontSize: '36px', color: 'white' }}></i>
                  </div>
                  <h2 style={{ marginBottom: '10px' }}>Seu Boleto foi Gerado!</h2>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    Pague o boleto em qualquer banco, lotérica ou pelo internet banking
                  </p>
                </div>

                {/* Vencimento */}
                {!isExpired && daysLeft !== null && (
                  <div className="text-center mb-30" style={{
                    backgroundColor: daysLeft <= 1 ? '#fff3cd' : '#e3f2fd',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: `1px solid ${daysLeft <= 1 ? '#ffc107' : '#90caf9'}`,
                  }}>
                    <i className="fa fa-calendar" style={{ marginRight: '10px', color: daysLeft <= 1 ? '#856404' : '#1565c0' }}></i>
                    <span style={{ color: daysLeft <= 1 ? '#856404' : '#1565c0', fontWeight: '500' }}>
                      {daysLeft === 1 
                        ? 'Vence amanhã! Pague hoje para evitar problemas.' 
                        : `Vencimento em ${daysLeft} dias`
                      }
                    </span>
                  </div>
                )}

                {isExpired && (
                  <div className="text-center mb-30" style={{
                    backgroundColor: '#f8d7da',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb',
                  }}>
                    <i className="fa fa-exclamation-triangle" style={{ marginRight: '10px', color: '#721c24' }}></i>
                    <span style={{ color: '#721c24', fontWeight: '500' }}>
                      Este boleto está vencido. Por favor, faça um novo pedido.
                    </span>
                  </div>
                )}

                {/* Valor */}
                <div className="text-center mb-30">
                  <p style={{ color: '#666', marginBottom: '5px' }}>Valor a pagar:</p>
                  <h3 style={{ fontSize: '32px', color: '#000', fontWeight: 'bold' }}>
                    R$ {Number(boletoData.amount).toFixed(2).replace('.', ',')}
                  </h3>
                </div>

                {!isExpired && (
                  <>
                    {/* Código de Barras */}
                    {boletoData.boletoData?.number && (
                      <div className="mb-30">
                        <p style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '500' }}>
                          Código de barras:
                        </p>
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '20px',
                          borderRadius: '8px',
                          textAlign: 'center',
                        }}>
                          {/* Simulação visual do código de barras */}
                          <div style={{
                            height: '60px',
                            background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 5px)',
                            marginBottom: '15px',
                            borderRadius: '4px',
                          }}></div>
                          
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            letterSpacing: '2px',
                            color: '#333',
                            wordBreak: 'break-all',
                          }}>
                            {formatBarcode(boletoData.boletoData.number)}
                          </div>
                        </div>
                        
                        <div className="text-center mt-20">
                          <button
                            onClick={handleCopyBarcode}
                            className="tp-btn"
                            style={{
                              backgroundColor: copied ? '#28a745' : '#000',
                              minWidth: '200px',
                            }}
                          >
                            <i className={`fa ${copied ? 'fa-check' : 'fa-copy'}`} style={{ marginRight: '10px' }}></i>
                            {copied ? 'Código Copiado!' : 'Copiar Código de Barras'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botão para visualizar/baixar boleto */}
                    {boletoData.boletoData?.hosted_voucher_url && (
                      <div className="text-center mb-30">
                        <a
                          href={boletoData.boletoData.hosted_voucher_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tp-btn"
                          style={{
                            backgroundColor: '#1a237e',
                            display: 'inline-block',
                            minWidth: '250px',
                          }}
                        >
                          <i className="fa fa-download" style={{ marginRight: '10px' }}></i>
                          Visualizar / Imprimir Boleto
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* Instruções */}
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px',
                }}>
                  <h5 style={{ marginBottom: '15px', color: '#1565c0' }}>
                    <i className="fa fa-info-circle" style={{ marginRight: '10px' }}></i>
                    Como pagar o boleto:
                  </h5>
                  <ol style={{ paddingLeft: '20px', marginBottom: '0', color: '#333' }}>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Internet Banking:</strong> Copie o código de barras e pague pelo app do seu banco
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Caixa Eletrônico:</strong> Use a opção "Pagamentos" e digite o código de barras
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong>Lotérica ou Banco:</strong> Apresente o boleto impresso ou o código de barras
                    </li>
                    <li style={{ marginBottom: '0' }}>
                      <strong>Prazo:</strong> O pagamento pode levar até 2 dias úteis para ser confirmado
                    </li>
                  </ol>
                </div>

                {/* Aviso importante */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '15px 20px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  borderLeft: '4px solid #ffc107',
                }}>
                  <p style={{ marginBottom: '0', color: '#856404' }}>
                    <i className="fa fa-exclamation-triangle" style={{ marginRight: '10px' }}></i>
                    <strong>Importante:</strong> O pedido será confirmado somente após a compensação do boleto. 
                    Pagamentos após o vencimento não serão processados.
                  </p>
                </div>

                {/* Número do Pedido */}
                <div className="text-center mt-30">
                  <p style={{ color: '#666' }}>
                    Número do pedido: <strong>#{orderId}</strong>
                  </p>
                  <Link href={`/order/${orderId}`} style={{ color: '#007bff' }}>
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

export default BoletoPaymentPage;



