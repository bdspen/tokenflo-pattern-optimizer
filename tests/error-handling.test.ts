import { PatternOptimizer, DualOptimizer, OptimizerError } from '../src/optimizers';
import { PromptOptimizer } from '../src/index';
import { createTokenizer, countTokens } from '../src/tokenizers';
import { TokenCache } from '../src/utils/token-cache';
import { OptimizationPattern } from '../src/types';

// Mock the patterns module to avoid loading invalid patterns
jest.mock('../src/patterns', () => {
  return {
    getAllPatterns: () => [],
    getPatternsByAggressiveness: () => [],
    getPatternsByCategory: () => [],
    getAvailableCategories: () => ['verbosity', 'formatting']
  };
});

describe('Error Handling Tests', () => {
  // PatternOptimizer error handling
  describe('PatternOptimizer Error Handling', () => {
    test('should validate patterns at construction', () => {
      // Invalid pattern - missing required properties
      const invalidPattern = {
        id: 'test-pattern'
        // Missing category and description
      } as OptimizationPattern;

      // Should throw when invalid pattern is provided in constructor
      expect(() => {
        new PatternOptimizer([invalidPattern]);
      }).toThrow(OptimizerError);
    });

    test('should validate patterns when adding them', () => {
      const optimizer = new PatternOptimizer();

      // Invalid pattern - missing replace property for find
      const invalidPattern = {
        id: 'test-pattern',
        category: 'test',
        description: 'Test pattern',
        find: 'test'
        // Missing replace property
      } as OptimizationPattern;

      expect(() => {
        optimizer.addPattern(invalidPattern);
      }).toThrow(OptimizerError);
    });

    test('should validate input text', () => {
      const optimizer = new PatternOptimizer();

      // Use proper type assertions
      expect(() => optimizer.optimize(null as unknown as string)).toThrow(OptimizerError);
      expect(() => optimizer.optimize(undefined as unknown as string)).toThrow(OptimizerError);
      expect(() => optimizer.optimize(123 as unknown as string)).toThrow(OptimizerError);

      // Empty string should not throw but return unchanged
      const result = optimizer.optimize('');
      expect(result.originalText).toBe('');
      expect(result.optimizedText).toBe('');
    });

    test('should skip patterns that throw errors during application', () => {
      // Create a pattern that always throws
      const errorPattern: OptimizationPattern = {
        id: 'error-pattern',
        category: 'test',
        description: 'Pattern that throws errors',
        test: () => { throw new Error('Test error in test() function'); },
        transform: () => { throw new Error('Test error in transform() function'); }
      };

      // Create a pattern that works normally
      const workingPattern: OptimizationPattern = {
        id: 'working-pattern',
        category: 'test',
        description: 'Pattern that works normally',
        find: 'test',
        replace: 'TEST'
      };

      const optimizer = new PatternOptimizer([errorPattern, workingPattern]);

      // Should not throw, but skip the error pattern
      const result = optimizer.optimize('This is a test text');

      // The working pattern should be applied
      expect(result.optimizedText).toBe('This is a TEST text');

      // Error pattern should be in skipped patterns
      expect(result.skippedPatterns).toContainEqual(expect.objectContaining({
        id: 'error-pattern'
      }));

      // Working pattern should be in applied patterns
      expect(result.appliedPatterns).toContainEqual(expect.objectContaining({
        id: 'working-pattern'
      }));
    });

    test('should handle errors in replacer functions', () => {
      // Create a pattern with a replacer function that throws
      const errorReplacerPattern: OptimizationPattern = {
        id: 'error-replacer',
        category: 'test',
        description: 'Pattern with error in replacer function',
        find: /test/g,
        replace: () => { throw new Error('Error in replacer function'); }
      };

      const optimizer = new PatternOptimizer([errorReplacerPattern]);

      // Should not throw, should keep original text for matches
      const result = optimizer.optimize('This is a test text with multiple test words');

      // The text should remain unchanged since the replacer fails
      expect(result.optimizedText).toBe('This is a test text with multiple test words');
    });

    test('should validate model parameter', () => {
      const optimizer = new PatternOptimizer();

      expect(() => optimizer.setModel('')).toThrow(OptimizerError);
      expect(() => optimizer.setModel(null as unknown as string)).toThrow(OptimizerError);
      expect(() => optimizer.setModel(undefined as unknown as string)).toThrow(OptimizerError);
    });

    test('should validate preserveFormatting parameter', () => {
      const optimizer = new PatternOptimizer();

      expect(() => optimizer.setPreserveFormatting('yes' as unknown as boolean)).toThrow(OptimizerError);
      expect(() => optimizer.setPreserveFormatting(null as unknown as boolean)).toThrow(OptimizerError);
      expect(() => optimizer.setPreserveFormatting(1 as unknown as boolean)).toThrow(OptimizerError);
    });
  });

  // DualOptimizer error handling
  describe('DualOptimizer Error Handling', () => {
    test('should validate balance parameter', () => {
      // Invalid balance - must be between 0 and 1
      expect(() => {
        new DualOptimizer({
          qualityVsEfficiencyBalance: -0.5,
          model: 'gpt-3.5-turbo'
        });
      }).toThrow(OptimizerError);

      expect(() => {
        new DualOptimizer({
          qualityVsEfficiencyBalance: 1.5,
          model: 'gpt-3.5-turbo'
        });
      }).toThrow(OptimizerError);

      // Testing invalid input type
      expect(() => {
        // Use a proper type assertion that TypeScript will accept
        new DualOptimizer({
          qualityVsEfficiencyBalance: 'medium' as unknown as number, // Cast string to number
          model: 'gpt-3.5-turbo'
        });
      }).toThrow(OptimizerError);
    });

    test('should validate setQualityEfficiencyBalance parameter', () => {
      const optimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: 0.5,
        model: 'gpt-3.5-turbo'
      });

      expect(() => optimizer.setQualityEfficiencyBalance(-0.1)).toThrow(OptimizerError);
      expect(() => optimizer.setQualityEfficiencyBalance(1.1)).toThrow(OptimizerError);

      // Testing invalid input type
      expect(() => optimizer.setQualityEfficiencyBalance('high' as unknown as number)).toThrow(OptimizerError);
    });

    test('should validate input text', () => {
      const optimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: 0.5,
        model: 'gpt-3.5-turbo'
      });

      expect(() => optimizer.optimize(null as unknown as string)).toThrow(OptimizerError);
      expect(() => optimizer.optimize(undefined as unknown as string)).toThrow(OptimizerError);
      expect(() => optimizer.optimize(123 as unknown as string)).toThrow(OptimizerError);
    });

    test('should include balance in optimization result', () => {
      const balance = 0.7;
      const optimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: balance,
        model: 'gpt-3.5-turbo'
      });

      const result = optimizer.optimize('Test text');
      expect(result.qualityVsEfficiencyBalance).toBe(balance);
    });
  });

  // PromptOptimizer error handling
  describe('PromptOptimizer Error Handling', () => {
    test('should validate aggressiveness level', () => {
      const optimizer = new PromptOptimizer();

      expect(() => optimizer.setAggressiveness('very-high' as unknown as 'low' | 'medium' | 'high')).toThrow(OptimizerError);
      expect(() => optimizer.setAggressiveness(5 as unknown as 'low' | 'medium' | 'high')).toThrow(OptimizerError);
      expect(() => optimizer.setAggressiveness(null as unknown as 'low' | 'medium' | 'high')).toThrow(OptimizerError);
    });

    test('should validate model parameter', () => {
      const optimizer = new PromptOptimizer();

      expect(() => optimizer.setModel('')).toThrow(OptimizerError);
      expect(() => optimizer.setModel(null as unknown as string)).toThrow(OptimizerError);
    });

    test('should validate pattern when adding', () => {
      const optimizer = new PromptOptimizer();

      const invalidPattern = {
        id: 'test'
        // Missing required properties
      } as OptimizationPattern;

      expect(() => optimizer.addPattern(invalidPattern)).toThrow(OptimizerError);
    });

    test('should handle tokenizer errors gracefully', () => {
      // Create a valid pattern to use in testing
      const validPattern: OptimizationPattern = {
        id: 'test-pattern',
        category: 'test',
        description: 'A test pattern',
        find: 'test',
        replace: 'TEST'
      };

      // Create a prompt optimizer with a fake model that might cause tokenizer issues
      // and provide a custom pattern to avoid validation errors
      const optimizer = new PromptOptimizer({
        model: 'non-existent-model',
        customPatterns: [validPattern]
      });

      // This should still work, falling back to the simple tokenizer
      // We're testing error handling here, not pattern application
      const result = optimizer.optimize('Test text');

      // Rather than checking the exact text transformation, check that:
      // 1. The function didn't throw an error
      // 2. We got a valid result with token counts
      expect(result).toBeDefined();
      expect(result.originalText).toBe('Test text');
      expect(result.originalTokenCount).toBeGreaterThan(0);
      expect(result.optimizedTokenCount).toBeGreaterThan(0);
    });
  });

  // TokenCache error handling
  describe('TokenCache Error Handling', () => {
    test('should validate maxSize parameter', () => {
      expect(() => new TokenCache(0)).toThrow();
      expect(() => new TokenCache(-10)).toThrow();
      // @ts-ignore - Testing invalid input
      expect(() => new TokenCache('large')).toThrow();
    });

    test('should validate setMaxSize parameter', () => {
      const cache = new TokenCache();

      expect(() => cache.setMaxSize(0)).toThrow();
      expect(() => cache.setMaxSize(-5)).toThrow();
      // @ts-ignore - Testing invalid input
      expect(() => cache.setMaxSize('100')).toThrow();
    });

    test('should validate count parameter in set method', () => {
      const cache = new TokenCache();

      expect(() => cache.set('text', 'model', -1)).toThrow();
      expect(() => cache.set('text', 'model', 'ten' as unknown as number)).toThrow();
    });

    test('should handle empty text or model gracefully', () => {
      const cache = new TokenCache();

      // These should not throw but return undefined
      expect(cache.get('', 'model')).toBeUndefined();
      expect(cache.get('text', '')).toBeUndefined();
      expect(cache.get(null as unknown as string, 'model')).toBeUndefined();

      // These should not throw but do nothing
      expect(() => cache.set('', 'model', 10)).not.toThrow();
      expect(() => cache.set('text', '', 10)).not.toThrow();
      expect(() => cache.set(null as unknown as string, 'model', 10)).not.toThrow();
    });
  });

  // Tokenizer error handling
  describe('Tokenizer Error Handling', () => {
    test('should validate model parameter', () => {
      expect(() => createTokenizer('')).toThrow();
      expect(() => createTokenizer(null as unknown as string)).toThrow();
      expect(() => createTokenizer(undefined as unknown as string)).toThrow();
    });

    test('should handle empty text gracefully in countTokens', () => {
      expect(countTokens('')).toBe(0);
      expect(countTokens(null as unknown as string)).toBe(0);
      expect(countTokens(undefined as unknown as string)).toBe(0);
    });
  });
}); 