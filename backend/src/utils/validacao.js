const AppError = require("./app-error");

function vazio(valor) {
  return valor === undefined || valor === null || String(valor).trim() === "";
}

// Converte números aceitando vírgula decimal (padrão brasileiro).
function paraNumero(valor) {
  if (typeof valor === "number") return valor;
  if (vazio(valor)) return NaN;

  let texto = String(valor).trim();

  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  return texto === "" ? NaN : Number(texto);
}

function idValido(valor, nome = "ID") {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${nome} inválido.`, 400);
  }

  return id;
}

function normalizarUf(uf) {
  const ufNormalizada = String(uf ?? "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(ufNormalizada)) {
    throw new AppError("A UF deve conter exatamente 2 letras.", 400);
  }

  return ufNormalizada;
}

function validarCoordenadas(latitude, longitude) {
  const lat = paraNumero(latitude);
  const lng = paraNumero(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new AppError("Latitude ou longitude inválida.", 400);
  }

  return { lat, lng };
}

module.exports = {
  vazio,
  paraNumero,
  idValido,
  normalizarUf,
  validarCoordenadas
};
