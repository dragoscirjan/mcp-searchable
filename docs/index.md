# mcp-searchable

**mcp-searchable** is a local-first [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that helps AI agents perform practical web research:

- **Search** with multiple providers (`duckduckgo`, `google`, `bing`, `brave`)
- **Fetch** pages and convert them into readable Markdown
- **Stash** useful content into local SQLite storage
- **Grep** stashed content with FTS5
- **Ask** questions over local context using Ollama

It is built for reproducible, tool-based research flows where the agent can both gather and reuse context.

## What does it do?

- Standardizes web search output across providers into `{ title, url, snippet }`
- Extracts readable content from raw web pages
- Persists page content locally so agents can reuse it later
- Enables local semantic workflows without depending on hosted vector services

## Why `mcp-searchable`?

Most agent workflows lose context between searches and page reads. `mcp-searchable` gives agents a persistent local knowledge loop:

1. discover sources (`web_search`)
2. extract content (`web_fetch`)
3. store useful material (`web_stash`)
4. retrieve relevant context (`web_grep`)
5. synthesize answers (`web_ask`)

---

## Next steps

- **[Installation](getting-started/installation.md)**
- **[Setup with LLMs](getting-started/llm-setup.md)**
- **[Usage](guide/usage.md)**
- **[MCP Tools](reference/tools.md)**
