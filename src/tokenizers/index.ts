import { TokenizerAdapter, SupportedModel } from '../types';
import { OpenAITokenizer } from './openai-tokenizer';
import { SimpleTokenizer } from './simple-tokenizer';
import { ClaudeTokenizer } from './claude-tokenizer';
import { TokenCache } from '../utils/token-cache';

// Global token cache to improve performance
const tokenCache = new TokenCache(2000);

/**
 * Create a tokenizer for the specified model with built-in caching
 * 
 * This factory function returns the appropriate tokenizer for a given model:
 * - OpenAI models use the OpenAI tokenizer (with tiktoken if available)
 * - Claude models use the Claude tokenizer
 * - Other models use appropriate tokenizers or fallbacks
 * 
 * The returned tokenizer instance is cached for future reuse to improve performance.
 * 
 * @param model - Model to create tokenizer for
 * @returns Tokenizer adapter for the specified model
 * @throws {Error} If the model is invalid or tokenizer creation fails
 * 
 * @example
 * ```typescript
 * const tokenizer = createTokenizer('gpt-4');
 * const tokenCount = tokenizer.countTokens('Hello, world!');
 * console.log(`Token count: ${tokenCount}`);
 * ```
 */
export function createTokenizer(model: SupportedModel): TokenizerAdapter {
  // Validate input
  if (!model || typeof model !== 'string') {
    throw new Error('Model name must be a non-empty string');
  }

  // Normalize model name to lowercase for consistency
  const normalizedModel = model.toLowerCase();

  // OpenAI GPT models
  if (normalizedModel.startsWith('gpt-') ||
    normalizedModel.includes('davinci') ||
    normalizedModel.includes('curie') ||
    normalizedModel.includes('babbage') ||
    normalizedModel.includes('ada') ||
    normalizedModel.includes('embedding')) {
    return new OpenAITokenizer(normalizedModel);
  }

  // Anthropic Claude models
  if (normalizedModel.startsWith('claude-')) {
    // Use the dedicated Claude tokenizer implementation
    return new ClaudeTokenizer(normalizedModel);
  }

  // Google models
  if (normalizedModel.startsWith('gemini-') ||
    normalizedModel.startsWith('palm-') ||
    normalizedModel.startsWith('bison-')) {
    // Using OpenAI tokenizer as a reasonable approximation
    return new OpenAITokenizer('gpt-3.5-turbo');
  }

  // Mistral models
  if (normalizedModel.startsWith('mistral-') ||
    normalizedModel.startsWith('mixtral-')) {
    return new OpenAITokenizer('gpt-3.5-turbo'); // Similar tokenization to GPT models
  }

  // Llama models
  if (normalizedModel.startsWith('llama-') ||
    normalizedModel.includes('llama2')) {
    return new OpenAITokenizer('gpt-3.5-turbo'); // Reasonable approximation
  }

  // Default to simple tokenizer for any other model
  console.warn(`Unknown model "${model}", using simple tokenizer as fallback`);
  return new SimpleTokenizer(model);
}

/**
 * Count tokens in text for a specific model with caching
 * 
 * This is a convenience function that creates a tokenizer and counts tokens
 * while using a cache to avoid repeat tokenizations of the same text.
 * 
 * @param text - Text to count tokens in
 * @param model - Model to use for tokenization (defaults to GPT-3.5-Turbo)
 * @returns Token count for the text
 * @throws {Error} If tokenization fails
 */
export function countTokens(text: string, model: SupportedModel = 'gpt-3.5-turbo'): number {
  if (!text) return 0;

  // Check cache first
  const cachedCount = tokenCache.get(text, model);
  if (cachedCount !== undefined) {
    return cachedCount;
  }

  // Create tokenizer and count tokens
  const tokenizer = createTokenizer(model);
  const count = tokenizer.countTokens(text);

  // Cache the result
  tokenCache.set(text, model, count);

  return count;
}

export * from './openai-tokenizer';
export * from './simple-tokenizer';
export * from './claude-tokenizer'; 