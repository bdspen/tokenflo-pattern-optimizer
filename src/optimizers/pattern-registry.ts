import { OptimizationPattern, PatternCategory } from '../types';
import metaPatterns from '../patterns/meta-patterns';
import { technicalPatterns } from '../patterns/technical-patterns';
import { rolePatterns } from '../patterns/role-patterns';
import { OptimizerError } from './base-optimizer';

/**
 * Interface for pattern version information
 */
interface PatternVersion {
  id: string;
  version: number;
  pattern: OptimizationPattern;
  createdAt: number;
}

/**
 * PatternRegistry manages all optimization patterns with versioning and conflict resolution
 * 
 * This registry provides:
 * - Pattern versioning to track changes over time
 * - Conflict resolution when patterns with the same ID are registered
 * - Efficient filtering and retrieval of patterns
 * - Pattern validation to ensure all required fields are present
 */
class PatternRegistry {
  private patterns: Map<string, PatternVersion> = new Map();
  private categorizedPatterns: Map<string, Set<string>> = new Map();
  private patternVersionHistory: Map<string, PatternVersion[]> = new Map();

  constructor() {
    // Register built-in patterns
    this.registerPatterns(metaPatterns);
    this.registerPatterns(technicalPatterns);
    this.registerPatterns(rolePatterns);
  }

  /**
   * Register an array of patterns with the registry
   * 
   * @param patterns - Array of patterns to register
   * @param overwrite - Whether to overwrite existing patterns with the same ID
   * @throws {OptimizerError} If a pattern is invalid or if there's a conflict and overwrite is false
   */
  registerPatterns(patterns: OptimizationPattern[], overwrite: boolean = false): void {
    patterns.forEach(pattern => this.registerPattern(pattern, overwrite));
  }

  /**
   * Register a single pattern with the registry
   * 
   * @param pattern - Pattern to register
   * @param overwrite - Whether to overwrite an existing pattern with the same ID
   * @throws {OptimizerError} If the pattern is invalid or if there's a conflict and overwrite is false
   */
  registerPattern(pattern: OptimizationPattern, overwrite: boolean = false): void {
    // Validate pattern
    this.validatePattern(pattern);
    
    const patternId = pattern.id;
    
    // Check for existing pattern with same ID
    if (this.patterns.has(patternId) && !overwrite) {
      throw new OptimizerError(
        `Pattern with ID "${patternId}" already exists. Use overwrite=true to replace it.`
      );
    }
    
    // Get current version number
    const currentVersion = this.patterns.has(patternId) 
      ? this.patterns.get(patternId)!.version + 1 
      : 1;
    
    // Create version info
    const versionInfo: PatternVersion = {
      id: patternId,
      version: currentVersion,
      pattern: { ...pattern }, // Clone to avoid external modifications
      createdAt: Date.now()
    };
    
    // Add to version history
    if (!this.patternVersionHistory.has(patternId)) {
      this.patternVersionHistory.set(patternId, []);
    }
    this.patternVersionHistory.get(patternId)!.push(versionInfo);
    
    // Update main pattern map
    this.patterns.set(patternId, versionInfo);
    
    // Update category index
    const category = pattern.category;
    if (!this.categorizedPatterns.has(category)) {
      this.categorizedPatterns.set(category, new Set());
    }
    this.categorizedPatterns.get(category)!.add(patternId);
  }

  /**
   * Validate a pattern has all required properties
   * 
   * @param pattern - Pattern to validate
   * @throws {OptimizerError} If the pattern is invalid
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
  }

  /**
   * Get all registered patterns
   * 
   * @returns Array of all patterns
   */
  getAllPatterns(): OptimizationPattern[] {
    return Array.from(this.patterns.values()).map(v => v.pattern);
  }

  /**
   * Get patterns filtered by category
   * 
   * @param category - Category to filter by
   * @returns Array of patterns in the specified category
   */
  getPatternsByCategory(category: string): OptimizationPattern[] {
    if (!this.categorizedPatterns.has(category)) {
      return [];
    }
    
    const patternIds = this.categorizedPatterns.get(category)!;
    return Array.from(patternIds)
      .map(id => this.patterns.get(id)!.pattern)
      .filter(Boolean);
  }

  /**
   * Get a pattern by ID
   * 
   * @param id - Pattern ID to look up
   * @returns The pattern or undefined if not found
   */
  getPatternById(id: string): OptimizationPattern | undefined {
    const versionInfo = this.patterns.get(id);
    return versionInfo ? versionInfo.pattern : undefined;
  }

  /**
   * Get all pattern categories
   * 
   * @returns Array of all categories
   */
  getAllCategories(): string[] {
    return Array.from(this.categorizedPatterns.keys());
  }

  /**
   * Get patterns sorted by priority (highest first)
   * 
   * @returns Array of patterns sorted by priority
   */
  getPatternsByPriority(): OptimizationPattern[] {
    return this.getAllPatterns()
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
  
  /**
   * Get version history for a pattern
   * 
   * @param id - Pattern ID to get history for
   * @returns Array of version info, or empty array if pattern not found
   */
  getPatternVersionHistory(id: string): PatternVersion[] {
    return this.patternVersionHistory.get(id) || [];
  }
  
  /**
   * Get a specific version of a pattern
   * 
   * @param id - Pattern ID
   * @param version - Version number
   * @returns The pattern at the specified version, or undefined if not found
   */
  getPatternVersion(id: string, version: number): OptimizationPattern | undefined {
    const history = this.patternVersionHistory.get(id);
    if (!history) return undefined;
    
    const versionInfo = history.find(v => v.version === version);
    return versionInfo ? versionInfo.pattern : undefined;
  }
  
  /**
   * Remove a pattern from the registry
   * 
   * @param id - ID of the pattern to remove
   * @returns true if the pattern was removed, false if it wasn't found
   */
  removePattern(id: string): boolean {
    if (!this.patterns.has(id)) {
      return false;
    }
    
    // Get the pattern to remove its category reference
    const pattern = this.patterns.get(id)!.pattern;
    const category = pattern.category;
    
    // Remove from category index
    if (this.categorizedPatterns.has(category)) {
      this.categorizedPatterns.get(category)!.delete(id);
      
      // Clean up empty category sets
      if (this.categorizedPatterns.get(category)!.size === 0) {
        this.categorizedPatterns.delete(category);
      }
    }
    
    // Remove from main pattern map
    this.patterns.delete(id);
    
    // Note: We keep the version history for reference
    
    return true;
  }
  
  /**
   * Clear all patterns from the registry
   */
  clear(): void {
    this.patterns.clear();
    this.categorizedPatterns.clear();
    this.patternVersionHistory.clear();
  }
}

// Export a singleton instance
const patternRegistry = new PatternRegistry();
export default patternRegistry;

// Export types
export { PatternVersion };
