import { OptimizationPattern } from '../types';

/**
 * Patterns for optimizing instructional text in prompts
 */
export const instructionalPatterns: OptimizationPattern[] = [
  {
    id: 'instructional-1',
    category: 'instructional',
    description: 'Remove "your task is to" phrase',
    priority: 9,
    preservesFormatting: true,
    find: /\byour task is to\b/gi,
    replace: '',
    example: {
      before: 'Your task is to analyze this data.',
      after: 'Analyze this data.'
    }
  },
  {
    id: 'instructional-2',
    category: 'instructional',
    description: 'Replace "I need you to" with "Please"',
    priority: 9,
    preservesFormatting: true,
    find: /\bi need you to\b/gi,
    replace: 'Please',
    example: {
      before: 'I need you to write a summary.',
      after: 'Please write a summary.'
    }
  },
  {
    id: 'instructional-3',
    category: 'instructional',
    description: 'Replace "I want you to act as" with "Act as"',
    priority: 9,
    preservesFormatting: true,
    find: /\bi want you to act as\b/gi,
    replace: 'Act as',
    example: {
      before: 'I want you to act as a financial advisor.',
      after: 'Act as a financial advisor.'
    }
  },
  {
    id: 'instructional-4',
    category: 'instructional',
    description: 'Remove AI self-references',
    priority: 8,
    preservesFormatting: true,
    find: /\b(as an ai language model|as an ai assistant|as a language model|as an assistant)\b/gi,
    replace: '',
    example: {
      before: 'As an AI language model, I need you to analyze this text.',
      after: 'I need you to analyze this text.'
    }
  },
  {
    id: 'instructional-5',
    category: 'instructional',
    description: 'Remove AI capability references',
    priority: 8,
    preservesFormatting: true,
    find: /\busing your (knowledge|training|capabilities) (as an AI|as a language model)\b/gi,
    replace: '',
    example: {
      before: 'Using your capabilities as an AI, generate a report.',
      after: 'Generate a report.'
    }
  },
  {
    id: 'instructional-6',
    category: 'instructional',
    description: 'Replace complex request phrases with "Please"',
    priority: 7,
    preservesFormatting: true,
    find: /\bi (would like|want) (to|you to) (ask|request) (that|if|for) you\b/gi,
    replace: 'Please',
    example: {
      before: 'I would like to request that you review this document.',
      after: 'Please review this document.'
    }
  },
  {
    id: 'instructional-7',
    category: 'instructional',
    description: 'Replace "my request is that you" with "Please"',
    priority: 7,
    preservesFormatting: true,
    find: /\bmy request is that you\b/gi,
    replace: 'Please',
    example: {
      before: 'My request is that you analyze the following data.',
      after: 'Please analyze the following data.'
    }
  },
  {
    id: 'instructional-8',
    category: 'instructional',
    description: 'Remove instruction modifiers',
    priority: 6,
    preservesFormatting: true,
    find: /\bin (a clear|an organized|a concise|a detailed) (manner|way|format)\b/gi,
    replace: '',
    example: {
      before: 'Write a summary in a concise manner.',
      after: 'Write a summary.'
    }
  },
  {
    id: 'instructional-9',
    category: 'instructional',
    description: 'Remove redundant adverbs',
    priority: 6,
    preservesFormatting: true,
    find: /\b(clearly|carefully|thoroughly) (explain|describe|analyze|summarize)\b/gi,
    replace: '$2',
    example: {
      before: 'Thoroughly explain the concept of inflation.',
      after: 'Explain the concept of inflation.'
    }
  },
  {
    id: 'instructional-10',
    category: 'instructional',
    description: 'Simplify format instructions',
    priority: 5,
    preservesFormatting: true,
    find: /\b(provide|include|give) (a|your) (answer|response|reply|output) (in|as|using) (the following|this) format:?\b/gi,
    replace: 'Format:',
    example: {
      before: 'Provide your response in the following format:',
      after: 'Format:'
    }
  },
  {
    id: 'instructional-11',
    category: 'instructional',
    description: 'Simplify inclusion instructions',
    priority: 5,
    preservesFormatting: true,
    find: /\b(make sure (to|that you)|ensure that you|don't forget to|remember to) (include|provide|add)\b/gi,
    replace: 'Include',
    example: {
      before: 'Make sure to include relevant examples.',
      after: 'Include relevant examples.'
    }
  },
  {
    id: 'instructional-12',
    category: 'instructional',
    description: 'Remove redundant task assignments',
    priority: 8,
    preservesFormatting: true,
    find: /\b(you are being asked to|you are tasked with|your job is to|you are requested to)\b/gi,
    replace: '',
    example: {
      before: 'You are being asked to review the proposal.',
      after: 'Review the proposal.'
    }
  },
  {
    id: 'instructional-13',
    category: 'instructional',
    description: 'Replace analysis phrases with "Analyze"',
    priority: 7,
    preservesFormatting: true,
    find: /\b(perform|conduct|carry out|do) (a|an) (analysis|review|evaluation|assessment) of\b/gi,
    replace: 'Analyze',
    example: {
      before: 'Perform an analysis of the quarterly results.',
      after: 'Analyze the quarterly results.'
    }
  },
  {
    id: 'instructional-14',
    category: 'instructional',
    description: 'Simplify writing request phrases',
    priority: 6,
    preservesFormatting: true,
    find: /\b(write|compose|draft) (a|an|the) (comprehensive|detailed|thorough|complete|in-depth)\b/gi,
    replace: 'Write a',
    example: {
      before: 'Write a comprehensive report on climate change.',
      after: 'Write a report on climate change.'
    }
  },
  {
    id: 'instructional-15',
    category: 'instructional',
    description: 'Simplify explanation request phrases',
    priority: 6,
    preservesFormatting: true,
    find: /\b(explain|describe|clarify|elaborate on) (to me|for me|in detail)\b/gi,
    replace: 'Explain',
    example: {
      before: 'Explain to me how photosynthesis works.',
      after: 'Explain how photosynthesis works.'
    }
  }
]; 