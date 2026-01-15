import React from "react";
import {Box, Delivery, Processing, Truck} from "@svg/index";

function SingleOrderInfo({ icon, info, title }) {
  return (
    <div className="col-md-3 col-sm-6">
      <div className="profile__main-info-item">
        <div className="profile__main-info-icon">
          <span className="total-order">
            <span className="profile-icon-count profile-download">{info ?? 0}</span>
            {icon}
          </span>
        </div>
        <h4 className="profile__main-info-title">{title}</h4>
      </div>
    </div>
  );
}

const OrderInfo = ({ orderData }) => {
  return (
    <div className="profile__main">
      <div className="profile__main-info">
        <div className="row gx-3">
          <SingleOrderInfo
            info={orderData?.totalDoc ?? 0}
            icon={<Box/>}
            title="Total de Pedidos"
          />
          <SingleOrderInfo
            info={orderData?.pending ?? 0}
            icon={<Processing/>}
            title="Pendentes"
          />
          <SingleOrderInfo
            info={orderData?.processing ?? 0}
            icon={<Truck/>}
            title="Em Processamento"
          />
          <SingleOrderInfo
            info={orderData?.delivered ?? 0}
            icon={<Delivery/>}
            title="Entregues"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderInfo;
