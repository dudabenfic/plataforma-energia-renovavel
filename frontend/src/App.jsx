import { lazy, Suspense, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { navegar, useHashRoute } from "./hooks/useHashRoute";
import { Carregando } from "./components/Feedback";
import LoginPage from "./pages/LoginPage";

// Páginas carregadas sob demanda (reduz o carregamento inicial).
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SimulacaoPage = lazy(() => import("./pages/SimulacaoPage"));
const MunicipiosPage = lazy(() => import("./pages/MunicipiosPage"));
const CriteriosPage = lazy(() => import("./pages/CriteriosPage"));
const ImportacaoPage = lazy(() => import("./pages/ImportacaoPage"));
const HistoricoPage = lazy(() => import("./pages/HistoricoPage"));
const UsuariosPage = lazy(() => import("./pages/UsuariosPage"));

const PAGINAS = [
  { rota: "dashboard", rotulo: "Dashboard", componente: DashboardPage },
  { rota: "simulacao", rotulo: "Simulação", componente: SimulacaoPage },
  { rota: "municipios", rotulo: "Municípios", componente: MunicipiosPage },
  { rota: "criterios", rotulo: "Critérios", componente: CriteriosPage },
  { rota: "importacao", rotulo: "Importação", componente: ImportacaoPage, requer: "podeEditar" },
  { rota: "historico", rotulo: "Histórico", componente: HistoricoPage },
  { rota: "usuarios", rotulo: "Usuários", componente: UsuariosPage, requer: "ehAdmin" }
];

const NOMES_PERFIL = { admin: "Administrador", pesquisador: "Pesquisador", gestor: "Gestor público" };

function App() {
  const auth = useAuth();
  const { pagina, parametro } = useHashRoute();
  const [menuAberto, setMenuAberto] = useState(false);

  if (auth.verificando) return <Carregando texto="Verificando sessão..." />;

  // Todas as páginas exigem login.
  if (!auth.usuario) return <LoginPage />;

  const permitidas = PAGINAS.filter((p) => !p.requer || auth[p.requer]);
  const atual = permitidas.find((p) => p.rota === pagina) ?? permitidas[0];
  const Pagina = atual.componente;

  function irPara(rota) {
    setMenuAberto(false);
    navegar(rota);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-topo">
          <button type="button" className="marca" onClick={() => irPara("dashboard")}>
            <span className="marca-icone" aria-hidden="true">☀</span>
            <span>
              <strong>Plataforma de Energia Renovável</strong>
              <small>Vulnerabilidade social energética · TOPSIS</small>
            </span>
          </button>

          <button
            type="button"
            className="botao-menu"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            Menu
          </button>
        </div>

        <nav id="menu-principal" className={`menu ${menuAberto ? "aberto" : ""}`}>
          {permitidas.map((p) => (
            <button
              type="button"
              key={p.rota}
              className={p.rota === atual.rota ? "ativo" : ""}
              aria-current={p.rota === atual.rota ? "page" : undefined}
              onClick={() => irPara(p.rota)}
            >
              {p.rotulo}
            </button>
          ))}

          <div className="usuario-logado">
            <span>
              {auth.usuario.nome}
              <small>{NOMES_PERFIL[auth.usuario.perfil] ?? auth.usuario.perfil}</small>
            </span>
            <button type="button" className="botao-sair" onClick={auth.sair}>
              Sair
            </button>
          </div>
        </nav>
      </header>

      <main className="content">
        <Suspense fallback={<Carregando />}>
          <Pagina key={atual.rota} simulacaoId={atual.rota === "historico" ? parametro : undefined} />
        </Suspense>
      </main>
    </div>
  );
}

export default App;
