import React from "react";
import styles from './prd-details-description.module.scss';
import {
  getFirstParagraphAndRest,
  textsAreEquivalent,
} from "src/utils/description-paragraphs";
import { removeMainImageFromCatalogHtml } from "src/utils/product-page-main-image";
import { hasCatalogLayout } from "@utils/catalog-layout";

const PrdDetailsDescription = ({ product, mainImageUrl }) => {
  const catalogContent = product?.catalogContent;
  const catalogPdf = product?.catalogPdf;
  const description = product?.description;
  const useCatalogLayout = hasCatalogLayout(product);

  let restContent = "";

  if (useCatalogLayout) {
    const descTrimmed = String(description || "").trim();
    if (descTrimmed) {
      // Descrição preenchida: mostrar catalogContent completo abaixo.
      // Exceção (livros migrados): se o 1º parágrafo ≡ descrição, omitir esse parágrafo
      // para não duplicar o que já aparece ao lado da capa.
      const { firstParagraph, restContent: afterFirst } = getFirstParagraphAndRest(
        catalogContent,
        true
      );
      if (firstParagraph && textsAreEquivalent(firstParagraph, descTrimmed)) {
        restContent = afterFirst;
      } else {
        restContent = catalogContent;
      }
    } else {
      // Sem descrição: comportamento atual (1º parágrafo ao lado da capa, restante abaixo).
      let { restContent: afterFirst } = getFirstParagraphAndRest(catalogContent, true);
      if (!afterFirst || !String(afterFirst).trim()) {
        afterFirst = catalogContent;
      }
      restContent = afterFirst;
    }
  } else {
    const rawContent = description || "";
    let { restContent: afterFirst } = getFirstParagraphAndRest(rawContent, false);
    if (!afterFirst || !String(afterFirst).trim()) {
      afterFirst = rawContent;
    }
    restContent = afterFirst;
  }

  // Remover o mockup/capa principal duplicado no HTML editorial
  // (compara por basename: URL do WP vs /images/... no catalogContent)
  if (useCatalogLayout && mainImageUrl && restContent) {
    restContent = removeMainImageFromCatalogHtml(restContent, mainImageUrl);
  }

  // Issuu: só bloco separado se NÃO houver iframe Issuu já no conteúdo editorial
  const contentHasIssuuIframe =
    useCatalogLayout &&
    /<iframe\b[^>]*src=["'][^"']*issuu[^"']*["']/i.test(String(catalogContent));
  const showSeparatePdfBlock = Boolean(catalogPdf) && !contentHasIssuuIframe;

  return (
    <div className={`product__details-description pt-95 ${styles.descriptionWrapper}`}>
      <div className={`product__details-description-content ${styles.descriptionContent}`}>
              {!useCatalogLayout && (
                <h3 className="product-desc-title">{product?.title}</h3>
              )}
              
              {restContent ? (
                useCatalogLayout ? (
                  <div 
                    className={styles.catalogContent}
                    dangerouslySetInnerHTML={{ __html: restContent }}
                  />
                ) : (
                  <div className={styles.defaultDescription}>
                    <p>{restContent}</p>
                  </div>
                )
              ) : null}

              {showSeparatePdfBlock && (
                <div className={styles.pdfSection}>
                  {catalogPdf.includes('issuu.com') ? (
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
