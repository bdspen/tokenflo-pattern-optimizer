import { OptimizationPattern, OptimizationResult, SupportedModel, AppliedPatternInfo, PatternEffectivenessMetrics } from '../types';
import { createTokenizer } from '../tokenizers';
import { BaseOptimizer, OptimizerError } from './base-optimizer';

/**
 * PatternOptimizer - Applies optimization patterns to reduce token usage in text
 * 
 * This optimizer applies a series of patterns to text to optimize it based on defined rules.
 * Each pattern can modify the text in various ways, such as removing redundancy,
 * simplifying formatting, or restructuring content.
 * 
 * The optimizer tracks which patterns are applied and skipped, along with token metrics.
 * 
 * @example
 * ```typescript
 * import { PatternOptimizer } from './pattern-optimizer';
 * import { technicalPatterns } from '../patterns';
 * 
 * // Create optimizer with technical patterns for GPT-4
 * const optimizer = new PatternOptimizer(technicalPatterns, 'gpt-4');
 * 
 * // Optimize some text
 * const result = optimizer.optimize('Here is some text to optimize.');
 * 
 * console.log(`Tokens saved: ${result.tokensSaved}`);
 * console.log(`Optimized text: ${result.optimizedText}`);
 * ```
 */
export class PatternOptimizer implements BaseOptimizer {
  private patterns: OptimizationPattern[];
  private model: SupportedModel;
  private preserveFormatting: boolean;
  private trackEffectiveness: boolean;

  /**
   * Create a new pattern optimizer
   * 
   * @param patterns - Patterns to apply during optimization
   * @param model - Model to use for tokenization (determines token counting method)
   * @param preserveFormatting - When true, patterns that would alter formatting are skipped
   * @param trackEffectiveness - Whether to track pattern effectiveness metrics
   * @throws {OptimizerError} If an invalid pattern is provided
   */
  constructor(
    patterns: OptimizationPattern[] = [],
    model: SupportedModel = 'gpt-3.5-turbo',
    preserveFormatting: boolean = true,
    trackEffectiveness: boolean = true
  ) {
    this.model = model;
    this.preserveFormatting = preserveFormatting;
    this.trackEffectiveness = trackEffectiveness;
    this.patterns = [];

    // Validate and set patterns
    if (patterns && patterns.length > 0) {
      patterns.forEach(pattern => this.addPattern(pattern));
    }
  }

  /**
   * Validate a pattern to ensure it has the required properties
   * 
   * @param pattern - Pattern to validate
   * @throws {OptimizerError} If the pattern is invalid or missing required properties
   * @private
   */
  private validatePattern(pattern: OptimizationPattern): void {
    if (!pattern.id) {
      throw new OptimizerError('Pattern must have an id');
    }

    if (!pattern.category) {
      throw new OptimizerError(`Pattern ${pattern.id} must have a category`);
    }

    if (!pattern.description) {
      throw new OptimizerError(`Pattern ${pattern.id} must have a description`);
    }

    // A pattern must have at least one of these properties
    if (!pattern.find && !pattern.transform) {
      throw new OptimizerError(
        `Pattern ${pattern.id} must have either a 'find' or 'transform' property`
      );
    }

    // If find is specified, replace must also be specified
    if (pattern.find && pattern.replace === undefined) {
      throw new OptimizerError(
        `Pattern ${pattern.id} with 'find' must also have a 'replace' property`
      );
    }

    // Initialize effectiveness metrics if tracking is enabled and they don't exist
    if (this.trackEffectiveness && !pattern.effectivenessMetrics) {
      pattern.effectivenessMetrics = {
        timesApplied: 0,
        totalTokensSaved: 0,
        avgTokensSaved: 0,
        timesSkipped: 0,
        successRate: 0
      };
    }
  }

  /**
   * Optimize text using the configured patterns
   * 
   * This method applies each pattern in sequence to the input text.
   * It tracks which patterns are applied vs. skipped, and calculates token metrics.
   * 
   * @param text - Text to optimize
   * @returns Detailed optimization result including token metrics and applied patterns
   * @throws {OptimizerError} If optimization fails or input is invalid
   */
  optimize(text: string): OptimizationResult {
    // Track performance if enabled
    const startTime = performance.now();

    // Handle edge cases
    if (text === undefined || text === null) {
      throw new OptimizerError('Cannot optimize undefined or null text');
    }

    if (typeof text !== 'string') {
      throw new OptimizerError(`Expected string but got ${typeof text}`);
    }

    // Handle empty text case
    if (text.trim() === '') {
      return {
        originalText: text,
        optimizedText: text,
        originalTokenCount: 0,
        optimizedTokenCount: 0,
        tokensSaved: 0,
        percentSaved: 0,
        appliedPatterns: [],
        skippedPatterns: []
      };
    }

    try {
      const tokenizer = createTokenizer(this.model);
      const originalTokenCount = tokenizer.countTokens(text);

      let optimizedText = text;
      const appliedPatterns: AppliedPatternInfo[] = [];
      const skippedPatterns: OptimizationPattern[] = [];

      // Apply each pattern
      for (const pattern of this.patterns) {
        try {
          // Skip if pattern is disabled
          if (pattern.disabled) {
            this.updatePatternSkippedMetrics(pattern);
            skippedPatterns.push(pattern);
            continue;
          }

          // Skip if pattern should preserve formatting and we're preserving formatting
          if (pattern.preservesFormatting === false && this.preserveFormatting) {
            this.updatePatternSkippedMetrics(pattern);
            skippedPatterns.push(pattern);
            continue;
          }

          // Apply the pattern
          const textBeforePattern = optimizedText;
          const result = this.applyPattern(optimizedText, pattern);

          // If the pattern was applied, update the text and track metrics
          if (result.applied) {
            const tokensBeforePattern = tokenizer.countTokens(textBeforePattern);
            optimizedText = result.text;
            const tokensAfterPattern = tokenizer.countTokens(optimizedText);
            const tokenChange = tokensAfterPattern - tokensBeforePattern;
            const tokensSaved = -tokenChange; // Negative change means tokens were saved

            appliedPatterns.push({
              id: pattern.id,
              category: pattern.category,
              description: pattern.description,
              priority: pattern.priority,
              tokensSaved: tokensSaved,
              tokenChange: tokenChange
            });

            // Update pattern effectiveness metrics
            this.updatePatternEffectivenessMetrics(pattern, tokensSaved);
          } else {
            this.updatePatternSkippedMetrics(pattern);
            skippedPatterns.push(pattern);
          }
        } catch (error) {
          // Log error but continue with other patterns
          console.error(`Error applying pattern ${pattern.id}:`, error);
          this.updatePatternSkippedMetrics(pattern);
          skippedPatterns.push(pattern);
        }
      }

      // Count tokens in optimized text safely
      let optimizedTokenCount: number;
      try {
        optimizedTokenCount = tokenizer.countTokens(optimizedText);
      } catch (error) {
        console.error('Error counting tokens in optimized text:', error);
        optimizedTokenCount = optimizedText.length / 4; // Fallback to rough estimate
      }

      // Calculate savings
      const tokensSaved = originalTokenCount - optimizedTokenCount;
      const percentSaved = originalTokenCount > 0
        ? (tokensSaved / originalTokenCount) * 100
        : 0;

      // Calculate performance metrics
      const endTime = performance.now();
      const executionTimeMs = endTime - startTime;
      const tokensPerSecond = originalTokenCount / (executionTimeMs / 1000);

      return {
        originalText: text,
        optimizedText,
        originalTokenCount,
        optimizedTokenCount,
        tokensSaved,
        percentSaved,
        appliedPatterns,
        skippedPatterns,
        performanceMetrics: {
          executionTimeMs,
          tokensPerSecond
        }
      };
    } catch (error) {
      throw new OptimizerError(
        `Error during optimization: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update effectiveness metrics for a pattern that was successfully applied
   * 
   * @param pattern - Pattern that was applied
   * @param tokensSaved - Number of tokens saved by applying this pattern
   * @private
   */
  private updatePatternEffectivenessMetrics(pattern: OptimizationPattern, tokensSaved: number): void {
    if (!this.trackEffectiveness || !pattern.effectivenessMetrics) return;

    const metrics = pattern.effectivenessMetrics;
    metrics.timesApplied++;
    metrics.totalTokensSaved += tokensSaved;
    metrics.avgTokensSaved = metrics.totalTokensSaved / metrics.timesApplied;
    metrics.lastApplied = Date.now();
    metrics.successRate = metrics.timesApplied / (metrics.timesApplied + metrics.timesSkipped);
  }

  /**
   * Update effectiveness metrics for a pattern that was skipped
   * 
   * @param pattern - Pattern that was skipped
   * @private
   */
  private updatePatternSkippedMetrics(pattern: OptimizationPattern): void {
    if (!this.trackEffectiveness || !pattern.effectivenessMetrics) return;

    const metrics = pattern.effectivenessMetrics;
    metrics.timesSkipped++;
    metrics.successRate = metrics.timesApplied / (metrics.timesApplied + metrics.timesSkipped);
  }

  /**
   * Apply a single pattern to the text
   * 
   * This method implements the pattern application logic, supporting:
   * - Custom test functions to determine if a pattern applies
   * - Transform functions that directly modify text
   * - Find/replace patterns using RegExp or string
   * 
   * @param text - Text to apply the pattern to
   * @param pattern - Pattern to apply
   * @returns Object with the resulting text and whether the pattern was applied
   * @throws {OptimizerError} If pattern application fails
   * @private
   */
  private applyPattern(text: string, pattern: OptimizationPattern): {
    text: string;
    applied: boolean;
  } {
    // If the pattern has a test function, use it to check if the pattern applies
    if (pattern.test) {
      try {
        if (!pattern.test(text)) {
          return { text, applied: false };
        }
      } catch (error) {
        throw new OptimizerError(
          `Error in test function for pattern ${pattern.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // If the pattern has a transform function, use it
    if (pattern.transform) {
      try {
        const transformed = pattern.transform(text);
        return {
          text: transformed,
          applied: transformed !== text
        };
      } catch (error) {
        throw new OptimizerError(
          `Error in transform function for pattern ${pattern.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Otherwise, use the find and replace
    if (pattern.find) {
      try {
        const regex = typeof pattern.find === 'string'
          ? new RegExp(pattern.find, 'g')
          : pattern.find;

        let newText = text;

        // Handle both string and function replacers
        if (typeof pattern.replace === 'string') {
          newText = text.replace(regex, pattern.replace);
        } else if (typeof pattern.replace === 'function') {
          newText = text.replace(regex, function () {
            try {
              // @ts-ignore - We know it's a function at this point
              return pattern.replace.apply(null, arguments);
            } catch (error) {
              console.error(`Error in replacer function for pattern ${pattern.id}:`, error);
              // Return the original match if the replacer fails
              return arguments[0];
            }
          });
        } else {
          // If no replace specified, use empty string
          newText = text.replace(regex, '');
        }

        return {
          text: newText,
          applied: newText !== text
        };
      } catch (error) {
        throw new OptimizerError(
          `Error applying pattern ${pattern.id} (find/replace): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // If no valid pattern method, return unchanged
    return { text, applied: false };
  }

  /**
   * Add a pattern to the optimizer's pattern collection
   * 
   * @param pattern - Pattern to add
   * @throws {OptimizerError} If the pattern is invalid
   */
  addPattern(pattern: OptimizationPattern): void {
    this.validatePattern(pattern);
    this.patterns.push(pattern);
  }

  /**
   * Set the patterns to use, replacing any existing patterns
   * 
   * @param patterns - Patterns to use
   * @throws {OptimizerError} If any pattern is invalid or the input is not an array
   */
  setPatterns(patterns: OptimizationPattern[]): void {
    if (!Array.isArray(patterns)) {
      throw new OptimizerError('Patterns must be an array');
    }

    // Validate all patterns before setting
    patterns.forEach(pattern => this.validatePattern(pattern));
    this.patterns = patterns;
  }

  /**
   * Set the model to use for tokenization
   * 
   * @param model - Model name
   * @throws {OptimizerError} If model name is invalid
   */
  setModel(model: SupportedModel): void {
    if (!model || typeof model !== 'string') {
      throw new OptimizerError('Model must be a non-empty string');
    }

    this.model = model;
  }

  /**
   * Set whether to preserve formatting
   * 
   * @param preserveFormatting - True to preserve formatting, false to allow all transformations
   * @throws {OptimizerError} If the value is not a boolean
   */
  setPreserveFormatting(preserveFormatting: boolean): void {
    if (typeof preserveFormatting !== 'boolean') {
      throw new OptimizerError('Preserve formatting must be a boolean');
    }

    this.preserveFormatting = preserveFormatting;
  }

  /**
   * Set whether to track pattern effectiveness
   * 
   * @param trackEffectiveness - True to track effectiveness metrics, false to disable
   */
  setTrackEffectiveness(trackEffectiveness: boolean): void {
    this.trackEffectiveness = trackEffectiveness;
  }

  /**
   * Get all patterns currently used by the optimizer
   * 
   * @returns Array of all patterns
   */
  getPatterns(): OptimizationPattern[] {
    return [...this.patterns];
  }

  /**
   * Get pattern effectiveness metrics for all patterns
   * 
   * @returns Map of pattern IDs to their effectiveness metrics
   */
  getPatternEffectivenessMetrics(): Map<string, PatternEffectivenessMetrics> {
    const metricsMap = new Map<string, PatternEffectivenessMetrics>();

    for (const pattern of this.patterns) {
      if (pattern.effectivenessMetrics) {
        metricsMap.set(pattern.id, { ...pattern.effectivenessMetrics });
      }
    }

    return metricsMap;
  }

  /**
   * Get most effective patterns sorted by average tokens saved
   * 
   * @param limit - Maximum number of patterns to return (default: 10)
   * @returns Array of patterns sorted by effectiveness
   */
  getMostEffectivePatterns(limit: number = 10): OptimizationPattern[] {
    return [...this.patterns]
      .filter(p => p.effectivenessMetrics && p.effectivenessMetrics.timesApplied > 0)
      .sort((a, b) =>
        (b.effectivenessMetrics?.avgTokensSaved ?? 0) -
        (a.effectivenessMetrics?.avgTokensSaved ?? 0)
      )
      .slice(0, limit);
  }
}
