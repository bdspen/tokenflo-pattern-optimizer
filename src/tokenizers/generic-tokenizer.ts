import { BaseTokenizer } from './base-tokenizer';

/**
 * Generic tokenizer that provides a fallback tokenization strategy
 * for models without specific implementations
 */
export class GenericTokenizer extends BaseTokenizer {
  private encodingCache: Map<string, string[]> = new Map();

  /**
   * Create a new generic tokenizer
   * @param modelName The model name
   */
  constructor(modelName: string = 'generic') {
    super(modelName);
  }

  /**
   * Count the number of tokens in a text
   * Uses a simplified token counting approach
   */
  countTokens(text: string): number {
    if (!text) return 0;

    return this.tokenize(text).length;
  }

  /**
   * Tokenize text into an array of tokens
   * Simplified approach that works for estimation purposes
   */
  tokenize(text: string): string[] {
    if (!text) return [];

    // Check cache first
    const cached = this.encodingCache.get(text);
    if (cached) {
      return cached;
    }

    // Generic tokenization rules
    // 1. Split on whitespace
    // 2. Split on punctuation
    // 3. Split words longer than 7 characters
    // This is a simplified approach for estimation

    const tokens: string[] = [];

    // Step 1: Split on whitespace and punctuation
    const chunks = text.split(/(\s+|[.,!?;:()"'{}[\]<>])/g).filter(c => c.length > 0);

    // Step 2: Process each chunk
    for (const chunk of chunks) {
      if (chunk.length <= 7) {
        // Short chunks typically become one token
        tokens.push(chunk);
      } else {
        // Longer chunks get split
        // We use a simple approach of ~4 chars per token
        let remaining = chunk;
        while (remaining.length > 0) {
          const segmentSize = Math.min(4, remaining.length);
          tokens.push(remaining.substring(0, segmentSize));
          remaining = remaining.substring(segmentSize);
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