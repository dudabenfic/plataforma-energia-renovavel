import axios from "axios";

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

const CHAVE_TOKEN = "per_token";

export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Navegação privada pode bloquear o localStorage.
  }
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = lerToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let aoExpirarSessao = () => {};

export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

api.interceptors.response.use(
  (resposta) => resposta,
  (error) => {
    const rotaDeLogin = error.config?.url?.startsWith("/auth/login");

    if (error.response?.status === 401 && !rotaDeLogin) {
      aoExpirarSessao();
    }

    return Promise.reject(error);
  }
);

export function mensagemDeErro(error, padrao = "Não foi possível concluir a operação.") {
  if (error?.response?.data?.erro) return error.response.data.erro;

  if (error?.response?.status === 404) {
    return "Rota não encontrada na API. Verifique se o backend está atualizado e se VITE_API_URL está correta.";
  }

  if (error?.code === "ECONNABORTED") {
    return "O servidor demorou para responder. Tente novamente.";
  }

  if (error?.request && !error.response) {
    return "Não foi possível conectar à API. Verifique sua conexão ou tente novamente em instantes.";
  }

  return padrao;
}

export default api;
