import Link from "next/link";
import React from "react";

const CopyrightText = () => {
  return (
    <p>
      Copyrights N-1 2026. Desenvolvido com{' '}
      <span 
        style={{ 
          display: 'inline-block',
          animation: 'heartbeat 1.5s ease-in-out infinite',
        }}
      >
        ❤️
      </span>{' '}
      por{' '}
      <Link href="https://agenciawebroad.com.br" target="_blank" rel="noopener noreferrer">
        WebRoad
      </Link>
    </p>
  );
};

export default CopyrightText;
