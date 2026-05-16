# MCP Tools & Resources

`mcp-searchable` exposes a focused set of tools for agent-driven research.

## Available Tools

| Tool         | Parameters                                                                                                           | Description                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `web_search` | `query` (string), `provider` (enum: `duckduckgo`, `google`, `bing`, `brave`), `limit` (positive integer, default: 5) | Searches web providers and returns normalized results (`title`, `url`, `snippet`). |
| `web_fetch`  | `url` (string)                                                                                                       | Fetches a URL and extracts Markdown content.                                       |
| `web_stash`  | `url` (string), `title` (string), `content` (string)                                                                 | Stores or updates a page in local SQLite storage.                                  |
| `web_grep`   | `query` (string), `limit` (positive integer, default: 5)                                                             | Runs FTS5 search across stashed pages and returns ranked snippets.                 |
| `web_ask`    | `question` (string), `limit` (positive integer, default: 3)                                                          | Uses local Ollama with stashed context and returns answer + source URLs.           |

## Available Resources

Currently, this server focuses on tools and does not expose additional MCP resource URIs.
