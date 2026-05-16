# Setup with LLMs

Configure your MCP client to launch `mcp-searchable` over stdio.

## Claude Code

```bash
claude mcp add mcp-searchable -- npx -y @dragoscirjan/mcp-searchable
```

## Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mcp-searchable": {
      "command": "npx",
      "args": ["-y", "@dragoscirjan/mcp-searchable"]
    }
  }
}
```

## Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "mcp-searchable": {
      "command": "npx",
      "args": ["-y", "@dragoscirjan/mcp-searchable"]
    }
  }
}
```

## OpenCode

Add to `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "mcp-searchable": {
      "type": "local",
      "command": ["npx", "-y", "@dragoscirjan/mcp-searchable"]
    }
  }
}
```

!!! warning
If you run locally from source instead of npm package, ensure your `.env` is loaded in the process environment so provider keys are available.
