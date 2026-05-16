# Environment Variables

`mcp-searchable` uses environment variables for search providers and local Q&A.

## Search providers

| Variable            | Required when     | Description                                                                |
| ------------------- | ----------------- | -------------------------------------------------------------------------- |
| `GOOGLE_API_KEY`    | `provider=google` | API key for Google Custom Search JSON API.                                 |
| `GOOGLE_CSE_ID`     | `provider=google` | Custom Search Engine identifier (`cx`).                                    |
| `BING_API_KEY`      | `provider=bing`   | API key for Bing Web Search API.                                           |
| `BING_API_ENDPOINT` | optional          | Override endpoint (default: `https://api.bing.microsoft.com/v7.0/search`). |
| `BRAVE_API_KEY`     | `provider=brave`  | API key for Brave Search API.                                              |

!!! tip
`duckduckgo` works without credentials.

## Local Q&A (Ollama)

| Variable       | Default                  | Description                  |
| -------------- | ------------------------ | ---------------------------- |
| `OLLAMA_URL`   | `http://localhost:11434` | Base URL of Ollama instance. |
| `OLLAMA_MODEL` | `llama3`                 | Model used by `web_ask`.     |

## Recommended setup

```bash
cp .env.example .env
```

Then set only keys required by the providers you use.
