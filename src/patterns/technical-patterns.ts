import { OptimizationPattern } from '../types';

/**
 * Technical patterns optimize programming-related prompts, technical language,
 * and specialized terminology
 */
export const technicalPatterns: OptimizationPattern[] = [
  {
    id: 'tech-code-block-instructions',
    category: 'technical',
    description: 'Optimize instructions about code blocks',
    priority: 90,
    preservesFormatting: true,
    find: /I want you to only reply with the (?:code|output|terminal output|result) inside one unique code block,? and nothing else/gi,
    replace: 'Reply: code block only'
  },

  {
    id: 'tech-code-response-format',
    category: 'technical',
    description: 'Optimize code response format instructions',
    priority: 85,
    preservesFormatting: true,
    test: (text) => {
      return text.toLowerCase().includes('code block') &&
        text.toLowerCase().includes('nothing else') &&
        text.length > 100;
    },
    transform: (text) => {
      // Convert verbose code format instructions into concise bullets
      let result = text;

      // Extract type if present (javascript, python, etc.)
      const codeTypeMatch = text.match(/\b(javascript|python|java|c\+\+|typescript|html|css|ruby|go|bash|shell)\b/i);
      const codeType = codeTypeMatch ? codeTypeMatch[1] : '';

      // Process common response format instructions
      result = result.replace(
        /(\b(?:do not|don't) (include|add|put|place|write) (?:any )?(?:comments|explanations|descriptions|notes|text).*?\.|Do not explain (?:the|your) (?:code|solution).*?\.)/gi,
        'No explanations.'
      );

      // Process code block format instructions
      result = result.replace(
        /I (?:want|need) you to (?:only |just )?(?:reply|respond|return|give me|provide) (?:the |your )?(?:code|solution|answer) (?:inside|in|within|using) (?:a |one )?(?:single |unique )?code blocks?.*?\./gi,
        `Reply: ${codeType} code block only.`
      );

      return result;
    }
  },

  {
    id: 'condense-api-documentation',
    category: 'technical',
    description: 'Condense verbose API documentation instructions',
    priority: 80,
    preservesFormatting: false,
    test: (text) => {
      return (text.match(/\b(api|endpoint|documentation|interface|swagger|openapi|rest|restful)\b/gi) || []).length > 1 &&
        text.length > 250;
    },
    transform: (text) => {
      // Condense API documentation instructions
      const apiKeywords = ['api', 'endpoint', 'documentation', 'interface', 'swagger', 'openapi', 'rest', 'restful'];
      const hasApiKeywords = apiKeywords.some(keyword => text.toLowerCase().includes(keyword));

      if (hasApiKeywords) {
        // Extract the key components
        const formatMatch = text.match(/\b(in (?:json|yaml|xml|markdown|md))\b/i);
        const format = formatMatch ? formatMatch[1].replace('in ', '') : 'JSON';

        // Extract action
        const actionMatch = text.match(/\b(create|generate|write|document|produce|design)\b/i);
        const action = actionMatch ? actionMatch[1] : 'Create';

        // Create a structured result
        const lines = [
          `• ${action} API docs in ${format.toUpperCase()}`,
        ];

        // Add endpoints if specified
        const endpointMatches = text.match(/\b(GET|POST|PUT|DELETE|PATCH)\s+([/\w-]+)/gi);
        if (endpointMatches && endpointMatches.length > 0) {
          lines.push('• Endpoints:');
          endpointMatches.forEach(endpoint => {
            lines.push(`  - ${endpoint.trim()}`);
          });
        }

        // Add requirements if present
        const requirementMatches = text.match(/\b(include|should have|must have|needs to have|requires)\s+([^.,]+)/gi);
        if (requirementMatches && requirementMatches.length > 0) {
          lines.push('• Include:');
          requirementMatches.forEach(req => {
            lines.push(`  - ${req.replace(/\b(include|should have|must have|needs to have|requires)\s+/i, '').trim()}`);
          });
        }

        return lines.join('\n');
      }

      return text;
    }
  },

  {
    id: 'shorten-technical-requirements',
    category: 'technical',
    description: 'Shorten verbose technical requirements',
    priority: 75,
    preservesFormatting: false,
    test: (text) => {
      return (text.match(/\b(requirements|features|functionality|specifications|specs)\b/gi) || []).length > 0 &&
        text.length > 300;
    },
    transform: (text) => {
      // Look for requirement sections that could be bulletized
      let result = text;

      // Find potential requirement sections
      const reqSections = result.match(/(?:the |following |these )(?:requirements|features|specs)(?:[^:]*):([^]*?)(?=\n\n|\n[A-Z]|$)/gi);

      if (reqSections) {
        reqSections.forEach(section => {
          // Split into individual requirements
          const requirements = section.split(/\d+\.\s+|\n+\s*[-•]\s+|\. /g)
            .filter(req => req.trim().length > 0);

          // If we found requirements, replace with bullet points
          if (requirements.length > 1) {
            const bulletPoints = requirements.map(req => `• ${req.trim()}`).join('\n');
            result = result.replace(section, bulletPoints);
          }
        });
      }

      // Remove common filler phrases in technical requirements
      result = result.replace(/\b(it is necessary that|it is required that|the system must|the application should|the software will|we need to|we need the|I need you to|I want you to|you will need to|you should make sure that|please ensure that|make sure to|don't forget to)\b/gi, '');

      return result;
    }
  },

  {
    id: 'streamline-database-instructions',
    category: 'technical',
    description: 'Streamline database-related instructions',
    priority: 70,
    preservesFormatting: false,
    test: (text) => {
      return (text.match(/\b(database|sql|query|table|schema|relational|nosql|mongodb|postgres|mysql)\b/gi) || []).length > 1 &&
        text.length > 200;
    },
    transform: (text) => {
      // Process database-related instructions

      // Identify database type
      const dbTypes = ['mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'sql server', 'mongodb', 'dynamodb', 'cassandra', 'redis'];
      let dbType = 'SQL';

      for (const type of dbTypes) {
        if (text.toLowerCase().includes(type)) {
          dbType = type;
          break;
        }
      }

      // Extract tables if specified
      const tables: string[] = [];
      const tableMatches = text.match(/\btable[s]?\s+(?:called|named)?\s*[""']?([a-z0-9_]+)[""']?/gi);

      if (tableMatches) {
        tableMatches.forEach(match => {
          const tableName = match.replace(/\btable[s]?\s+(?:called|named)?\s*[""']?/i, '').replace(/[""']?$/i, '');
          if (tableName && !tables.includes(tableName)) {
            tables.push(tableName);
          }
        });
      }

      // Check if this is about query creation
      const isQueryTask = text.toLowerCase().includes('query') ||
        text.toLowerCase().includes('select') ||
        text.toLowerCase().includes('write a sql');

      if (isQueryTask) {
        // Format as a query task
        const lines = [
          `• Database: ${dbType}`,
        ];

        if (tables.length > 0) {
          lines.push(`• Tables: ${tables.join(', ')}`);
        }

        // Extract the specific query task
        const queryMatch = text.match(/\b(write|create|generate|give me)\s+a\s+(?:sql\s+)?query\s+(?:that|to|which)\s+([^.]+)/i);
        if (queryMatch) {
          lines.push(`• Query: ${queryMatch[2].trim()}`);
        }

        return lines.join('\n');
      }

      // If not a specific query task, just shorten the text
      let result = text;

      // Remove common filler phrases in database requirements
      result = result.replace(/\b(I would like you to|I need you to|I want you to|Please|Could you|Can you|You should|You need to)\b/gi, '');

      return result;
    }
  },

  // Original patterns below

  {
    id: 'tech-simplify-stack-lists',
    category: 'technical',
    description: 'Simplify technology stack listings',
    priority: 100,
    preservesFormatting: true,
    find: /You will develop an? [^.]+ (using|with) (the )?(following|these) (tools|technologies|stack|libraries|frameworks):\s*([^.]+)\./gi,
    replace: 'Tech: $5.'
  },
  {
    id: 'tech-code-example-request',
    category: 'technical',
    description: 'Optimize code example requests',
    priority: 95,
    preservesFormatting: true,
    find: /I will (provide|give) you with [^.]+ and you will (provide|write|create) [^.]+ code [^.]+\./gi,
    replace: 'Write code based on my specifications.'
  },
  {
    id: 'tech-terminal-instructions',
    category: 'technical',
    description: 'Optimize terminal simulation instructions',
    priority: 85,
    preservesFormatting: true,
    find: /I want you to act as a [^.]+ terminal\. I will (type|write) commands and you will reply with what the [^.]+ terminal should show\./gi,
    replace: 'Simulate a terminal. Process my commands and show output only.'
  },
  {
    id: 'tech-file-optimization',
    category: 'technical',
    description: 'Optimize file handling instructions',
    priority: 80,
    preservesFormatting: true,
    find: /You should merge files in(to)? (a )?(single|one) [^.]+ file and nothing else\./gi,
    replace: 'Merge into single file.'
  },
  {
    id: 'tech-explanation-removal',
    category: 'technical',
    description: 'Remove technical explanation requests',
    priority: 75,
    preservesFormatting: true,
    find: /do not write explanations\./gi,
    replace: 'no explanations.'
  },
  {
    id: 'tech-programming-instructions',
    category: 'technical',
    description: 'Simplify programming task instructions',
    priority: 70,
    preservesFormatting: true,
    find: /I will provide (you with )?(some |the )?(details|specifications|requirements) (about|for|related to) [^.]+, and (it will be your job|your task is) to [^.]+\./gi,
    replace: 'Given requirements, you will create code.'
  },
  {
    id: 'tech-remove-prompt-context',
    category: 'technical',
    description: 'Remove unnecessary prompt context in technical requests',
    priority: 60,
    preservesFormatting: true,
    find: /This could (include|involve) [^.]+\./gi,
    replace: ''
  },
  {
    id: 'tech-api-interaction',
    category: 'technical',
    description: 'Optimize API interaction instructions',
    priority: 55,
    preservesFormatting: true,
    find: /You should (use|utilize|employ) [^.]+ in order to [^.]+\./gi,
    replace: ''
  }
]; 