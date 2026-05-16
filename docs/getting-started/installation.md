# Installation

## Prerequisites

- Node.js 22+
- npm 10+
- Python 3.11+
- `uv`

!!! tip
If you use `mise`, run `mise run deps:sync` to install toolchain and dependencies.

## Install from npm (recommended)

```bash
npm i -g @dragoscirjan/mcp-searchable
```

Or use `npx` from your MCP client configuration:

```bash
npx -y @dragoscirjan/mcp-searchable
```

## Install from source

```bash
git clone https://github.com/templ-project/typescript.git mcp-searchable
cd mcp-searchable
npm install
uv sync
```

## Configure environment

```bash
cp .env.example .env
```

Fill the provider credentials you plan to use:

- `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` for Google
- `BING_API_KEY` (and optional `BING_API_ENDPOINT`) for Bing
- `BRAVE_API_KEY` for Brave

No key is required for `duckduckgo`.

## Run the server locally

```bash
npm run build
npm start
```

The server runs over stdio for MCP clients.

## Verify docs build

```bash
uv run mkdocs build --strict
```
