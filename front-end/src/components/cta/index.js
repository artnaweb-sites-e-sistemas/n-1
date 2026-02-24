'use client';
import { useState } from 'react';
import styles from './cta.module.scss';

const ShopCta = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Integração com base de leads será adicionada posteriormente
    console.log('Newsletter submit - email:', email);
  };

  return (
    <section
      className={`cta__area p-relative ${styles.ctaArea} ${styles.ctaCompact}`}
    >
      <div className="container">
        <div className={`cta__inner-13 ${styles.ctaInner}`}>
          <div className="row align-items-center justify-content-center">
            <div className="col-xl-12 col-lg-12">
              <div className="cta__content-13 text-center">
                <div className={styles.newsletterWrap}>
                  <p className={styles.newsletterLabel}>Receba nossas novidades por e-mail</p>
                  <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
                    <div className={styles.newsletterInput}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu e-mail"
                        required
                        aria-label="E-mail para newsletter"
                      />
                      <button type="submit">Inscrever</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopCta;
