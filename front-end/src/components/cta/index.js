'use client';
import { useState } from 'react';
import styles from './cta.module.scss';
import { notifyError, notifySuccess } from '@utils/toast';

const ShopCta = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/brevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        notifySuccess(data.message || 'Inscrição realizada com sucesso!');
        setEmail('');
      } else {
        notifyError(data.message || 'Não foi possível inscrever. Tente novamente.');
      }
    } catch {
      notifyError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
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
                      <button type="submit" disabled={submitting}>
                        {submitting ? 'Enviando…' : 'Inscrever'}
                      </button>
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
