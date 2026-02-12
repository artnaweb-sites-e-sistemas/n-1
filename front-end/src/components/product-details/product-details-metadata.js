import React from "react";

const ProductDetailsMetadata = ({ product }) => {
  const {
    bookTitle,
    originalTitle,
    author,
    authors,
    organization,
    translation,
    preparation,
    revision,
    year,
    pages,
    dimensions,
    isbn
  } = product || {};

  // Se não houver metadados, não renderizar nada
  if (!bookTitle && !author && !authors && !isbn) {
    return null;
  }

  return (
    <>
      {bookTitle && (
        <div className="product__details-metadata product__details-more">
          <p>Título:</p>
          <span>{bookTitle}</span>
        </div>
      )}
      {originalTitle && (
        <div className="product__details-metadata product__details-more">
          <p>Título Original:</p>
          <span>{originalTitle}</span>
        </div>
      )}
      {author && (
        <div className="product__details-metadata product__details-more">
          <p>Autor:</p>
          <span>{author}</span>
        </div>
      )}
      {authors && (
        <div className="product__details-metadata product__details-more">
          <p>Autores:</p>
          <span>{authors}</span>
        </div>
      )}
      {organization && (
        <div className="product__details-metadata product__details-more">
          <p>Organização:</p>
          <span>{organization}</span>
        </div>
      )}
      {translation && (
        <div className="product__details-metadata product__details-more">
          <p>Tradução:</p>
          <span>{translation}</span>
        </div>
      )}
      {preparation && (
        <div className="product__details-metadata product__details-more">
          <p>Preparação:</p>
          <span>{preparation}</span>
        </div>
      )}
      {revision && (
        <div className="product__details-metadata product__details-more">
          <p>Revisão:</p>
          <span>{revision}</span>
        </div>
      )}
      {year && (
        <div className="product__details-metadata product__details-more">
          <p>Ano:</p>
          <span>{year}</span>
        </div>
      )}
      {pages && (
        <div className="product__details-metadata product__details-more">
          <p>N˚ de páginas:</p>
          <span>{pages}</span>
        </div>
      )}
      {dimensions && (
        <div className="product__details-metadata product__details-more">
          <p>Dimensões:</p>
          <span>{dimensions}</span>
        </div>
      )}
      {isbn && (
        <div className="product__details-metadata product__details-more">
          <p>ISBN:</p>
          <span>{isbn}</span>
        </div>
      )}
    </>
  );
};

export default ProductDetailsMetadata;

