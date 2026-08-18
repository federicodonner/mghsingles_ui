---
name: run-mghsingles-customer
description: Build, run and drive the mghsingles customer storefront UI headlessly. Use when asked to start the customer app, screenshot a page, test the login or store or collection flow, or verify a React change in the running app.
---

# Run the mghsingles customer UI

Create React App 5 + React 18 + react-router 6 + MUI 7. Spanish-language MTG singles
storefront. Talks to `mghsingles_api` via `REACT_APP_API_URL` (dev default
`http://localhost:3101`).

The agent path is `.claude/skills/run-mghsingles-customer/driver.mjs`: a
headless-Chrome REPL that reads one command per line on stdin, so a whole flow
goes in a single heredoc. It uses `playwright-core` against the **system Google
Chrome**, so no browser is downloaded.

All paths below are relative to `mghsingles_ui/mghsingles_customer/`.

## Prerequisites

- Node (verified on v24.4.1)
- Google Chrome at `/Applications/Google Chrome.app`
- A running `mghsingles_api` with a seeded database — see the
  `run-mghsingles-api` skill in `mghsingles_api/`. Login, Cuenta and the store
  listing all need it.

## Setup

```bash
npm install
```

```bash
cd .claude/skills/run-mghsingles-customer && npm install
```

## Run (agent path)

Start the dev server. `BROWSER=none` stops CRA opening a real window:

```bash
BROWSER=none PORT=3100 REACT_APP_API_URL=http://localhost:3101 npx react-scripts start
```

First compile takes ~40s (a few seconds once CRA's cache is warm). Wait for a
`webpack 5.65.0 compiled ...` line. `compiled with 1 warning` is expected —
unused-vars in `src/sorter/`; it is not an error.

Then drive it:

```bash
UI_URL=http://localhost:3100 node .claude/skills/run-mghsingles-customer/driver.mjs <<'EOF'
goto /login
waitms 1200
fill 'input[placeholder="Usuario"]' devuser
fill 'input[placeholder="Contraseña"]' devpass123
click button.login
waitms 2000
shot after-login
eval localStorage.getItem('mghsinglesToken')
text
net
EOF
```

Verified output:

```
> click button.login
clicked button.login -> http://localhost:3100/home

> shot after-login
wrote .../run-mghsingles-customer/shots/after-login.png

> eval localStorage.getItem('mghsinglesToken')
"q9dKWcWwGwVeMsqrPSaFRaZ5L"

> text
Colección
Ventas
Cuenta
Salir
...
```

Screenshots land in `.claude/skills/run-mghsingles-customer/shots/`
(override with `SHOT_DIR`). **Open them — don't assume they rendered.**

### Driver commands

| Command | Effect |
|---|---|
| `goto <path\|url>` | Navigate (paths resolve against `UI_URL`), then wait 700ms for React to mount |
| `ls` | List every input/button/link/select with usable selectors — **start here** |
| `fill <selector> <value>` | Fill a field. **Quote the selector** if it contains spaces: `fill 'input[placeholder="Card name"]' bolt` |
| `click <selector>` | Click, then wait 700ms |
| `clicktext <text>` | Click by visible text — the nav links have no stable ids |
| `text [selector]` | innerText of `body` (or a selector) |
| `wait <selector>` / `waitms <n>` | Wait for an element / a duration |
| `shot <name>` | Full-page screenshot to `shots/<name>.png` |
| `eval <js>` | Evaluate in the page, returns JSON |
| `token <value>` | Write `localStorage.mghsinglesToken` — skips the login form |
| `console` | Buffered console + `pageerror` output |
| `net` | Requests that failed or returned ≥400 |
| `quit` | Exit early |

Set `HEADFUL=1` to watch the browser. Lines starting with `#` are comments.
The driver exits non-zero if any command failed.

## Run (human path)

```bash
npm start
```

Same `react-scripts start` as above, but with CRA's defaults: opens a real
browser at `http://localhost:3000` and expects the API on `:3101` (from
`.env.development`). Useless headless — and it fails outright if 3000 is taken,
which is why the agent path pins `PORT` and `BROWSER=none`.

Skipping the login form is often faster than driving it. Grab a token from the
API and inject it:

```bash
TOK=$(curl -s -X POST http://localhost:3101/oauth -H 'Content-Type: application/json' \
  -d '{"username":"devuser","password":"devpass123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')
UI_URL=http://localhost:3100 node .claude/skills/run-mghsingles-customer/driver.mjs <<EOF
goto /
token $TOK
goto /account
waitms 2000
shot account
EOF
```

## Gotchas

- **A wishlist entry can ask for 1-4 copies.** The picker sits on the row
  itself, next to the card it belongs to, and saves on change — adding is just
  picking a name. The API caps and clamps, so a bad value cannot get in.

- **The list is alphabetical, except for this sitting's additions.** Anything
  added since the page loaded sits on top, newest first, so a row you just
  created does not drop into the middle of the list and look like nothing
  happened. The "recent" list is component state, so a reload settles everything
  into name order — that is deliberate, not a bug to fix.

- **The wishlist shows wants, not stock.** No availability badge, no in-stock
  lines, no "we have some but they do not match" note — just the card name and
  the chosen preferences. The name field is a MUI `Autocomplete` fed by
  `card/names`, deliberately NOT `freeSolo`: entries are matched against stock
  by name, so free text lets a typo create an entry that silently never matches.
  The add button stays disabled until a real card is picked.

  Driving it: the field is `input[role="combobox"]`, and note the form contains
  **two** buttons — the Autocomplete's own popup toggle comes first, so
  `click form button` hits that one. Use `click button[type=submit]`.

- **The storefront shows nothing until you search.** `/` opens with the search
  panel and an empty state; it no longer loads every card in the shop as full
  card art on first paint. Results come from `store/search` and are stock only,
  laid out as a grid of tiles (`store/StoreResult.js`), each showing set,
  condition, language and finish — the facts that distinguish one copy from
  another printing. The type line is deliberately not on the tile: it is
  identical for every printing of a card, so it only earns its place as a filter.

  The button at the bottom of each tile is login-aware: "Ingresa para pedir"
  routes to /login when logged out, "Agregar a deseados" when logged in, which
  POSTs the card NAME to `wishlist` — not this printing's set, language, grade
  and finish, which would be a lot to infer from one click.

  Store.js holds the set of wishlisted names, not each tile, because a search
  can return several printings of the same card and adding it from one has to
  settle every tile for that card. A 400 from the POST means "already on the
  list", which is not a failure — the button settles into its added state
  rather than raising an alert.

- **Size MUI components with `sx`, not a CSS class.** MUI's own styles sit in a
  layer that outranks a plain class, so `.storeResultArt { width: 86px }` lost
  to CardMedia's `width: 100%` and the art stretched across the whole row. The
  same rule explains why the result tile is a flex column via `sx` on the Card:
  a nested `height: 100%` Stack was shorter than the tile whenever a card had no
  price, so `mt: auto` on the button had nothing to push against and the buttons
  came out ragged across a row.

- **Contenedores is the customer's only view of their cards.** The separate
  Colección section is gone; `/mystorage` lists containers, `/mystorage/:id`
  opens one, `/mystorage/:id/add` adds a card into it. Every container opens
  whatever state it is in — the cards are the customer's whether the shop is
  holding them or not — and nothing is greyed out. Only EDITING is gated, and
  the page says why rather than leaving the missing buttons to be puzzled over.

  The list also shows copies with no container at all (`mystorage/unfiled`),
  because with Colección gone those would otherwise be invisible.

  Adding a card is two API calls — create the card, then place a copy — since
  the card exists whether or not it has a home. The customer performs one
  action; AddCard does the second half.

- **`/mystorage` is the customer's own binders and boxes** (`src/storage/`,
  menu label "Contenedores"). It is the customer half of the container
  lifecycle: they create one (it starts `released`, in their hands), announce
  they are bringing it in (`returning`), and ask for one back (`retired`). The
  shop makes the other two moves from the admin app. The page draws its buttons
  from the `cando` array the API returns for each container rather than deciding
  locally which move is legal — if a button is missing, look at `cando` in the
  response before looking at the component.

  Retiring pops a `confirm` and then, if any copies are already in a buyer's
  pick-up bag, an `alert` saying how many stay behind. When driving it headless,
  stub both first or the click appears to do nothing:

  ```
  eval window.confirm = () => true; window.__alerts = []; window.alert = (m) => window.__alerts.push(m); 'ok'
  clicktext Pedir que me lo devuelvan
  eval window.__alerts
  ```

- **Every interactive element is MUI.** Buttons, text fields, selects,
  checkboxes, radios, chips and the nav bar all come from `@mui/material`, themed
  in `src/theme.js`. Two consequences when driving it:

  - **Class names are MUI's**, e.g. `MuiButton-root MuiButton-contained ...`,
    plus any `className` the component passes through. The hooks the flows below
    rely on — `button.login`, `button.create`, `button.search` — are still
    present, because they are passed as `className` deliberately. Anything else,
    run `ls` and read the real classes rather than guessing.
  - **`input[placeholder="..."]` still works.** A `TextField` renders a real
    `<input>` with the placeholder on it; the Spanish text is unchanged
    (`input[placeholder="Usuario"]`, `input[placeholder="Contraseña"]` — note
    the accented `ñ`). Selects are `TextField select` with
    `SelectProps={{native: true}}`, so they are still real `<select>` elements
    with `<option>` children and `fill` works on them.

  Do NOT restyle a button by editing CSS — set the MUI props (`variant`,
  `color`, `size`) or change the theme. The old `.dark` / `.light` / `.orange`
  classes are gone, and the global `button {}` and `input, select {}` rules in
  `App.css` were removed because they fought the components.

- **The route list and the links disagree.** Successful login navigates to
  `/home`, which is **not** in `Router.js`. It falls through the `*` route and
  renders `Store` — the same component as `/`. Don't read a `/home` URL as a
  distinct page.

- **A `403 GET /player/me` on every page load is normal.** `Login` and the
  header probe `player/me` unauthenticated to decide whether to show the
  logged-in menu. It appears in `net` output even on a healthy run.

- **`Colección`, `Ventas` and the search box all work now.** They used to hang
  on a blank page because `GET /collection`, `GET /sale` and
  `GET /store/search/:name` threw in the API without responding. Fixed in the
  API; if a blank page comes back, check `console` for a React error before
  assuming it is the API again.

  Endpoints per page: `/` → `player/me`, `store/:page`; `/collection` →
  `collection`; `/sales` → `sale`; `/account` → `player/me`, `player`,
  `player/password`.

- **One bad field blanks the entire page.** There is no error boundary, so a
  render-time `TypeError` in a single card unmounts the whole route and you get
  a white screen with no message. `console` in the driver shows the real cause;
  `text` returning empty is the tell. `cardgeneral.cardsetcode` (not
  `.cardset`) is the field that caused this.

- **Only the newest API token per player is valid.** Logging in through the UI
  invalidates a token the API smoke script took, and vice versa. Two browser
  sessions as the same user will fight; the older one starts getting 403s.

- **Seeded card images 404.** The dev seed uses invented Scryfall URLs, so
  `net` reports `ERR_BLOCKED_BY_ORB` on card images and tiles show a broken
  icon. The data is fine — only the image URLs are fake.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Error: listen EADDRINUSE :::3000` | `BROWSER=none PORT=3100 npx react-scripts start` |
| Driver: `browserType.launch: Chromium distribution 'chrome' is not found` | Install Google Chrome, or set `channel` in `driver.mjs` |
| `Cannot find module 'playwright-core'` | `cd .claude/skills/run-mghsingles-customer && npm install` |
| Blank page, `net` shows `ECONNREFUSED :3101` | API isn't running, or `REACT_APP_API_URL` points at the wrong port |
| Login does nothing, `net` shows `404 POST /oauth` | `REACT_APP_API_URL` unset — CRA bakes it in **at start time**, so restart the dev server after changing it |
| Login returns 404 with the API up | `devuser` doesn't exist — run the API skill's `smoke.mjs --seed-user` |
| `clicktext` fails with strict-mode / timeout | Text appears more than once; the driver takes `.first()`, so use a CSS selector instead |
| Store shows 0 cards | API `/store/1` returns `numberOfCards: 0` — reseed via the API skill |
| White page, `text` returns nothing | Render-time error; run `console` to see it (no error boundary) |
