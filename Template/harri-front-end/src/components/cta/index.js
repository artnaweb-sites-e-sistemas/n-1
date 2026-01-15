'use client';
import { useState, useEffect } from 'react';
// internal
import bg from "@assets/img/cta/13/cta-bg-1.jpg";

const ShopCta = () => {
  // Frases motivacionais relacionadas ao tema do projeto (editora, conhecimento, pensamento crítico)
  const motivationalPhrases = [
    "Desde 2011 produzindo conhecimento e transformando ideias em livros",
    "Pensamento crítico, reflexão e diálogo: construindo novos horizontes",
    "Livros que desafiam perspectivas e ampliam o debate intelectual",
    "Conhecimento que transforma: da teoria à prática, da página à ação",
    "Editora independente comprometida com a diversidade de pensamento",
    "Entre a clínica, antropologia e política: explorando fronteiras do saber",
    "Palavras que movem, ideias que transformam, livros que permanecem",
    "Publicando vozes que questionam, inspiram e revolucionam o pensamento",
    "Cada livro é uma porta aberta para novos mundos e possibilidades",
    "Conhecimento compartilhado é poder coletivo: juntos construímos o futuro"
  ];

  const [currentPhrase, setCurrentPhrase] = useState('');

  useEffect(() => {
    // Selecionar uma frase aleatória ao carregar a página
    const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
    setCurrentPhrase(motivationalPhrases[randomIndex]);
  }, []);

  return (
    <section
      className="cta__area pt-50 pb-50 p-relative include-bg jarallax"
      style={{ backgroundImage: `url(${bg.src})` }}
    >
      <div className="container">
        <div className="cta__inner-13 white-bg">
          <div className="row align-items-center justify-content-center">
            <div className="col-xl-12 col-lg-12">
              <div className="cta__content-13 text-center">
                <h3 className="cta__title-13" style={{ 
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  lineHeight: '1.4',
                  margin: 0,
                  fontWeight: 600
                }}>
                  {currentPhrase || motivationalPhrases[0]}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopCta;
