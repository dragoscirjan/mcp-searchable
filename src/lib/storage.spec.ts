import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebStorage } from './storage.js';
import { WebFetchResult } from './web-fetch.js';

describe('WebStorage', () => {
  let storage: WebStorage;

  beforeEach(() => {
    // Use an in-memory database for testing
    storage = new WebStorage(':memory:');
  });

  afterEach(() => {
    storage.close();
  });

  it('should stash a web page and make it searchable via FTS5', () => {
    const page: WebFetchResult = {
      url: 'https://example.com/guide',
      title: 'A Guide to TypeScript',
      content:
        'TypeScript is a strongly typed programming language that builds on JavaScript. It gives you better tooling at any scale.',
      excerpt: 'Learn about TypeScript',
      siteName: 'TS Docs',
    };

    storage.stash(page);

    // Search for a keyword that appears in the content
    const results = storage.grep('strongly typed');

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://example.com/guide');
    expect(results[0].title).toBe('A Guide to TypeScript');

    // Check if the snippet contains the match wrapped in <b> tags
    expect(results[0].snippet).toContain('<b>strongly</b> <b>typed</b>');
  });

  it('should update an existing page when stashing the same URL', () => {
    const page: WebFetchResult = {
      url: 'https://example.com/update',
      title: 'Original Title',
      content: 'Original content with the keyword apple.',
    };

    storage.stash(page);

    const updatedPage: WebFetchResult = {
      url: 'https://example.com/update',
      title: 'New Title',
      content: 'Updated content with the keyword banana.',
    };

    storage.stash(updatedPage);

    // Search for original keyword (should not be found)
    const oldResults = storage.grep('apple');
    expect(oldResults).toHaveLength(0);

    // Search for new keyword (should be found)
    const newResults = storage.grep('banana');
    expect(newResults).toHaveLength(1);
    expect(newResults[0].title).toBe('New Title');
  });

  it('should respect the limit parameter during grep', () => {
    // Add multiple pages with the same keyword
    for (let i = 0; i < 5; i++) {
      storage.stash({
        url: `https://example.com/page${i}`,
        title: `Page ${i}`,
        content: 'This page contains the magic keyword.',
      });
    }

    const results = storage.grep('magic keyword', 3);

    expect(results).toHaveLength(3);
  });

  it('should handle FTS5 query syntax gracefully', () => {
    storage.stash({
      url: 'https://example.com/syntax',
      title: 'Syntax Guide',
      content: 'We are learning about logical AND OR NOT operations in SQLite.',
    });

    // Testing an advanced FTS5 query
    const results = storage.grep('learning AND SQLite');

    expect(results).toHaveLength(1);
  });
});
