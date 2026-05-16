import { Readability } from '@mozilla/readability';
import axios from 'axios';
import { JSDOM, VirtualConsole } from 'jsdom';
import TurndownService from 'turndown';

export interface WebFetchResult {
  title: string;
  content: string; // Markdown content
  url: string;
  excerpt?: string;
  siteName?: string;
}

export class WebFetcher {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }

  async fetch(url: string): Promise<WebFetchResult> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      });

      const contentType = response.headers['content-type']?.toString() || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      // Suppress JSDOM CSS parsing errors
      const virtualConsole = new VirtualConsole();
      const dom = new JSDOM(response.data, { url, virtualConsole });

      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        throw new Error('Failed to extract article content using Readability');
      }

      const markdown = this.turndownService.turndown(article.content || '');

      return {
        title: article.title || '',
        content: markdown,
        url: url,
        excerpt: article.excerpt || undefined,
        siteName: article.siteName || undefined,
      };
    } catch (error) {
      console.error(`Error fetching or parsing URL ${url}:`, error);
      throw new Error(`Failed to fetch web page: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
