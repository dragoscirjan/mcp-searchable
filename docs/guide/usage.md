# Usage

This is the canonical end-user flow for `mcp-searchable`.

## Workflow: Search → Fetch → Stash → Grep → Ask

### 1) Search

Call `web_search` to find candidate sources.

```json
{
  "query": "mcp server security best practices",
  "provider": "duckduckgo",
  "limit": 5
}
```

### 2) Fetch

Take a result URL and call `web_fetch` to extract readable Markdown.

```json
{
  "url": "https://example.com/mcp-security"
}
```

### 3) Stash

Persist useful content with `web_stash`.

```json
{
  "url": "https://example.com/mcp-security",
  "title": "MCP Security Guide",
  "content": "# MCP Security Guide\n..."
}
```

### 4) Grep local context

Run `web_grep` to locate relevant stashed snippets.

```json
{
  "query": "token handling",
  "limit": 5
}
```

### 5) Ask with local context

Use `web_ask` for synthesized answers backed by local sources.

```json
{
  "question": "Summarize recommended secret management patterns",
  "limit": 3
}
```

## Provider strategy

- Use `duckduckgo` when you want zero-key quick search.
- Use `google`, `bing`, or `brave` when you need official API-backed search.

## Notes

!!! warning
`web_ask` requires a running Ollama server reachable at `OLLAMA_URL`.

!!! tip
Keep stashed pages focused and high-quality. Better stash quality generally improves `web_ask` output quality.
