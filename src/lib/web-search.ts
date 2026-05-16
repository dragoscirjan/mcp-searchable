import axios from 'axios';
import { JSDOM } from 'jsdom';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchProvider {
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

export type SearchProviderName = 'duckduckgo' | 'google' | 'bing' | 'brave';

const GOOGLE_API_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';
const BING_API_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';
const BRAVE_API_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

function validatePositiveLimit(limit: number): number {
  if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit <= 0) {
    throw new Error('Search limit must be a positive integer');
  }

  return limit;
}

function requireEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function mapSearchError(provider: SearchProviderName, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Failed to perform ${provider} web search: ${message}`);
}

export class DuckDuckGoSearchProvider implements WebSearchProvider {
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const normalizedLimit = validatePositiveLimit(limit);

    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const results: SearchResult[] = [];
      const resultElements = document.querySelectorAll('.result');

      for (let i = 0; i < resultElements.length && results.length < normalizedLimit; i++) {
        const el = resultElements[i];

        const titleEl = el.querySelector('.result__title a.result__a, .result__a, .result__title a.result__url');
        const snippetEl = el.querySelector('.result__snippet');

        if (titleEl && snippetEl) {
          let url = titleEl.getAttribute('href') || '';
          if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            url = decodeURIComponent(urlParams.get('uddg') || url);
          }

          results.push({
            title: titleEl.textContent?.trim() || '',
            url: url,
            snippet: snippetEl.textContent?.trim() || '',
          });
        }
      }

      return results;
    } catch (error) {
      throw mapSearchError('duckduckgo', error);
    }
  }
}

export class GoogleSearchProvider implements WebSearchProvider {
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const normalizedLimit = validatePositiveLimit(limit);
    const apiKey = requireEnvVar('GOOGLE_API_KEY');
    const cx = requireEnvVar('GOOGLE_CSE_ID');

    try {
      const response = await axios.get(GOOGLE_API_ENDPOINT, {
        params: {
          key: apiKey,
          cx,
          q: query,
          num: Math.min(normalizedLimit, 10),
        },
      });

      const items: Array<{ title?: string; link?: string; snippet?: string }> = Array.isArray(response.data?.items)
        ? response.data.items
        : [];

      return items.slice(0, normalizedLimit).map((item) => ({
        title: item.title?.trim() || '',
        url: item.link?.trim() || '',
        snippet: item.snippet?.trim() || '',
      }));
    } catch (error) {
      throw mapSearchError('google', error);
    }
  }
}

export class BingSearchProvider implements WebSearchProvider {
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const normalizedLimit = validatePositiveLimit(limit);
    const apiKey = requireEnvVar('BING_API_KEY');
    const endpoint = process.env.BING_API_ENDPOINT || BING_API_ENDPOINT;

    try {
      const response = await axios.get(endpoint, {
        params: {
          q: query,
          count: Math.min(normalizedLimit, 50),
        },
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      });

      const values: Array<{ name?: string; url?: string; snippet?: string }> = Array.isArray(
        response.data?.webPages?.value,
      )
        ? response.data.webPages.value
        : [];

      return values.slice(0, normalizedLimit).map((item) => ({
        title: item.name?.trim() || '',
        url: item.url?.trim() || '',
        snippet: item.snippet?.trim() || '',
      }));
    } catch (error) {
      throw mapSearchError('bing', error);
    }
  }
}

export class BraveSearchProvider implements WebSearchProvider {
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    const normalizedLimit = validatePositiveLimit(limit);
    const apiKey = requireEnvVar('BRAVE_API_KEY');

    try {
      const response = await axios.get(BRAVE_API_ENDPOINT, {
        params: {
          q: query,
          count: Math.min(normalizedLimit, 20),
        },
        headers: {
          'X-Subscription-Token': apiKey,
        },
      });

      const results: Array<{ title?: string; url?: string; description?: string }> = Array.isArray(
        response.data?.web?.results,
      )
        ? response.data.web.results
        : [];

      return results.slice(0, normalizedLimit).map((item) => ({
        title: item.title?.trim() || '',
        url: item.url?.trim() || '',
        snippet: item.description?.trim() || '',
      }));
    } catch (error) {
      throw mapSearchError('brave', error);
    }
  }
}

export function createSearchProvider(provider: SearchProviderName = 'duckduckgo'): WebSearchProvider {
  switch (provider) {
    case 'duckduckgo':
      return new DuckDuckGoSearchProvider();
    case 'google':
      return new GoogleSearchProvider();
    case 'bing':
      return new BingSearchProvider();
    case 'brave':
      return new BraveSearchProvider();
    default:
      throw new Error(`Unsupported search provider: ${provider}`);
  }
}
