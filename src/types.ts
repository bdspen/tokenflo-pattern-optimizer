/**
 * Types and interfaces for the static prompt optimizer package
 */

// Import types from dual-optimizer
import { DualOptimizationResult, DualOptimizerConfig } from './optimizers/dual-optimizer';

/**
 * Supported language models for tokenization
 * This helps ensure we only use models that have tokenization support
 */
export type SupportedModel =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-vision-preview'
  | 'claude-instant-1'
  | 'claude-2'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-3-5-sonnet-20240620'
  | 'claude-3-7-sonnet-20240729'
  | 'text-embedding-ada-002'
  | 'text-davinci-003'
  | string; // Allow for custom models, but prefer using the specific ones above

/**
 * Pattern categories supported by the optimizer
 */
export type PatternCategory =
  | 'formatting'
  | 'redundancy'
  | 'verbosity'
  | 'context'
  | 'technical'
  | 'structure'
  | 'custom'
  | string; // Allow for custom categories

/**
 * Aggressiveness levels for optimization
 */
export type AggressivenessLevel = 'low' | 'medium' | 'high';

/**
 * Interface for a tokenizer adapter
 */
export interface TokenizerAdapter {
  /**
   * Count tokens in text
   * @param text Text to count tokens in
   * @returns Token count
   * @throws {Error} If text is invalid or tokenization fails
   */
  countTokens(text: string): number;

  /**
   * Get the model name
   * @returns Model name
   */
  getModel(): string;
}

/**
 * Pattern effectiveness metrics
 * Used to track how well a pattern performs in real-world optimization
 */
export interface PatternEffectivenessMetrics {
  /**
   * Total number of times this pattern has been applied
   */
  timesApplied: number;

  /**
   * Total tokens saved across all applications
   */
  totalTokensSaved: number;

  /**
   * Average tokens saved per application
   */
  avgTokensSaved: number;

  /**
   * Number of times the pattern was skipped
   */
  timesSkipped: number;

  /**
   * Success rate (0-1) of pattern application
   * (timesApplied / (timesApplied + timesSkipped))
   */
  successRate: number;

  /**
   * Last time the pattern was applied (timestamp)
   */
  lastApplied?: number;
}

/**
 * Optimization pattern definition
 */
export interface OptimizationPattern {
  /**
   * Unique identifier for the pattern
   */
  id: string;

  /**
   * Category of the pattern
   */
  category: PatternCategory;

  /**
   * Description of what the pattern does
   */
  description: string;

  /**
   * Example of the pattern in action
   */
  example?: {
    before: string;
    after: string;
  };

  /**
   * Whether the pattern is disabled
   */
  disabled?: boolean;

  /**
   * Whether the pattern preserves formatting
   */
  preservesFormatting?: boolean;

  /**
   * Priority of the pattern (higher = applied first)
   * Defaults to 0 if not specified
   */
  priority?: number;

  /**
   * Effectiveness metrics for this pattern
   * Updated during optimization to track performance
   */
  effectivenessMetrics?: PatternEffectivenessMetrics;

  /**
   * Function to test if the pattern applies to text
   * @param text The text to test
   * @returns true if the pattern should be applied, false otherwise
   */
  test?: (text: string) => boolean;

  /**
   * Function to transform text
   * @param text The text to transform
   * @returns The transformed text
   */
  transform?: (text: string) => string;

  /**
   * Regular expression or string to find
   * Must be provided if transform is not specified
   */
  find?: RegExp | string;

  /**
   * String or function to replace with
   * Must be provided if find is specified
   * For function replacers, the signature follows the JavaScript replace() method's replacer function
   */
  replace?: string | ((substring: string, ...args: any[]) => string);
}

/**
 * Information about an applied pattern with metrics
 */
export interface AppliedPatternInfo {
  /**
   * Pattern ID
   */
  id: string;

  /**
   * Pattern category
   */
  category: PatternCategory;

  /**
   * Pattern description
   */
  description: string;

  /**
   * Pattern priority (if specified)
   */
  priority?: number;

  /**
   * Number of tokens saved by applying this pattern
   */
  tokensSaved?: number;

  /**
   * Net change in tokens (negative means tokens were removed)
   */
  tokenChange?: number;
}

/**
 * Result of optimization
 */
export interface OptimizationResult {
  /**
   * Original text
   */
  originalText: string;

  /**
   * Optimized text
   */
  optimizedText: string;

  /**
   * Original token count
   */
  originalTokenCount: number;

  /**
   * Optimized token count
   */
  optimizedTokenCount: number;

  /**
   * Tokens saved
   */
  tokensSaved: number;

  /**
   * Percent saved (0-100)
   */
  percentSaved: number;

  /**
   * Patterns that were applied, with metrics
   */
  appliedPatterns: AppliedPatternInfo[];

  /**
   * Patterns that were skipped
   */
  skippedPatterns: OptimizationPattern[];

  /**
   * Performance metrics for the optimization
   */
  performanceMetrics?: {
    /**
     * Time taken for the optimization (in ms)
     */
    executionTimeMs: number;

    /**
     * Tokens processed per second
     */
    tokensPerSecond: number;
  };
}

/**
 * Configuration for the optimizer
 */
export interface OptimizerConfig {
  /**
   * Model to use for tokenization
   * @default 'gpt-3.5-turbo'
   */
  model: SupportedModel;

  /**
   * Aggressiveness level
   * - low: Only apply patterns that definitely improve quality
   * - medium: Balance between token efficiency and quality
   * - high: Maximize token efficiency, possibly at the expense of quality
   * @default 'medium'
   */
  aggressiveness: AggressivenessLevel;

  /**
   * Whether to preserve formatting (whitespace, indentation, etc.)
   * @default true
   */
  preserveFormatting: boolean;

  /**
   * Categories to enable
   * Use 'all' to enable all categories
   * @default ['all']
   */
  enabledCategories: Array<PatternCategory | 'all'>;

  /**
   * Custom patterns to add
   * @default []
   */
  customPatterns: OptimizationPattern[];

  /**
   * Whether to track pattern effectiveness metrics
   * @default true
   */
  trackPatternEffectiveness?: boolean;

  /**
   * Whether to include performance metrics in results
   * @default false
   */
  includePerformanceMetrics?: boolean;
}

/**
 * Default configuration for the optimizer
 */
export const DEFAULT_CONFIG: OptimizerConfig = {
  model: 'gpt-3.5-turbo',
  aggressiveness: 'medium',
  preserveFormatting: true,
  enabledCategories: ['all'],
  customPatterns: [],
  trackPatternEffectiveness: true,
  includePerformanceMetrics: false
};

// Re-export types from dual-optimizer
export { DualOptimizationResult, DualOptimizerConfig }; 