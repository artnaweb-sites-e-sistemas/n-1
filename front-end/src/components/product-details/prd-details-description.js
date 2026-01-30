import React from "react";
import Image from "next/image";
import styles from './prd-details-description.module.scss';

const PrdDetailsDescription = ({product}) => {
  const catalogContent = product?.catalogContent;
  const catalogImages = product?.catalogImages || [];
  const catalogPdf = product?.catalogPdf;
  const description = product?.description;

  // Se não houver conteúdo do catálogo, usar descrição padrão
  const displayContent = catalogContent || description || '';

  return (
    <div className={`product__details-description pt-95 ${styles.descriptionWrapper}`}>
      <div className={`product__details-description-content ${styles.descriptionContent}`}>
              {/* Título - só mostrar se não tiver conteúdo do catálogo (que já tem título) */}
              {!catalogContent && (
                <h3 className="product-desc-title">{product?.title}</h3>
              )}
              
              {/* Conteúdo editorial do catálogo ou descrição padrão */}
              {catalogContent ? (
                <div 
                  className={styles.catalogContent}
                  dangerouslySetInnerHTML={{ __html: catalogContent }}
                />
              ) : (
                <div className={styles.defaultDescription}>
                  <p>{description}</p>
                </div>
              )}

              {/* Galeria de imagens internas do catálogo - removida pois já está no HTML */}
              {/* As imagens já vêm no catalogContent, então não precisamos duplicar */}

              {/* PDF ou Visualizador Issuu */}
              {catalogPdf && (
                <div className={styles.pdfSection}>
                  {catalogPdf.includes('issuu.com') ? (
                    // Se for URL do Issuu, renderizar iframe
                    <div className={styles.issuuViewer}>
                      <h4 className={styles.pdfTitle}>Visualização do Livro</h4>
                      <iframe
                        src={catalogPdf}
                        title="Visualização do livro"
                        className={styles.issuuIframe}
                        allowFullScreen
                        allow="clipboard-write;allow-top-navigation;allow-top-navigation-by-user-activation;allow-downloads;allow-scripts;allow-same-origin;allow-popups;allow-modals;allow-popups-to-escape-sandbox;allow-forms"
                      />
                    </div>
                  ) : (
                    // Se for PDF direto, mostrar botão
                    <a
                      href={catalogPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pdfButton}
                    >
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Ver/Baixar PDF</span>
                    </a>
                  )}
                </div>
              )}
      </div>
    </div>
  );
};

export default PrdDetailsDescription;
