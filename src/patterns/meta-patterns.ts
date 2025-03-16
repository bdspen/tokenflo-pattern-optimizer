import { OptimizationPattern } from '../types';

/**
 * Meta-patterns focus on structural optimizations that can apply across multiple domains
 * These patterns target common inefficiencies in prompt construction regardless of topic
 */

const metaPatterns: OptimizationPattern[] = [
  {
    id: 'remove-redundant-i-want-you-to',
    category: 'meta',
    description: 'Remove redundant "I want you to act as" phrasing',
    priority: 100,
    preservesFormatting: true,
    find: /I want you to (act|behave|function|serve) as an? ([a-z\s-]+)\./gi,
    replace: 'You are a $2.'
  },
  {
    id: 'remove-excessive-politeness',
    category: 'meta',
    description: 'Remove excessive politeness markers',
    priority: 90,
    preservesFormatting: true,
    find: /(please|kindly|if you could|if you would|I would appreciate it if you could|would you mind)\s+/gi,
    replace: ''
  },
  {
    id: 'shorten-do-not-instructions',
    category: 'meta',
    description: 'Convert negative instructions to more concise forms',
    priority: 85,
    preservesFormatting: true,
    find: /Do not (write|provide|include|add|give) (any )?explanations\.?/gi,
    replace: 'No explanations.'
  },
  {
    id: 'consolidate-repeated-instructions',
    category: 'meta',
    description: 'Consolidate repeated instructions into a single instance',
    priority: 80,
    preservesFormatting: true,
    find: /(I want you to only reply with [^.]+\.)\s+.*(only reply with [^.]+\.)/gi,
    replace: '$1'
  },
  {
    id: 'convert-paragraphs-to-bullets',
    category: 'meta',
    description: 'Convert instruction paragraphs to bullet points',
    priority: 75,
    preservesFormatting: true,
    find: /You should ([^.]+)\. You should also ([^.]+)\. Additionally, ([^.]+)\./gi,
    replace: '• $1\n• $2\n• $3'
  },
  {
    id: 'remove-performance-reassurance',
    category: 'meta',
    description: 'Remove unnecessary performance reassurances',
    priority: 70,
    preservesFormatting: true,
    find: /You (should|must|need to|have to) (use|utilize|employ|apply) your (knowledge|expertise|understanding|skills) of [^.]+\./gi,
    replace: ''
  },
  {
    id: 'simplify-my-first-request',
    category: 'meta',
    description: 'Simplify "my first request" phrasing',
    priority: 65,
    preservesFormatting: true,
    find: /My (first|initial) (request|suggestion request|question) is ?("|')?/gi,
    replace: 'Task: $3'
  },
  {
    id: 'remove-confirmation-requests',
    category: 'meta',
    description: 'Remove requests for confirmation',
    priority: 60,
    preservesFormatting: true,
    find: /Reply "?OK"? (to confirm|if you understood)\.?/gi,
    replace: ''
  },
  {
    id: 'compress-formatting-instructions',
    category: 'meta',
    description: 'Compress lengthy formatting instructions',
    priority: 55,
    preservesFormatting: true,
    find: /I want you to (only reply|respond) with [^.]+, and nothing else\./gi,
    replace: 'Format: $1 only.'
  },
  {
    id: 'optimize-role-descriptions',
    category: 'meta',
    description: 'Optimize verbose role descriptions',
    priority: 50,
    preservesFormatting: true,
    find: /Your (role|job|task) (is|will be) to ([^.]+)\. You (will|should) ([^.]+)\./gi,
    replace: 'Role: $3, $5.'
  }
];

export default metaPatterns; 