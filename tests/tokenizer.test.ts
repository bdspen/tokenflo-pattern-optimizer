import {
  createTokenizer,
  countTokens,
  OpenAITokenizer,
  SimpleTokenizer
} from '../src/tokenizers';
import { TokenCache } from '../src/utils/token-cache';

// Mock the tokenizers module
jest.mock('../src/tokenizers', () => {
  // Keep track of the original module
  const originalModule = jest.requireActual('../src/tokenizers');

  return {
    __esModule: true,
    ...originalModule,
    // We'll manually override createTokenizer when needed in tests
  };
});

describe('Tokenizer Tests', () => {
  // Basic tokenizer functionality
  describe('Tokenizer Creation', () => {
    test('should create correct tokenizer for OpenAI models', () => {
      const tokenizer = createTokenizer('gpt-4');
      expect(tokenizer).toBeInstanceOf(OpenAITokenizer);
      expect(tokenizer.getModel()).toBe('gpt-4');
    });

    test('should create correct tokenizer for unknown models', () => {
      const tokenizer = createTokenizer('unknown-model');
      expect(tokenizer).toBeInstanceOf(SimpleTokenizer);
      expect(tokenizer.getModel()).toBe('unknown-model');
    });

    test('should normalize model names', () => {
      const tokenizer = createTokenizer('GPT-3.5-Turbo');
      expect(tokenizer).toBeInstanceOf(OpenAITokenizer);
      expect(tokenizer.getModel()).toBe('gpt-3.5-turbo');
    });

    test('should throw error for invalid model names', () => {
      expect(() => createTokenizer('')).toThrow();
      // @ts-ignore - Testing invalid input
      expect(() => createTokenizer(null)).toThrow();
      // @ts-ignore - Testing invalid input
      expect(() => createTokenizer(undefined)).toThrow();
    });
  });

  // OpenAI tokenizer specific tests
  describe('OpenAI Tokenizer', () => {
    test('should correctly count tokens for English text', () => {
      const tokenizer = new OpenAITokenizer('gpt-4');
      const text = 'Hello, world! This is a test.';
      const count = tokenizer.countTokens(text);

      // We know approximately how many tokens this should be
      // GPT models generally tokenize this to 7-8 tokens
      expect(count).toBeGreaterThanOrEqual(6);
      expect(count).toBeLessThanOrEqual(9);
    });

    test('should correctly count tokens for code', () => {
      const tokenizer = new OpenAITokenizer('gpt-4');
      const code = `function example() {
        const x = 10;
        return x * 2;
      }`;

      const count = tokenizer.countTokens(code);
      // Code typically has more tokens due to whitespace and symbols
      expect(count).toBeGreaterThan(10);
    });

    test('should handle empty text', () => {
      const tokenizer = new OpenAITokenizer('gpt-4');
      expect(tokenizer.countTokens('')).toBe(0);
      expect(tokenizer.countTokens('   ')).toBe(1); // Whitespace is usually 1 token
    });

    test('should use different encodings for different models', () => {
      const gpttokenizer = new OpenAITokenizer('gpt-4');
      const davincitokenizer = new OpenAITokenizer('text-davinci-003');

      // Models can have slightly different tokenization
      const text = 'This is a test of different encodings.';

      // Both should give reasonable results, though they might differ
      expect(gpttokenizer.countTokens(text)).toBeGreaterThan(0);
      expect(davincitokenizer.countTokens(text)).toBeGreaterThan(0);
    });
  });

  // Simple tokenizer specific tests
  describe('Simple Tokenizer', () => {
    test('should provide reasonable approximations for English text', () => {
      const tokenizer = new SimpleTokenizer('generic-model');
      const text = 'This is a simple test of the tokenizer.';
      const count = tokenizer.countTokens(text);

      // Should be roughly 8-10 tokens
      expect(count).toBeGreaterThanOrEqual(7);
      expect(count).toBeLessThanOrEqual(12);
    });

    test('should detect and adjust for code content', () => {
      const tokenizer = new SimpleTokenizer('generic-model');

      const englishText = 'This is a normal English sentence with regular words.';
      const codeText = `function test() {
        const x = 10;
        return x * 2;
      }`;

      const englishCount = tokenizer.countTokens(englishText);
      const codeCount = tokenizer.countTokens(codeText);

      // The code tokenization heuristic should result in a different token density
      const englishDensity = englishCount / englishText.length;
      const codeDensity = codeCount / codeText.length;

      // Code density should be different from English text density
      // Use a less strict precision (decimal places to check)
      expect(Math.abs(englishDensity - codeDensity)).toBeGreaterThan(0.01);
    });

    test('should detect and adjust for non-ASCII content', () => {
      const tokenizer = new SimpleTokenizer('generic-model');

      const englishText = 'This is English text.';
      const chineseText = '这是中文文本。'; // Chinese text

      const englishCount = tokenizer.countTokens(englishText);
      const chineseCount = tokenizer.countTokens(chineseText);

      // Chinese characters should be tokenized differently
      const englishDensity = englishCount / englishText.length;
      const chineseDensity = chineseCount / chineseText.length;

      // Non-ASCII content should have a different token density
      expect(englishDensity).not.toBeCloseTo(chineseDensity, 1);
    });
  });

  // Token counting utility tests
  describe('countTokens Utility', () => {
    test('should use cache for repeated calls', () => {
      const text = 'This should be cached after first call.';

      // First call should calculate tokens
      const firstCount = countTokens(text);

      // Mock the tokenizer to detect if it's called again
      const mockTokenizer = {
        countTokens: jest.fn().mockReturnValue(firstCount),
        getModel: jest.fn().mockReturnValue('gpt-3.5-turbo')
      };

      // Mock the createTokenizer function to return our mock tokenizer
      const originalCreateTokenizer = require('../src/tokenizers').createTokenizer;
      const mockedCreateTokenizer = jest.fn().mockReturnValue(mockTokenizer);
      require('../src/tokenizers').createTokenizer = mockedCreateTokenizer;

      // Second call should use cache
      const secondCount = countTokens(text);

      expect(secondCount).toBe(firstCount);
      // If cache works, the mock shouldn't be called
      expect(mockedCreateTokenizer).not.toHaveBeenCalled();

      // Restore the original implementation
      require('../src/tokenizers').createTokenizer = originalCreateTokenizer;
    });

    test('should handle undefined and empty inputs', () => {
      expect(countTokens('')).toBe(0);
      // @ts-ignore - Testing invalid input
      expect(countTokens(null)).toBe(0);
      // @ts-ignore - Testing invalid input
      expect(countTokens(undefined)).toBe(0);
    });
  });

  // Token cache tests
  describe('TokenCache', () => {
    test('should store and retrieve values correctly', () => {
      const cache = new TokenCache(100);

      cache.set('test text', 'gpt-4', 10);
      expect(cache.get('test text', 'gpt-4')).toBe(10);
    });

    test('should handle cache eviction when size exceeded', () => {
      const cache = new TokenCache(2); // Only 2 entries

      cache.set('first', 'model', 1);
      cache.set('second', 'model', 2);

      // This should evict the first entry
      cache.set('third', 'model', 3);

      expect(cache.get('first', 'model')).toBeUndefined();
      expect(cache.get('second', 'model')).toBe(2);
      expect(cache.get('third', 'model')).toBe(3);
    });

    test('should move recently accessed items to the end of eviction queue', () => {
      const cache = new TokenCache(2);

      cache.set('first', 'model', 1);
      cache.set('second', 'model', 2);

      // Access the first item to move it to the end of the queue
      cache.get('first', 'model');

      // Add a third item, which should evict the second item
      cache.set('third', 'model', 3);

      expect(cache.get('first', 'model')).toBe(1); // Should still be in cache
      expect(cache.get('second', 'model')).toBeUndefined(); // Should be evicted
      expect(cache.get('third', 'model')).toBe(3);
    });

    test('should clear all entries when clear() is called', () => {
      const cache = new TokenCache();

      cache.set('test1', 'model', 1);
      cache.set('test2', 'model', 2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('test1', 'model')).toBeUndefined();
      expect(cache.get('test2', 'model')).toBeUndefined();
    });

    test('should resize cache when maxSize changes', () => {
      const cache = new TokenCache(5);

      for (let i = 0; i < 5; i++) {
        cache.set(`item${i}`, 'model', i);
      }

      expect(cache.size()).toBe(5);

      // Reduce size, should evict oldest entries
      cache.setMaxSize(3);

      expect(cache.size()).toBe(3);
      // The first 2 items should be evicted
      expect(cache.get('item0', 'model')).toBeUndefined();
      expect(cache.get('item1', 'model')).toBeUndefined();
      // The last 3 items should remain
      expect(cache.get('item2', 'model')).toBe(2);
      expect(cache.get('item3', 'model')).toBe(3);
      expect(cache.get('item4', 'model')).toBe(4);
    });
  });

  // Performance tests
  describe('Tokenizer Performance', () => {
    test('should tokenize large text efficiently', () => {
      const largeText = 'word '.repeat(10000);

      const tokenizer = createTokenizer('gpt-3.5-turbo');

      const startTime = performance.now();
      const count = tokenizer.countTokens(largeText);
      const endTime = performance.now();

      const timeMs = endTime - startTime;

      // Should tokenize in a reasonable amount of time
      expect(timeMs).toBeLessThan(1000); // Less than 1 second

      // Should return a reasonable token count (approx 1 token per word)
      expect(count).toBeGreaterThan(5000);
      expect(count).toBeLessThan(15000);

      console.log(`Tokenized ${largeText.length} chars in ${timeMs.toFixed(2)}ms (${(largeText.length / timeMs * 1000).toFixed(0)} chars/sec)`);
    });
  });
}); 