import { OptimizationPattern, OptimizationResult, AppliedPatternInfo, SupportedModel, PatternCategory } from '../types';
import { createTokenizer } from '../tokenizers';
import { BaseOptimizer, OptimizerError } from './base-optimizer';

/**
 * Configuration options for the DualOptimizer
 */
export interface DualOptimizerConfig {
  // Balance between token efficiency and quality (0 = max token efficiency, 1 = max quality)
  qualityVsEfficiencyBalance: number;
  // Model to use for tokenization
  model: SupportedModel;
  // Custom patterns to add
  customPatterns?: OptimizationPattern[];
}

/**
 * Extended optimization result that includes quality vs efficiency balance
 */
export interface DualOptimizationResult extends OptimizationResult {
  qualityVsEfficiencyBalance: number;
}

/**
 * DualOptimizer provides optimization that balances between token efficiency and output quality
 * It uses separate pattern sets for each optimization goal and blends them based on user preference
 */
export class DualOptimizer implements BaseOptimizer {
  private tokenEfficiencyPatterns: OptimizationPattern[] = [];
  private qualityPatterns: OptimizationPattern[] = [];
  private qualityVsEfficiencyBalance: number;
  private model: SupportedModel;
  private tokenizer: any; // Will be initialized in the constructor or during optimization

  /**
   * Create a new DualOptimizer
   * @param config Configuration options
   * @throws {OptimizerError} If configuration is invalid
   */
  constructor(config: DualOptimizerConfig) {
    // Validate balance is a number between 0 and 1
    if (typeof config.qualityVsEfficiencyBalance !== 'number' ||
      config.qualityVsEfficiencyBalance < 0 ||
      config.qualityVsEfficiencyBalance > 1) {
      throw new OptimizerError('qualityVsEfficiencyBalance must be a number between 0 and 1');
    }

    this.qualityVsEfficiencyBalance = config.qualityVsEfficiencyBalance;
    this.model = config.model;

    // Initialize tokenizer
    try {
      this.tokenizer = createTokenizer(this.model);
    } catch (error) {
      console.warn(`Could not initialize tokenizer for model ${this.model}: ${error}`);
      // We'll try again during optimization
    }

    // Add custom patterns if provided
    if (config.customPatterns && Array.isArray(config.customPatterns)) {
      this.addCustomPatterns(config.customPatterns);
    }
  }

  /**
   * Add token efficiency patterns
   * @param patterns Patterns that optimize for token efficiency
   * @throws {OptimizerError} If patterns are invalid
   */
  addTokenEfficiencyPatterns(patterns: OptimizationPattern[]): void {
    if (!Array.isArray(patterns)) {
      throw new OptimizerError('Patterns must be an array');
    }

    patterns.forEach(pattern => {
      this.validatePattern(pattern);
      this.tokenEfficiencyPatterns.push(pattern);
    });
  }

  /**
   * Add quality enhancement patterns
   * @param patterns Patterns that optimize for quality
   * @throws {OptimizerError} If patterns are invalid
   */
  addQualityPatterns(patterns: OptimizationPattern[]): void {
    if (!Array.isArray(patterns)) {
      throw new OptimizerError('Patterns must be an array');
    }

    patterns.forEach(pattern => {
      this.validatePattern(pattern);
      this.qualityPatterns.push(pattern);
    });
  }

  /**
   * Add a pattern to the optimizer
   * 
   * @param pattern - Pattern to add
   * @throws {OptimizerError} If the pattern is invalid
   */
  addPattern(pattern: OptimizationPattern): void {
    this.validatePattern(pattern);
    
    // Determine if pattern is for token efficiency or quality
    if (pattern.category === 'efficiency' ||
        pattern.category === 'redundancy' ||
        pattern.category === 'verbosity') {
      this.tokenEfficiencyPatterns.push(pattern);
    } else {
      this.qualityPatterns.push(pattern);
    }
  }

  /**
   * Get all patterns currently used by the optimizer
   * 
   * @returns Array of all patterns
   */
  getPatterns(): OptimizationPattern[] {
    return [...this.tokenEfficiencyPatterns, ...this.qualityPatterns];
  }

  /**
   * Add custom patterns (will be categorized based on their purpose)
   * @param patterns Custom patterns to add
   * @throws {OptimizerError} If patterns are invalid
   */
  addCustomPatterns(patterns: OptimizationPattern[]): void {
    if (!Array.isArray(patterns)) {
      throw new OptimizerError('Custom patterns must be an array');
    }

    patterns.forEach(pattern => {
      this.validatePattern(pattern);

      // Determine if pattern is for token efficiency or quality
      if (pattern.category === 'efficiency' ||
        pattern.category === 'redundancy' ||
        pattern.category === 'verbosity') {
        this.tokenEfficiencyPatterns.push(pattern);
      } else {
        this.qualityPatterns.push(pattern);
      }
    });
  }

  /**
   * Validate a pattern has the required properties
   * @param pattern Pattern to validate
   * @throws {OptimizerError} If pattern is invalid
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
    if (pattern.find && !pattern.replace) {
      throw new OptimizerError(
        `Pattern ${pattern.id} with 'find' must also have a 'replace' property`
      );
    }
  }

  /**
   * Set the balance between token efficiency and quality
   * @param balance Balance between token efficiency and quality (0-1)
   * @throws {OptimizerError} If balance is invalid
   */
  setQualityEfficiencyBalance(balance: number): void {
    if (typeof balance !== 'number' || balance < 0 || balance > 1) {
      throw new OptimizerError('Balance must be a number between 0 and 1');
    }

    this.qualityVsEfficiencyBalance = balance;
  }

  /**
   * Set the model to use for tokenization
   * @param model Model to use
   * @throws {OptimizerError} If model is invalid
   */
  setModel(model: SupportedModel): void {
    if (!model || typeof model !== 'string') {
      throw new OptimizerError('Model must be a non-empty string');
    }

    this.model = model;

    // Reinitialize tokenizer with new model
    try {
      this.tokenizer = createTokenizer(this.model);
    } catch (error) {
      console.warn(`Could not initialize tokenizer for model ${this.model}: ${error}`);
      // We'll try again during optimization
    }
  }

  /**
   * Optimize text using the configured balance between token efficiency and quality
   * @param text Text to optimize
   * @returns Optimization result
   * @throws {OptimizerError} If optimization fails
   */
  optimize(text: string): DualOptimizationResult {
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
        skippedPatterns: [],
        qualityVsEfficiencyBalance: this.qualityVsEfficiencyBalance
      };
    }

    try {
      // Ensure tokenizer is initialized
      if (!this.tokenizer) {
        try {
          this.tokenizer = createTokenizer(this.model);
        } catch (error) {
          throw new OptimizerError(`Could not initialize tokenizer for model ${this.model}: ${error}`);
        }
      }

      const originalTokenCount = this.tokenizer.countTokens(text);

      // Select patterns based on balance
      const patternsToApply: OptimizationPattern[] = this.selectPatterns();

      let optimizedText = text;
      const appliedPatterns: AppliedPatternInfo[] = [];
      const skippedPatterns: OptimizationPattern[] = [];

      // Apply selected patterns
      for (const pattern of patternsToApply) {
        try {
          // Skip if pattern is disabled
          if (pattern.disabled) {
            skippedPatterns.push(pattern);
            continue;
          }

          // Try to apply the pattern
          const textBeforePattern = optimizedText;
          const result = this.applyPattern(optimizedText, pattern);

          // If pattern was applied, update optimized text and track metrics
          if (result.applied) {
            const tokensBeforePattern = this.tokenizer.countTokens(textBeforePattern);
            optimizedText = result.text;
            const tokensAfterPattern = this.tokenizer.countTokens(optimizedText);
            const tokenChange = tokensAfterPattern - tokensBeforePattern;

            appliedPatterns.push({
              id: pattern.id,
              category: pattern.category,
              description: pattern.description,
              priority: pattern.priority,
              tokensSaved: -tokenChange, // Negative change means tokens were saved
              tokenChange: tokenChange
            });
          } else {
            skippedPatterns.push(pattern);
          }
        } catch (error) {
          // Log error but continue with other patterns
          console.error(`Error applying pattern ${pattern.id}:`, error);
          skippedPatterns.push(pattern);
        }
      }

      // Get final token count
      const optimizedTokenCount = this.tokenizer.countTokens(optimizedText);
      const tokensSaved = originalTokenCount - optimizedTokenCount;
      const percentSaved = originalTokenCount > 0
        ? (tokensSaved / originalTokenCount) * 100
        : 0;

      return {
        originalText: text,
        optimizedText,
        originalTokenCount,
        optimizedTokenCount,
        tokensSaved,
        percentSaved,
        appliedPatterns,
        skippedPatterns,
        qualityVsEfficiencyBalance: this.qualityVsEfficiencyBalance
      };
    } catch (error) {
      throw new OptimizerError(
        `Optimization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Select patterns to apply based on the quality/efficiency balance
   * @returns Array of patterns to apply
   * @private
   */
  private selectPatterns(): OptimizationPattern[] {
    // If balance is 0, use only token efficiency patterns
    if (this.qualityVsEfficiencyBalance === 0) {
      return [...this.tokenEfficiencyPatterns];
    }

    // If balance is 1, use only quality patterns
    if (this.qualityVsEfficiencyBalance === 1) {
      return [...this.qualityPatterns];
    }

    // Otherwise, blend patterns based on balance
    const patterns: OptimizationPattern[] = [];

    // Add all quality patterns
    this.qualityPatterns.forEach(pattern => patterns.push({ ...pattern }));

    // Add token efficiency patterns with probability based on balance
    this.tokenEfficiencyPatterns.forEach(pattern => {
      // The lower the balance, the more likely we include efficiency patterns
      if (Math.random() > this.qualityVsEfficiencyBalance) {
        patterns.push({ ...pattern });
      }
    });

    // Sort by priority if available
    return patterns.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  /**
   * Apply a pattern to text
   * @param text Text to apply pattern to
   * @param pattern Pattern to apply
   * @returns Result of applying pattern
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
}
