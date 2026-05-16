import axios from 'axios';
import { WebStorage, GrepResult } from './storage.js';

export interface AskResult {
  answer: string;
  contextUrls: string[];
}

export class OllamaAskProvider {
  constructor(
    private storage: WebStorage,
    private ollamaUrl: string = process.env.OLLAMA_URL || 'http://localhost:11434',
    private model: string = process.env.OLLAMA_MODEL || 'llama3',
  ) {}

  async ask(question: string, limit: number = 3): Promise<AskResult> {
    // 1. Search the storage for relevant context
    // First, try a direct FTS5 search
    // If that fails or gives no results, we might want to fallback to a simpler query,
    // but for now we'll stick to the provided question.
    // Clean up question to be a valid FTS5 query by removing special characters
    const safeQuery = question.replace(/["'^]/g, '').trim();

    let grepResults: GrepResult[] = [];
    try {
      grepResults = this.storage.grep(safeQuery, limit);
    } catch {
      // If FTS5 query syntax fails, fallback to OR-ing words
      const words = safeQuery.split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0) {
        try {
          grepResults = this.storage.grep(words.join(' OR '), limit);
        } catch (e) {
          console.warn('Fallback FTS5 query failed', e);
        }
      }
    }

    if (grepResults.length === 0) {
      return {
        answer: "I don't have any relevant information in my web stash to answer that question.",
        contextUrls: [],
      };
    }

    // 2. Fetch full content for context
    const contextUrls: string[] = [];
    let contextText = '';

    for (const res of grepResults) {
      const page = this.storage.getPage(res.url);
      if (page) {
        contextUrls.push(res.url);
        // Truncate content to avoid blowing up context window
        // Roughly 2000 chars per context source
        const truncatedContent = page.content.length > 2000 ? page.content.substring(0, 2000) + '...' : page.content;

        contextText += `Source: ${page.url}\nTitle: ${page.title}\nContent: \n${truncatedContent}\n\n`;
      }
    }

    // 3. Prepare the prompt for Ollama
    const prompt = `
You are a helpful assistant. Use the following context to answer the question at the end.
If the answer is not contained in the context, say "I don't know based on the provided context."

Context:
${contextText}

Question: ${question}

Answer:`;

    // 4. Call Ollama API
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
        },
        {
          timeout: 60000, // LLM generation can be slow
        },
      );

      return {
        answer: response.data.response,
        contextUrls,
      };
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error(`Failed to get answer from Ollama: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
