#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { WebStorage } from './lib/storage.js';
import { OllamaAskProvider } from './lib/web-ask.js';
import { WebFetcher } from './lib/web-fetch.js';
import { createSearchProvider, type SearchProviderName } from './lib/web-search.js';

const SEARCH_PROVIDERS: SearchProviderName[] = ['duckduckgo', 'google', 'bing', 'brave'];

// Initialize providers
const webFetcher = new WebFetcher();
const webStorage = new WebStorage('.web_stash.db');
const askProvider = new OllamaAskProvider(webStorage);

const server = new Server(
  {
    name: 'smart-web-extraction',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const SearchInputSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search query' },
    provider: {
      type: 'string',
      enum: SEARCH_PROVIDERS,
      description: 'Search provider (default: duckduckgo)',
    },
    limit: { type: 'number', description: 'Max results (default: 5)' },
  },
  required: ['query'],
};

function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName}: expected a string`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Invalid ${fieldName}: cannot be empty`);
  }

  return normalized;
}

function parseOptionalPositiveLimit(value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error('Invalid limit: expected a positive integer');
  }

  return value;
}

function parseProvider(value: unknown): SearchProviderName {
  if (value === undefined) {
    return 'duckduckgo';
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid provider: expected a string');
  }

  const provider = value.trim() as SearchProviderName;
  if (!SEARCH_PROVIDERS.includes(provider)) {
    throw new Error(`Invalid provider: ${provider}. Supported providers: ${SEARCH_PROVIDERS.join(', ')}`);
  }

  return provider;
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'web_search',
        description: 'Search the web using supported providers (DuckDuckGo, Google, Bing, Brave).',
        inputSchema: SearchInputSchema,
      },
      {
        name: 'web_fetch',
        description: 'Fetch and extract markdown content from a URL.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' },
          },
          required: ['url'],
        },
      },
      {
        name: 'web_stash',
        description: 'Store markdown content into local SQLite database.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Source URL' },
            title: { type: 'string', description: 'Title of the page' },
            content: { type: 'string', description: 'Markdown content' },
          },
          required: ['url', 'title', 'content'],
        },
      },
      {
        name: 'web_grep',
        description: 'Search stashed web pages using FTS5.',
        inputSchema: SearchInputSchema,
      },
      {
        name: 'web_ask',
        description: 'Ask a question using a local Ollama model and context from stashed web pages.',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'The question to ask' },
            limit: { type: 'number', description: 'Number of sources to retrieve (default: 3)' },
          },
          required: ['question'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'web_search': {
        const query = parseRequiredString(args?.query, 'query');
        const provider = parseProvider(args?.provider);
        const limit = parseOptionalPositiveLimit(args?.limit, 5);

        const searchProvider = createSearchProvider(provider);
        const results = await searchProvider.search(query, limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      case 'web_fetch': {
        const url = parseRequiredString(args?.url, 'url');
        const result = await webFetcher.fetch(url);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'web_stash': {
        const url = parseRequiredString(args?.url, 'url');
        const title = parseRequiredString(args?.title, 'title');
        const content = parseRequiredString(args?.content, 'content');
        webStorage.stash({ url, title, content });
        return {
          content: [{ type: 'text', text: `Successfully stashed ${url}` }],
        };
      }

      case 'web_grep': {
        const query = parseRequiredString(args?.query, 'query');
        const limit = parseOptionalPositiveLimit(args?.limit, 5);
        const results = webStorage.grep(query, limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      case 'web_ask': {
        const question = parseRequiredString(args?.question, 'question');
        const limit = parseOptionalPositiveLimit(args?.limit, 3);

        const result = await askProvider.ask(question, limit);

        return {
          content: [{ type: 'text', text: `Answer:\n${result.answer}\n\nSources:\n${result.contextUrls.join('\n')}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    return {
      content: [{ type: 'text', text: `Error executing tool ${name}: ${err.message}` }],
      isError: true,
    };
  }
});

// Start server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Smart Web Extraction MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
