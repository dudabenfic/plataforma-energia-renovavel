import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Alerta, Carregando } from "../components/Feedback";
import { formatarData } from "../utils/formatacao";

const PERFIS = {
  admin: "Administrador",
  pesquisador: "Pesquisador",
  gestor: "Gestor público"
};

// RF08 — gerenciamento de perfis de acesso (somente administrador).
function UsuariosPage() {
  const { usuario: atual } = useAuth();
  const [usuarios, setUsuarios] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get("/usuarios")
      .then(({ data }) => setUsuarios(data.usuarios))
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar os usuários.")));
  }, []);

  async function atualizar(id, dados) {
    setErro("");

    try {
      const { data } = await api.patch(`/usuarios/${id}`, dados);
      setUsuarios(usuarios.map((u) => (u.id === id ? data.usuario : u)));
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  if (!usuarios) return erro ? <Alerta>{erro}</Alerta> : <Carregando />;

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Usuários e perfis</h2>
          <p>
            Administrador: acesso total. Pesquisador: cadastra dados, configura critérios e executa
            simulações. Gestor público: consulta, executa simulações e gera relatórios.
          </p>
        </div>
      </div>

      <Alerta aoFechar={() => setErro("")}>{erro}</Alerta>

      <section className="panel">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const proprio = u.id === atual.id;

                return (
                  <tr key={u.id} className={u.ativo ? "" : "inativo"}>
                    <td>{u.nome}{proprio && " (você)"}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.perfil}
                        disabled={proprio}
                        onChange={(e) => atualizar(u.id, { perfil: e.target.value })}
                        aria-label={`Perfil de ${u.nome}`}
                      >
                        {Object.entries(PERFIS).map(([valor, rotulo]) => (
                          <option key={valor} value={valor}>{rotulo}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={u.ativo}
                          disabled={proprio}
                          onChange={(e) => atualizar(u.id, { ativo: e.target.checked })}
                        />
                        {u.ativo ? "Ativo" : "Inativo"}
                      </label>
                    </td>
                    <td>{formatarData(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default UsuariosPage;
