import { TokenizerAdapter } from '../types';
import { TokenCache } from './token-cache';

// Define a type for the optional tiktoken module
type TiktokenModule = {
  encoding_for_model: (model: string) => any;
  get_encoding: (encoding: string) => any;
};

/**
 * Tokenizer implementation using the tiktoken library for GPT models
 * and character-based approximation as fallback
 */
export class Tokenizer implements TokenizerAdapter {
  private model: string;
  private cache: TokenCache;
  private tiktokenModule: TiktokenModule | null = null;

  /**
   * Create a new tokenizer
   * @param model Model to use for tokenization ('gpt-3.5-turbo', 'gpt-4', 'claude', etc.)
   */
  constructor(model: string = 'gpt-3.5-turbo') {
    this.model = model;
    this.cache = new TokenCache(1000);

    // Try to load tiktoken if in Node environment
    this.initTiktoken();
  }

  /**
   * Initialize the tiktoken library if possible
   * This is done asynchronously to avoid blocking
   */
  private async initTiktoken(): Promise<void> {
    // Only attempt to load tiktoken in Node environment
    if (typeof window === 'undefined') {
      try {
        // Use dynamic import with type assertion
        const tiktokenImport = await import('tiktoken' /* webpackIgnore: true */);
        this.tiktokenModule = tiktokenImport as unknown as TiktokenModule;
      } catch (error) {
        // Silently fail and use fallback tokenization
        this.tiktokenModule = null;
      }
    }
  }

  /**
   * Get the appropriate encoding for the model
   * @returns Encoding object or null if not available
   */
  private getEncoding(): any {
    if (!this.tiktokenModule) return null;

    try {
      // Map model names to tiktoken encoding
      if (this.model.includes('gpt-4')) {
        return this.tiktokenModule.encoding_for_model('gpt-4');
      } else if (this.model.includes('gpt-3.5')) {
        return this.tiktokenModule.encoding_for_model('gpt-3.5-turbo');
      } else if (this.model.includes('davinci')) {
        return this.tiktokenModule.encoding_for_model('text-davinci-003');
      } else {
        // Default to cl100k_base for newer models
        return this.tiktokenModule.get_encoding('cl100k_base');
      }
    } catch (error) {
      console.warn(`Failed to get encoding for model ${this.model}:`, error);
      return null;
    }
  }

  /**
   * Count tokens using tiktoken library
   * @param text Text to tokenize
   * @returns Token count
   */
  private countWithTiktoken(text: string): number {
    const encoding = this.getEncoding();
    if (!encoding) return this.fallbackTokenCount(text);

    try {
      const tokens = encoding.encode(text);
      return tokens.length;
    } catch (error) {
      console.warn('Error counting tokens with tiktoken:', error);
      return this.fallbackTokenCount(text);
    }
  }

  /**
   * Fallback token counting method based on character and word heuristics
   * @param text Text to count tokens in
   * @returns Approximate token count
   */
  private fallbackTokenCount(text: string): number {
    if (text.trim() === '') return 0;

    // Different models have slightly different tokenization characteristics
    // These are approximations based on empirical observations
    const chars = text.length;
    const words = text.split(/\s+/).length;

    // GPT models tend to use ~4 chars per token on average for English text
    // This varies by language and content type
    let tokensPerChar = 0.25; // 1/4 tokens per character

    if (this.model.includes('claude')) {
      tokensPerChar = 0.27; // Claude models may have slightly different tokenization
    }

    // Special handling for code or technical content which typically has more tokens
    // due to special characters, camelCase, etc.
    if (text.includes('{') && text.includes('}') ||
      text.includes('<') && text.includes('>') ||
      text.includes('function') || text.includes('class ')) {
      tokensPerChar = 0.3; // Technical content needs adjustment
    }

    // Combine character-based estimate with word-based estimate
    // Words in English tend to be 1-2 tokens on average
    const charBasedEstimate = Math.ceil(chars * tokensPerChar);
    const wordBasedEstimate = Math.ceil(words * 1.3);

    // Use the larger of the two estimates to avoid underestimating
    return Math.max(charBasedEstimate, wordBasedEstimate, 1);
  }

  /**
   * Count tokens in text
   * @param text Text to count tokens in
   * @returns Token count
   */
  countTokens(text: string): number {
    // Check cache first
    const cachedCount = this.cache.get(text, this.model);
    if (cachedCount !== undefined) {
      return cachedCount;
    }

    let tokens: number;

    // Use tiktoken if available
    if (this.tiktokenModule) {
      tokens = this.countWithTiktoken(text);
    } else {
      tokens = this.fallbackTokenCount(text);
    }

    // Store in cache
    this.cache.set(text, this.model, tokens);

    return tokens;
  }

  /**
   * Get the model name
   * @returns Model name
   */
  getModel(): string {
    return this.model;
  }
} 