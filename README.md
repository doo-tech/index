# Doo · site institucional

Site estático (HTML, CSS e JS sem dependências) da Doo — *Letz doo it*.
Construído a partir do **Manual de Marca v1 (setembro 2026)**: paleta, temas Creme/Oliva,
escala tipográfica (Montserrat + Comfortaa), espaços, cantos, motivo de anéis-bolha,
mascote e regras de contraste.

## Estrutura

```
index.html              Página principal (hero, frentes, porquê a Doo, método, sobre, CTA, contacto)
404.html                Página de erro com a mascote
assets/css/styles.css   Tokens da marca e estilos
assets/js/main.js       Tema, menu móvel, animações e formulário
assets/img/             Logótipo e isotipo (SVG extraídos do manual) e mascote
```

## Correr localmente

```sh
python3 -m http.server 8000
# abrir http://localhost:8000
```

Pode ser publicado em qualquer alojamento estático (GitHub Pages, Netlify, Vercel…).
A `404.html` usa caminhos absolutos (`/assets/...`), pensados para o site servido na raiz do domínio.

## Notas

- **Temas:** segue `prefers-color-scheme`; o botão no cabeçalho alterna e guarda a escolha.
- **Contraste:** `#3399F3` nunca é usado em texto pequeno — links e botões usam `action` (`#1C6FC4`);
  branco sobre azul só a 24px ou mais.
- **Contacto:** o formulário valida os campos e abre o cliente de email (`mailto:`).
  O endereço `ola@doo.pt` e o link do LinkedIn são **provisórios** — substituir pelos reais
  (em `index.html`, `404.html` e no atributo `data-mailto` do formulário), ou ligar o formulário
  a um serviço como Formspree/Netlify Forms.
