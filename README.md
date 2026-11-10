# Nicholas Medland Portfolio

Source for Nicholas Medland's public portfolio:

- <https://nicholasmedland.com>
- <https://nicholasmedland.ca>
- <https://nicholasmedland.dev>

The site is a Vinext/React application deployed with OpenAI Sites. It contains the portfolio, résumé, Sudoku page, and the private queue APIs used by the to-do and shopping-list printers.

## Project map

- `app/page.tsx` — homepage, project information, galleries, and lightbox
- `app/resume/page.tsx` — work history and résumé download page
- `app/games/` — playable Sudoku and the original solver viewer
- `app/api/` — printer queue endpoints; do not change without testing both device workflows
- `db/` and `drizzle/` — queue storage definitions and migrations
- `public/projects/` — web-ready project photos, videos, and 3D models
- `docs/` — maintenance and backend notes

`app/pip.tsx` is intentionally retained even though Pip is currently hidden. It is waiting for the physical robot design to be finalized.

## Local setup

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm run build
npm run lint
```

## Editing content

See [docs/content-maintenance.md](docs/content-maintenance.md) for the safest places to update project text, media, work history, and the downloadable résumé.

## Printer backends

The printer endpoints are part of the same deployed Worker but do not add public pages to the portfolio. Their tokens belong only in the ignored `.env.local` file. See [docs/todo-printer-backend.md](docs/todo-printer-backend.md) before changing those routes.

## Deployment

The GitHub repository is the durable source copy. Production is deployed through OpenAI Sites using the project ID in `.openai/hosting.json`. Generated folders such as `dist`, `.next`, `.vinext`, `.wrangler`, and `node_modules` are intentionally ignored and should not be committed.
