import { OptimizationPattern, OptimizerConfig, OptimizationResult, AggressivenessLevel } from './types';
import { Tokenizer } from './utils/tokenizer';
import patternRegistry from './optimizers/pattern-registry';

// Define AppliedPattern type locally if not in types.ts
interface AppliedPattern extends OptimizationPattern {
  tokensSaved: number;
}

// Extended aggressiveness level for internal use
type ExtendedAggressivenessLevel = AggressivenessLevel | 'max';

export class PromptOptimizer {
  private patterns: OptimizationPattern[] = [];
  private config: OptimizerConfig;
  private tokenizer: Tokenizer;

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = {
      model: config.model || 'gpt-3.5-turbo',
      aggressiveness: config.aggressiveness || 'medium',
      preserveFormatting: config.preserveFormatting !== undefined ? config.preserveFormatting : true,
      enabledCategories: config.enabledCategories || ['all'],
      customPatterns: config.customPatterns || [],
      trackPatternEffectiveness: config.trackPatternEffectiveness !== undefined ? config.trackPatternEffectiveness : true,
      includePerformanceMetrics: config.includePerformanceMetrics || false
    };

    this.tokenizer = new Tokenizer(this.config.model);

    // Initialize with default patterns
    this.loadDefaultPatterns();

    // Add any custom patterns provided
    if (this.config.customPatterns.length > 0) {
      this.patterns = [...this.patterns, ...this.config.customPatterns];
    }
  }

  private loadDefaultPatterns(): void {
    // Load patterns from registry based on aggressiveness level
    const allPatterns = patternRegistry.getAllPatterns();

    switch (this.config.aggressiveness) {
      case 'low':
        // Only include high priority patterns (80-100)
        this.patterns = allPatterns.filter(p => (p.priority || 0) >= 80);
        break;
      case 'medium':
        // Include medium to high priority patterns (50-100)
        this.patterns = allPatterns.filter(p => (p.priority || 0) >= 50);
        break;
      case 'high':
        // Include all patterns
        this.patterns = allPatterns;
        break;
      case 'max' as ExtendedAggressivenessLevel:
        // Include all patterns plus special high-impact patterns
        this.patterns = allPatterns;
        // Add extra aggressive patterns for maximum token reduction
        this.patterns.push({
          id: 'max-remove-all-explanations',
          category: 'max',
          description: 'Remove all explanation texts',
          priority: 100,
          preservesFormatting: true,
          find: /This (could|should|will|may|might) ([^.]+)\./gi,
          replace: ''
        });
        this.patterns.push({
          id: 'max-convert-paragraphs-to-bullets',
          category: 'max',
          description: 'Aggressively convert all paragraphs to bullet points',
          priority: 100,
          preservesFormatting: true,
          find: /([A-Z][^.]+)\. ([A-Z][^.]+)\. ([A-Z][^.]+)\./g,
          replace: '• $1\n• $2\n• $3'
        });
        break;
    }

    // Sort patterns by priority (highest first)
    this.patterns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  addPattern(pattern: OptimizationPattern): void {
    // Add to registry so it's available to all instances
    patternRegistry.registerPattern(pattern);

    // Add to this instance
    this.patterns.push(pattern);

    // Re-sort patterns by priority
    this.patterns.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  optimize(text: string): OptimizationResult {
    const originalTokenCount = this.tokenizer.countTokens(text);
    const appliedPatterns: AppliedPattern[] = [];
    const skippedPatterns: OptimizationPattern[] = [];
    let optimizedText = text;

    this.patterns.forEach(pattern => {
      if (!this.config.preserveFormatting && pattern.preservesFormatting === false) {
        skippedPatterns.push(pattern);
        return; // Skip patterns that don't preserve formatting if required
      }

      const before = optimizedText;
      if (pattern.find) {
        optimizedText = optimizedText.replace(pattern.find, pattern.replace as string);
      }

      // If pattern was applied, count tokens saved and record
      if (before !== optimizedText) {
        const beforeTokens = this.tokenizer.countTokens(before);
        const afterTokens = this.tokenizer.countTokens(optimizedText);
        const tokensSaved = beforeTokens - afterTokens;

        if (tokensSaved > 0) {
          appliedPatterns.push({
            ...pattern,
            tokensSaved
          });
        }
      } else {
        skippedPatterns.push(pattern);
      }
    });

    // Apply structural meta-patterns after initial optimizations
    // These are more aggressive transformations that convert paragraphs to lists, etc.
    if (this.config.aggressiveness === 'high' || this.config.aggressiveness === ('max' as ExtendedAggressivenessLevel)) {
      const structuralOptimizer = this.applyStructuralOptimizations(optimizedText);
      optimizedText = structuralOptimizer.text;

      // Add structural patterns that were applied
      appliedPatterns.push(...structuralOptimizer.patterns);
    }

    const optimizedTokenCount = this.tokenizer.countTokens(optimizedText);
    const tokensSaved = originalTokenCount - optimizedTokenCount;
    const percentSaved = originalTokenCount > 0 ? (tokensSaved / originalTokenCount) * 100 : 0;

    return {
      originalText: text,
      optimizedText,
      originalTokenCount,
      optimizedTokenCount,
      tokensSaved,
      percentSaved,
      appliedPatterns,
      skippedPatterns
    };
  }

  private applyStructuralOptimizations(text: string): { text: string, patterns: AppliedPattern[] } {
    let optimizedText = text;
    const appliedPatterns: AppliedPattern[] = [];

    // Define structural optimizations that operate on overall text structure
    const structuralPatterns: OptimizationPattern[] = [
      {
        id: 'structural-paragraphs-to-bullets',
        category: 'structural',
        description: 'Convert paragraphs to bullet points for readability',
        priority: 90,
        preservesFormatting: true,
        find: /([A-Z][^.!?]{15,}[.!?]) ([A-Z][^.!?]{15,}[.!?]) ([A-Z][^.!?]{15,}[.!?])/g,
        replace: '• $1\n• $2\n• $3'
      },
      {
        id: 'structural-instructions-to-list',
        category: 'structural',
        description: 'Convert instruction paragraphs to lists',
        priority: 85,
        preservesFormatting: true,
        find: /(First|Initially|To start)[,:]? ([^.!?]+[.!?]) (Then|Next|After that|Second)[,:]? ([^.!?]+[.!?]) (Finally|Lastly|Third)[,:]? ([^.!?]+[.!?])/gi,
        replace: '1. $2\n2. $4\n3. $6'
      },
      {
        id: 'structural-numbered-lists',
        category: 'structural',
        description: 'Convert numbered item text to actual numbered lists',
        priority: 80,
        preservesFormatting: true,
        find: /(\d+\.) ([^.!?]+[.!?]) (\d+\.) ([^.!?]+[.!?]) (\d+\.) ([^.!?]+[.!?])/g,
        replace: '$1 $2\n$3 $4\n$5 $6'
      },
      {
        id: 'structural-condense-descriptions',
        category: 'structural',
        description: 'Condense multi-part descriptions',
        priority: 75,
        preservesFormatting: true,
        find: /([A-Z][^.!?]+) is described as ([^.!?]+[.!?]) It is also ([^.!?]+[.!?]) Additionally, it ([^.!?]+[.!?])/g,
        replace: '$1: $2'
      }
    ];

    structuralPatterns.forEach(pattern => {
      const before = optimizedText;
      if (pattern.find && pattern.replace) {
        optimizedText = optimizedText.replace(pattern.find, pattern.replace as string);
      }

      if (before !== optimizedText) {
        const beforeTokens = this.tokenizer.countTokens(before);
        const afterTokens = this.tokenizer.countTokens(optimizedText);
        const tokensSaved = beforeTokens - afterTokens;

        if (tokensSaved > 0) {
          appliedPatterns.push({
            ...pattern,
            tokensSaved
          });
        }
      }
    });

    return { text: optimizedText, patterns: appliedPatterns };
  }
} 