import { PatternOptimizer, DualOptimizer, OptimizerError } from './optimizers';
import {
  DEFAULT_CONFIG,
  OptimizerConfig,
  OptimizationPattern,
  OptimizationResult,
  SupportedModel,
  PatternCategory,
  AppliedPatternInfo,
  DualOptimizationResult,
  DualOptimizerConfig,
  PatternEffectivenessMetrics
} from './types';
import { countTokens } from './tokenizers';
import { TokenCache } from './utils';
import {
  getAvailableCategories,
  getPatternsByAggressiveness,
} from './patterns';

/**
 * Main entry point for the tokenFlo Pattern Optimizer package
 * 
 * This package provides tools for optimizing prompts to reduce token usage
 * while maintaining the semantic meaning and functionality of the prompts.
 * 
 * @example
 * ```typescript
 * import { PromptOptimizer } from 'tokenflo-pattern-optimizer';
 * 
 * // Create optimizer with default settings
 * const optimizer = new PromptOptimizer();
 * 
 * // Optimize a prompt
 * const result = optimizer.optimize('Your prompt text here');
 * 
 * // Get optimization metrics
 * console.log(`Tokens saved: ${result.tokensSaved}`);
 * console.log(`Percent reduction: ${result.percentSaved}%`);
 * console.log(`Optimized text: ${result.optimizedText}`);
 * ```
 * 
 * @packageDocumentation
 */

/**
 * PromptOptimizer - Main class for optimizing prompts to reduce token usage
 * 
 * This class provides a high-level API for optimizing prompts using pattern-based
 * optimization techniques. It supports various configuration options including
 * model selection, aggressiveness level, and category filtering.
 * 
 * @example
 * ```typescript
 * import { PromptOptimizer } from 'tokenflo-pattern-optimizer';
 * 
 * // Create optimizer with default settings
 * const optimizer = new PromptOptimizer({
 *   model: 'gpt-4',
 *   aggressiveness: 'medium'
 * });
 * 
 * // Optimize a prompt
 * const result = optimizer.optimize(`
 *   Please provide a comprehensive analysis of renewable energy trends.
 *   Include information about solar, wind, and hydroelectric power.
 * `);
 * 
 * console.log(`Tokens saved: ${result.tokensSaved} (${result.percentSaved.toFixed(1)}%)`);
 * console.log(`Optimized text: ${result.optimizedText}`);
 * ```
 * 
 * @packageDocumentation
 */
export class PromptOptimizer {
  private config: OptimizerConfig;
  private optimizer: PatternOptimizer;
  private tokenCache: TokenCache;

  /**
   * Create a new prompt optimizer
   * 
   * @param config - Configuration options (partial, will be merged with defaults)
   * @throws {OptimizerError} If configuration is invalid
   */
  constructor(config: Partial<OptimizerConfig> = {}) {
    // Merge with default config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    // Initialize the token cache
    this.tokenCache = new TokenCache();

    // Get patterns based on config
    let patterns = getPatternsByAggressiveness(this.config.aggressiveness);

    // Filter patterns by enabled categories
    if (this.config.enabledCategories.length > 0 && !this.config.enabledCategories.includes('all')) {
      patterns = patterns.filter(pattern => this.config.enabledCategories.includes(pattern.category));
    }

    // Add custom patterns
    if (this.config.customPatterns.length > 0) {
      patterns = [...patterns, ...this.config.customPatterns];
    }

    // Create the optimizer
    this.optimizer = new PatternOptimizer(
      patterns,
      this.config.model,
      this.config.preserveFormatting,
      this.config.trackPatternEffectiveness
    );
  }

  /**
   * Optimize a prompt to reduce token usage while preserving meaning
   * 
   * @param text - The prompt text to optimize
   * @returns Detailed optimization result with metrics
   * @throws {OptimizerError} If optimization fails
   */
  optimize(text: string): OptimizationResult {
    return this.optimizer.optimize(text);
  }

  /**
   * Count tokens in text using the configured model's tokenizer
   * 
   * @param text - The text to count tokens in
   * @param model - Optional model override
   * @returns Token count
   * @throws {Error} If tokenization fails
   */
  countTokens(text: string, model?: SupportedModel): number {
    const targetModel = model || this.config.model;
    return countTokens(text, targetModel);
  }

  /**
   * Add a custom optimization pattern
   * 
   * @param pattern - The pattern to add
   * @throws {OptimizerError} If the pattern is invalid
   */
  addPattern(pattern: OptimizationPattern): void {
    this.config.customPatterns.push(pattern);
    this.optimizer.addPattern(pattern);
  }

  /**
   * Enable a pattern category
   * 
   * @param category - The category to enable ('all' enables all categories)
   */
  enableCategory(category: PatternCategory | 'all'): void {
    if (category === 'all') {
      this.config.enabledCategories = ['all'];
    } else if (!this.config.enabledCategories.includes(category)) {
      // If 'all' is in the list, remove it
      if (this.config.enabledCategories.includes('all')) {
        this.config.enabledCategories = [category];
      } else {
        this.config.enabledCategories.push(category);
      }
    }

    this.updatePatterns();
  }

  /**
   * Disable a pattern category
   * 
   * @param category - The category to disable ('all' disables all categories)
   */
  disableCategory(category: PatternCategory | 'all'): void {
    if (category === 'all') {
      this.config.enabledCategories = [];
    } else {
      this.config.enabledCategories = this.config.enabledCategories.filter(c => c !== category && c !== 'all');
    }

    this.updatePatterns();
  }

  /**
   * Set the aggressiveness level for optimization
   * 
   * @param level - The aggressiveness level:
   *   - 'low': Minimal changes, preserves style and formatting
   *   - 'medium': Balanced approach, moderate token reduction
   *   - 'high': Maximum token reduction, may alter style
   * @throws {OptimizerError} If level is invalid
   */
  setAggressiveness(level: 'low' | 'medium' | 'high'): void {
    if (!['low', 'medium', 'high'].includes(level)) {
      throw new OptimizerError(`Invalid aggressiveness level: ${level}`);
    }

    this.config.aggressiveness = level;
    this.updatePatterns();
  }

  /**
   * Set the model to use for tokenization
   * 
   * @param model - The model name
   * @throws {OptimizerError} If model is invalid
   */
  setModel(model: SupportedModel): void {
    if (!model || typeof model !== 'string') {
      throw new OptimizerError('Model must be a non-empty string');
    }

    this.config.model = model;
    this.optimizer.setModel(model);
  }

  /**
   * Set whether to preserve formatting during optimization
   * 
   * @param preserve - Whether to preserve formatting
   * @throws {OptimizerError} If preserve is not a boolean
   */
  setPreserveFormatting(preserve: boolean): void {
    if (typeof preserve !== 'boolean') {
      throw new OptimizerError('Preserve formatting must be a boolean');
    }

    this.config.preserveFormatting = preserve;
    this.optimizer.setPreserveFormatting(preserve);
  }

  /**
   * Set whether to track pattern effectiveness metrics
   * 
   * @param track - Whether to track effectiveness metrics
   * @throws {OptimizerError} If track is not a boolean
   */
  setTrackPatternEffectiveness(track: boolean): void {
    if (typeof track !== 'boolean') {
      throw new OptimizerError('Track pattern effectiveness must be a boolean');
    }

    this.config.trackPatternEffectiveness = track;
    this.optimizer.setTrackEffectiveness(track);
  }

  /**
   * Get the current configuration
   * 
   * @returns Copy of the current configuration
   */
  getConfig(): OptimizerConfig {
    return { ...this.config };
  }

  /**
   * Get all available pattern categories
   * 
   * @returns Array of available pattern categories
   */
  getAvailableCategories(): PatternCategory[] {
    return getAvailableCategories() as PatternCategory[];
  }

  /**
   * Get all patterns currently being used
   * 
   * @returns Array of all patterns
   */
  getPatterns(): OptimizationPattern[] {
    return this.optimizer.getPatterns();
  }

  /**
   * Get pattern effectiveness metrics for all patterns
   * 
   * @returns Map of pattern IDs to their effectiveness metrics
   */
  getPatternEffectivenessMetrics(): Map<string, PatternEffectivenessMetrics> {
    return this.optimizer.getPatternEffectivenessMetrics();
  }

  /**
   * Get most effective patterns sorted by average tokens saved
   * 
   * @param limit - Maximum number of patterns to return (default: 10)
   * @returns Array of patterns sorted by effectiveness
   */
  getMostEffectivePatterns(limit: number = 10): OptimizationPattern[] {
    return this.optimizer.getMostEffectivePatterns(limit);
  }

  /**
   * Update patterns based on current config
   * @private
   */
  private updatePatterns(): void {
    // Get patterns based on aggressiveness
    let patterns = getPatternsByAggressiveness(this.config.aggressiveness);

    // Filter by enabled categories
    if (this.config.enabledCategories.length > 0 && !this.config.enabledCategories.includes('all')) {
      patterns = patterns.filter(pattern => this.config.enabledCategories.includes(pattern.category));
    }

    // Add custom patterns
    patterns = [...patterns, ...this.config.customPatterns];

    // Update the optimizer
    this.optimizer.setPatterns(patterns);
  }
}

/**
 * Create a dual optimizer that balances between token efficiency and quality
 * 
 * @example
 * ```typescript
 * import { createDualOptimizer } from 'tokenflo-pattern-optimizer';
 * 
 * // Create a dual optimizer with default settings
 * const dualOptimizer = createDualOptimizer();
 * 
 * // Optimize with balanced quality vs efficiency
 * const result = dualOptimizer.optimize('Your prompt text here');
 * ```
 * 
 * @param config Configuration for the dual optimizer
 * @returns A new dual optimizer instance
 */
export function createDualOptimizer(config: DualOptimizerConfig): DualOptimizer {
  return new DualOptimizer(config);
}

// Export types and utility functions
export {
  OptimizationPattern,
  OptimizerConfig,
  OptimizationResult,
  DualOptimizationResult,
  DualOptimizerConfig,
  SupportedModel,
  PatternCategory,
  AppliedPatternInfo,
  PatternEffectivenessMetrics,
  OptimizerError
};

// Export other useful modules
export * from './tokenizers';
export * from './patterns';
export * from './optimizers';
export * from './utils'; 