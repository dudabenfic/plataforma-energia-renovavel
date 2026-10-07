import { useEffect, useState } from "react";

function lerRota() {
  const partes = window.location.hash.replace(/^#\/?/, "").split("/");

  return { pagina: partes[0] || "dashboard", parametro: partes[1] || null };
}

// Navegação simples por hash (#/pagina/parametro), sem dependências extras
// e sem necessidade de configurar rewrites no Vercel.
export function useHashRoute() {
  const [rota, setRota] = useState(lerRota);

  useEffect(() => {
    const atualizar = () => {
      setRota(lerRota());
      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", atualizar);
    return () => window.removeEventListener("hashchange", atualizar);
  }, []);

  return rota;
}

export function navegar(caminho) {
  window.location.hash = `#/${caminho}`;
}
