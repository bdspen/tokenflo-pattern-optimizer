import { OptimizationPattern } from '../types';

/**
 * Filler patterns remove unnecessary words, phrases, and expressions
 * that don't contribute to the meaning of the text
 */
export const fillerPatterns: OptimizationPattern[] = [
  {
    id: 'remove-please',
    category: 'filler',
    description: 'Remove unnecessary "please" from instructions',
    priority: 90,
    preservesFormatting: true,
    find: /\b(please)\b\s+/gi,
    replace: ''
  },

  {
    id: 'remove-all-redundant-polite-phrases',
    category: 'filler',
    description: 'Remove all redundant polite phrases',
    priority: 85,
    preservesFormatting: true,
    find: /\b(I would appreciate it if you could|I would be grateful if you could|I would like to ask you to|If you don't mind|If it's not too much trouble|I was wondering if you could|Would you mind|Could you please|Would you be able to|If you could|If possible|If you can|I kindly request you to)\b/gi,
    replace: ''
  },

  {
    id: 'remove-all-filler-words',
    category: 'filler',
    description: 'Remove all filler words and phrases',
    priority: 80,
    preservesFormatting: true,
    find: /\b(actually|basically|essentially|practically|virtually|really|honestly|frankly|truly|literally|simply|just|very|quite|extremely|obviously|clearly|of course|needless to say|as you know|as you may know|as we all know|as I mentioned earlier|as previously stated|as I said before|as stated above|like I said|like I mentioned)\b\s*/gi,
    replace: ''
  },

  {
    id: 'remove-all-hedge-words',
    category: 'filler',
    description: 'Remove all hedge words and phrases',
    priority: 75,
    preservesFormatting: true,
    find: /\b(I think|I believe|In my opinion|From my perspective|It seems to me|It appears that|It looks like|It could be|It might be|It may be|Perhaps|Maybe|Possibly|Probably|Presumably|Seemingly|Apparently|Generally|Typically|Usually|Normally|To some extent|More or less|Kind of|Sort of|A bit|A little|Somewhat|Fairly|Rather|Quite)\b\s*/gi,
    replace: ''
  },

  {
    id: 'simplify-compound-prepositions',
    category: 'filler',
    description: 'Simplify compound prepositions',
    priority: 70,
    preservesFormatting: true,
    find: /\b(in order to|for the purpose of|in the process of|in the course of|in the case of|on the subject of|in relation to|with regard to|with respect to|on the basis of|on the grounds of|in the event of|in the absence of|with the exception of|by means of|by virtue of|by way of|for the reason that|due to the fact that|owing to the fact that|on account of the fact that|in view of the fact that|on the grounds that)\b/gi,
    replace: (match) => {
      const replacements: Record<string, string> = {
        'in order to': 'to',
        'for the purpose of': 'for',
        'in the process of': 'during',
        'in the course of': 'during',
        'in the case of': 'for',
        'on the subject of': 'about',
        'in relation to': 'about',
        'with regard to': 'about',
        'with respect to': 'about',
        'on the basis of': 'from',
        'on the grounds of': 'because',
        'in the event of': 'if',
        'in the absence of': 'without',
        'with the exception of': 'except',
        'by means of': 'by',
        'by virtue of': 'by',
        'by way of': 'by',
        'for the reason that': 'because',
        'due to the fact that': 'because',
        'owing to the fact that': 'because',
        'on account of the fact that': 'because',
        'in view of the fact that': 'because',
        'on the grounds that': 'because'
      };

      return replacements[match.toLowerCase()] || match;
    }
  },

  {
    id: 'extreme-space-optimization',
    category: 'filler',
    description: 'Extremely aggressive space optimization',
    priority: 65,
    preservesFormatting: false,
    test: (text) => text.length > 500,
    transform: (text) => {
      // Replace phrases that don't add value with nothing
      text = text.replace(/\bI would like you to\b/gi, '');
      text = text.replace(/\bI want you to\b/gi, '');
      text = text.replace(/\bI need you to\b/gi, '');
      text = text.replace(/\bYou need to\b/gi, '');
      text = text.replace(/\bYou should\b/gi, '');
      text = text.replace(/\bI would like\b/gi, '');

      // Replace wordy instructions with brief alternatives
      text = text.replace(/\bMake sure (to|that you)\b/gi, '');
      text = text.replace(/\bKeep in mind\b/gi, '');
      text = text.replace(/\bTake note (of|that)\b/gi, '');
      text = text.replace(/\bIt('s| is) important (to|that)\b/gi, '');

      // Convert long-form instructions to bullets
      if (text.length > 1000) {
        const paragraphs = text.split(/\n\s*\n/);

        if (paragraphs.length > 2) {
          text = paragraphs.map(p => {
            // Only convert paragraphs with clear instructions
            if (p.match(/\b(should|will|must|need to|have to|can|may|might)\b/i)) {
              // Split into sentences
              const sentences = p.split(/(?<=[.!?])\s+/);
              return sentences
                .filter(s => s.trim().length > 0)
                .map(s => `• ${s.trim()}`)
                .join('\n');
            }
            return p;
          }).join('\n\n');
        }
      }

      return text;
    }
  },

  // Original patterns below
  {
    id: 'filler-1',
    category: 'filler',
    description: 'Remove "I would like to request" filler',
    priority: 60,
    preservesFormatting: true,
    find: /I would like to request that you/gi,
    replace: 'Please'
  },

  {
    id: 'filler-2',
    category: 'filler',
    description: 'Remove "basically"',
    priority: 7,
    preservesFormatting: true,
    find: /\bbasically\b/gi,
    replace: '',
    example: {
      before: 'Basically, we need to finish this by Friday.',
      after: 'We need to finish this by Friday.'
    }
  },
  {
    id: 'filler-3',
    category: 'filler',
    description: 'Remove "just"',
    priority: 6,
    preservesFormatting: true,
    find: /\bjust\b/gi,
    replace: '',
    example: {
      before: 'I just wanted to ask you a question.',
      after: 'I wanted to ask you a question.'
    }
  },
  {
    id: 'filler-4',
    category: 'filler',
    description: 'Remove "kind of/sort of"',
    priority: 6,
    preservesFormatting: true,
    find: /\b(kind of|sort of)\b/gi,
    replace: '',
    example: {
      before: "It's kind of important to finish this soon.",
      after: "It's important to finish this soon."
    }
  },
  {
    id: 'filler-5',
    category: 'filler',
    description: 'Remove "literally"',
    priority: 6,
    preservesFormatting: true,
    find: /\bliterally\b/gi,
    replace: '',
    example: {
      before: "I literally can't believe it.",
      after: "I can't believe it."
    }
  },
  {
    id: 'filler-6',
    category: 'filler',
    description: 'Remove "honestly"',
    priority: 6,
    preservesFormatting: true,
    find: /\b(honestly|to be honest|to tell the truth|frankly speaking)\b/gi,
    replace: '',
    example: {
      before: "Honestly, I don't think this will work.",
      after: "I don't think this will work."
    }
  },
  {
    id: 'filler-7',
    category: 'filler',
    description: 'Remove "as you know"',
    priority: 7,
    preservesFormatting: true,
    find: /\b(as you (may |might )?(know|are aware)|as we (all )?know)\b/gi,
    replace: '',
    example: {
      before: 'As you know, the deadline is approaching.',
      after: 'The deadline is approaching.'
    }
  },
  {
    id: 'filler-8',
    category: 'filler',
    description: 'Remove "in my humble opinion"',
    priority: 7,
    preservesFormatting: true,
    find: /\b(in my (humble |personal |honest )?opinion|IMHO)\b/gi,
    replace: '',
    example: {
      before: 'In my humble opinion, we should reconsider this approach.',
      after: 'We should reconsider this approach.'
    }
  },
  {
    id: 'filler-9',
    category: 'filler',
    description: 'Remove "needless to say"',
    priority: 7,
    preservesFormatting: true,
    find: /\b(needless to say|it goes without saying that)\b/gi,
    replace: '',
    example: {
      before: 'Needless to say, this is an important issue.',
      after: 'This is an important issue.'
    }
  },
  {
    id: 'filler-10',
    category: 'filler',
    description: 'Remove "I mean"',
    priority: 7,
    preservesFormatting: true,
    find: /\bI mean,?\b/gi,
    replace: '',
    example: {
      before: 'I mean, we should consider all options.',
      after: 'We should consider all options.'
    }
  },
  {
    id: 'filler-11',
    category: 'filler',
    description: 'Remove "please note that"',
    priority: 7,
    preservesFormatting: true,
    find: /\b(please note that|i would like to mention that|it is worth mentioning that|it should be noted that)\b/gi,
    replace: '',
    example: {
      before: 'Please note that the meeting has been rescheduled.',
      after: 'The meeting has been rescheduled.'
    }
  },
  {
    id: 'filler-12',
    category: 'filler',
    description: 'Simplify request phrases',
    priority: 8,
    preservesFormatting: true,
    find: /\b(i would like (you )?to|i want you to|i'd like you to|i need you to)\b/gi,
    replace: 'Please',
    example: {
      before: 'I would like you to analyze this data.',
      after: 'Please analyze this data.'
    }
  },
  {
    id: 'filler-13',
    category: 'filler',
    description: 'Simplify thank you phrases',
    priority: 5,
    preservesFormatting: true,
    find: /\b(thank you (very much |a lot |so much |in advance )?for your (help|assistance|time|attention|consideration))\b/gi,
    replace: 'Thanks',
    example: {
      before: 'Thank you very much for your help with this matter.',
      after: 'Thanks with this matter.'
    }
  },
  {
    id: 'filler-14',
    category: 'filler',
    description: 'Remove gratitude in advance',
    priority: 4,
    preservesFormatting: true,
    find: /\b(thanks in advance|thank you in advance)\b/gi,
    replace: '',
    example: {
      before: 'Please send me the report. Thanks in advance.',
      after: 'Please send me the report.'
    }
  },
  {
    id: 'filler-15',
    category: 'filler',
    description: 'Remove politeness qualifiers',
    priority: 7,
    preservesFormatting: true,
    find: /\b(if it'?s not too much (trouble|to ask)|if you don'?t mind|if possible)\b/gi,
    replace: '',
    example: {
      before: "Could you send me the report, if it's not too much trouble?",
      after: "Could you send me the report?"
    }
  }
]; 