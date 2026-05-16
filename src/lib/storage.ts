import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { WebFetchResult } from './web-fetch.js';

export interface GrepResult {
  url: string;
  title: string;
  snippet: string;
  rank: number;
}

export class WebStorage {
  private db: DatabaseType;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    // Create the base table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        excerpt TEXT,
        site_name TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    // Create the FTS5 virtual table for full-text search
    // We only index title and content for searching
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
        title,
        content,
        content='pages',
        content_rowid='id'
      );
    `);

    // Triggers to keep FTS index updated
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
        INSERT INTO pages_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
      END;
      
      CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
        INSERT INTO pages_fts(pages_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
      END;
      
      CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
        INSERT INTO pages_fts(pages_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
        INSERT INTO pages_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
      END;
    `);
  }

  stash(page: WebFetchResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO pages (url, title, content, excerpt, site_name, created_at)
      VALUES (@url, @title, @content, @excerpt, @siteName, @createdAt)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        excerpt = excluded.excerpt,
        site_name = excluded.site_name,
        created_at = excluded.created_at
    `);

    stmt.run({
      url: page.url,
      title: page.title,
      content: page.content,
      excerpt: page.excerpt || null,
      siteName: page.siteName || null,
      createdAt: Date.now(),
    });
  }

  grep(query: string, limit: number = 10): GrepResult[] {
    // Use snippet function from FTS5 to highlight matches
    // snippet(fts_table, column_index, 'before_match', 'after_match', 'ellipsis', max_tokens)
    const stmt = this.db.prepare(`
      SELECT 
        pages.url,
        pages.title,
        snippet(pages_fts, 1, '<b>', '</b>', '...', 64) as snippet,
        pages_fts.rank
      FROM pages_fts
      JOIN pages ON pages.id = pages_fts.rowid
      WHERE pages_fts MATCH @query
      ORDER BY pages_fts.rank
      LIMIT @limit
    `);

    const rows = stmt.all({ query, limit }) as Array<{
      url: string;
      title: string;
      snippet: string;
      rank: number;
    }>;

    return rows.map((row) => ({
      url: row.url,
      title: row.title,
      snippet: row.snippet,
      rank: row.rank,
    }));
  }

  getPage(url: string): WebFetchResult | null {
    const stmt = this.db.prepare(`
      SELECT url, title, content, excerpt, site_name as siteName
      FROM pages
      WHERE url = @url
    `);

    const row = stmt.get({ url }) as
      | {
          url: string;
          title: string;
          content: string;
          excerpt?: string;
          siteName?: string;
        }
      | undefined;
    if (!row) return null;

    return {
      url: row.url,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      siteName: row.siteName,
    };
  }

  close(): void {
    this.db.close();
  }
}
