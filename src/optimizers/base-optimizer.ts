import { OptimizationPattern, OptimizationResult, SupportedModel } from '../types';

/**
 * Base interface for all optimizers
 * 
 * This interface defines the common methods that all optimizers must implement,
 * providing a consistent API across different optimization strategies.
 */
export interface BaseOptimizer {
  /**
   * Optimize text to reduce token usage
   * 
   * @param text - Text to optimize
   * @returns Optimization result with metrics
   */
  optimize(text: string): OptimizationResult;
  
  /**
   * Add a pattern to the optimizer
   * 
   * @param pattern - Pattern to add
   */
  addPattern(pattern: OptimizationPattern): void;
  
  /**
   * Set the model to use for tokenization
   * 
   * @param model - Model name
   */
  setModel(model: SupportedModel): void;
  
  /**
   * Get all patterns currently used by the optimizer
   * 
   * @returns Array of all patterns
   */
  getPatterns(): OptimizationPattern[];
}

/**
 * Base error class for optimizer-related errors
 */
export class OptimizerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizerError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, OptimizerError.prototype);
  }
}
