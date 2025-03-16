import { TokenizerAdapter, SupportedModel } from '../types';
import { encode, decode } from 'gpt-tokenizer';
import { isBrowser } from '../utils/environment';

// Optional import of tiktoken - may not be available in all environments
let tiktoken: any = null;
if (!isBrowser) {
  try {
    tiktoken = require('tiktoken');
  } catch (error) {
    // tiktoken not available - will fall back to gpt-tokenizer
    console.warn('Tiktoken not available, using gpt-tokenizer instead');
  }
}

/**
 * Map of models to encoding names for tiktoken
 */
const MODEL_TO_ENCODING: Record<string, string> = {
  'gpt-3.5-turbo': 'cl100k_base',
  'gpt-3.5-turbo-16k': 'cl100k_base',
  'gpt-4': 'cl100k_base',
  'gpt-4-32k': 'cl100k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-4o': 'cl100k_base',
  'gpt-4o-mini': 'cl100k_base',
  'gpt-4-turbo-preview': 'cl100k_base',
  'gpt-4-vision-preview': 'cl100k_base',
  'text-davinci-003': 'p50k_base',
  'text-embedding-ada-002': 'cl100k_base'
};

/**
 * Tokenizer for OpenAI models using tiktoken when available with fallback to gpt-tokenizer
 */
export class OpenAITokenizer implements TokenizerAdapter {
  private model: SupportedModel;
  private encoding: any | null = null;
  private usesTiktoken = false;

  /**
   * Create a new OpenAI tokenizer
   * @param model Model to tokenize for
   * @throws {Error} If the model is not supported and tiktoken is available
   */
  constructor(model: SupportedModel) {
    this.model = model;

    // Try to initialize tiktoken encoding
    if (tiktoken) {
      try {
        // Get encoding name for the model
        const encodingName = this.getEncodingName(model);
        this.encoding = tiktoken.get_encoding(encodingName);
        this.usesTiktoken = true;
      } catch (error) {
        console.warn(`Could not initialize tiktoken for model ${model}: ${error}`);
        // Will fall back to gpt-tokenizer
        this.encoding = null;
      }
    }
  }

  /**
   * Count tokens in text using tiktoken when available, with fallback to gpt-tokenizer
   * @param text Text to count tokens in
   * @returns Token count
   * @throws {Error} If tokenization fails
   */
  countTokens(text: string): number {
    if (!text) return 0;

    // Use tiktoken if available
    if (this.usesTiktoken && this.encoding) {
      try {
        const tokens = this.encoding.encode(text);
        return tokens.length;
      } catch (error) {
        console.warn(`Tiktoken encoding failed, falling back to gpt-tokenizer: ${error}`);
        // Fall back to gpt-tokenizer
      }
    }

    // Fall back to gpt-tokenizer
    try {
      return encode(text).length;
    } catch (error) {
      throw new Error(`Token counting failed: ${error}`);
    }
  }

  /**
   * Get the model name
   * @returns Model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Check if the tokenizer is using tiktoken
   * @returns True if using tiktoken, false if using gpt-tokenizer
   */
  isUsingTiktoken(): boolean {
    return this.usesTiktoken;
  }

  /**
   * Get the encoding name for a model
   * @param model Model to get encoding for
   * @returns Encoding name for tiktoken
   * @private
   */
  private getEncodingName(model: string): string {
    // Look up exact model match
    if (model in MODEL_TO_ENCODING) {
      return MODEL_TO_ENCODING[model];
    }

    // Check for model family matches
    if (model.startsWith('gpt-3.5-turbo')) {
      return 'cl100k_base';
    }

    if (model.startsWith('gpt-4')) {
      return 'cl100k_base';
    }

    if (model.startsWith('text-embedding-')) {
      return 'cl100k_base';
    }

    if (model.startsWith('text-davinci-')) {
      return 'p50k_base';
    }

    // Default to cl100k_base for newer models
    return 'cl100k_base';
  }
}
