import { BaseTokenizer } from './base-tokenizer';
import { SupportedModel } from '../types';

/**
 * Tokenizer adapter for Anthropic Claude models
 * 
 * Note: This is a simpler approximation as Anthropic doesn't provide
 * an official tokenizer library. For production use, it's recommended
 * to use Anthropic's API for accurate token counts.
 */
export class ClaudeTokenizer extends BaseTokenizer {
  private encodingCache: Map<string, string[]> = new Map();
  private isClaude3Model: boolean;

  /**
   * Create a new Claude tokenizer
   * @param modelName The model name (e.g., 'claude-3-opus-20240229')
   */
  constructor(modelName: SupportedModel) {
    super(modelName);

    // Check if this is a Claude 3 model which uses slightly different tokenization
    this.isClaude3Model = modelName.toLowerCase().includes('claude-3') ||
      modelName.toLowerCase().includes('claude-3.5') ||
      modelName.toLowerCase().includes('claude-3.7');
  }

  /**
   * Count the number of tokens in a text
   * 
   * This is an approximation based on Claude's tokenization rules
   */
  countTokens(text: string): number {
    if (!text) return 0;

    // Claude uses approximately 4 characters per token for English text
    // Claude 3 models are closer to OpenAI's tokenization (cl100k_base)
    const tokens = this.tokenize(text);
    return tokens.length;
  }

  /**
   * Tokenize text into an array of tokens
   * 
   * Simplified approximation for Claude tokenization
   */
  tokenize(text: string): string[] {
    if (!text) return [];

    // Check cache first
    const cached = this.encodingCache.get(text);
    if (cached) {
      return cached;
    }

    // Split on regex approximating Claude's tokenization
    // This is a simplified approach that works for estimation purposes
    const tokens = [];

    // Claude 3, 3.5, and 3.7 models use a tokenization more similar to GPT-4
    // with better handling of non-English characters and more efficient tokenization
    if (this.isClaude3Model) {
      // Split on whitespace boundaries and punctuation with better handling of code
      const words = text.split(/(\s+|[.,!?;:(){}[\]<>]|\/\/|#|==|=>|<=|!=|===|!==|&&|\|\|)/g)
        .filter(w => w.length > 0);

      for (const word of words) {
        if (word.length <= 5) {
          // Short words typically become one token
          tokens.push(word);
        } else if (/^[a-zA-Z]+$/.test(word)) {
          // For English words, we can more aggressively split
          let remainingWord = word;
          while (remainingWord.length > 0) {
            const tokenSize = Math.min(5, remainingWord.length);
            tokens.push(remainingWord.substring(0, tokenSize));
            remainingWord = remainingWord.substring(tokenSize);
          }
        } else {
          // For code, URLs, and non-English text, be more conservative
          let remainingWord = word;
          while (remainingWord.length > 0) {
            const tokenSize = Math.min(3, remainingWord.length);
            tokens.push(remainingWord.substring(0, tokenSize));
            remainingWord = remainingWord.substring(tokenSize);
          }
        }
      }
    } else {
      // Original Claude tokenization (Claude 1, 2, etc.)
      // Split on whitespace boundaries and punctuation
      const words = text.split(/(\s+|[.,!?;:()])/g).filter(w => w.length > 0);

      for (const word of words) {
        if (word.length <= 4) {
          // Short words typically become one token
          tokens.push(word);
        } else {
          // Longer words get split roughly every 4 characters
          // This is a simplification but works for estimation
          let remainingWord = word;
          while (remainingWord.length > 0) {
            const tokenSize = Math.min(4, remainingWord.length);
            tokens.push(remainingWord.substring(0, tokenSize));
            remainingWord = remainingWord.substring(tokenSize);
          }
        }
      }
    }

    this.encodingCache.set(text, tokens);
    return tokens;
  }

  /**
   * Convert tokens back to text
   */
  detokenize(tokens: string[]): string {
    if (!tokens || tokens.length === 0) return '';
    return tokens.join('');
  }

  /**
   * Clear the encoding cache
   */
  clearCache(): void {
    this.encodingCache.clear();
  }
} 