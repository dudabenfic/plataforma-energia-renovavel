import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { mensagemDeErro } from "../services/api";
import { Alerta } from "../components/Feedback";

function LoginPage() {
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState("login");
  const [formulario, setFormulario] = useState({ nome: "", email: "", senha: "", confirmacao: "" });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const cadastro = modo === "cadastro";

  function alterar(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  }

  function trocarModo(novoModo) {
    setModo(novoModo);
    setErro("");
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");

    if (cadastro && formulario.senha !== formulario.confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);

    try {
      if (cadastro) {
        await cadastrar(formulario.nome, formulario.email, formulario.senha);
      } else {
        await entrar(formulario.email, formulario.senha);
      }
    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível entrar."));
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-login">
      <div className="login-apresentacao">
        <h1>Plataforma de Energia Renovável</h1>
        <p>
          Análise multicritério (TOPSIS) da vulnerabilidade social relacionada ao
          acesso, uso e impacto da energia renovável nos municípios.
        </p>
      </div>

      <form className="cartao-login" onSubmit={enviar}>
        <div className="abas" role="tablist">
          <button type="button" role="tab" aria-selected={!cadastro} className={!cadastro ? "ativa" : ""} onClick={() => trocarModo("login")}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={cadastro} className={cadastro ? "ativa" : ""} onClick={() => trocarModo("cadastro")}>
            Criar conta
          </button>
        </div>

        {cadastro && (
          <label className="campo">
            Nome
            <input name="nome" value={formulario.nome} onChange={alterar} required autoComplete="name" />
          </label>
        )}

        <label className="campo">
          E-mail
          <input type="email" name="email" value={formulario.email} onChange={alterar} required autoComplete="email" />
        </label>

        <label className="campo">
          Senha
          <input
            type="password"
            name="senha"
            value={formulario.senha}
            onChange={alterar}
            required
            minLength={cadastro ? 6 : undefined}
            autoComplete={cadastro ? "new-password" : "current-password"}
          />
        </label>

        {cadastro && (
          <label className="campo">
            Confirmar senha
            <input
              type="password"
              name="confirmacao"
              value={formulario.confirmacao}
              onChange={alterar}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
        )}

        <Alerta>{erro}</Alerta>

        <button type="submit" className="botao largura-total" disabled={enviando}>
          {enviando ? "Aguarde..." : cadastro ? "Cadastrar" : "Entrar"}
        </button>

        {cadastro && (
          <p className="texto-suave">Novas contas recebem o perfil de pesquisador.</p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
