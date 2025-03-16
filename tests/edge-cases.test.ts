import {
  createTokenizer,
  countTokens,
  OpenAITokenizer,
  SimpleTokenizer
} from '../src/tokenizers';
import {
  PatternOptimizer,
  DualOptimizer,
  OptimizerError
} from '../src/optimizers';
import { PromptOptimizer } from '../src/index';
import { OptimizationPattern } from '../src/types';

describe('Edge Cases', () => {
  // Empty inputs
  describe('Empty and Null Inputs', () => {
    test('tokenizers should handle empty inputs', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      expect(tokenizer.countTokens('')).toBe(0);

      // Utility function should handle empty inputs
      expect(countTokens('')).toBe(0);
    });

    test('optimizers should handle empty inputs', () => {
      const patternOptimizer = new PatternOptimizer();
      const dualOptimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: 0.5,
        model: 'gpt-3.5-turbo'
      });
      const promptOptimizer = new PromptOptimizer();

      // Empty string
      expect(patternOptimizer.optimize('')).toEqual(expect.objectContaining({
        originalText: '',
        optimizedText: '',
        originalTokenCount: 0,
        optimizedTokenCount: 0,
        tokensSaved: 0
      }));

      expect(dualOptimizer.optimize('')).toEqual(expect.objectContaining({
        originalText: '',
        optimizedText: '',
        originalTokenCount: 0,
        optimizedTokenCount: 0,
        tokensSaved: 0
      }));

      expect(promptOptimizer.optimize('')).toEqual(expect.objectContaining({
        originalText: '',
        optimizedText: '',
        originalTokenCount: 0,
        optimizedTokenCount: 0,
        tokensSaved: 0
      }));
    });

    test('optimizers should reject null/undefined inputs', () => {
      const optimizer = new PatternOptimizer();

      // @ts-ignore - Testing invalid input
      expect(() => optimizer.optimize(null)).toThrow(OptimizerError);
      // @ts-ignore - Testing invalid input
      expect(() => optimizer.optimize(undefined)).toThrow(OptimizerError);
    });
  });

  // Whitespace-only inputs
  describe('Whitespace-Only Inputs', () => {
    test('tokenizers should handle whitespace-only inputs', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      expect(tokenizer.countTokens(' ')).toBe(1);
      expect(tokenizer.countTokens('   \n   \t   ')).toBeGreaterThan(0);
    });

    test('optimizers should handle whitespace-only inputs', () => {
      const optimizer = new PatternOptimizer();
      const whitespaceOnly = '   \n   \t   ';

      const result = optimizer.optimize(whitespaceOnly);
      expect(result.originalText).toBe(whitespaceOnly);
      // May or may not be modified depending on patterns
    });
  });

  // Extremely long inputs
  describe('Extremely Long Inputs', () => {
    test('tokenizers should handle very long text', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      const longText = 'a'.repeat(100000);

      // Should not throw and return a reasonable number
      const count = tokenizer.countTokens(longText);
      expect(count).toBeGreaterThan(1000);
    });

    test('optimizers should handle very long text', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'replace-a',
          category: 'test',
          description: 'Replace letter a with b',
          find: /a/g,
          replace: 'b'
        }
      ]);

      const longText = 'a'.repeat(10000);

      // Should not throw and successfully optimize
      const result = optimizer.optimize(longText);
      expect(result.optimizedText).toBe('b'.repeat(10000));
    });
  });

  // Non-English characters
  describe('Non-English Characters', () => {
    test('tokenizers should handle non-English text', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');

      // Unicode characters in various languages
      const chineseText = '你好，世界！'; // Chinese
      const arabicText = 'مرحبا بالعالم'; // Arabic
      const russianText = 'Привет, мир!'; // Russian
      const emojiText = '👋🌍🚀'; // Emojis

      // Should handle these without throwing
      expect(tokenizer.countTokens(chineseText)).toBeGreaterThan(0);
      expect(tokenizer.countTokens(arabicText)).toBeGreaterThan(0);
      expect(tokenizer.countTokens(russianText)).toBeGreaterThan(0);
      expect(tokenizer.countTokens(emojiText)).toBeGreaterThan(0);
    });

    test('optimizers should handle non-English text', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'replace-greeting',
          category: 'test',
          description: 'Replace greeting with simplified',
          find: /(你好|こんにちは|안녕하세요|Привет|مرحبا)/g,
          replace: 'Hi'
        }
      ]);

      const mixedText = '你好，こんにちは, 안녕하세요, Привет, مرحبا!';

      // Should not throw and correctly apply the pattern
      const result = optimizer.optimize(mixedText);
      expect(result.optimizedText).toBe('Hi，Hi, Hi, Hi, Hi!');
    });
  });

  // HTML and markdown
  describe('HTML and Markdown Content', () => {
    test('tokenizers should count HTML content correctly', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      const htmlContent = '<div class="container"><h1>Hello World</h1><p>This is a <strong>test</strong>.</p></div>';

      // Special characters like <, >, / are usually separate tokens
      const count = tokenizer.countTokens(htmlContent);
      expect(count).toBeGreaterThan(htmlContent.split(' ').length);
    });

    test('optimizers should handle HTML and markdown', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'simplify-html-tags',
          category: 'technical',
          description: 'Simplify HTML tags',
          find: /<\/?[a-z][^>]*>/gi,
          replace: '' // Remove HTML tags
        }
      ]);

      const htmlContent = '<div><h1>Title</h1><p>Paragraph <em>with</em> formatting</p></div>';
      const markdownContent = '# Title\n\n**Bold text** and *italic text*';

      // Should not throw and process HTML
      const htmlResult = optimizer.optimize(htmlContent);
      expect(htmlResult.optimizedText).toBe('TitleParagraph with formatting');

      // Should handle markdown without issues (may or may not modify it)
      expect(() => optimizer.optimize(markdownContent)).not.toThrow();
    });
  });

  // Special characters
  describe('Special Characters', () => {
    test('tokenizers should handle special characters', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      const specialChars = '!@#$%^&*()_+-=[]{};:\'",.<>/?\\|`~';

      // Should not throw
      expect(() => tokenizer.countTokens(specialChars)).not.toThrow();
    });

    test('optimizers should handle special regex characters in text', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'simplify-punctuation',
          category: 'formatting',
          description: 'Simplify punctuation',
          find: /[.]{2,}/g,
          replace: '.'
        }
      ]);

      const textWithRegexChars = 'This text has regex special chars: (a+b)* and [a-z]+ and a{1,3}';
      const textWithManyDots = 'This has too many dots.........';

      // Should not throw with text containing regex metacharacters
      expect(() => optimizer.optimize(textWithRegexChars)).not.toThrow();

      // Should correctly optimize the dots
      const result = optimizer.optimize(textWithManyDots);
      expect(result.optimizedText).toBe('This has too many dots.');
    });
  });

  // Code content
  describe('Code Content', () => {
    test('tokenizers should handle code content', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      const codeSnippet = `
        function calculateSum(a, b) {
          return a + b;
        }
        
        const result = calculateSum(5, 10);
        console.log(result);
      `;

      // Should not throw and return a reasonable count
      expect(tokenizer.countTokens(codeSnippet)).toBeGreaterThan(10);
    });

    test('optimizers should handle code content', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'simplify-comments',
          category: 'technical',
          description: 'Simplify comments',
          find: /\/\/.*$/gm,
          replace: '' // Remove single-line comments
        }
      ]);

      const codeWithComments = `
        function hello() {
          // This is a comment
          console.log('Hello'); // End of line comment
        }
      `;

      // Should not throw and remove comments
      const result = optimizer.optimize(codeWithComments);
      expect(result.optimizedText).not.toContain('This is a comment');
    });
  });

  // Mixed line endings
  describe('Mixed Line Endings', () => {
    test('tokenizers should handle mixed line endings', () => {
      const tokenizer = createTokenizer('gpt-3.5-turbo');
      const mixedEndings = 'Line 1\nLine 2\r\nLine 3\rLine 4';

      // Should not throw
      expect(() => tokenizer.countTokens(mixedEndings)).not.toThrow();
    });

    test('optimizers should handle mixed line endings', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'normalize-newlines',
          category: 'formatting',
          description: 'Normalize newlines',
          find: /\r\n|\r/g,
          replace: '\n'
        }
      ]);

      const mixedEndings = 'Line 1\nLine 2\r\nLine 3\rLine 4';

      // Should not throw and normalize line endings
      const result = optimizer.optimize(mixedEndings);
      expect(result.optimizedText).toBe('Line 1\nLine 2\nLine 3\nLine 4');
    });
  });

  // Edge cases in patterns
  describe('Pattern Edge Cases', () => {
    test('should handle zero-width patterns', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'zero-width-pattern',
          category: 'test',
          description: 'Insert at start of line',
          find: /^/gm, // Zero-width match at start of line
          replace: '> '
        }
      ]);

      const text = 'Line 1\nLine 2\nLine 3';

      // Should add > at the start of each line
      const result = optimizer.optimize(text);
      expect(result.optimizedText).toBe('> Line 1\n> Line 2\n> Line 3');
    });

    test('should handle patterns that produce more tokens', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'expand-pattern',
          category: 'test',
          description: 'Replace with longer text',
          find: /\b(\w+)\b/g,
          replace: '($1)'
        }
      ]);

      const text = 'This is a test';

      // Should wrap each word in parentheses
      const result = optimizer.optimize(text);
      expect(result.optimizedText).toBe('(This) (is) (a) (test)');

      // Token count should be higher, but the optimizer should handle it
      expect(result.optimizedTokenCount).toBeGreaterThan(result.originalTokenCount);
      expect(result.tokensSaved).toBeLessThan(0); // Negative savings
    });

    test('should handle overlapping patterns', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'pattern1',
          category: 'test',
          description: 'First pattern',
          find: /test 1/g,
          replace: 'TEST 1'
        },
        {
          id: 'pattern2',
          category: 'test',
          description: 'Second pattern',
          find: /1 2/g,
          replace: 'ONE TWO'
        }
      ]);

      const text = 'This is test 1 2 3';

      // Should apply both patterns
      const result = optimizer.optimize(text);
      expect(result.optimizedText).toBe('This is TEST ONE TWO 3');
    });

    test('should handle recursive pattern applications', () => {
      const optimizer = new PatternOptimizer([
        {
          id: 'recursive-pattern',
          category: 'test',
          description: 'Replace a with b, potentially recursively',
          find: /a/g,
          replace: 'ba'
        }
      ]);

      // This could cause infinite recursion if not handled properly
      // because the replacement introduces a new match for the pattern
      const text = 'a';

      // Should not hang and complete optimization
      const result = optimizer.optimize(text);
      // The result will depend on how the library handles recursive patterns
      // At minimum it should not hang or throw
      expect(result.optimizedText).toBeDefined();
    });
  });

  // DualOptimizer specific edge cases
  describe('DualOptimizer Edge Cases', () => {
    test('should handle extreme balance values', () => {
      // Create optimizer with extreme balance values
      const noQualityOptimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: 0, // Max efficiency
        model: 'gpt-3.5-turbo'
      });

      const maxQualityOptimizer = new DualOptimizer({
        qualityVsEfficiencyBalance: 1, // Max quality
        model: 'gpt-3.5-turbo'
      });

      const text = 'Test text for optimizing';

      // Both should produce valid results
      const noQualityResult = noQualityOptimizer.optimize(text);
      const maxQualityResult = maxQualityOptimizer.optimize(text);

      expect(noQualityResult.originalText).toBe(text);
      expect(maxQualityResult.originalText).toBe(text);

      // Balance should be correctly reported
      expect(noQualityResult.qualityVsEfficiencyBalance).toBe(0);
      expect(maxQualityResult.qualityVsEfficiencyBalance).toBe(1);
    });
  });

  // Unusual model names
  describe('Unusual Model Names', () => {
    test('should handle unusual but valid model names', () => {
      // These should not throw but use appropriate fallbacks
      expect(() => createTokenizer('custom-model-v1')).not.toThrow();
      expect(() => createTokenizer('nonexistent-llm')).not.toThrow();

      // Should return a valid tokenizer
      const tokenizer = createTokenizer('unusual-model-name');
      expect(tokenizer.countTokens('test')).toBeGreaterThan(0);
    });
  });
}); 