// internal
import {Payment, Refund, ShippingCar, Support} from "@svg/index";

// SingleFeature
function SingleFeature({ icon, title, subtitle }) {
  return (
    <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
      <div className="features__item-13 d-flex align-items-start mb-40">
        <div className="features__icon-13">
          <span>{icon}</span>
        </div>
        <div className="features__content-13">
          <h3 className="features__title-13">{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

const ShopFeature = () => {
  return (
    <>
      <section className="features__area pt-80 pb-20">
        <div className="container">
          <div className="row">
            <SingleFeature
              icon={<ShippingCar />}
              title="Frete Grátis"
              subtitle={
                <>
                  Frete grátis para pedidos <br /> acima de R$ 200
                </>
              }
            />
            <SingleFeature
              icon={<Refund/>}
              title="Reembolso"
              subtitle={
                <>
                  Até 30 dias para <br /> troca.
                </>
              }
            />
            <SingleFeature
              icon={<Support />}
              title="Suporte"
              subtitle={
                <>
                  24 horas por dia, 7 dias <br /> por semana
                </>
              }
            />
            <SingleFeature
              icon={<Payment />}
              title="Pagamento"
              subtitle={
                <>
                  Pague com múltiplos <br /> cartões de crédito
                </>
              }
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopFeature;
