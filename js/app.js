/**
 * Consulta de CEPs — Passos, MG
 * Curso de Bacharelado em Sistemas de Informação — UEMG Unidade Carangola
 * JavaScript Vanilla (ES6+, sem bibliotecas ou frameworks)
 */
(function () {
  "use strict";

  const DATA_URL = "./data/ceps.json";
  const MIN_SEARCH_CHARS = 3;

  /** @type {Array<Object>} */
  let cepsData = [];
  /** @type {Array<Object>} */
  let currentMatches = [];
  let activeIndex = -1;
  let dataLoaded = false;

  // Elementos da busca e estatísticas
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("logradouro-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const comboboxWrapper = document.getElementById("combobox-wrapper");
  const suggestionsList = document.getElementById("suggestions-list");
  const searchHint = document.getElementById("search-hint");
  const exampleChips = document.querySelectorAll(".example-chip");

  const statTotal = document.getElementById("stat-total");
  const statRuas = document.getElementById("stat-ruas");
  const statAvenidas = document.getElementById("stat-avenidas");
  const statPracas = document.getElementById("stat-pracas");

  // Elementos da exibição de resultado
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

  // Estado dos modais
  let activeModal = null;
  let lastFocusedTrigger = null;
  let copyFeedbackTimer = null;

  /**
   * Normaliza texto removendo acentos e convertendo para minúsculas
   * para comparações consistentes em português.
   * @param {string} value
   * @returns {string}
   */
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  /**
   * Identifica o tipo do logradouro para exibição no selo visual.
   * @param {string} logradouro
   * @returns {string}
   */
  function getStreetType(logradouro) {
    const normalized = normalizeText(logradouro);
    if (normalized.startsWith("avenida")) return "Avenida";
    if (normalized.startsWith("praca")) return "Praça";
    if (normalized.startsWith("rua")) return "Rua";
    return "Logradouro";
  }

  /**
   * Cria um DocumentFragment com o trecho pesquisado destacado em <mark>
   * de forma segura (sem innerHTML), respeitando acentuação original.
   * @param {string} originalText
   * @param {string} query
   * @returns {DocumentFragment}
   */
  function createHighlightedFragment(originalText, query) {
    const fragment = document.createDocumentFragment();
    const normQuery = normalizeText(query);

    if (!normQuery) {
      fragment.appendChild(document.createTextNode(originalText));
      return fragment;
    }

    // Mapeia cada caractere normalizado de volta para seu índice na string original
    const chars = Array.from(originalText);
    let normalizedFull = "";
    const indexMap = [];

    for (let i = 0; i < chars.length; i += 1) {
      const normChar = chars[i]
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      for (let j = 0; j < normChar.length; j += 1) {
        normalizedFull += normChar[j];
        indexMap.push(i);
      }
    }

    const matchStart = normalizedFull.indexOf(normQuery);
    if (matchStart === -1) {
      fragment.appendChild(document.createTextNode(originalText));
      return fragment;
    }

    const origStart = indexMap[matchStart];
    const origEnd = indexMap[matchStart + normQuery.length - 1] + 1;

    const before = chars.slice(0, origStart).join("");
    const match = chars.slice(origStart, origEnd).join("");
    const after = chars.slice(origEnd).join("");

    if (before) fragment.appendChild(document.createTextNode(before));

    const mark = document.createElement("mark");
    mark.textContent = match;
    fragment.appendChild(mark);

    if (after) fragment.appendChild(document.createTextNode(after));

    return fragment;
  }

  /**
   * Carrega a base local de CEPs via Fetch API e atualiza as estatísticas do Hero.
   */
  async function loadCepsData() {
    try {
      const response = await fetch(DATA_URL, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const rawData = await response.json();
      if (!Array.isArray(rawData)) {
        throw new Error("Formato JSON inválido.");
      }

      // Pré-indexação leve para busca reativa instantânea
      cepsData = rawData.map(function (item) {
        return {
          cep: item.cep || "",
          logradouro: item.logradouro || "",
          complemento: item.complemento || "",
          bairro: item.bairro || "",
          localidade: item.localidade || "Passos",
          uf: item.uf || "MG",
          estado: item.estado || "Minas Gerais",
          ddd: item.ddd || "35",
          ibge: item.ibge || "3147907",
          _searchLogradouro: normalizeText(item.logradouro)
        };
      });

      dataLoaded = true;
      updateHeroStats();
      setHint(
        "Base local carregada com " +
          cepsData.length +
          " logradouros de Passos, MG. Digite ao menos 3 caracteres para pesquisar.",
        false
      );
    } catch (error) {
      dataLoaded = false;
      console.error("Erro ao carregar ./data/ceps.json:", error);
      setHint(
        "Não foi possível carregar ./data/ceps.json. Execute o projeto por um servidor local (ex.: Live Server) ou acesse a versão publicada.",
        true
      );
    }
  }

  /**
   * Atualiza os contadores dinâmicos da seção Hero com base no JSON carregado.
   */
  function updateHeroStats() {
    let ruas = 0;
    let avenidas = 0;
    let pracas = 0;

    for (let i = 0; i < cepsData.length; i += 1) {
      const type = getStreetType(cepsData[i].logradouro);
      if (type === "Rua") ruas += 1;
      else if (type === "Avenida") avenidas += 1;
      else if (type === "Praça") pracas += 1;
    }

    if (statTotal) statTotal.textContent = String(cepsData.length);
    if (statRuas) statRuas.textContent = String(ruas);
    if (statAvenidas) statAvenidas.textContent = String(avenidas);
    if (statPracas) statPracas.textContent = String(pracas);
  }

  /**
   * Atualiza a mensagem de status/orientação abaixo do campo de busca.
   * @param {string} message
   * @param {boolean} isError
   */
  function setHint(message, isError) {
    searchHint.textContent = message;
    searchHint.classList.toggle("is-error", Boolean(isError));
  }

  /**
   * Filtra a base de logradouros e ordena por relevância.
   * @param {string} query
   * @returns {Array<Object>}
   */
  function filterLogradouros(query) {
    const normalizedQuery = normalizeText(query);
    const matches = [];

    for (let i = 0; i < cepsData.length; i += 1) {
      const item = cepsData[i];
      const idx = item._searchLogradouro.indexOf(normalizedQuery);
      if (idx !== -1) {
        // Prioriza correspondências no início do nome ou início de palavra
        let score = 2;
        if (idx === 0) {
          score = 0;
        } else if (item._searchLogradouro.charAt(idx - 1) === " ") {
          score = 1;
        }
        matches.push({ item: item, score: score });
      }
    }

    matches.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      return a.item.logradouro.localeCompare(b.item.logradouro, "pt-BR");
    });

    return matches.map(function (entry) {
      return entry.item;
    });
  }

  /**
   * Abre ou fecha o menu suspenso de sugestões.
   * @param {boolean} open
   */
  function setDropdownOpen(open) {
    suggestionsList.hidden = !open;
    searchInput.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      activeIndex = -1;
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  /**
   * Renderiza a lista flutuante de sugestões do autocomplete.
   * @param {Array<Object>} matches
   * @param {string} query
   */
  function renderSuggestions(matches, query) {
    suggestionsList.textContent = "";
    currentMatches = matches;
    activeIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");

    if (matches.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "suggestion-empty";
      emptyLi.setAttribute("role", "option");
      emptyLi.setAttribute("aria-disabled", "true");
      emptyLi.textContent = 'Nenhum logradouro encontrado para "' + query.trim() + '".';
      suggestionsList.appendChild(emptyLi);
      setDropdownOpen(true);
      setHint("Nenhuma correspondência encontrada na base local de Passos, MG.", false);
      return;
    }

    const fragment = document.createDocumentFragment();

    matches.forEach(function (item, index) {
      const li = document.createElement("li");
      li.id = "suggestion-option-" + index;
      li.className = "suggestion-item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.dataset.index = String(index);

      const mainDiv = document.createElement("div");
      mainDiv.className = "suggestion-main";

      const streetSpan = document.createElement("span");
      streetSpan.className = "suggestion-street";
      streetSpan.appendChild(createHighlightedFragment(item.logradouro, query));

      const metaSpan = document.createElement("span");
      metaSpan.className = "suggestion-meta";
      const metaParts = [];
      if (item.bairro) metaParts.push("Bairro " + item.bairro);
      if (item.complemento) metaParts.push(item.complemento);
      metaSpan.textContent = metaParts.join(" · ") || item.localidade + "/" + item.uf;

      mainDiv.appendChild(streetSpan);
      mainDiv.appendChild(metaSpan);

      const cepSpan = document.createElement("span");
      cepSpan.className = "suggestion-cep";
      cepSpan.textContent = item.cep;

      li.appendChild(mainDiv);
      li.appendChild(cepSpan);

      // Usa mousedown para selecionar antes do evento blur do input
      li.addEventListener("mousedown", function (event) {
        event.preventDefault();
        selectLogradouro(item);
      });

      fragment.appendChild(li);
    });

    suggestionsList.appendChild(fragment);
    setDropdownOpen(true);

    const plural = matches.length === 1 ? "logradouro encontrado" : "logradouros encontrados";
    setHint(
      matches.length + " " + plural + ". Selecione uma opção na lista para ver o CEP em destaque.",
      false
    );
  }

  /**
   * Atualiza o item destacado na navegação por teclado no dropdown.
   * @param {number} newIndex
   */
  function updateActiveOption(newIndex) {
    const items = suggestionsList.querySelectorAll(".suggestion-item");
    if (items.length === 0) return;

    items.forEach(function (el) {
      el.classList.remove("is-active");
      el.setAttribute("aria-selected", "false");
    });

    if (newIndex < 0) {
      activeIndex = items.length - 1;
    } else if (newIndex >= items.length) {
      activeIndex = 0;
    } else {
      activeIndex = newIndex;
    }

    const activeEl = items[activeIndex];
    if (activeEl) {
      activeEl.classList.add("is-active");
      activeEl.setAttribute("aria-selected", "true");
      searchInput.setAttribute("aria-activedescendant", activeEl.id);
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }

  /**
   * Exibe o card completo do logradouro selecionado com destaque absoluto ao CEP.
   * @param {Object} item
   */
  function selectLogradouro(item) {
    searchInput.value = item.logradouro;
    clearSearchBtn.hidden = false;
    setDropdownOpen(false);

    resultBadge.textContent = getStreetType(item.logradouro);
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
    detailLocalidade.textContent = item.localidade + " / " + item.uf + " (" + item.estado + ")";
    detailDdd.textContent = "(" + item.ddd + ")";
    detailIbge.textContent = item.ibge;

    resetCopyButton();

    resultEmpty.hidden = true;
    resultCard.hidden = false;

    setHint("Exibindo dados completos para " + item.logradouro + " — CEP " + item.cep + ".", false);
  }

  /**
   * Trata a digitação no campo de busca, respeitando o gatilho mínimo de 3 caracteres.
   */
  function handleSearchInput() {
    const rawValue = searchInput.value;
    const trimmedValue = rawValue.trim();

    clearSearchBtn.hidden = rawValue.length === 0;

    if (!dataLoaded) {
      return;
    }

    // Regra obrigatória: o disparo do filtro só ocorre com 3 ou mais caracteres
    if (trimmedValue.length === 0) {
      currentMatches = [];
      setDropdownOpen(false);
      setHint(
        "Base local carregada com " +
          cepsData.length +
          " logradouros de Passos, MG. Digite ao menos 3 caracteres para pesquisar.",
        false
      );
      return;
    }

    if (trimmedValue.length < MIN_SEARCH_CHARS) {
      const remaining = MIN_SEARCH_CHARS - trimmedValue.length;
      const charWord = remaining === 1 ? "caractere" : "caracteres";
      currentMatches = [];
      setDropdownOpen(false);
      setHint(
        "Digite mais " + remaining + " " + charWord + " para exibir as sugestões de logradouros.",
        false
      );
      return;
    }

    const matches = filterLogradouros(trimmedValue);
    renderSuggestions(matches, trimmedValue);
  }

  /**
   * Restaura o botão de copiar CEP ao estado padrão.
   */
  function resetCopyButton() {
    if (copyFeedbackTimer) {
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = null;
    }
    copyCepBtn.classList.remove("is-copied");
    copyCepLabel.textContent = "Copiar CEP";
  }

  /**
   * Copia o CEP exibido para a área de transferência com fallback seguro.
   */
  async function handleCopyCep() {
    const cepValue = resultCep.textContent.trim();
    if (!cepValue) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cepValue);
      } else {
        const tempInput = document.createElement("textarea");
        tempInput.value = cepValue;
        tempInput.setAttribute("readonly", "");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      copyCepBtn.classList.add("is-copied");
      copyCepLabel.textContent = "CEP copiado!";
      if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = setTimeout(resetCopyButton, 2200);
    } catch (err) {
      console.error("Falha ao copiar CEP:", err);
    }
  }

  /* ========================================================================
     Gerenciamento de Janelas Flutuantes (Modais Acessíveis)
     ======================================================================== */

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function openModal(modalId, triggerElement) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (activeModal) {
      closeModal();
    }

    lastFocusedTrigger = triggerElement || document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    const focusables = getFocusableElements(modal);
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  }

  function closeModal() {
    if (!activeModal) return;

    activeModal.hidden = true;
    document.body.classList.remove("modal-open");
    activeModal = null;

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
    lastFocusedTrigger = null;
  }

  function handleModalKeydown(event) {
    if (!activeModal) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      const focusables = getFocusableElements(activeModal);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  /* ========================================================================
     Registro de Eventos
     ======================================================================== */

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!suggestionsList.hidden && currentMatches.length > 0) {
      const chosen = activeIndex >= 0 ? currentMatches[activeIndex] : currentMatches[0];
      if (chosen) selectLogradouro(chosen);
    }
  });

  searchInput.addEventListener("input", handleSearchInput);

  searchInput.addEventListener("keydown", function (event) {
    if (suggestionsList.hidden) {
      if (event.key === "ArrowDown" && searchInput.value.trim().length >= MIN_SEARCH_CHARS) {
        handleSearchInput();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      updateActiveOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      updateActiveOption(activeIndex - 1);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        event.preventDefault();
        selectLogradouro(currentMatches[activeIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDropdownOpen(false);
    }
  });

  clearSearchBtn.addEventListener("click", function () {
    searchInput.value = "";
    clearSearchBtn.hidden = true;
    currentMatches = [];
    setDropdownOpen(false);
    handleSearchInput();
    searchInput.focus();
  });

  // Fecha o dropdown ao clicar fora do combobox
  document.addEventListener("click", function (event) {
    if (!comboboxWrapper.contains(event.target)) {
      setDropdownOpen(false);
    }
  });

  // Sugestões rápidas de demonstração
  exampleChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const exampleQuery = chip.dataset.example || "";
      searchInput.value = exampleQuery;
      searchInput.focus();
      handleSearchInput();
    });
  });

  copyCepBtn.addEventListener("click", handleCopyCep);

  // Gatilhos de abertura e fechamento de modais
  document.querySelectorAll("[data-modal-target]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openModal(trigger.dataset.modalTarget, trigger);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    overlay.querySelectorAll("[data-modal-close]").forEach(function (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    });
  });

  document.addEventListener("keydown", handleModalKeydown);

  // Inicialização
  loadCepsData();
})();
