---
id: "00001"
type: lld
title: "Smart Web Extraction MCP Server"
version: 1
status: draft
opencode-agent: lead-engineer
---

# Smart Web Extraction MCP Server

## 1. Overview
The Smart Web Extraction MCP (Model Context Protocol) Server provides AI agents with token-optimized tools for web searching, content fetching, and deep extraction. It minimizes context window bloat by acting as a "smart proxy"—cleaning HTML, chunking large documents into local SQLite storage for keyword searching, and delegating complex reading tasks to local, free LLMs (via Ollama).

## 2. Architecture & Tech Stack
- **Language**: TypeScript / Node.js
- **Protocol**: `@modelcontextprotocol/sdk`
- **Fetching & HTML Parsing**:
  - `axios` (HTTP requests)
  - `jsdom` (DOM parsing)
  - `@mozilla/readability` (Core article extraction, noise stripping)
  - `turndown` (HTML to Markdown conversion with custom rules for stripping links/images)
- **Local Storage (Stash & Search)**:
  - `better-sqlite3` (with FTS5 extension enabled for fast full-text search)
- **Local AI Delegation**:
  - `ollama` SDK (or generic OpenAI-compatible fetch to `localhost:11434`)

## 3. Tool Definitions

### 3.1 `web_search`
Searches the web and returns a dense, token-optimized list of results.
- **Parameters**:
  - `query` (string, required)
  - `provider` (string, enum: `duckduckgo`, `brave`, `tavily`, default: `duckduckgo`)
  - `limit` (number, default: 5)
- **Returns**: Markdown list of results (Title, URL, concise snippet).

### 3.2 `web_fetch`
Fetches a URL and returns highly optimized, clean Markdown. Best for small-to-medium pages.
- **Parameters**:
  - `url` (string, required)
  - `mode` (string, enum: `article`, `raw`, `text_only`, default: `article`)
  - `selector` (string, optional) - Target specific DOM node.
  - `strip_links` (boolean, default: true)
- **Returns**: Cleaned Markdown text (truncated if exceeding internal limits, suggesting `web_stash`).

### 3.3 `web_stash`
Fetches a large URL, cleans it, chunks it, and stashes it into a local SQLite database for iterative searching.
- **Parameters**:
  - `url` (string, required)
- **Returns**: `document_id` and metadata (title, word count, chunk count).

### 3.4 `web_grep`
Searches a previously stashed document for specific keywords/concepts using SQLite FTS5.
- **Parameters**:
  - `document_id` (string, required)
  - `query` (string, required) - Keyword or phrase to search.
- **Returns**: Top N matching chunks/paragraphs with surrounding context.

### 3.5 `web_ask`
Delegates reading comprehension to a local AI. The MCP fetches the page, cleans it, and prompts a local Ollama model to answer the query.
- **Parameters**:
  - `url` (string, required)
  - `question` (string, required)
  - `local_model` (string, default: `llama3` or `phi3`)
- **Returns**: The exact answer to the question extracted by the local AI (massive token savings for the main LLM).

## 4. Implementation Tasks
- **Task 1**: Project Scaffolding (TypeScript, MCP SDK, ESLint).
- **Task 2**: Implement `web_search` (DuckDuckGo integration first, extensible to Brave).
- **Task 3**: Implement `web_fetch` pipeline (Axios -> JSDOM -> Readability -> Turndown).
- **Task 4**: Implement SQLite storage layer (`web_stash` & `web_grep` with FTS5).
- **Task 5**: Implement Ollama delegation (`web_ask`).
- **Task 6**: Write tests and package server for usage in standard MCP clients.

