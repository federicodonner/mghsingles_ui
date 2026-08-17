---
name: run-mghsingles-customer
description: Build, run and drive the mghsingles customer storefront UI headlessly. Use when asked to start the customer app, screenshot a page, test the login or store or collection flow, or verify a React change in the running app.
---

# Run the mghsingles customer UI

Create React App 5 + React 17 + react-router 6. Spanish-language MTG singles
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

- **`ls` before you write selectors.** Buttons here are `button.login`,
  `button.create`, `button.search` — generic class names reused across pages,
  and inputs have no `name` or `id`, only Spanish placeholders
  (`input[placeholder="Usuario"]`, `input[placeholder="Contraseña"]`). Note the
  accented `ñ`.

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
