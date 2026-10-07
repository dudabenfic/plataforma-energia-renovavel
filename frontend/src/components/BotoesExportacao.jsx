import { useState } from "react";
import { exportarCsv, exportarPdf } from "../utils/relatorios";
import { Alerta } from "./Feedback";

function BotoesExportacao({ ranking, simulacao, criterios, anoReferencia, municipios, usuario }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  async function gerarPdf() {
    setGerando(true);
    setErro("");

    try {
      await exportarPdf({ ranking, simulacao, criterios, anoReferencia, usuario });
    } catch (error) {
      console.error(error);
      setErro("Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <div className="acoes">
        <button type="button" className="botao secundario" onClick={() => exportarCsv({ ranking, simulacao, municipios })}>
          Exportar CSV
        </button>
        <button type="button" className="botao secundario" onClick={gerarPdf} disabled={gerando}>
          {gerando ? "Gerando PDF..." : "Exportar PDF"}
        </button>
      </div>
      <Alerta aoFechar={() => setErro("")}>{erro}</Alerta>
    </>
  );
}

export default BotoesExportacao;
