import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebFetcher } from './web-fetch.js';

vi.mock('axios');

describe('WebFetcher', () => {
  let fetcher: WebFetcher;

  beforeEach(() => {
    fetcher = new WebFetcher();
    vi.resetAllMocks();
  });

  it('should fetch and convert HTML to Markdown', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Article</title>
          <meta property="og:site_name" content="Test Site">
          <meta name="description" content="An excerpt of the test article.">
        </head>
        <body>
          <header>
            <h1>Test Article</h1>
          </header>
          <div class="main-content" id="content">
            <p>This is a <strong>bold</strong> statement.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <a href="https://example.com/link">A link</a>
            <p>Some more text to make Readability think this is an article. Usually it needs some amount of text to consider it an article, otherwise it just ignores the block.</p>
            <p>Here is another paragraph with enough words to score higher in the Readability algorithm.</p>
          </div>
          <footer>
            <p>Footer content that might be ignored.</p>
          </footer>
        </body>
      </html>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: mockHtml,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });

    const result = await fetcher.fetch('https://example.com/test-article');

    expect(axios.get).toHaveBeenCalledWith('https://example.com/test-article', expect.any(Object));
    expect(result.title).toBe('Test Article');
    expect(result.siteName).toBe('Test Site');
    expect(result.excerpt).toBe('An excerpt of the test article.');
    expect(result.url).toBe('https://example.com/test-article');

    // Check markdown generation
    expect(result.content).toContain('This is a **bold** statement.');
    expect(result.content).toContain('*   Item 1');
    expect(result.content).toContain('*   Item 2');
    expect(result.content).toContain('[A link](https://example.com/link)');
  });

  it('should handle non-HTML content gracefully', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: '{"json": true}',
      headers: { 'content-type': 'application/json' },
    });

    await expect(fetcher.fetch('https://example.com/api/data')).rejects.toThrow('Unsupported content type');
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetcher.fetch('https://example.com/')).rejects.toThrow('Failed to fetch web page: Network error');
  });
});
