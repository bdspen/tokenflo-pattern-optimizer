import { OptimizationPattern } from '../types';
import { verbosityPatterns } from './verbosity-patterns';
import { fillerPatterns } from './filler-patterns';
import { formattingPatterns } from './formatting-patterns';
import { instructionalPatterns } from './instructional-patterns';
import { technicalPatterns } from './technical-patterns';
import { rolePatterns } from './role-patterns';

// All available pattern categories
const CATEGORIES = [
  'verbosity',
  'filler',
  'formatting',
  'instructional',
  'technical',
  'role'
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
    ...rolePatterns
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
        pattern.category === 'formatting'
      );

    case 'medium':
      // Include all except the most aggressive patterns
      return allPatterns.filter(pattern =>
        (pattern.category !== 'technical' && pattern.category !== 'role') ||
        ((pattern.category === 'technical' || pattern.category === 'role') && pattern.priority && pattern.priority < 80)
      );

    case 'high':
      // Include all patterns
      return allPatterns;

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