import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BingSearchProvider,
  BraveSearchProvider,
  createSearchProvider,
  DuckDuckGoSearchProvider,
  GoogleSearchProvider,
} from './web-search.js';

vi.mock('axios');

const ORIGINAL_ENV = { ...process.env };

describe('DuckDuckGoSearchProvider', () => {
  let provider: DuckDuckGoSearchProvider;

  beforeEach(() => {
    provider = new DuckDuckGoSearchProvider();
    vi.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('should extract search results from HTML', async () => {
    const mockHtml = `
      <html>
        <body>
          <div class="result">
            <h2 class="result__title">
              <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Example Domain</a>
            </h2>
            <div class="result__snippet">This is an example snippet.</div>
          </div>
          <div class="result">
            <h2 class="result__title">
              <a class="result__url" href="https://another.com">Another Domain</a>
            </h2>
            <div class="result__snippet">Another snippet here.</div>
          </div>
        </body>
      </html>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockHtml });

    const results = await provider.search('test query', 2);

    expect(axios.get).toHaveBeenCalledWith(
      'https://html.duckduckgo.com/html/',
      expect.objectContaining({
        params: { q: 'test query' },
      }),
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'Example Domain',
      url: 'https://example.com',
      snippet: 'This is an example snippet.',
    });
    expect(results[1]).toEqual({
      title: 'Another Domain',
      url: 'https://another.com',
      snippet: 'Another snippet here.',
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    await expect(provider.search('test query')).rejects.toThrow(
      'Failed to perform duckduckgo web search: Network error',
    );
  });

  it('should respect the limit parameter', async () => {
    const mockHtml = `
      <html>
        <body>
          ${Array(5)
            .fill(0)
            .map(
              (_, i) => `
            <div class="result">
              <h2 class="result__title">
                <a class="result__url" href="https://example.com/${i}">Title ${i}</a>
              </h2>
              <div class="result__snippet">Snippet ${i}</div>
            </div>
          `,
            )
            .join('')}
        </body>
      </html>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockHtml });

    const results = await provider.search('test query', 3);

    expect(results).toHaveLength(3);
  });

  it('should reject invalid limits', async () => {
    await expect(provider.search('test query', 0)).rejects.toThrow('Search limit must be a positive integer');
    await expect(provider.search('test query', 0.5)).rejects.toThrow('Search limit must be a positive integer');
  });
});

describe('GoogleSearchProvider', () => {
  let provider: GoogleSearchProvider;

  beforeEach(() => {
    provider = new GoogleSearchProvider();
    vi.resetAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      GOOGLE_API_KEY: 'google-key',
      GOOGLE_CSE_ID: 'google-cse',
    };
  });

  it('should map Google Custom Search results', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        items: [
          { title: 'Google Result', link: 'https://google-result.com', snippet: 'Google snippet' },
          { title: 'Google Result 2', link: 'https://google-result-2.com', snippet: 'Google snippet 2' },
        ],
      },
    });

    const results = await provider.search('typescript', 2);

    expect(axios.get).toHaveBeenCalledWith(
      'https://www.googleapis.com/customsearch/v1',
      expect.objectContaining({
        params: {
          key: 'google-key',
          cx: 'google-cse',
          q: 'typescript',
          num: 2,
        },
      }),
    );

    expect(results).toEqual([
      { title: 'Google Result', url: 'https://google-result.com', snippet: 'Google snippet' },
      { title: 'Google Result 2', url: 'https://google-result-2.com', snippet: 'Google snippet 2' },
    ]);
  });

  it('should fail when required env vars are missing', async () => {
    delete process.env.GOOGLE_API_KEY;

    await expect(provider.search('typescript')).rejects.toThrow(
      'Missing required environment variable: GOOGLE_API_KEY',
    );
  });
});

describe('BingSearchProvider', () => {
  let provider: BingSearchProvider;

  beforeEach(() => {
    provider = new BingSearchProvider();
    vi.resetAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      BING_API_KEY: 'bing-key',
    };
  });

  it('should map Bing search results', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        webPages: {
          value: [{ name: 'Bing Result', url: 'https://bing-result.com', snippet: 'Bing snippet' }],
        },
      },
    });

    const results = await provider.search('nodejs', 1);

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.bing.microsoft.com/v7.0/search',
      expect.objectContaining({
        params: { q: 'nodejs', count: 1 },
        headers: { 'Ocp-Apim-Subscription-Key': 'bing-key' },
      }),
    );
    expect(results).toEqual([{ title: 'Bing Result', url: 'https://bing-result.com', snippet: 'Bing snippet' }]);
  });
});

describe('BraveSearchProvider', () => {
  let provider: BraveSearchProvider;

  beforeEach(() => {
    provider = new BraveSearchProvider();
    vi.resetAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      BRAVE_API_KEY: 'brave-key',
    };
  });

  it('should map Brave search results', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        web: {
          results: [{ title: 'Brave Result', url: 'https://brave-result.com', description: 'Brave snippet' }],
        },
      },
    });

    const results = await provider.search('mcp', 1);

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.search.brave.com/res/v1/web/search',
      expect.objectContaining({
        params: { q: 'mcp', count: 1 },
        headers: { 'X-Subscription-Token': 'brave-key' },
      }),
    );
    expect(results).toEqual([{ title: 'Brave Result', url: 'https://brave-result.com', snippet: 'Brave snippet' }]);
  });
});

describe('createSearchProvider', () => {
  it('should return provider instances for each supported provider', () => {
    expect(createSearchProvider('duckduckgo')).toBeInstanceOf(DuckDuckGoSearchProvider);
    expect(createSearchProvider('google')).toBeInstanceOf(GoogleSearchProvider);
    expect(createSearchProvider('bing')).toBeInstanceOf(BingSearchProvider);
    expect(createSearchProvider('brave')).toBeInstanceOf(BraveSearchProvider);
  });
});
