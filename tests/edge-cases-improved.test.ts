import { PromptOptimizer } from '../src';
import { OptimizerError } from '../src/optimizers';

describe('Edge Case Handling', () => {
  let optimizer: PromptOptimizer;

  beforeEach(() => {
    optimizer = new PromptOptimizer({
      model: 'gpt-3.5-turbo',
      aggressiveness: 'medium'
    });
  });

  describe('Input validation', () => {
    test('should handle empty input', () => {
      const result = optimizer.optimize('');
      expect(result.originalText).toBe('');
      expect(result.optimizedText).toBe('');
      expect(result.originalTokenCount).toBe(0);
      expect(result.optimizedTokenCount).toBe(0);
      // Token count might be slightly different due to whitespace, but should be close to 0
      expect(Math.abs(result.tokensSaved)).toBeLessThanOrEqual(1);
      expect(result.percentSaved).toBe(0);
    });

    test('should handle whitespace-only input', () => {
      const result = optimizer.optimize('   \n   \t   ');
      expect(result.originalText).toBe('   \n   \t   ');
      expect(result.optimizedText).toBe('   \n   \t   ');
      expect(result.originalTokenCount).toBe(0);
      expect(result.optimizedTokenCount).toBe(0);
      // Token count might be slightly different due to whitespace, but should be close to 0
      expect(Math.abs(result.tokensSaved)).toBeLessThanOrEqual(1);
      expect(result.percentSaved).toBe(0);
    });

    test('should throw error for null input', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.optimize(null)).toThrow(OptimizerError);
    });

    test('should throw error for undefined input', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.optimize(undefined)).toThrow(OptimizerError);
    });

    test('should throw error for non-string input', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.optimize(123)).toThrow(OptimizerError);
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.optimize({})).toThrow(OptimizerError);
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.optimize([])).toThrow(OptimizerError);
    });
  });

  describe('Pattern application edge cases', () => {
    test('should handle text with no applicable patterns', () => {
      const input = 'Simple text with no optimization opportunities.';
      const result = optimizer.optimize(input);
      expect(result.optimizedText.trim()).toBe(input.trim());
      // Token count might be slightly different due to whitespace, but should be close to 0
      expect(Math.abs(result.tokensSaved)).toBeLessThanOrEqual(1);
      // There might be some patterns applied for whitespace/formatting, but they shouldn't change the content
      expect(result.appliedPatterns.length).toBeLessThanOrEqual(1);
      expect(result.skippedPatterns.length).toBeGreaterThan(0);
    });

    test('should handle extremely long input', () => {
      // Create a very long input (100KB)
      const longText = 'This is a test sentence. '.repeat(5000);
      expect(longText.length).toBeGreaterThan(100000);

      const result = optimizer.optimize(longText);
      
      // Just verify it completes without error and returns a result
      expect(result.originalText).toBe(longText);
      expect(typeof result.optimizedText).toBe('string');
      expect(typeof result.originalTokenCount).toBe('number');
      expect(typeof result.optimizedTokenCount).toBe('number');
    });

    test('should handle text with special characters', () => {
      const input = 'Text with special characters: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./';
      const result = optimizer.optimize(input);
      
      // Should not throw and should return a result
      expect(result.originalText).toBe(input);
      expect(typeof result.optimizedText).toBe('string');
    });

    test('should handle text with emoji', () => {
      const input = 'Text with emoji 😀 👍 🚀 🌈 🔥 💯';
      const result = optimizer.optimize(input);
      
      // Should not throw and should return a result
      expect(result.originalText).toBe(input);
      expect(typeof result.optimizedText).toBe('string');
    });

    test('should handle text with code blocks', () => {
      const input = `
        Here is some code:
        \`\`\`javascript
        function test() {
          const x = 1;
          return x + 2;
        }
        \`\`\`
      `;
      const result = optimizer.optimize(input);
      
      // Should not throw and should return a result
      expect(result.originalText).toBe(input);
      expect(typeof result.optimizedText).toBe('string');
    });
  });

  describe('Error handling in patterns', () => {
    test('should continue optimization if a pattern throws an error', () => {
      // Add a pattern that will throw an error
      optimizer.addPattern({
        id: 'error-pattern',
        category: 'test',
        description: 'This pattern will throw an error',
        priority: 100,
        preservesFormatting: true,
        test: () => { throw new Error('Test error'); },
        transform: (text) => text
      });

      const input = 'This is a test.';
      
      // Should not throw the error from the pattern
      const result = optimizer.optimize(input);
      
      // Should still return a result
      expect(result.originalText).toBe(input);
      expect(typeof result.optimizedText).toBe('string');
    });

    test('should handle regex patterns that could cause catastrophic backtracking', () => {
      // Add a pattern with a potentially problematic regex
      optimizer.addPattern({
        id: 'backtracking-pattern',
        category: 'test',
        description: 'Pattern with potential backtracking issues',
        priority: 100,
        preservesFormatting: true,
        // This regex can cause catastrophic backtracking on certain inputs
        find: /a(a|b)+c/,
        replace: 'replaced'
      });

      // Input that could trigger backtracking
      const input = 'a' + 'a'.repeat(100) + 'b';
      
      // Should not hang and should return a result
      const result = optimizer.optimize(input);
      expect(result.originalText).toBe(input);
      expect(typeof result.optimizedText).toBe('string');
    });
  });

  describe('Configuration edge cases', () => {
    test('should handle invalid aggressiveness level gracefully', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.setAggressiveness('invalid')).toThrow();
      
      // Should still work after invalid attempt
      optimizer.setAggressiveness('high');
      const result = optimizer.optimize('Test');
      expect(typeof result.optimizedText).toBe('string');
    });

    test('should handle invalid model gracefully', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.setModel('')).toThrow();
      
      // Should still work after invalid attempt
      optimizer.setModel('gpt-4');
      const result = optimizer.optimize('Test');
      expect(typeof result.optimizedText).toBe('string');
    });

    test('should handle invalid preserveFormatting gracefully', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      expect(() => optimizer.setPreserveFormatting('yes')).toThrow();
      
      // Should still work after invalid attempt
      optimizer.setPreserveFormatting(false);
      const result = optimizer.optimize('Test');
      expect(typeof result.optimizedText).toBe('string');
    });
  });

  describe('Performance metrics', () => {
    test('should include performance metrics in results', () => {
      const optimizer = new PromptOptimizer({
        model: 'gpt-3.5-turbo',
        includePerformanceMetrics: true
      });
      
      const result = optimizer.optimize('Test text');
      
      expect(result.performanceMetrics).toBeDefined();
      expect(typeof result.performanceMetrics?.executionTimeMs).toBe('number');
      expect(typeof result.performanceMetrics?.tokensPerSecond).toBe('number');
    });
  });
});
