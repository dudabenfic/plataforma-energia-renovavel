export function Carregando({ texto = "Carregando..." }) {
  return (
    <div className="carregando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function Alerta({ tipo = "erro", children, aoFechar }) {
  if (!children) return null;

  return (
    <div className={`alerta alerta-${tipo}`} role={tipo === "erro" ? "alert" : "status"}>
      <div>{children}</div>
      {aoFechar && (
        <button type="button" className="botao-fechar" onClick={aoFechar} aria-label="Fechar">
          ×
        </button>
      )}
    </div>
  );
}

export function Vazio({ children }) {
  return <p className="vazio">{children}</p>;
}
