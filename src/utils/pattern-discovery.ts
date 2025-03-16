import { OptimizationPattern } from '../types';
import { Tokenizer } from './tokenizer';

interface PatternDiscoveryOptions {
  minOccurrences?: number;
  minTokenImpact?: number;
  model?: string;
}

/**
 * PatternDiscovery analyzes example pairs of original and optimized prompts
 * to automatically discover potential optimization patterns
 */
export class PatternDiscovery {
  private options: PatternDiscoveryOptions;
  private tokenizer: Tokenizer;

  constructor(options: PatternDiscoveryOptions = {}) {
    this.options = {
      minOccurrences: options.minOccurrences || 3,
      minTokenImpact: options.minTokenImpact || 2,
      model: options.model || 'gpt-3.5-turbo'
    };
    this.tokenizer = new Tokenizer(this.options.model);
  }

  /**
   * Analyze a dataset to discover potential optimization patterns
   * @param dataset Array of {prompt, optimized_prompt} objects
   * @returns Discovered patterns categorized by type
   */
  discoverPatterns(dataset: { prompt: string, optimized_prompt: string }[]): {
    efficiencyPatterns: OptimizationPattern[],
    qualityPatterns: OptimizationPattern[]
  } {
    const efficiencyPatterns: OptimizationPattern[] = [];
    const qualityPatterns: OptimizationPattern[] = [];

    // Pattern candidates
    const tokenReductionCandidates: Record<string, { count: number, pattern: string, replacement: string, totalTokensSaved: number }> = {};
    const qualityEnhancementCandidates: Record<string, { count: number, pattern: string, enhancement: string, totalTokensAdded: number }> = {};

    // Analyze each example pair
    dataset.forEach(({ prompt, optimized_prompt }) => {
      const originalTokens = this.tokenizer.countTokens(prompt);
      const optimizedTokens = this.tokenizer.countTokens(optimized_prompt);

      if (optimizedTokens < originalTokens) {
        // This is a token reduction example
        this.analyzeTokenReduction(prompt, optimized_prompt, tokenReductionCandidates);
      } else if (optimizedTokens > originalTokens) {
        // This is a quality enhancement example
        this.analyzeQualityEnhancement(prompt, optimized_prompt, qualityEnhancementCandidates);
      }
    });

    // Convert candidates to patterns
    this.convertReductionCandidatesToPatterns(tokenReductionCandidates, efficiencyPatterns);
    this.convertEnhancementCandidatesToPatterns(qualityEnhancementCandidates, qualityPatterns);

    return {
      efficiencyPatterns,
      qualityPatterns
    };
  }

  /**
   * Analyze a token reduction example to find potential patterns
   */
  private analyzeTokenReduction(
    original: string,
    optimized: string,
    candidates: Record<string, { count: number, pattern: string, replacement: string, totalTokensSaved: number }>
  ): void {
    // Simple word replacement detection
    // This is a simplistic approach that could be enhanced with more sophisticated NLP
    const originalWords = original.split(/\s+/);
    const optimizedWords = optimized.split(/\s+/);

    // Find sequences that were removed or replaced
    let i = 0, j = 0;
    while (i < originalWords.length) {
      if (j < optimizedWords.length && originalWords[i] === optimizedWords[j]) {
        // Words match, move both pointers
        i++;
        j++;
      } else {
        // Words don't match, look for a pattern
        let matchFound = false;

        // Try to find the next matching word
        for (let lookAhead = 1; lookAhead <= 5 && i + lookAhead < originalWords.length; lookAhead++) {
          const nextPotentialMatch = originalWords[i + lookAhead];

          // Check if this word appears in the optimized text after current position
          const optimizedIndex = optimizedWords.indexOf(nextPotentialMatch, j);
          if (optimizedIndex !== -1) {
            // We found a potential pattern
            const removedPhrase = originalWords.slice(i, i + lookAhead).join(' ');
            const replacementPhrase = optimizedWords.slice(j, optimizedIndex).join(' ');

            const key = `${removedPhrase}→${replacementPhrase}`;
            if (!candidates[key]) {
              candidates[key] = {
                count: 0,
                pattern: removedPhrase,
                replacement: replacementPhrase,
                totalTokensSaved: 0
              };
            }

            candidates[key].count++;
            const tokensBefore = this.tokenizer.countTokens(removedPhrase);
            const tokensAfter = this.tokenizer.countTokens(replacementPhrase);
            candidates[key].totalTokensSaved += (tokensBefore - tokensAfter);

            // Move pointers
            i += lookAhead;
            j = optimizedIndex + 1;
            matchFound = true;
            break;
          }
        }

        if (!matchFound) {
          // No match found, just skip this word
          i++;
        }
      }
    }
  }

  /**
   * Analyze a quality enhancement example to find potential patterns
   */
  private analyzeQualityEnhancement(
    original: string,
    optimized: string,
    candidates: Record<string, { count: number, pattern: string, enhancement: string, totalTokensAdded: number }>
  ): void {
    // Find common quality enhancement patterns

    // Look for added phrases at the beginning
    if (optimized.startsWith(original.substring(0, 20))) {
      const commonPrefix = this.findLongestCommonPrefix(original, optimized);
      const originalRemaining = original.substring(commonPrefix.length).trim();
      const optimizedRemaining = optimized.substring(commonPrefix.length).trim();

      if (originalRemaining && optimizedRemaining && optimizedRemaining.includes(originalRemaining)) {
        // Enhancement was added around the original content
        const beforeEnhancement = optimizedRemaining.substring(0, optimizedRemaining.indexOf(originalRemaining)).trim();
        const afterEnhancement = optimizedRemaining.substring(optimizedRemaining.indexOf(originalRemaining) + originalRemaining.length).trim();

        if (beforeEnhancement) {
          const key = `prefix:${beforeEnhancement}`;
          if (!candidates[key]) {
            candidates[key] = {
              count: 0,
              pattern: original,
              enhancement: `${beforeEnhancement} ${original}`,
              totalTokensAdded: 0
            };
          }
          candidates[key].count++;
          candidates[key].totalTokensAdded += this.tokenizer.countTokens(beforeEnhancement);
        }

        if (afterEnhancement) {
          const key = `suffix:${afterEnhancement}`;
          if (!candidates[key]) {
            candidates[key] = {
              count: 0,
              pattern: original,
              enhancement: `${original} ${afterEnhancement}`,
              totalTokensAdded: 0
            };
          }
          candidates[key].count++;
          candidates[key].totalTokensAdded += this.tokenizer.countTokens(afterEnhancement);
        }
      }
    }

    // Look for specific type-based enhancements (e.g., commands like "Explain", "Describe")
    const commandRegex = /^(Explain|Describe|Tell me about|Compare|Write|Create|Implement|Generate|List|Analyze|Summarize|Solve|Calculate|Find|Show|Make)(\s+a|\s+an|\s+)?([\w\s]+)$/i;
    const originalMatch = original.match(commandRegex);

    if (originalMatch) {
      const command = originalMatch[1];
      const target = originalMatch[3];

      // Check if the optimized version enhances this command pattern
      if (optimized.includes(command) && optimized.includes(target)) {
        const key = `command:${command}`;
        if (!candidates[key]) {
          candidates[key] = {
            count: 0,
            pattern: `${command} ${target}`,
            enhancement: optimized,
            totalTokensAdded: 0
          };
        }
        candidates[key].count++;
        candidates[key].totalTokensAdded += (this.tokenizer.countTokens(optimized) - this.tokenizer.countTokens(original));
      }
    }
  }

  /**
   * Find the longest common prefix between two strings
   */
  private findLongestCommonPrefix(str1: string, str2: string): string {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  }

  /**
   * Convert token reduction candidates to optimization patterns
   */
  private convertReductionCandidatesToPatterns(
    candidates: Record<string, { count: number, pattern: string, replacement: string, totalTokensSaved: number }>,
    patterns: OptimizationPattern[]
  ): void {
    const minOccurrences = this.options.minOccurrences ?? 3; // Default to 3 if not specified
    const minTokenImpact = this.options.minTokenImpact ?? 2; // Default to 2 if not specified

    Object.entries(candidates)
      .filter(([_, data]) => data.count >= minOccurrences && data.totalTokensSaved >= minTokenImpact)
      .sort((a, b) => b[1].totalTokensSaved - a[1].totalTokensSaved)
      .forEach(([key, data], index) => {
        // Escape regex special characters in the pattern
        const escapedPattern = data.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        patterns.push({
          id: `efficiency-discovered-${index + 1}`,
          category: 'efficiency',
          description: `Replace "${data.pattern}" with "${data.replacement}"`,
          priority: 90 - index, // Assign descending priorities
          preservesFormatting: true,
          find: new RegExp(`\\b${escapedPattern}\\b`, 'gi'),
          replace: data.replacement
        });
      });
  }

  /**
   * Convert quality enhancement candidates to optimization patterns
   */
  private convertEnhancementCandidatesToPatterns(
    candidates: Record<string, { count: number, pattern: string, enhancement: string, totalTokensAdded: number }>,
    patterns: OptimizationPattern[]
  ): void {
    const minOccurrences = this.options.minOccurrences ?? 3; // Default to 3 if not specified

    // Process prefix/suffix enhancements
    const prefixCandidates = Object.entries(candidates)
      .filter(([key, data]) => key.startsWith('prefix:') && data.count >= minOccurrences)
      .sort((a, b) => b[1].count - a[1].count);

    const suffixCandidates = Object.entries(candidates)
      .filter(([key, data]) => key.startsWith('suffix:') && data.count >= minOccurrences)
      .sort((a, b) => b[1].count - a[1].count);

    const commandCandidates = Object.entries(candidates)
      .filter(([key, data]) => key.startsWith('command:') && data.count >= minOccurrences)
      .sort((a, b) => b[1].count - a[1].count);

    // Add prefix patterns
    prefixCandidates.forEach(([key, data], index) => {
      const prefix = key.substring(7); // Remove 'prefix:' part
      patterns.push({
        id: `quality-prefix-${index + 1}`,
        category: 'quality',
        description: `Add prefix: "${prefix}"`,
        priority: 95 - index,
        preservesFormatting: true,
        find: new RegExp(`^${this.escapeRegExp(data.pattern)}$`, 'gm'),
        replace: `${prefix} ${data.pattern}`
      });
    });

    // Add suffix patterns
    suffixCandidates.forEach(([key, data], index) => {
      const suffix = key.substring(7); // Remove 'suffix:' part
      patterns.push({
        id: `quality-suffix-${index + 1}`,
        category: 'quality',
        description: `Add suffix: "${suffix}"`,
        priority: 85 - index,
        preservesFormatting: true,
        find: new RegExp(`^${this.escapeRegExp(data.pattern)}$`, 'gm'),
        replace: `${data.pattern} ${suffix}`
      });
    });

    // Add command enhancement patterns
    commandCandidates.forEach(([key, data], index) => {
      const command = key.substring(8); // Remove 'command:' part

      // Create a more specific pattern based on the command
      patterns.push({
        id: `quality-command-${command.toLowerCase()}-${index + 1}`,
        category: 'quality',
        description: `Enhance "${command}" command`,
        priority: 90 - index,
        preservesFormatting: true,
        find: new RegExp(`^${command}\\s+(\\w[\\w\\s]+)\\.$`, 'gmi'),
        replace: data.enhancement.includes('$1')
          ? data.enhancement
          : `${command} $1. Provide a comprehensive, detailed response with examples and clear structure.`
      });
    });
  }

  /**
   * Escape special characters in regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
} 