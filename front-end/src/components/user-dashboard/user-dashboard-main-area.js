"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// internal
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import Footer from "@layout/footer";
import { useGetUserOrdersQuery } from "src/redux/features/orderApi";
import DashboardArea from "@components/user-dashboard/dashboard-area";
import UserHeroBanner from "@components/user-dashboard/user-hero-banner";
import Loader from "@components/loader/loader";
import ErrorMessage from "@components/error-message/error";

const UserDashboardMainArea = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const {
    data: orderData,
    isError,
    isLoading,
    error,
    refetch,
  } = useGetUserOrdersQuery(undefined, {
    skip: !isAuthenticated, // Só faz a requisição se estiver autenticado
  });

  useEffect(() => {
    const authData = localStorage.getItem("auth");
    if (!authData) {
      router.push("/login");
    } else {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.accessToken) {
          setIsAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch (e) {
        router.push("/login");
      }
    }
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isAuthenticated && orderData) {
      // Refetch apenas quando necessário
    }
  }, [isAuthenticated, orderData]);

  let content = null;

  if (checkingAuth || isLoading) {
    content = (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        <Loader loading={true} />
      </div>
    );
  } else if (isError) {
    console.error("Erro ao carregar pedidos:", error);
    // Mostrar dados vazios em vez de erro se for problema de autenticação
    const emptyData = {
      orders: [],
      totalDoc: 0,
      pending: 0,
      processing: 0,
      delivered: 0,
    };
    content = <DashboardArea orderData={emptyData} />;
  } else if (orderData) {
    content = <DashboardArea orderData={orderData} />;
  } else if (isAuthenticated) {
    // Ainda não carregou os dados
    const emptyData = {
      orders: [],
      totalDoc: 0,
      pending: 0,
      processing: 0,
      delivered: 0,
    };
    content = <DashboardArea orderData={emptyData} />;
  }

  return (
    <Wrapper>
      <Header style_2={true} />
      <UserHeroBanner />
      {content}
      <Footer />
    </Wrapper>
  );
};

export default UserDashboardMainArea;
