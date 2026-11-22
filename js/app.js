// Lógica da busca de CEPs (Passos, MG) e dos modais

(() => {
  "use strict";

  const DATA_URL = "./data/ceps.json";
  const MIN_CHARS = 3;
  const MAX_SUGGESTIONS = 30;

  let ceps = [];
  let resultadosAtuais = [];
  let indiceAtivo = -1;
  let baseCarregada = false;

  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("logradouro-input");
  const clearBtn = document.getElementById("clear-search-btn");
  const comboboxWrapper = document.getElementById("combobox-wrapper");
  const suggestionsList = document.getElementById("suggestions-list");
  const searchHint = document.getElementById("search-hint");
  const exampleChips = document.querySelectorAll(".example-chip");

  const statTotal = document.getElementById("stat-total");
  const statBairros = document.getElementById("stat-bairros");
  const statRuas = document.getElementById("stat-ruas");
  const statOutros = document.getElementById("stat-outros");

  const resultEmpty = document.getElementById("result-empty");
  const resultCard = document.getElementById("result-card");
  const resultBadge = document.getElementById("result-badge");
  const resultLogradouro = document.getElementById("result-logradouro");
  const resultCep = document.getElementById("result-cep");
  const copyCepBtn = document.getElementById("copy-cep-btn");
  const copyCepLabel = document.getElementById("copy-cep-label");

  const detailLogradouro = document.getElementById("detail-logradouro");
  const detailComplementoRow = document.getElementById("detail-complemento-row");
  const detailComplemento = document.getElementById("detail-complemento");
  const detailBairro = document.getElementById("detail-bairro");
  const detailLocalidade = document.getElementById("detail-localidade");
  const detailDdd = document.getElementById("detail-ddd");
  const detailIbge = document.getElementById("detail-ibge");

  let modalAberto = null;
  let elementoAnterior = null;
  let timerCopia = null;

  // Remove acentos e normaliza maiúsculas para facilitar a busca
  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function identificarTipo(logradouro) {
    const inicio = normalizar(logradouro);
    if (inicio.startsWith("rua")) return "Rua";
    if (inicio.startsWith("avenida")) return "Avenida";
    if (inicio.startsWith("praca")) return "Praça";
    if (inicio.startsWith("travessa")) return "Travessa";
    if (inicio.startsWith("alameda")) return "Alameda";
    if (inicio.startsWith("estrada")) return "Estrada";
    if (inicio.startsWith("rodovia")) return "Rodovia";
    if (inicio.startsWith("beco")) return "Beco";
    return "Logradouro";
  }

  // Destaca o trecho buscado no texto sem usar innerHTML
  function destacarTrecho(textoOriginal, termo) {
    const fragment = document.createDocumentFragment();
    const termoNorm = normalizar(termo);

    if (!termoNorm) {
      fragment.appendChild(document.createTextNode(textoOriginal));
      return fragment;
    }

    const chars = Array.from(textoOriginal);
    let textoNorm = "";
    const mapaIndices = [];

    chars.forEach((ch, idx) => {
      const chNorm = ch
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      for (let j = 0; j < chNorm.length; j += 1) {
        textoNorm += chNorm[j];
        mapaIndices.push(idx);
      }
    });

    const pos = textoNorm.indexOf(termoNorm);
    if (pos === -1) {
      fragment.appendChild(document.createTextNode(textoOriginal));
      return fragment;
    }

    const ini = mapaIndices[pos];
    const fim = mapaIndices[pos + termoNorm.length - 1] + 1;

    const antes = chars.slice(0, ini).join("");
    const trecho = chars.slice(ini, fim).join("");
    const depois = chars.slice(fim).join("");

    if (antes) fragment.appendChild(document.createTextNode(antes));

    const mark = document.createElement("mark");
    mark.textContent = trecho;
    fragment.appendChild(mark);

    if (depois) fragment.appendChild(document.createTextNode(depois));

    return fragment;
  }

  function atualizarAviso(mensagem, erro = false) {
    searchHint.textContent = mensagem;
    searchHint.classList.toggle("is-error", erro);
  }

  function atualizarContadores() {
    let ruas = 0;
    let avenidasPracas = 0;
    const bairrosUnicos = new Set();

    ceps.forEach((item) => {
      const tipo = identificarTipo(item.logradouro);
      if (tipo === "Rua") ruas += 1;
      if (tipo === "Avenida" || tipo === "Praça") avenidasPracas += 1;
      if (item.bairro) bairrosUnicos.add(item.bairro);
    });

    const formatador = new Intl.NumberFormat("pt-BR");
    if (statTotal) statTotal.textContent = formatador.format(ceps.length);
    if (statBairros) statBairros.textContent = formatador.format(bairrosUnicos.size);
    if (statRuas) statRuas.textContent = formatador.format(ruas);
    if (statOutros) statOutros.textContent = formatador.format(avenidasPracas);
  }

  async function carregarBase() {
    try {
      const resposta = await fetch(DATA_URL, {
        headers: { Accept: "application/json" }
      });

      if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status}`);
      }

      const dados = await resposta.json();
      if (!Array.isArray(dados)) {
        throw new Error("O arquivo JSON não contém uma lista válida.");
      }

      ceps = dados.map((item) => ({
        cep: item.cep || "",
        logradouro: item.logradouro || "",
        complemento: item.complemento || "",
        bairro: item.bairro || "",
        localidade: item.localidade || "Passos",
        uf: item.uf || "MG",
        estado: item.estado || "Minas Gerais",
        ddd: item.ddd || "35",
        ibge: item.ibge || "3147907",
        buscaLogradouro: normalizar(item.logradouro),
        buscaBairro: normalizar(item.bairro)
      }));

      baseCarregada = true;
      atualizarContadores();
      atualizarAviso(
        `Base pronta com ${ceps.length.toLocaleString("pt-BR")} endereços de Passos. Digite pelo menos 3 caracteres para buscar.`
      );
    } catch (err) {
      baseCarregada = false;
      console.error("Falha ao carregar ./data/ceps.json:", err);
      atualizarAviso(
        "Não foi possível carregar ./data/ceps.json. Abra o projeto usando um servidor local (como Live Server) ou pela versão publicada.",
        true
      );
    }
  }

  // Ordena de A-Z priorizando ruas com nome completo (deixando códigos de 1 letra para busca exata)
  function filtrarEnderecos(termo) {
    const query = normalizar(termo);
    const encontrados = [];

    for (let i = 0; i < ceps.length; i += 1) {
      const item = ceps[i];
      const idxRua = item.buscaLogradouro.indexOf(query);
      const idxBairro = item.buscaBairro.indexOf(query);

      if (idxRua === -1 && idxBairro === -1) continue;

      const ehLetraIsolada = /^(rua|avenida|praca|travessa)\s+[a-z0-9]$/.test(item.buscaLogradouro);
      const buscaExata = item.buscaLogradouro === query;

      let peso = 5;
      if (buscaExata) {
        peso = 0;
      } else if (idxRua === 0) {
        peso = ehLetraIsolada ? 3.5 : 1;
      } else if (idxRua > 0 && item.buscaLogradouro[idxRua - 1] === " ") {
        peso = 2;
      } else if (idxRua > 0) {
        peso = 3;
      } else if (idxBairro === 0) {
        peso = 4;
      }

      encontrados.push({ item, peso });
    }

    encontrados.sort((a, b) => {
      if (a.peso !== b.peso) return a.peso - b.peso;
      return a.item.logradouro.localeCompare(b.item.logradouro, "pt-BR");
    });

    return encontrados.map((entry) => entry.item);
  }

  function alternarDropdown(aberto) {
    suggestionsList.hidden = !aberto;
    searchInput.setAttribute("aria-expanded", aberto ? "true" : "false");
    if (!aberto) {
      indiceAtivo = -1;
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function renderizarSugestoes(listaCompleta, termo) {
    suggestionsList.textContent = "";
    const visiveis = listaCompleta.slice(0, MAX_SUGGESTIONS);
    resultadosAtuais = visiveis;
    indiceAtivo = -1;
    searchInput.removeAttribute("aria-activedescendant");

    if (visiveis.length === 0) {
      const vazio = document.createElement("li");
      vazio.className = "suggestion-empty";
      vazio.setAttribute("role", "option");
      vazio.setAttribute("aria-disabled", "true");
      vazio.textContent = `Nenhum endereço encontrado para "${termo.trim()}".`;
      suggestionsList.appendChild(vazio);
      alternarDropdown(true);
      atualizarAviso("Nenhum logradouro ou bairro correspondente encontrado.");
      return;
    }

    const fragment = document.createDocumentFragment();

    visiveis.forEach((item, index) => {
      const li = document.createElement("li");
      li.id = `sugestao-${index}`;
      li.className = "suggestion-item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");

      const colunaTexto = document.createElement("div");
      colunaTexto.className = "suggestion-main";

      const nomeRua = document.createElement("span");
      nomeRua.className = "suggestion-street";
      nomeRua.appendChild(destacarTrecho(item.logradouro, termo));

      const detalhes = document.createElement("span");
      detalhes.className = "suggestion-meta";
      if (item.bairro) {
        detalhes.appendChild(document.createTextNode("Bairro "));
        detalhes.appendChild(destacarTrecho(item.bairro, termo));
        if (item.complemento) {
          detalhes.appendChild(document.createTextNode(` · ${item.complemento}`));
        }
      } else {
        detalhes.textContent = item.complemento || `${item.localidade}/${item.uf}`;
      }

      colunaTexto.appendChild(nomeRua);
      colunaTexto.appendChild(detalhes);

      const cepBadge = document.createElement("span");
      cepBadge.className = "suggestion-cep";
      cepBadge.textContent = item.cep;

      li.appendChild(colunaTexto);
      li.appendChild(cepBadge);

      li.addEventListener("mousedown", (event) => {
        event.preventDefault();
        selecionarEndereco(item);
      });

      fragment.appendChild(li);
    });

    if (listaCompleta.length > MAX_SUGGESTIONS) {
      const avisoMais = document.createElement("li");
      avisoMais.className = "suggestion-more";
      avisoMais.setAttribute("role", "presentation");
      avisoMais.textContent = `Mostrando ${MAX_SUGGESTIONS} de ${listaCompleta.length.toLocaleString("pt-BR")} resultados — continue digitando para filtrar.`;
      fragment.appendChild(avisoMais);
    }

    suggestionsList.appendChild(fragment);
    alternarDropdown(true);

    const textoQtd =
      listaCompleta.length === 1
        ? "1 endereço encontrado."
        : `${listaCompleta.length.toLocaleString("pt-BR")} endereços encontrados.`;
    atualizarAviso(`${textoQtd} Selecione uma opção para ver os detalhes.`);
  }

  function atualizarItemAtivo(novoIndice) {
    const itens = suggestionsList.querySelectorAll(".suggestion-item");
    if (itens.length === 0) return;

    itens.forEach((el) => {
      el.classList.remove("is-active");
      el.setAttribute("aria-selected", "false");
    });

    if (novoIndice < 0) {
      indiceAtivo = itens.length - 1;
    } else if (novoIndice >= itens.length) {
      indiceAtivo = 0;
    } else {
      indiceAtivo = novoIndice;
    }

    const ativo = itens[indiceAtivo];
    if (ativo) {
      ativo.classList.add("is-active");
      ativo.setAttribute("aria-selected", "true");
      searchInput.setAttribute("aria-activedescendant", ativo.id);
      ativo.scrollIntoView({ block: "nearest" });
    }
  }

  function resetarBotaoCopiar() {
    if (timerCopia) {
      clearTimeout(timerCopia);
      timerCopia = null;
    }
    copyCepBtn.classList.remove("is-copied");
    copyCepLabel.textContent = "Copiar CEP";
  }

  function selecionarEndereco(item) {
    searchInput.value = item.logradouro;
    clearBtn.hidden = false;
    alternarDropdown(false);

    resultBadge.textContent = identificarTipo(item.logradouro);
    resultLogradouro.textContent = item.logradouro;
    resultCep.textContent = item.cep;

    detailLogradouro.textContent = item.logradouro;

    if (item.complemento) {
      detailComplemento.textContent = item.complemento;
      detailComplementoRow.hidden = false;
    } else {
      detailComplemento.textContent = "";
      detailComplementoRow.hidden = true;
    }

    detailBairro.textContent = item.bairro || "Não informado";
    detailLocalidade.textContent = `${item.localidade} / ${item.uf} (${item.estado})`;
    detailDdd.textContent = `(${item.ddd})`;
    detailIbge.textContent = item.ibge;

    resetarBotaoCopiar();
    resultEmpty.hidden = true;
    resultCard.hidden = false;

    atualizarAviso(`Exibindo CEP de ${item.logradouro} (${item.cep}).`);
  }

  function aoDigitar() {
    const valor = searchInput.value;
    const limpo = valor.trim();

    clearBtn.hidden = valor.length === 0;
    if (!baseCarregada) return;

    if (limpo.length === 0) {
      resultadosAtuais = [];
      alternarDropdown(false);
      atualizarAviso(
        `Base pronta com ${ceps.length.toLocaleString("pt-BR")} endereços de Passos. Digite pelo menos 3 caracteres para buscar.`
      );
      return;
    }

    // O filtro só dispara a partir de 3 caracteres digitados
    if (limpo.length < MIN_CHARS) {
      const faltam = MIN_CHARS - limpo.length;
      const unidade = faltam === 1 ? "caractere" : "caracteres";
      resultadosAtuais = [];
      alternarDropdown(false);
      atualizarAviso(`Digite mais ${faltam} ${unidade} para ver as sugestões.`);
      return;
    }

    const resultados = filtrarEnderecos(limpo);
    renderizarSugestoes(resultados, limpo);
  }

  async function copiarCep() {
    const cepTexto = resultCep.textContent.trim();
    if (!cepTexto) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cepTexto);
      } else {
        const temp = document.createElement("textarea");
        temp.value = cepTexto;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }

      copyCepBtn.classList.add("is-copied");
      copyCepLabel.textContent = "CEP copiado!";
      if (timerCopia) clearTimeout(timerCopia);
      timerCopia = setTimeout(resetarBotaoCopiar, 2000);
    } catch (err) {
      console.error("Não foi possível copiar o CEP:", err);
    }
  }

  // Controle dos modais acessíveis
  function elementosFocaveis(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function abrirModal(idModal, gatilho) {
    const modal = document.getElementById(idModal);
    if (!modal) return;

    if (modalAberto) fecharModal();

    elementoAnterior = gatilho || document.activeElement;
    modalAberto = modal;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    const focaveis = elementosFocaveis(modal);
    if (focaveis.length > 0) focaveis[0].focus();
  }

  function fecharModal() {
    if (!modalAberto) return;

    modalAberto.hidden = true;
    document.body.classList.remove("modal-open");
    modalAberto = null;

    if (elementoAnterior && typeof elementoAnterior.focus === "function") {
      elementoAnterior.focus();
    }
    elementoAnterior = null;
  }

  function tecladoModal(event) {
    if (!modalAberto) return;

    if (event.key === "Escape") {
      event.preventDefault();
      fecharModal();
      return;
    }

    if (event.key === "Tab") {
      const focaveis = elementosFocaveis(modalAberto);
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }
  }

  // Eventos
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!suggestionsList.hidden && resultadosAtuais.length > 0) {
      const escolhido = indiceAtivo >= 0 ? resultadosAtuais[indiceAtivo] : resultadosAtuais[0];
      if (escolhido) selecionarEndereco(escolhido);
    }
  });

  searchInput.addEventListener("input", aoDigitar);

  searchInput.addEventListener("keydown", (event) => {
    if (suggestionsList.hidden) {
      if (event.key === "ArrowDown" && searchInput.value.trim().length >= MIN_CHARS) {
        aoDigitar();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      atualizarItemAtivo(indiceAtivo + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      atualizarItemAtivo(indiceAtivo - 1);
    } else if (event.key === "Enter" && indiceAtivo >= 0 && resultadosAtuais[indiceAtivo]) {
      event.preventDefault();
      selecionarEndereco(resultadosAtuais[indiceAtivo]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      alternarDropdown(false);
    }
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.hidden = true;
    resultadosAtuais = [];
    alternarDropdown(false);
    aoDigitar();
    searchInput.focus();
  });

  document.addEventListener("click", (event) => {
    if (!comboboxWrapper.contains(event.target)) {
      alternarDropdown(false);
    }
  });

  exampleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      searchInput.value = chip.dataset.example || "";
      searchInput.focus();
      aoDigitar();
    });
  });

  copyCepBtn.addEventListener("click", copiarCep);

  document.querySelectorAll("[data-modal-target]").forEach((btn) => {
    btn.addEventListener("click", () => abrirModal(btn.dataset.modalTarget, btn));
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) fecharModal();
    });

    overlay.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", fecharModal);
    });
  });

  document.addEventListener("keydown", tecladoModal);

  carregarBase();
})();
