"use client";
import React from "react";
import { useSelector } from "react-redux";

const UserHeroBanner = () => {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <section className="user-hero__area pt-120 pb-80 grey-bg-17">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="user-hero__content text-center">
              <span className="user-hero__subtitle">
                Bem-vindo(a) à sua área pessoal
              </span>
              <h2 className="user-hero__title">
                Olá, {user?.name?.split(' ')[0] || user?.name || 'Usuário'}!
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserHeroBanner;



