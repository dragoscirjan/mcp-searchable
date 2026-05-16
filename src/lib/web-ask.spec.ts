import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebStorage } from './storage.js';
import { OllamaAskProvider } from './web-ask.js';

vi.mock('axios');

describe('OllamaAskProvider', () => {
  let askProvider: OllamaAskProvider;
  let mockStorage: Partial<WebStorage>;

  beforeEach(() => {
    mockStorage = {
      grep: vi.fn(),
      getPage: vi.fn(),
    };
    askProvider = new OllamaAskProvider(mockStorage as WebStorage, 'http://localhost:11434', 'llama3');
    vi.resetAllMocks();
  });

  it('should return a default message if no context is found', async () => {
    vi.mocked(mockStorage.grep!).mockReturnValueOnce([]);

    const result = await askProvider.ask('What is the capital of France?');

    expect(result.answer).toContain("I don't have any relevant information");
    expect(result.contextUrls).toHaveLength(0);
  });

  it('should formulate a prompt and call Ollama with context', async () => {
    vi.mocked(mockStorage.grep!).mockReturnValueOnce([
      { url: 'https://example.com/france', title: 'France Info', snippet: '...', rank: 0 },
    ]);

    vi.mocked(mockStorage.getPage!).mockReturnValueOnce({
      url: 'https://example.com/france',
      title: 'France Info',
      content: 'The capital of France is Paris.',
    });

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { response: 'Based on the context, the capital of France is Paris.' },
    });

    const result = await askProvider.ask('What is the capital of France?');

    expect(mockStorage.grep).toHaveBeenCalled();
    expect(mockStorage.getPage).toHaveBeenCalledWith('https://example.com/france');
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        model: 'llama3',
        stream: false,
      }),
      expect.any(Object),
    );

    // Verify the prompt contains the context and question
    const callArgs = vi.mocked(axios.post).mock.calls[0];
    const requestBody = callArgs[1] as { prompt: string };
    expect(requestBody.prompt).toContain('The capital of France is Paris.');
    expect(requestBody.prompt).toContain('What is the capital of France?');

    expect(result.answer).toBe('Based on the context, the capital of France is Paris.');
    expect(result.contextUrls).toEqual(['https://example.com/france']);
  });

  it('should fallback to OR query if FTS5 syntax fails', async () => {
    // First call throws (e.g. invalid syntax)
    vi.mocked(mockStorage.grep!).mockImplementationOnce(() => {
      throw new Error('FTS5 syntax error');
    });

    // Second call succeeds
    vi.mocked(mockStorage.grep!).mockReturnValueOnce([
      { url: 'https://example.com/syntax', title: 'Syntax', snippet: '', rank: 0 },
    ]);

    vi.mocked(mockStorage.getPage!).mockReturnValueOnce({
      url: 'https://example.com/syntax',
      title: 'Syntax',
      content: 'It works.',
    });

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { response: 'Yes.' },
    });

    await askProvider.ask('how to write queries');

    // grep should be called twice (initial + fallback)
    expect(mockStorage.grep).toHaveBeenCalledTimes(2);
    // fallback query should join words > 2 chars with OR
    expect(mockStorage.grep).toHaveBeenLastCalledWith('how OR write OR queries', 3);
  });
});
