# Consulta de CEPs — Passos, MG

Landing page canônica e interativa para consulta local de Códigos de Endereçamento Postal (CEPs) e logradouros da cidade de **Passos — Minas Gerais**, desenvolvida como atividade prática da disciplina de **Programação 2 (Desenvolvimento Web)** para o **2º Período** do curso de **Bacharelado em Sistemas de Informação** da **Universidade do Estado de Minas Gerais (UEMG) — Unidade Acadêmica de Carangola**.

---

## Visão Geral e Funcionalidades

- **Base Local Consolidada (`data/ceps.json`):** 146 registros únicos extraídos da API pública ViaCEP para o município de **Passos — MG** (50 Ruas, 50 Avenidas e 46 Praças), higienizados sem duplicidades e consumidos localmente de forma assíncrona via `fetch()`.
- **Arquitetura 100% Vanilla Web:** Desenvolvida estritamente com **HTML5 Semântico**, **CSS3 Puro (Mobile-First)** e **JavaScript Vanilla (ES6+)**, sem uso de bibliotecas ou frameworks externos.
- **Busca Reativa com Autocomplete:** Filtro dinâmico acionado somente a partir de **3 ou mais caracteres** digitados, insensível a acentos e maiúsculas/minúsculas, com menu suspenso flutuante e navegação completa por mouse e teclado (`↑`, `↓`, `Enter`, `Esc`).
- **Destaque Visual ao CEP:** Exibição estruturada de Logradouro, Complemento/Trecho, Bairro, Localidade/UF, DDD e IBGE, com destaque tipográfico em alto contraste para o CEP e botão de cópia rápida.
- **Modais Acessíveis:** Janelas flutuantes para **Sobre** (incluindo Nota de Transparência sobre uso de IA), **Termos de Uso** e **Política de Privacidade (LGPD)**, com controle de foco, overlay escurecido e fechamento via botão, backdrop ou tecla `Esc`.
- **Caminhos Relativos:** Todos os recursos (`./css/styles.css`, `./js/app.js`, `./data/ceps.json`, `./assets/*`) utilizam caminhos relativos para compatibilidade total com GitHub Pages e Vercel.

---

## Estrutura do Projeto

```text
landing-page-ceps-uemg/
├── index.html             # Documento principal em HTML5 semântico
├── css/
│   └── styles.css         # Estilização pura CSS3 com abordagem Mobile-First
├── js/
│   └── app.js             # Consumo via Fetch API, autocomplete e modais acessíveis
├── data/
│   └── ceps.json          # Base unificada e higienizada de CEPs de Passos, MG
├── assets/
│   ├── logo-si.png        # Logotipo do curso de Sistemas de Informação (UEMG Carangola)
│   ├── logo-uemg.png      # Logotipo institucional da UEMG Unidade Carangola
│   └── hero-cidade.jpg    # Fotografia panorâmica da região central de Passos, MG
└── README.md              # Documentação técnica e autoria do projeto
```

---

## Extração e Higienização da Base de Dados (ViaCEP)

Os dados oficiais foram consultados diretamente nos endpoints da API ViaCEP para o município de **Passos — MG**:

- `https://viacep.com.br/ws/MG/Passos/Rua/json/` (50 registros)
- `https://viacep.com.br/ws/MG/Passos/Avenida/json/` (50 registros)
- `https://viacep.com.br/ws/MG/Passos/Praca/json/` (46 registros)

Os três retornos foram consolidados, verificados quanto a duplicidades (146 CEPs únicos), ordenados alfabeticamente por logradouro e salvos em UTF-8 no arquivo `./data/ceps.json`.

---

## Como Executar Localmente

Como a aplicação consome `./data/ceps.json` via `fetch()`, é necessário abri-la por meio de um servidor HTTP local (para evitar bloqueio de CORS em URLs `file://`):

### Opção 1 — VS Code Live Server
1. Abra a pasta do projeto no Visual Studio Code.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2 — Servidor Local via Terminal
```bash
# Com Python 3
python -m http.server 5500

# Ou com Node.js
npx serve .
```
Depois, acesse `http://localhost:5500` no navegador.

---

## Deploy (GitHub Pages ou Vercel)

- **GitHub Pages:** Acesse **Settings → Pages → Build and deployment**, selecione a branch `main` e a pasta `/ (root)`.
- **Vercel:** Importe o repositório público no painel da Vercel com framework preset **Other** (site estático sem etapa de build).

---

## Equipe de Desenvolvimento

- **Davi Vilete** — [GitHub](https://github.com/davidvilete)
- **Victor Silva Granja**
- **Maxmiller Pereira da Mota**

---

## Nota de Transparência sobre o Uso de Inteligência Artificial

Em consonância com os princípios de integridade acadêmica e transparência tecnológica, declara-se que ferramentas de Inteligência Artificial generativa foram utilizadas durante o desenvolvimento deste projeto como suporte na estruturação do HTML5 semântico, revisão de responsividade e acessibilidade em CSS3, implementação da lógica reativa em JavaScript Vanilla e higienização da base JSON, sendo a definição dos requisitos, validação dos dados de Passos (MG) e auditoria final conduzidas pelos membros da equipe.

---

## Créditos e Licenças

- **Dados de CEPs:** [ViaCEP](https://viacep.com.br/)
- **Fotografia de Passos, MG:** *Passos - Região central de Passos, com Praça da Matriz (no centro)* por Enio1966 via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Passos_-_Regi%C3%A3o_central_de_Passos,_com_Pra%C3%A7a_da_Matriz_(no_centro).jpg) (Licença CC BY-SA 4.0).
- **Instituição:** [UEMG — Unidade Acadêmica de Carangola](https://www.uemg.br/carangola)
