import { useCallback, useEffect, useMemo, useState } from "react";
import api, { definirAoExpirarSessao, lerToken, salvarToken } from "../services/api";
import { AuthContext } from "../hooks/useAuth";

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(() => Boolean(lerToken()));

  const sair = useCallback(() => {
    salvarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    definirAoExpirarSessao(sair);
  }, [sair]);

  // Valida o token salvo ao abrir a aplicação.
  useEffect(() => {
    if (!lerToken()) return;

    api
      .get("/auth/me")
      .then((resposta) => setUsuario(resposta.data.usuario))
      .catch(() => sair())
      .finally(() => setVerificando(false));
  }, [sair]);

  const entrar = useCallback(async (email, senha) => {
    const resposta = await api.post("/auth/login", { email, senha });

    salvarToken(resposta.data.token);
    setUsuario(resposta.data.usuario);
  }, []);

  const cadastrar = useCallback(
    async (nome, email, senha) => {
      await api.post("/auth/register", { nome, email, senha });
      await entrar(email, senha);
    },
    [entrar]
  );

  const valor = useMemo(
    () => ({
      usuario,
      verificando,
      entrar,
      cadastrar,
      sair,
      podeEditar: ["admin", "pesquisador"].includes(usuario?.perfil),
      ehAdmin: usuario?.perfil === "admin"
    }),
    [usuario, verificando, entrar, cadastrar, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
