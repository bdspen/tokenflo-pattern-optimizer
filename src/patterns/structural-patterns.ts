import { OptimizationPattern } from '../types';

/**
 * Structural patterns focus on common prompt structures and formats
 * These patterns can identify and optimize various prompt components regardless of domain
 */
export const structuralPatterns: OptimizationPattern[] = [
  // Section header optimizations
  {
    id: 'simplify-markdown-headers',
    category: 'structural',
    description: 'Simplify verbose markdown headers',
    priority: 100,
    preservesFormatting: true,
    find: /##+ ([A-Z][A-Z\s]+)(?:\s+AND\s+|\s+&\s+)([A-Z][A-Z\s]+)(\n|$)/g,
    replace: '# $1 $2$3'
  },
  {
    id: 'remove-redundant-title',
    category: 'structural',
    description: 'Remove redundant title when followed by sections',
    priority: 99,
    preservesFormatting: true,
    find: /^# [^\n]{10,60}\s+(?:Prompt|Template|Guide|Instructions)\n\n/g,
    replace: ''
  },
  
  // Role definition optimizations
  {
    id: 'condense-role-definitions',
    category: 'structural',
    description: 'Condense verbose role definitions',
    priority: 95,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:ROLE|CONTEXT|IDENTITY)[^\n]*\n)You (?:are|will act as) (?:an? )?([^.,]+), (?:an? )?([^.,]+) (?:that|who) ([^.]{20,100})\./g,
    replace: '\n# ROLE\nYou: $1, $2. $3.'
  },
  {
    id: 'condense-assistant-definitions',
    category: 'structural',
    description: 'Condense assistant definitions',
    priority: 94,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:ROLE|CONTEXT|IDENTITY)[^\n]*\n)You are (?:an? )?([^.,]+) (?:assistant|agent|bot|helper) (?:for|specializing in) ([^.]{10,100})\. Your (?:primary |main )?(?:role|job|purpose|goal) is to ([^.]{10,100})\./g,
    replace: '\n# ROLE\nYou: $1 for $2. Purpose: $3.'
  },
  
  // Knowledge base optimizations
  {
    id: 'condense-knowledge-sections',
    category: 'structural',
    description: 'Condense knowledge base sections',
    priority: 90,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:KNOWLEDGE|INFORMATION|EXPERTISE)[^\n]*\n)(?:You (?:have|possess) (?:access to|knowledge of) the following (?:information|knowledge|data):\n)?((?:- [^\n]+\n){3,10})/g,
    replace: '\n# KNOWLEDGE\n$1'
  },
  
  // Voice/tone optimizations
  {
    id: 'condense-voice-tone-sections',
    category: 'structural',
    description: 'Condense voice and tone sections',
    priority: 85,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:VOICE|TONE|STYLE)[^\n]*\n)((?:- [^\n]+\n){3,8})/g,
    replace: '\n# VOICE\n$1'
  },
  
  // Response structure optimizations
  {
    id: 'condense-response-structure',
    category: 'structural',
    description: 'Condense response structure sections',
    priority: 80,
    preservesFormatting: true,
    test: (text) => {
      return text.includes("RESPONSE") && 
             (text.match(/\d+\.\s*\*\*[^*]+\*\*\s*-\s*[^\n]+/g) || []).length >= 3;
    },
    transform: (text) => {
      // Find response structure sections
      const sections = text.match(/(?:^|\n)(?:#+\s*(?:RESPONSE|OUTPUT|ANSWER)\s+(?:STRUCTURE|FORMAT|STYLE)[^\n]*\n)(?:(?:\d+\.\s*\*\*[^*]+\*\*\s*-\s*[^\n]+\n){3,})/g);
      
      if (!sections || sections.length === 0) return text;
      
      let result = text;
      
      for (const section of sections) {
        // Extract the numbered items and remove descriptions
        const steps = section.match(/\d+\.\s*\*\*([^*]+)\*\*\s*-\s*[^\n]+/g);
        if (!steps) continue;
        
        const header = '# RESPONSE FORMAT\n';
        const condensedSteps = steps.map(step => {
          const number = step.match(/(\d+)\./)?.[1] || '';
          const title = step.match(/\*\*([^*]+)\*\*/)?.[1] || '';
          return `${number}. ${title}`;
        }).join('\n');
        
        const condensed = `\n${header}${condensedSteps}`;
        
        // Replace in the text
        result = result.replace(section, condensed);
      }
      
      return result;
    }
  },
  
  // Capabilities optimizations
  {
    id: 'condense-capabilities-section',
    category: 'structural',
    description: 'Condense capabilities sections',
    priority: 75,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:CAPABILITIES|ABILITIES|FUNCTIONS)[^\n]*\n)(?:###\s*You (?:CAN|SHOULD|MUST|ARE ABLE TO):\n)((?:- [^\n]+\n){4,})/g,
    replace: '\n# CAPABILITIES\n$1'
  },
  
  // Limitations optimizations
  {
    id: 'condense-limitations-section',
    category: 'structural',
    description: 'Condense limitations sections',
    priority: 70,
    preservesFormatting: true,
    find: /(?:^|\n)(?:###\s*You (?:CANNOT|SHOULD NOT|MUST NOT|ARE NOT ABLE TO):\n)((?:- [^\n]+\n){4,})/g,
    replace: '\n# LIMITATIONS\n$1'
  },
  
  // Example optimizations
  {
    id: 'condense-examples-section',
    category: 'structural',
    description: 'Condense example interactions',
    priority: 65,
    preservesFormatting: false,
    test: (text) => {
      return text.includes("Example") && 
             (text.match(/\*\*User:\*\*|\*\*Human:\*\*|\*\*Question:\*\*/g) || []).length > 0 &&
             (text.match(/\*\*(?:Assistant|AI|Bot|You):\*\*|\*\*Answer:\*\*/g) || []).length > 0;
    },
    transform: (text) => {
      // Find example sections
      const exampleSections = text.match(/(?:^|\n)(?:#+\s*(?:EXAMPLES?|SAMPLE|INTERACTIONS?)[^\n]*\n)(?:###\s*(?:Example|Sample)\s*\d+:?\s*([^\n]+)\n\n\*\*(?:User|Human|Question):\*\*\s*([^\n]+)\n\n\*\*(?:Assistant|AI|Bot|You|Answer):\*\*\s*([^\n]+(?:\n(?!\n\*\*|\n###)[^\n]*)*))(?=\n\n###|\n\n##|\n*$)/g);
      
      if (!exampleSections || exampleSections.length === 0) return text;
      
      let result = text;
      
      for (const section of exampleSections) {
        // Extract components
        const titleMatch = section.match(/###\s*(?:Example|Sample)\s*\d+:?\s*([^\n]+)/);
        const title = titleMatch ? titleMatch[1] : "Example";
        
        const userMatch = section.match(/\*\*(?:User|Human|Question):\*\*\s*([^\n]+)/);
        const user = userMatch ? userMatch[1] : "";
        
        const assistantMatch = section.match(/\*\*(?:Assistant|AI|Bot|You|Answer):\*\*\s*([^\n]+(?:\n(?!\n\*\*|\n###)[^\n]*)*)/);
        const assistant = assistantMatch ? assistantMatch[1] : "";
        
        // Create condensed version
        const condensed = `### ${title}\nQ: ${user}\nA: ${assistant.split('\n').join(' ').substring(0, 100)}${assistant.length > 100 ? '...' : ''}`;
        
        // Replace in the text
        result = result.replace(section, condensed);
      }
      
      // If we have multiple examples, add a header
      if (exampleSections.length > 1) {
        const examplesHeader = /(?:^|\n)#+\s*(?:EXAMPLES?|SAMPLE|INTERACTIONS?)[^\n]*\n/;
        result = result.replace(examplesHeader, '\n# EXAMPLES\n');
      }
      
      return result;
    }
  },
  
  // Bullet point optimizations
  {
    id: 'condense-similar-bullet-points',
    category: 'structural',
    description: 'Condense similar bullet points',
    priority: 60,
    preservesFormatting: true,
    find: /- ([^\n]{5,30})\n- ([^\n]{5,30})\n- ([^\n]{5,30})\n- ([^\n]{5,30})\n- ([^\n]{5,30})\n/g,
    replace: '- $1\n- $2\n- $3, $4, $5\n'
  },
  
  // Instruction optimizations
  {
    id: 'condense-instruction-paragraphs',
    category: 'structural',
    description: 'Condense instruction paragraphs',
    priority: 55,
    preservesFormatting: true,
    find: /(?:If|When) ([^,.]{10,40}), (?:you should|you must|please) ([^.]{10,40})\. (?:This will|This helps|This allows) ([^.]{10,40})\./g,
    replace: '$1 → $2. $3.'
  },
  
  // Continuous improvement section optimizations
  {
    id: 'condense-improvement-sections',
    category: 'structural',
    description: 'Condense improvement sections',
    priority: 50,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:CONTINUOUS |ONGOING )?(?:IMPROVEMENT|LEARNING|FEEDBACK)[^\n]*\n)(?:After each interaction,? )?(?:you should |please )?(?:record|note|track|document):\n((?:- [^\n]+\n){2,6})(?:This (?:information|feedback|data) will be used to ([^.]+)\.)?/g,
    replace: '\n# IMPROVEMENT\nRecord: $1'
  },
  
  // Updates section optimizations
  {
    id: 'condense-updates-sections',
    category: 'structural',
    description: 'Condense updates sections',
    priority: 45,
    preservesFormatting: true,
    find: /(?:^|\n)(?:#+\s*(?:UPDATES?|MAINTENANCE)[^\n]*\n)This (?:prompt|document|instruction set) will be (?:reviewed|updated) ([^.]+)\. Last updated: ([^.]+)\./g,
    replace: '\n# UPDATES\n$1. Last updated: $2'
  }
];
