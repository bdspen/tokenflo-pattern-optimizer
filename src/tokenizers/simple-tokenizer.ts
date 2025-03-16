import { TokenizerAdapter, SupportedModel } from '../types';

/**
 * Simple tokenizer for fallback when more accurate tokenizers are not available
 * Uses a heuristic-based approximation based on text characteristics
 */
export class SimpleTokenizer implements TokenizerAdapter {
  private model: SupportedModel;

  /**
   * Create a new simple tokenizer
   * @param model Model to tokenize for (used for reference only)
   */
  constructor(model: SupportedModel) {
    this.model = model;
  }

  /**
   * Count tokens in text using a heuristic-based approximation
   * 
   * This is an improved approximation that accounts for:
   * - Different languages (ASCII vs non-ASCII content)
   * - Code vs natural language
   * - Special characters and whitespace
   * 
   * While not as accurate as model-specific tokenizers, it provides a reasonable
   * estimate when those are not available.
   * 
   * @param text Text to count tokens in
   * @returns Approximate token count
   */
  countTokens(text: string): number {
    if (!text || typeof text !== 'string') return 0;

    // Check if text is mostly code or natural language
    const isCode = this.isProbablyCode(text);
    
    // Check if text contains mostly ASCII or non-ASCII (different languages)
    const nonAsciiRatio = this.getNonAsciiRatio(text);
    
    // Count tokens based on text characteristics
    let tokenCount: number;
    
    if (isCode) {
      // Code tends to tokenize differently than natural language
      // More special characters and distinct spacing patterns
      const codeCharRatio = 4.5; // Assume ~4.5 chars per token for code
      tokenCount = Math.ceil(text.length / codeCharRatio);
      
      // Add tokens for newlines in code, as they're often separate tokens
      const newlineCount = (text.match(/\n/g) || []).length;
      tokenCount += newlineCount * 0.5; // Newlines often contribute to token count
    } else if (nonAsciiRatio > 0.2) {
      // Non-English text (e.g., Chinese, Japanese, Korean) often has
      // fewer characters per token
      const nonEnglishCharRatio = 2; // ~2 chars per token for non-English
      tokenCount = Math.ceil(text.length / nonEnglishCharRatio);
    } else {
      // For typical English text:
      // Combine word-based and character-based counts
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const charCount = text.length / 4; // ~4 chars per token for English
      
      // Special character adjustment - many special chars are separate tokens
      const specialCharCount = (text.match(/[^\w\s]/g) || []).length;
      
      // Combine the measures with weightings
      tokenCount = Math.ceil(
        (charCount * 0.5) + 
        (wordCount * 0.5) + 
        (specialCharCount * 0.3)
      );
    }
    
    // Add a small base amount to account for short messages
    return Math.max(1, Math.ceil(tokenCount));
  }

  /**
   * Get the model name
   * @returns Model name
   */
  getModel(): string {
    return this.model;
  }
  
  /**
   * Check if text is probably code rather than natural language
   * @param text Text to analyze
   * @returns True if the text is likely code
   * @private
   */
  private isProbablyCode(text: string): boolean {
    // Code tends to have:
    // - More special symbols ({, }, (), [], ;, etc.)
    // - More indentation patterns
    // - Specific keywords

    // Check for code indicators
    const codeIndicators = [
      // Common programming syntax
      /[{}[\]()<>:;]/.test(text),
      // Common programming keywords (sample)
      /\b(function|return|if|else|for|while|var|let|const|import|class)\b/.test(text),
      // Indentation patterns
      /^[ \t]+\S/m.test(text),
      // Comment patterns
      /\/\/|\/\*|\*\/|#include|#define/.test(text)
    ];
    
    // If more than 2 indicators match, likely code
    return codeIndicators.filter(Boolean).length >= 2;
  }
  
  /**
   * Calculate the ratio of non-ASCII characters in the text
   * @param text Text to analyze
   * @returns Ratio of non-ASCII characters (0-1)
   * @private
   */
  private getNonAsciiRatio(text: string): number {
    if (!text || text.length === 0) return 0;
    
    let nonAsciiCount = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 127) {
        nonAsciiCount++;
      }
    }
    
    return nonAsciiCount / text.length;
  }
} 