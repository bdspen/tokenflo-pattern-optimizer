import { OptimizationPattern } from '../types';
import { verbosityPatterns } from './verbosity-patterns';
import { fillerPatterns } from './filler-patterns';
import { formattingPatterns } from './formatting-patterns';
import { instructionalPatterns } from './instructional-patterns';
import { technicalPatterns } from './technical-patterns';
import { rolePatterns } from './role-patterns';
import { structuralPatterns } from './structural-patterns';

// All available pattern categories
const CATEGORIES = [
  'verbosity',
  'filler',
  'formatting',
  'instructional',
  'technical',
  'role',
  'structural'
];

/**
 * Get all available patterns
 * @returns All patterns
 */
export function getAllPatterns(): OptimizationPattern[] {
  return [
    ...verbosityPatterns,
    ...fillerPatterns,
    ...formattingPatterns,
    ...instructionalPatterns,
    ...technicalPatterns,
    ...rolePatterns,
    ...structuralPatterns
  ];
}

/**
 * Get patterns by category
 * @param category Category to get patterns for
 * @returns Patterns in the category
 */
export function getPatternsByCategory(category: string): OptimizationPattern[] {
  if (category === 'all') {
    return getAllPatterns();
  }

  switch (category) {
    case 'verbosity':
      return verbosityPatterns;
    case 'filler':
      return fillerPatterns;
    case 'formatting':
      return formattingPatterns;
    case 'instructional':
      return instructionalPatterns;
    case 'technical':
      return technicalPatterns;
    case 'role':
      return rolePatterns;
    case 'structural':
      return structuralPatterns;
    default:
      return [];
  }
}

/**
 * Get patterns by aggressiveness level
 * @param level Aggressiveness level
 * @returns Patterns for the level
 */
export function getPatternsByAggressiveness(level: 'low' | 'medium' | 'high'): OptimizationPattern[] {
  const allPatterns = getAllPatterns();

  switch (level) {
    case 'low':
      // Only include patterns that don't change meaning
      return allPatterns.filter(pattern =>
        pattern.category === 'filler' ||
        pattern.category === 'formatting' ||
        (pattern.category === 'structural' && pattern.priority && pattern.priority < 60)
      );

    case 'medium':
      // Include moderate patterns that preserve essential meaning
      return allPatterns.filter(pattern =>
        pattern.category === 'filler' ||
        pattern.category === 'formatting' ||
        pattern.category === 'verbosity' ||
        (pattern.category === 'structural' && pattern.priority && pattern.priority < 80) ||
        (pattern.category === 'instructional' && pattern.priority && pattern.priority < 90) ||
        ((pattern.category === 'technical' || pattern.category === 'role') && pattern.priority && pattern.priority < 70)
      );

    case 'high':
      // Include all patterns, prioritizing structural patterns
      return [
        // First apply structural patterns for maximum effect
        ...allPatterns.filter(pattern => pattern.category === 'structural'),
        // Then apply other patterns
        ...allPatterns.filter(pattern => pattern.category !== 'structural')
      ];

    default:
      return allPatterns;
  }
}

/**
 * Get all available categories
 * @returns All categories
 */
export function getAvailableCategories(): string[] {
  return [...CATEGORIES];
}

// Export pattern collections
export * from './verbosity-patterns';
export * from './filler-patterns';
export * from './formatting-patterns';
export * from './instructional-patterns';
export * from './technical-patterns';
export * from './role-patterns';
export * from './structural-patterns';
