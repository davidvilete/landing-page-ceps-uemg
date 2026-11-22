# Consulta de CEPs — Passos, MG

Aplicação web desenvolvida para a disciplina de **Programação 2** (2º Período do curso de **Bacharelado em Sistemas de Informação** — **UEMG Unidade Acadêmica de Carangola**).

O site permite pesquisar logradouros e bairros da cidade de **Passos — MG** usando uma base local em JSON extraída da API pública do ViaCEP, construída apenas com **HTML5 semântico**, **CSS3 puro** e **JavaScript Vanilla**.

## Funcionalidades

- **Base completa de Passos (`data/ceps.json`):** 1.471 registros únicos abrangendo 32 bairros da cidade (1.276 ruas, 85 avenidas, 46 praças, 42 travessas e 22 outros tipos como alamedas, estradas, rodovias e becos), sem duplicidades e carregados localmente via `fetch()`.
- **Autocomplete a partir de 3 caracteres:** o filtro só dispara com 3 ou mais letras digitadas, ignora acentos e maiúsculas, destaca o trecho encontrado e funciona com mouse e teclado (`↑`, `↓`, `Enter`, `Esc`).
- **Destaque do CEP:** ao selecionar um endereço, exibe Logradouro, Complemento (quando houver), Bairro, Localidade/UF, DDD, Código IBGE e o CEP em destaque com botão para copiar.
- **Modais acessíveis:** janelas de **Sobre** (com Nota de Transparência sobre uso de IA), **Termos de Uso** e **Política de Privacidade (LGPD)**.
- **Layout responsivo (Mobile-First):** adaptado para celulares, tablets e telas desktop com CSS puro e caminhos relativos.

## Estrutura de pastas

```text
landing-page-ceps-uemg/
├── index.html             # Estrutura semântica da página e dos modais
├── css/
│   └── styles.css         # Estilos e responsividade (CSS3 puro)
├── js/
│   └── app.js             # Fetch do JSON, busca com autocomplete e modais
├── data/
│   └── ceps.json          # Base consolidada e sem duplicidades de Passos, MG
├── assets/
│   ├── logo-si.png        # Logo de Sistemas de Informação (UEMG Carangola)
│   ├── logo-uemg.png      # Logo da UEMG Unidade Carangola
│   └── hero-cidade.jpg    # Vista aérea da região central de Passos, MG
└── README.md
```

## Base de dados (ViaCEP)

Os dados foram coletados na API pública do [ViaCEP](https://viacep.com.br/) partindo dos endpoints base (`Rua`, `Avenida` e `Praca` em `MG/Passos`) e expandidos por prefixos e demais tipos de logradouro (`Travessa`, `Alameda`, `Estrada`, `Rodovia`, `Beco`, entre outros) para contornar o limite de 50 resultados por requisição da API e cobrir os 32 bairros registrados da cidade.

Todos os registros foram consolidados, higienizados contra duplicidades e ordenados alfabeticamente em `./data/ceps.json`.

## Como rodar localmente

Como o JavaScript usa `fetch('./data/ceps.json')`, abra o projeto por um servidor local para evitar bloqueio de CORS no navegador:

- **VS Code:** clique com o botão direito em `index.html` e selecione **Open with Live Server**.
- **Terminal:**
  ```bash
  python -m http.server 5500
  ```
  Depois acesse `http://localhost:5500`.

## Equipe

- **Davi Vilete** — [github.com/davidvilete](https://github.com/davidvilete)
- **Victor Silva Granja** — [github.com/Legolasoelfo](https://github.com/Legolasoelfo)
- **Maxmiller Pereira da Mota** — [github.com/maxmiller-ux](https://github.com/maxmiller-ux)

## Transparência sobre uso de IA

Em consonância com os princípios de integridade acadêmica e transparência tecnológica, ferramentas de Inteligência Artificial generativa foram utilizadas como apoio na organização do HTML/CSS, depuração da lógica em JavaScript e consolidação da base JSON, sendo a revisão, os testes e a validação final conduzidos pela equipe.

## Créditos

- **Dados:** [ViaCEP](https://viacep.com.br/)
- **Foto de Passos, MG:** *Passos - Região central de Passos, com Praça da Matriz (no centro)* por Enio1966 via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Passos_-_Regi%C3%A3o_central_de_Passos,_com_Pra%C3%A7a_da_Matriz_(no_centro).jpg) (CC BY-SA 4.0)
- **Instituição:** [UEMG — Unidade Acadêmica de Carangola](https://www.uemg.br/carangola)
