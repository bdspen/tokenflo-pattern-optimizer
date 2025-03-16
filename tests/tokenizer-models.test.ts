import { createTokenizer, countTokens } from '../src/tokenizers';
import { OpenAITokenizer } from '../src/tokenizers';
import { ClaudeTokenizer } from '../src/tokenizers';

describe('Tokenizer Model Support', () => {
  describe('OpenAI Latest Models', () => {
    test('supports GPT-4o', () => {
      const tokenizer = createTokenizer('gpt-4o');
      expect(tokenizer).toBeInstanceOf(OpenAITokenizer);
      expect(tokenizer.getModel()).toBe('gpt-4o');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });

    test('supports GPT-4o-mini', () => {
      const tokenizer = createTokenizer('gpt-4o-mini');
      expect(tokenizer).toBeInstanceOf(OpenAITokenizer);
      expect(tokenizer.getModel()).toBe('gpt-4o-mini');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });

    test('supports GPT-4-turbo-preview', () => {
      const tokenizer = createTokenizer('gpt-4-turbo-preview');
      expect(tokenizer).toBeInstanceOf(OpenAITokenizer);
      expect(tokenizer.getModel()).toBe('gpt-4-turbo-preview');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Anthropic Latest Models', () => {
    test('supports Claude 3 Opus', () => {
      const tokenizer = createTokenizer('claude-3-opus-20240229');
      expect(tokenizer).toBeInstanceOf(ClaudeTokenizer);
      expect(tokenizer.getModel()).toBe('claude-3-opus-20240229');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });

    test('supports Claude 3.5 Sonnet', () => {
      const tokenizer = createTokenizer('claude-3-5-sonnet-20240620');
      expect(tokenizer).toBeInstanceOf(ClaudeTokenizer);
      expect(tokenizer.getModel()).toBe('claude-3-5-sonnet-20240620');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });

    test('supports Claude 3.7 Sonnet', () => {
      const tokenizer = createTokenizer('claude-3-7-sonnet-20240729');
      expect(tokenizer).toBeInstanceOf(ClaudeTokenizer);
      expect(tokenizer.getModel()).toBe('claude-3-7-sonnet-20240729');

      const count = tokenizer.countTokens('Hello, world!');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Tokenization Consistency', () => {
    const testText = `
    function calculateTokens() {
      // Test complex code with special characters
      const regex = /[a-z]+/g;
      return "This is a test of tokenization for newer models like GPT-4o and Claude 3.7";
    }
    `;

    test('Claude 3.7 and GPT-4o tokenize similarly', () => {
      const claude37Count = countTokens(testText, 'claude-3-7-sonnet-20240729');
      const gpt4oCount = countTokens(testText, 'gpt-4o');

      // Claude 3.7 and GPT-4o both use similar tokenization to GPT-4
      // Their token counts should be reasonably close
      const difference = Math.abs(claude37Count - gpt4oCount);
      const percentDifference = difference / Math.max(claude37Count, gpt4oCount);

      // Since our Claude tokenizer is an approximation, we expect some difference,
      // but the counts should be within a reasonable range for estimation purposes
      expect(percentDifference).toBeLessThan(0.5);
      console.log(`Tokenization difference: Claude 3.7 (${claude37Count}) vs GPT-4o (${gpt4oCount})`);
    });
  });
}); 