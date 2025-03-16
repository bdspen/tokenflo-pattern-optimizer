import { OptimizationPattern } from '../types';

/**
 * Verbosity patterns target unnecessarily verbose expressions and wordiness
 * that can be expressed more concisely
 */
export const verbosityPatterns: OptimizationPattern[] = [
  {
    id: 'remove-redundant-i-want-you-to',
    category: 'verbosity',
    description: 'Replace "I want you to act as" with "You are"',
    priority: 95,
    preservesFormatting: true,
    find: /I want you to (act|serve|function|work|operate) as/gi,
    replace: 'You are'
  },

  // New aggressive patterns for significant token reduction
  {
    id: 'bulletize-instructions',
    category: 'verbosity',
    description: 'Convert long paragraphs of instructions into bullet points',
    priority: 90,
    preservesFormatting: false,
    test: (text) => text.length > 200 && text.split('.').length > 3,
    transform: (text) => {
      // Split into sentences, trim each one, and convert to bullets
      const sentences = text.split(/(?<=[.!?])\s+/);
      return sentences
        .filter(s => s.trim().length > 0)
        .map(s => `• ${s.trim()}`)
        .join('\n');
    }
  },

  {
    id: 'condense-multiple-sentences',
    category: 'verbosity',
    description: 'Condense multiple consecutive short sentences into one',
    priority: 85,
    preservesFormatting: true,
    test: (text) => {
      const sentences = text.split(/(?<=[.!?])\s+/);
      return sentences.length > 3 && sentences.some(s => s.split(' ').length < 8);
    },
    transform: (text) => {
      // Replace multiple short sentences with condensed versions
      return text.replace(/(?<=[.!?])\s+(?=[A-Z])/g, ', ');
    }
  },

  {
    id: 'remove-filler-phrases',
    category: 'verbosity',
    description: 'Remove common filler phrases that add no value',
    priority: 80,
    preservesFormatting: true,
    find: /\b(it is (worth|important) (to )?(note|mention|remember|consider) that|as you (may|might|can) see|if you think about it|in the final analysis|for all intents and purposes|in the event that|it goes without saying that|it should be noted that|due to the fact that|despite the fact that|in spite of the fact that|in order to|for the purpose of|in regards to|with reference to|with regard to|concerning the matter of|it would be helpful if you could|I would (like|appreciate) it if you would)\b/gi,
    replace: ''
  },

  {
    id: 'compact-role-instructions',
    category: 'verbosity',
    description: 'Compact lengthy role instructions into concise directives',
    priority: 75,
    preservesFormatting: false,
    test: (text) => text.includes("you should") && text.length > 300,
    transform: (text) => {
      // Replace "You should X" patterns with more concise forms
      text = text.replace(/\bYou should (be able to|be capable of|have the ability to)\b/gi, 'You can');
      text = text.replace(/\bYou should (have|possess|maintain)\b/gi, 'Have');
      text = text.replace(/\bYou should (provide|give|offer|create|generate)\b/gi, 'Provide');

      // Make instructional lists more concise
      text = text.replace(/\bIt (would be|is) (great|helpful|useful|beneficial) if you could\b/gi, 'Please');

      return text;
    }
  },

  {
    id: 'extremely-compress-instructions',
    category: 'verbosity',
    description: 'Extremely compress long-form instructions to minimal form',
    priority: 70,
    preservesFormatting: false,
    test: (text) => text.length > 500 && text.toLowerCase().includes('should') && text.toLowerCase().includes('will'),
    transform: (text) => {
      // Extract key components and reconstruct in minimal form
      const roleLine = text.match(/I want you to (act|function|serve|be) as an? ([^.,]+)/i);
      const role = roleLine ? roleLine[2].trim() : 'assistant';

      // Create a short instruction set
      let result = `• Role: ${role}\n`;

      // Extract key instructions
      const instructions = text.match(/You (should|will|must|can|need to) ([^.,;]+)/gi);
      if (instructions && instructions.length > 0) {
        result += instructions
          .map(inst => `• ${inst.replace(/^You (should|will|must|can|need to)/i, '').trim()}`)
          .join('\n');
      }

      // Add a task section if we can identify it
      const taskMatch = text.match(/My (first|initial) (request|task|question) is ['""]([^""]+)['"]/i);
      if (taskMatch) {
        result += `\n• Task: "${taskMatch[3].trim()}"`;
      }

      return result;
    }
  },

  // Original patterns below
  {
    id: 'remove-that-is',
    category: 'verbosity',
    description: 'Remove "that is" when used as a filler',
    priority: 60,
    preservesFormatting: true,
    find: /\b,?\s*that is\s*,?\b/gi,
    replace: ','
  },

  {
    id: 'verbosity-1',
    category: 'verbosity',
    description: 'Remove unnecessary introductory phrases',
    priority: 5,
    preservesFormatting: true,
    find: /\b(I would like to|I want to|I'd like to|I need to|I wish to|I desire to) (ask|know|understand|learn|inquire|find out)/gi,
    replace: 'Tell me',
    example: {
      before: 'I would like to ask about the weather tomorrow.',
      after: 'Tell me about the weather tomorrow.'
    }
  },
  {
    id: 'verbosity-2',
    category: 'verbosity',
    description: 'Remove redundant phrases',
    priority: 5,
    preservesFormatting: true,
    find: /\b(in order to|for the purpose of|with the objective of|with the goal of)\b/gi,
    replace: 'to',
    example: {
      before: "I'm writing in order to request information.",
      after: "I'm writing to request information."
    }
  },
  {
    id: 'verbosity-3',
    category: 'verbosity',
    description: 'Simplify "the fact that"',
    priority: 4,
    preservesFormatting: true,
    find: /\bthe fact that\b/gi,
    replace: 'that',
    example: {
      before: 'I am aware of the fact that the deadline is tomorrow.',
      after: 'I am aware that the deadline is tomorrow.'
    }
  },
  {
    id: 'verbosity-4',
    category: 'verbosity',
    description: 'Remove "I think/believe/feel that"',
    priority: 3,
    preservesFormatting: true,
    find: /\b(I think|I believe|I feel|In my opinion|I suppose|I guess) that\b/gi,
    replace: '',
    example: {
      before: 'I think that we should proceed with the plan.',
      after: 'We should proceed with the plan.'
    }
  },
  {
    id: 'verbosity-5',
    category: 'verbosity',
    description: 'Simplify "due to the fact that"',
    priority: 5,
    preservesFormatting: true,
    find: /\bdue to the fact that\b/gi,
    replace: 'because',
    example: {
      before: 'The project was delayed due to the fact that resources were limited.',
      after: 'The project was delayed because resources were limited.'
    }
  },
  {
    id: 'verbosity-6',
    category: 'verbosity',
    description: 'Simplify "at this point in time"',
    priority: 5,
    preservesFormatting: true,
    find: /\bat this point in time\b/gi,
    replace: 'now',
    example: {
      before: 'At this point in time, we cannot proceed with the project.',
      after: 'Now, we cannot proceed with the project.'
    }
  },
  {
    id: 'verbosity-7',
    category: 'verbosity',
    description: 'Remove "please note that"',
    priority: 4,
    preservesFormatting: true,
    find: /\b(please note that|please be advised that|kindly note that)\b/gi,
    replace: '',
    example: {
      before: 'Please note that the meeting has been rescheduled.',
      after: 'The meeting has been rescheduled.'
    }
  },
  {
    id: 'verbosity-8',
    category: 'verbosity',
    description: 'Simplify "in the event that"',
    priority: 4,
    preservesFormatting: true,
    find: /\bin the event that\b/gi,
    replace: 'if',
    example: {
      before: 'In the event that it rains, the event will be canceled.',
      after: 'If it rains, the event will be canceled.'
    }
  },
  {
    id: 'verbosity-9',
    category: 'verbosity',
    description: 'Remove "it is important to note that"',
    priority: 3,
    preservesFormatting: true,
    find: /\b(it is important to note that|it should be noted that|it is worth noting that)\b/gi,
    replace: '',
    example: {
      before: 'It is important to note that the deadline is approaching.',
      after: 'The deadline is approaching.'
    }
  },
  {
    id: 'verbosity-10',
    category: 'verbosity',
    description: 'Simplify "for the reason that"',
    priority: 5,
    preservesFormatting: true,
    find: /\bfor the reason that\b/gi,
    replace: 'because',
    example: {
      before: 'We canceled the event for the reason that attendance was low.',
      after: 'We canceled the event because attendance was low.'
    }
  }
]; 