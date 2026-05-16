# Troubleshooting & Known Issues

## 1) `web_search` fails for API-backed providers

- **Issue**: `web_search` works with `duckduckgo`, but fails with `google`, `bing`, or `brave`.
- **Cause**: Missing or invalid provider credentials.
- **Fix**:
  - `google` requires `GOOGLE_API_KEY` and `GOOGLE_CSE_ID`
  - `bing` requires `BING_API_KEY`
  - `brave` requires `BRAVE_API_KEY`

After updating `.env`, restart your MCP client/host process.

## 2) `web_ask` fails to answer

- **Issue**: `web_ask` returns an error or times out.
- **Cause**: Ollama is not running, wrong `OLLAMA_URL`, or unavailable model.
- **Fix**:
  - Ensure Ollama is running and reachable
  - Verify `OLLAMA_URL` and `OLLAMA_MODEL`
  - Retry after confirming local Ollama health

## 3) Low-quality answers from `web_ask`

- **Issue**: Answers are vague or miss key details.
- **Cause**: Insufficient or noisy stashed context.
- **Fix**:
  - Stash higher-quality, relevant sources
  - Use `web_grep` before `web_ask` to confirm context quality

## 4) DuckDuckGo returns fewer results

- **Issue**: Fewer results than expected with `provider=duckduckgo`.
- **Cause**: HTML endpoint variability and anti-bot response differences.
- **Fix**:
  - Retry query with refined terms
  - Use `google`, `bing`, or `brave` for consistent API-backed retrieval
