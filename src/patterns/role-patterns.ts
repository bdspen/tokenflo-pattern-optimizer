import { OptimizationPattern } from '../types';

/**
 * Role patterns optimize role-playing instructions and persona definitions
 * to reduce token usage while preserving the essential role information
 */
export const rolePatterns: OptimizationPattern[] = [
  {
    id: 'role-expertise-compression',
    category: 'role',
    description: 'Compress expertise descriptions into concise bullet points',
    priority: 95,
    preservesFormatting: false,
    test: (text) => {
      return text.match(/\b(knowledge|expertise|experience|understanding|familiar|proficient)\b/gi) !== null &&
        text.length > 300;
    },
    transform: (text) => {
      // Extract expertise descriptions and convert to bullet points
      let result = text;

      // Replace verbose expertise descriptions
      result = result.replace(
        /You should (use|apply|leverage|utilize) your (knowledge|expertise|experience|understanding) (of|in|with) ([^.]+)\./gi,
        '• Apply $2 in $4.'
      );

      // Replace "You should be knowledgeable about" patterns
      result = result.replace(
        /You should be (knowledgeable|familiar|proficient|experienced|an expert) (about|in|with) ([^.]+)\./gi,
        '• Knowledge: $3.'
      );

      return result;
    }
  },

  {
    id: 'role-knowledge-compression',
    category: 'role',
    description: 'Compress knowledge requirements into concise bullet points',
    priority: 90,
    preservesFormatting: false,
    test: (text) => {
      return text.includes("knowledgeable about") || text.includes("familiar with");
    },
    transform: (text) => {
      // Extract knowledge requirements
      let result = text;

      // Replace "You should be knowledgeable about X, Y, and Z" patterns
      result = result.replace(
        /You should be (knowledgeable|familiar|proficient|experienced|an expert) (about|in|with) ([^.]+)\./gi,
        '• Knowledge: $3.'
      );

      return result;
    }
  },

  {
    id: 'role-simplify-my-first-request',
    category: 'role',
    description: 'Simplify "My first request is" patterns',
    priority: 85,
    preservesFormatting: true,
    find: /My (first|initial) (request|task|question|prompt) is ['""]([^""]+)['"]/gi,
    replace: 'Task: "$3"'
  },

  {
    id: 'compress-persona-descriptions',
    category: 'role',
    description: 'Compress verbose persona descriptions',
    priority: 80,
    preservesFormatting: false,
    test: (text) => {
      return text.match(/\b(act as|pretend to be|role-play as|assume the role of)\b/gi) !== null &&
        text.length > 400;
    },
    transform: (text) => {
      // Extract the role and key characteristics
      const roleMatch = text.match(/\b(act as|pretend to be|role-play as|assume the role of) an? ([^.,]+)/i);

      if (roleMatch) {
        const role = roleMatch[2].trim();
        let result = `• Role: ${role}\n`;

        // Extract key characteristics
        const traits: string[] = [];
        const traitMatches = text.match(/\b(you are|you should be|as a [^,]+, you are) ([^.,]+)/gi);

        if (traitMatches) {
          traitMatches.forEach(match => {
            const trait = match.replace(/\b(you are|you should be|as a [^,]+, you are) /i, '').trim();
            if (trait && !traits.includes(trait)) {
              traits.push(trait);
            }
          });
        }

        if (traits.length > 0) {
          result += `• Traits: ${traits.join(', ')}\n`;
        }

        // Extract responsibilities
        const responsibilities: string[] = [];
        const respMatches = text.match(/\b(you will|you should|your job is to|your task is to|you need to) ([^.,]+)/gi);

        if (respMatches) {
          respMatches.forEach(match => {
            const resp = match.replace(/\b(you will|you should|your job is to|your task is to|you need to) /i, '').trim();
            if (resp && !responsibilities.includes(resp)) {
              responsibilities.push(resp);
            }
          });
        }

        if (responsibilities.length > 0) {
          result += `• Responsibilities:\n`;
          responsibilities.forEach(resp => {
            result += `  - ${resp}\n`;
          });
        }

        // Extract the first task if present
        const taskMatch = text.match(/\bMy (first|initial) (request|task|question) is ['""]([^""]+)['"]/i);
        if (taskMatch) {
          result += `• Task: "${taskMatch[3].trim()}"`;
        }

        return result;
      }

      return text;
    }
  },

  {
    id: 'condense-character-roleplay',
    category: 'role',
    description: 'Condense character roleplay instructions',
    priority: 75,
    preservesFormatting: false,
    test: (text) => {
      return text.match(/\b(character|fictional|persona|personality|dialogue|conversation)\b/gi) !== null &&
        text.length > 300;
    },
    transform: (text) => {
      // Extract character information
      const characterMatch = text.match(/\b(act as|pretend to be|role-play as|assume the role of) ([^.,]+)/i);

      if (characterMatch) {
        const character = characterMatch[2].trim();
        let result = `• Character: ${character}\n`;

        // Extract personality traits
        const traits: string[] = [];
        const traitMatches = text.match(/\b(personality|character traits|characteristics|demeanor|attitude|tone) [^.]*?(is|are|includes|should be) ([^.]+)/gi);

        if (traitMatches) {
          traitMatches.forEach(match => {
            const trait = match.replace(/\b(personality|character traits|characteristics|demeanor|attitude|tone) [^.]*?(is|are|includes|should be) /i, '').trim();
            if (trait && !traits.includes(trait)) {
              traits.push(trait);
            }
          });
        }

        if (traits.length > 0) {
          result += `• Traits: ${traits.join(', ')}\n`;
        }

        // Extract speaking style
        const styleMatch = text.match(/\b(speak|talk|communicate|respond|reply|answer|write) [^.]*?(in|with|using) ([^.]+) (style|manner|way|tone|voice)/i);
        if (styleMatch) {
          result += `• Style: ${styleMatch[3].trim()}\n`;
        }

        // Extract the first dialogue if present
        const dialogueMatch = text.match(/\bMy (first|initial) (message|question|statement) is ['""]([^""]+)['"]/i);
        if (dialogueMatch) {
          result += `• First message: "${dialogueMatch[3].trim()}"`;
        }

        return result;
      }

      return text;
    }
  }
];
