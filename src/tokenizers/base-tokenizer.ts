import { TokenizerAdapter } from '../types';

/**
 * Base class for tokenizer adapters
 */
export abstract class BaseTokenizer implements TokenizerAdapter {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Count the number of tokens in a text
   */
  abstract countTokens(text: string): number;

  /**
   * Tokenize text into an array of tokens
   */
  abstract tokenize(text: string): string[];

  /**
   * Convert tokens back to text
   */
  abstract detokenize(tokens: string[]): string;

  /**
   * Get the model name this tokenizer is for
   */
  getModel(): string {
    return this.modelName;
  }

  /**
   * @deprecated Use getModel() instead for compatibility with TokenizerAdapter
   */
  getModelName(): string {
    return this.modelName;
  }
} 