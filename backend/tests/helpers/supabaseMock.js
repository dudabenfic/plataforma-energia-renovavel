// Mock em memória do cliente Supabase usado nos testes.
// Reproduz a API encadeada do supabase-js (select/eq/in/order/range/
// single/maybeSingle/insert/update/upsert/delete) sobre tabelas em memória,
// para que o código de produção seja exercitado sem alterações.

function copiar(valor) {
  return valor === undefined ? undefined : JSON.parse(JSON.stringify(valor));
}

function iguais(a, b) {
  return String(a) === String(b);
}

function comparar(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return a < b ? -1 : 1;
}

function projetar(linha, colunas) {
  if (!colunas || colunas.trim() === "*") return { ...linha };

  return Object.fromEntries(
    colunas.split(",").map((c) => c.trim()).map((c) => [c, linha[c]])
  );
}

class Consulta {
  constructor(banco, tabela) {
    this.banco = banco;
    this.tabela = tabela;
    this.operacao = "select";
    this.colunas = "*";
    this.retornar = false;
    this.filtros = [];
    this.ordens = [];
    this.intervalo = null;
    this.limiteLinhas = null;
    this.modoUnico = null;
    this.contar = false;
  }

  select(colunas = "*", opcoes = {}) {
    this.colunas = colunas;
    if (this.operacao !== "select") this.retornar = true;
    if (opcoes.count) this.contar = true;
    return this;
  }

  insert(dados) {
    this.operacao = "insert";
    this.dados = dados;
    return this;
  }

  update(dados) {
    this.operacao = "update";
    this.dados = dados;
    return this;
  }

  upsert(dados, opcoes = {}) {
    this.operacao = "upsert";
    this.dados = dados;
    this.conflito = (opcoes.onConflict ?? "id").split(",").map((c) => c.trim());
    return this;
  }

  delete() {
    this.operacao = "delete";
    return this;
  }

  eq(coluna, valor) {
    this.filtros.push((linha) => iguais(linha[coluna], valor));
    return this;
  }

  in(coluna, valores) {
    this.filtros.push((linha) => valores.some((v) => iguais(linha[coluna], v)));
    return this;
  }

  gte(coluna, valor) {
    this.filtros.push((linha) => comparar(linha[coluna], valor) >= 0);
    return this;
  }

  lte(coluna, valor) {
    this.filtros.push((linha) => comparar(linha[coluna], valor) <= 0);
    return this;
  }

  order(coluna, opcoes = {}) {
    this.ordens.push({ coluna, ascendente: opcoes.ascending !== false });
    return this;
  }

  range(inicio, fim) {
    this.intervalo = [inicio, fim];
    return this;
  }

  limit(quantidade) {
    this.limiteLinhas = quantidade;
    return this;
  }

  single() {
    this.modoUnico = "single";
    return this;
  }

  maybeSingle() {
    this.modoUnico = "maybeSingle";
    return this;
  }

  then(resolver, rejeitar) {
    return Promise.resolve()
      .then(() => this.executar())
      .then(resolver, rejeitar);
  }

  linhasFiltradas() {
    return this.banco.tabela(this.tabela).filter((linha) =>
      this.filtros.every((filtro) => filtro(linha))
    );
  }

  executar() {
    this.banco.chamadas.push({ tabela: this.tabela, operacao: this.operacao });

    const falha = this.banco.consumirFalha(this.tabela, this.operacao);
    if (falha) return { data: null, error: falha, count: null };

    let linhas;

    switch (this.operacao) {
      case "insert":
        linhas = this.banco.inserir(this.tabela, this.dados);
        break;
      case "update":
        linhas = this.linhasFiltradas();
        linhas.forEach((linha) => Object.assign(linha, copiar(this.dados)));
        break;
      case "upsert":
        linhas = this.banco.upsert(this.tabela, this.dados, this.conflito);
        break;
      case "delete": {
        const removidas = this.linhasFiltradas();
        this.banco.tabelas[this.tabela] = this.banco
          .tabela(this.tabela)
          .filter((linha) => !removidas.includes(linha));
        linhas = removidas;
        break;
      }
      default:
        linhas = this.linhasFiltradas();
    }

    if (this.operacao !== "select" && !this.retornar) {
      return { data: null, error: null, count: null };
    }

    let resultado = [...linhas];

    for (const { coluna, ascendente } of [...this.ordens].reverse()) {
      resultado.sort((a, b) => comparar(a[coluna], b[coluna]) * (ascendente ? 1 : -1));
    }

    const total = resultado.length;

    if (this.intervalo) {
      resultado = resultado.slice(this.intervalo[0], this.intervalo[1] + 1);
    }

    if (this.limiteLinhas !== null) {
      resultado = resultado.slice(0, this.limiteLinhas);
    }

    resultado = resultado.map((linha) => copiar(projetar(linha, this.colunas)));

    if (this.modoUnico) {
      if (resultado.length === 1) {
        return { data: resultado[0], error: null, count: null };
      }

      if (resultado.length === 0 && this.modoUnico === "maybeSingle") {
        return { data: null, error: null, count: null };
      }

      return {
        data: null,
        error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
        count: null
      };
    }

    return { data: resultado, error: null, count: this.contar ? total : null };
  }
}

class BancoMemoria {
  constructor() {
    this.reiniciar({});
  }

  reiniciar(tabelas) {
    this.tabelas = copiar(tabelas);
    this.sequencias = {};
    this.falhas = [];
    this.chamadas = [];
  }

  tabela(nome) {
    if (!this.tabelas[nome]) this.tabelas[nome] = [];
    return this.tabelas[nome];
  }

  proximoId(nome) {
    const maior = this.tabela(nome).reduce((max, l) => Math.max(max, l.id ?? 0), 0);
    this.sequencias[nome] = Math.max(this.sequencias[nome] ?? 0, maior) + 1;
    return this.sequencias[nome];
  }

  inserir(nome, dados) {
    const lista = Array.isArray(dados) ? dados : [dados];

    return lista.map((item) => {
      const linha = { id: this.proximoId(nome), created_at: new Date().toISOString(), ...copiar(item) };
      if (nome === "simulacoes" && !linha.data_execucao) {
        linha.data_execucao = new Date().toISOString();
      }
      this.tabela(nome).push(linha);
      return linha;
    });
  }

  upsert(nome, dados, conflito) {
    const lista = Array.isArray(dados) ? dados : [dados];

    return lista.map((item) => {
      const existente = this.tabela(nome).find((linha) =>
        conflito.every((coluna) => iguais(linha[coluna], item[coluna]))
      );

      if (existente) {
        Object.assign(existente, copiar(item));
        return existente;
      }

      return this.inserir(nome, item)[0];
    });
  }

  // Faz a próxima operação na tabela retornar erro (simula falha do banco).
  falharEm(tabela, operacao, erro = { message: "falha simulada", code: "XX000" }) {
    this.falhas.push({ tabela, operacao, erro });
  }

  consumirFalha(tabela, operacao) {
    const indice = this.falhas.findIndex(
      (f) => f.tabela === tabela && f.operacao === operacao
    );

    if (indice === -1) return null;

    return this.falhas.splice(indice, 1)[0].erro;
  }
}

function criarSupabaseMock() {
  const banco = new BancoMemoria();

  return {
    banco,
    from: (tabela) => new Consulta(banco, tabela)
  };
}

module.exports = { criarSupabaseMock };
