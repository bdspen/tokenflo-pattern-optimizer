import { OptimizationPattern } from '../types';

/**
 * Formatting patterns optimize whitespace, layout, and structure
 * while preserving the meaning and organization
 */
export const formattingPatterns: OptimizationPattern[] = [
  {
    id: 'optimize-whitespace',
    category: 'formatting',
    description: 'Optimize whitespace by removing excessive spaces and newlines',
    priority: 90,
    preservesFormatting: true,
    find: /\s{2,}/g,
    replace: ' '
  },
  
  {
    id: 'optimize-list-format',
    category: 'formatting',
    description: 'Convert verbose list descriptions to concise bullet points',
    priority: 85,
    preservesFormatting: false,
    test: (text) => {
      return (text.includes('following') || text.includes('list')) && 
             (text.match(/(\d+\.\s+|first,\s*|second,\s*|third,\s*|next,\s*|finally,\s*)/gi) || []).length > 1;
    },
    transform: (text) => {
      // Convert numbered lists or text lists to bullet points
      let result = text;
      
      // Find potential list sections
      const listSections = result.match(/(?:the following|here are|list of|I (need|want))[^:]*:\s*([^]*?)(?=\n\n|\n[A-Z]|$)/gi);
      
      if (listSections) {
        listSections.forEach(section => {
          // Split the section into items
          const items = section.split(/\d+\.\s+|\n+\s*[-•]\s+|\bfirst,\s*|\bsecond,\s*|\bthird,\s*|\bnext,\s*|\bthen,\s*|\blastly,\s*|\bfinally,\s*/gi)
            .filter(item => item.trim().length > 0);
          
          // If we found items, replace the section with bullet points
          if (items.length > 1) {
            const bulletPoints = items.map(item => `• ${item.trim()}`).join('\n');
            result = result.replace(section, bulletPoints);
          }
        });
      }
      
      return result;
    }
  },
  
  {
    id: 'consolidate-instructions',
    category: 'formatting',
    description: 'Consolidate multi-paragraph instructions into concise blocks',
    priority: 80,
    preservesFormatting: false,
    test: (text) => {
      const paragraphs = text.split(/\n\s*\n/);
      return paragraphs.length > 3 && text.length > 400;
    },
    transform: (text) => {
      // Split into paragraphs
      const paragraphs = text.split(/\n\s*\n/);
      
      // Identify common instruction paragraphs
      const instructionParagraphs = paragraphs.filter(p => 
        p.match(/\b(please|you should|provide|ensure|make sure|remember to|don't forget|be sure to)\b/i)
      );
      
      // If we have instruction paragraphs, consolidate them
      if (instructionParagraphs.length > 1) {
        // Extract key sentences from each paragraph
        const instructions = instructionParagraphs
          .flatMap(p => p.split(/(?<=[.!?])\s+/))
          .filter(s => s.trim().length > 0 && 
                    s.match(/\b(please|you should|provide|ensure|make sure|remember to|don't forget|be sure to)\b/i))
          .map(s => `• ${s.trim()}`);
        
        // Replace the instruction paragraphs with consolidated bullet points
        let result = text;
        instructionParagraphs.forEach(p => {
          result = result.replace(p, '');
        });
        
        // Add the consolidated instructions to the end
        if (instructions.length > 0) {
          result = result.trim() + '\n\n' + instructions.join('\n');
        }
        
        return result;
      }
      
      return text;
    }
  },
  
  {
    id: 'compress-code-instructions',
    category: 'formatting',
    description: 'Compress verbose programming/code related instructions',
    priority: 75,
    preservesFormatting: false,
    test: (text) => {
      return text.match(/\b(code|function|program|algorithm|javascript|python|java|c\+\+|typescript|html|css|api)\b/gi) !== null &&
             text.length > 300;
    },
    transform: (text) => {
      // Replace verbose programming instructions with more concise versions
      let result = text;
      
      // Identify language
      const languages = ['javascript', 'python', 'java', 'c++', 'typescript', 'html', 'css', 'php', 'ruby', 'go'];
      let language = null;
      
      for (const lang of languages) {
        if (text.toLowerCase().includes(lang)) {
          language = lang;
          break;
        }
      }
      
      if (language) {
        // Create a more structured instruction
        const taskMatch = text.match(/\b(create|write|implement|develop|generate|build)\s+a\s+([^.]+)/i);
        
        if (taskMatch) {
          const task = taskMatch[2].trim();
          
          // Build a concise instruction
          const formattedResult = [
            `• Language: ${language.charAt(0).toUpperCase() + language.slice(1)}`,
            `• Task: ${task}`,
          ];
          
          // Extract key requirements
          const requirementMatches = text.match(/\b(must|should|needs to|has to)\s+([^.]+)/gi);
          if (requirementMatches) {
            formattedResult.push(`• Requirements:`);
            requirementMatches.forEach(req => {
              formattedResult.push(`  - ${req.replace(/\b(must|should|needs to|has to)\s+/i, '').trim()}`);
            });
          }
          
          // Keep any examples if present
          const exampleMatch = text.match(/\bexample\b[^.]*?[`"']([^`"']+)[`"']/i);
          if (exampleMatch) {
            formattedResult.push(`• Example: ${exampleMatch[1].trim()}`);
          }
          
          return formattedResult.join('\n');
        }
      }
      
      return result;
    }
  },
  
  // Original patterns below
  {
    id: 'format-newlines-after-sentences',
    category: 'formatting',
    description: 'Ensure sentences end with a period and have a single space after',
    priority: 60,
    preservesFormatting: true,
    find: /([.!?])\s*/g,
    replace: '$1 '
  },

  {
    id: 'formatting-1',
    category: 'formatting',
    description: 'Normalize bullet points',
    priority: 3,
    preservesFormatting: false,
    find: /^\s*[-*•+]\s+/gm,
    replace: '- ',
    example: {
      before: '• Item one\n* Item two\n+ Item three',
      after: '- Item one\n- Item two\n- Item three'
    }
  },
  {
    id: 'formatting-2',
    category: 'formatting',
    description: 'Normalize numbered lists',
    priority: 3,
    preservesFormatting: false,
    find: /^\s*(Number|Step|Point)\s+(\d+)[:.-]\s+/gmi,
    replace: '$2. ',
    example: {
      before: 'Number 1: First item\nStep 2. Second item',
      after: '1. First item\n2. Second item'
    }
  },
  {
    id: 'formatting-3',
    category: 'formatting',
    description: 'Convert parenthesis numbered lists to period format',
    priority: 3,
    preservesFormatting: false,
    find: /^\s*(\d+)\)\s+/gm,
    replace: '$1. ',
    example: {
      before: '1) First item\n2) Second item',
      after: '1. First item\n2. Second item'
    }
  },
  {
    id: 'formatting-4',
    category: 'formatting',
    description: 'Reduce excessive line breaks',
    priority: 2,
    preservesFormatting: false,
    find: /\n{3,}/g,
    replace: '\n\n',
    example: {
      before: 'First paragraph\n\n\n\nSecond paragraph',
      after: 'First paragraph\n\nSecond paragraph'
    }
  },
  {
    id: 'formatting-5',
    category: 'formatting',
    description: 'Remove trailing whitespace',
    priority: 1,
    preservesFormatting: false,
    find: /[ \t]+$/gm,
    replace: '',
    example: {
      before: 'Line with trailing spaces    \nAnother line\t\t',
      after: 'Line with trailing spaces\nAnother line'
    }
  },
  {
    id: 'formatting-6',
    category: 'formatting',
    description: 'Remove leading whitespace',
    priority: 1,
    preservesFormatting: false,
    find: /^[ \t]+/gm,
    replace: '',
    example: {
      before: '    Indented line\n\t\tTabbed line',
      after: 'Indented line\nTabbed line'
    }
  },
  {
    id: 'formatting-7',
    category: 'formatting',
    description: 'Reduce multiple spaces to single space',
    priority: 1,
    preservesFormatting: false,
    find: /[ \t]{2,}/g,
    replace: ' ',
    example: {
      before: 'Text with     multiple    spaces',
      after: 'Text with multiple spaces'
    }
  },
  {
    id: 'formatting-8',
    category: 'formatting',
    description: 'Convert equals sign headers to markdown',
    priority: 4,
    preservesFormatting: false,
    find: /^=+\s*(.+?)\s*=+$/gm,
    replace: '# $1',
    example: {
      before: '=========\nTitle\n=========',
      after: '# Title'
    }
  },
  {
    id: 'formatting-9',
    category: 'formatting',
    description: 'Convert dash headers to markdown',
    priority: 4,
    preservesFormatting: false,
    find: /^-+\s*(.+?)\s*-+$/gm,
    replace: '## $1',
    example: {
      before: '----------\nSubtitle\n----------',
      after: '## Subtitle'
    }
  },
  {
    id: 'formatting-10',
    category: 'formatting',
    description: 'Convert explicit section markers to markdown',
    priority: 4,
    preservesFormatting: false,
    find: /^\s*(SECTION|HEADING|TITLE):\s*(.+)$/gmi,
    replace: '# $2',
    example: {
      before: 'SECTION: Important Information',
      after: '# Important Information'
    }
  },
  {
    id: 'formatting-11',
    category: 'formatting',
    description: 'Normalize table cell spacing',
    priority: 2,
    preservesFormatting: false,
    find: /\|\s+/g,
    replace: '| ',
    example: {
      before: '| Column 1    | Column 2    |',
      after: '| Column 1 | Column 2 |'
    }
  },
  {
    id: 'formatting-12',
    category: 'formatting',
    description: 'Normalize code block openings',
    priority: 3,
    preservesFormatting: false,
    find: /```\s+([a-zA-Z0-9]+)\s+/g,
    replace: '```$1\n',
    example: {
      before: '```   javascript   ',
      after: '```javascript\n'
    }
  },
  {
    id: 'formatting-13',
    category: 'formatting',
    description: 'Convert numbered list text markers to numbers',
    priority: 5,
    preservesFormatting: false,
    find: /^\s*(First|Firstly|First of all|To begin with)[:,]\s*/gmi,
    replace: '1. ',
    example: {
      before: 'First: Do this step.',
      after: '1. Do this step.'
    }
  },
  {
    id: 'formatting-14',
    category: 'formatting',
    description: 'Convert quoted lines to blockquotes',
    priority: 4,
    preservesFormatting: false,
    find: /^["'](.+)["']$/gm,
    replace: '> $1',
    example: {
      before: '"This is a quotation"',
      after: '> This is a quotation'
    }
  },
  {
    id: 'formatting-15',
    category: 'formatting',
    description: 'Remove redundant formatting instructions',
    priority: 6,
    preservesFormatting: false,
    find: /\b(format the (output|response) as|use the following format|format your (answer|response) like this):/gi,
    replace: '',
    example: {
      before: 'Format the output as: A numbered list.',
      after: 'A numbered list.'
    }
  }
]; 