# TokenFlo Pattern Optimizer

A TypeScript package for optimizing AI prompts to reduce token usage without requiring API calls, while preserving semantic meaning.

[![npm version](https://badge.fury.io/js/tokenflo-pattern-optimizer.svg)](https://badge.fury.io/js/tokenflo-pattern-optimizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Reduces prompt tokens by 15-25% using rule-based optimization
- 🔄 Supports multiple LLM tokenizers (OpenAI GPT, Anthropic Claude, etc.)
- 🧠 Preserves semantic meaning and functionality of prompts
- 📚 Includes extensive pattern libraries for different optimization strategies
- 📊 Provides before/after analysis with token counts and savings metrics
- 🌐 Works in both browser and Node.js environments
- 🧩 Modular architecture for easy extension and maintenance
- 🔒 Robust error handling and edge case management
- 📈 Performance optimized with proper LRU caching
- 🔄 Pattern versioning and conflict resolution

## Installation

```bash
npm install tokenflo-pattern-optimizer
```

or with yarn:

```bash
yarn add tokenflo-pattern-optimizer
```

## Quick Start

```typescript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

// Create optimizer with default settings
const optimizer = new PromptOptimizer({
  model: 'gpt-3.5-turbo',
  aggressiveness: 'medium'
});

// Optimize a prompt
const result = optimizer.optimize(`
I would like you to provide a comprehensive analysis of the current market trends 
in the renewable energy sector. Please make sure to include information about 
solar, wind, and hydroelectric power. It would be great if you could also discuss 
the impact of recent government policies on the industry.
`);

console.log(`Original tokens: ${result.originalTokenCount}`);
console.log(`Optimized tokens: ${result.optimizedTokenCount}`);
console.log(`Reduction: ${result.percentSaved.toFixed(2)}%`);
console.log(`Optimized text: ${result.optimizedText}`);
```

## How It Works

Static Prompt Optimizer uses a pattern-based approach to reduce token usage in prompts:

1. **Pattern Libraries**: The package includes carefully crafted pattern libraries for different types of optimizations:
   - **Verbosity**: Removes unnecessarily wordy phrases
   - **Filler**: Eliminates filler words that don't add meaning
   - **Formatting**: Optimizes whitespace and layout
   - **Instructional**: Streamlines common instruction patterns
   - **Technical**: Optimizes technical terminology

2. **Tokenization**: Built-in tokenizers for different LLM models accurately measure token count savings.

3. **Configuration Options**: Control which optimizations to apply and how aggressively to apply them.

4. **Preservation of Meaning**: Patterns are designed to maintain the original intent and meaning of the prompt.

5. **Optimization Strategies**:
   - **Pattern-based Optimization**: Apply regex and transform patterns to reduce token usage
   - **Dual Optimization**: Balance between token efficiency and output quality
   - **Customizable Patterns**: Add your own patterns for domain-specific optimizations

## Architecture

The package is built with a modular architecture that separates concerns and allows for easy extension:

1. **BaseOptimizer Interface**: Common interface for all optimizer implementations
2. **PatternOptimizer**: Core implementation that applies patterns to reduce token usage
3. **DualOptimizer**: Advanced implementation that balances between token efficiency and quality
4. **Pattern Registry**: Manages patterns with versioning and conflict resolution
5. **Tokenizers**: Adapters for different LLM models to accurately count tokens
6. **Token Cache**: Efficient LRU cache to avoid redundant tokenization

## API Reference

### PromptOptimizer

The main class for optimizing prompts.

```typescript
class PromptOptimizer {
  constructor(config?: OptimizerConfig);
  
  // Core methods
  optimize(text: string): OptimizationResult;
  countTokens(text: string, model?: string): number;
  
  // Configuration methods
  addPattern(pattern: OptimizationPattern): void;
  enableCategory(category: string): void;
  disableCategory(category: string): void;
  setAggressiveness(level: 'low' | 'medium' | 'high'): void;
  setModel(model: string): void;
  setPreserveFormatting(preserve: boolean): void;
  setTrackPatternEffectiveness(track: boolean): void;
  getConfig(): OptimizerConfig;
  
  // Analysis methods
  getPatterns(): OptimizationPattern[];
  getPatternEffectivenessMetrics(): Map<string, PatternEffectivenessMetrics>;
  getMostEffectivePatterns(limit?: number): OptimizationPattern[];
}
```

### Configuration

```typescript
interface OptimizerConfig {
  model: string;                  // Target model for tokenization
  aggressiveness: 'low' | 'medium' | 'high';  // How aggressive the optimization should be
  preserveFormatting: boolean;    // Whether to preserve specific formatting
  enabledCategories: string[];    // Which pattern categories to enable
  customPatterns: OptimizationPattern[];  // Custom patterns to include
  trackPatternEffectiveness?: boolean; // Whether to track pattern effectiveness metrics
  includePerformanceMetrics?: boolean; // Whether to include performance metrics in results
}
```

### Optimization Result

```typescript
interface OptimizationResult {
  originalText: string;          // The input text
  optimizedText: string;         // The optimized text
  originalTokenCount: number;    // Token count before optimization
  optimizedTokenCount: number;   // Token count after optimization
  tokensSaved: number;           // Number of tokens saved
  percentSaved: number;          // Percentage of tokens reduced
  appliedPatterns: AppliedPatternInfo[];  // Patterns that were applied, with metrics
  skippedPatterns: OptimizationPattern[];  // Patterns that were skipped
  performanceMetrics?: {         // Optional performance metrics
    executionTimeMs: number;     // Time taken for optimization
    tokensPerSecond: number;     // Processing speed
  };
}
```

### Optimization Pattern

```typescript
interface OptimizationPattern {
  id: string;                    // Unique identifier for the pattern
  category: string;              // Category of the pattern
  description: string;           // Description of what the pattern does
  example?: {                    // Example of the pattern in action
    before: string;
    after: string;
  };
  disabled?: boolean;            // Whether the pattern is disabled
  preservesFormatting?: boolean; // Whether the pattern preserves formatting
  priority?: number;             // Priority of the pattern (higher = applied first)
  effectivenessMetrics?: PatternEffectivenessMetrics; // Metrics tracking pattern effectiveness
  test?: (text: string) => boolean; // Function to test if the pattern applies
  transform?: (text: string) => string; // Function to transform text
  find?: RegExp | string;        // Regular expression or string to find
  replace?: string | ((substring: string, ...args: any[]) => string); // String or function to replace with
}
```

### Pattern Effectiveness Metrics

```typescript
interface PatternEffectivenessMetrics {
  timesApplied: number;          // Number of times pattern was applied
  totalTokensSaved: number;      // Total tokens saved by this pattern
  avgTokensSaved: number;        // Average tokens saved per application
  timesSkipped: number;          // Number of times pattern was skipped
  successRate: number;           // Success rate (0-1) of pattern application
  lastApplied?: number;          // Timestamp of last application
}
```

### DualOptimizer

Advanced optimizer that balances between token efficiency and quality.

```typescript
class DualOptimizer implements BaseOptimizer {
  constructor(config: DualOptimizerConfig);
  
  // Core methods
  optimize(text: string): DualOptimizationResult;
  addPattern(pattern: OptimizationPattern): void;
  getPatterns(): OptimizationPattern[];
  
  // Specialized methods
  addTokenEfficiencyPatterns(patterns: OptimizationPattern[]): void;
  addQualityPatterns(patterns: OptimizationPattern[]): void;
  setQualityEfficiencyBalance(balance: number): void;
  setModel(model: string): void;
}

interface DualOptimizerConfig {
  qualityVsEfficiencyBalance: number; // 0 = max efficiency, 1 = max quality
  model: string;                      // Target model for tokenization
  customPatterns?: OptimizationPattern[]; // Custom patterns to add
}

interface DualOptimizationResult extends OptimizationResult {
  qualityVsEfficiencyBalance: number; // The balance used for this optimization
}
```

## Examples

### Basic Optimization

```typescript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

const optimizer = new PromptOptimizer();

const prompt = `
Hello there! I would like to ask for your assistance with something.
In order to complete my project, I need you to analyze this data.
`;

const result = optimizer.optimize(prompt);
console.log(result.optimizedText);
// Output: "Hello! Please analyze this data."
console.log(`Tokens saved: ${result.tokensSaved} (${result.percentSaved.toFixed(1)}%)`);
```

### Custom Patterns

```typescript
import { PromptOptimizer, OptimizationPattern } from 'tokenflo-pattern-optimizer';

const optimizer = new PromptOptimizer();

// Add a custom pattern for domain-specific terminology
optimizer.addPattern({
  id: 'custom-ml-terms',
  category: 'custom',
  description: 'Shorten machine learning terms',
  priority: 8,
  find: /\bmachine learning\b/gi,
  replace: 'ML'
});

const result = optimizer.optimize("Let's use machine learning to solve this problem.");
console.log(result.optimizedText);
// Output: "Let's use ML to solve this problem."

// Check pattern effectiveness
const metrics = optimizer.getPatternEffectivenessMetrics();
console.log(metrics.get('custom-ml-terms'));
```

### Different Aggressiveness Levels

```typescript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

const prompt = `
I would like to request that you perform an analysis of the potential applications
of Artificial Intelligence in healthcare. Please make sure to include information
about patient diagnosis systems, drug discovery, and administrative improvements.
`;

const optimizer = new PromptOptimizer();

// Try different levels
optimizer.setAggressiveness('low');
const lowResult = optimizer.optimize(prompt);

optimizer.setAggressiveness('medium');
const mediumResult = optimizer.optimize(prompt);

optimizer.setAggressiveness('high');
const highResult = optimizer.optimize(prompt);

console.log(`Low: ${lowResult.percentSaved.toFixed(2)}% reduction`);
console.log(`Medium: ${mediumResult.percentSaved.toFixed(2)}% reduction`);
console.log(`High: ${highResult.percentSaved.toFixed(2)}% reduction`);
```

### Using the DualOptimizer

```typescript
import { createDualOptimizer } from 'tokenflo-pattern-optimizer';

// Create a dual optimizer with custom balance
const dualOptimizer = createDualOptimizer({
  qualityVsEfficiencyBalance: 0.7, // Favor quality over efficiency
  model: 'gpt-4'
});

const prompt = `
I would like to request that you perform an analysis of the potential applications
of Artificial Intelligence in healthcare. Please make sure to include information
about patient diagnosis systems, drug discovery, and administrative improvements.
`;

// Optimize with balanced approach
const result = dualOptimizer.optimize(prompt);

console.log(`Optimized text: ${result.optimizedText}`);
console.log(`Tokens saved: ${result.tokensSaved} (${result.percentSaved.toFixed(1)}%)`);
console.log(`Quality/Efficiency balance: ${result.qualityVsEfficiencyBalance}`);

// Adjust balance to favor efficiency more
dualOptimizer.setQualityEfficiencyBalance(0.3);
const efficientResult = dualOptimizer.optimize(prompt);

console.log(`More efficient version saved: ${efficientResult.percentSaved.toFixed(1)}%`);
```

### Enabling/Disabling Categories

```typescript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

const optimizer = new PromptOptimizer();

// Only use verbosity patterns
optimizer.disableCategory('all');
optimizer.enableCategory('verbosity');

// Or combine multiple categories
optimizer.disableCategory('all');
optimizer.enableCategory('verbosity');
optimizer.enableCategory('filler');

// Get available categories
const categories = optimizer.getAvailableCategories();
console.log('Available categories:', categories);
```

### Performance Metrics

```typescript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

const optimizer = new PromptOptimizer({
  model: 'gpt-3.5-turbo',
  includePerformanceMetrics: true
});

const longPrompt = `
This is a long prompt that will be used to test the performance metrics.
`.repeat(100);

const result = optimizer.optimize(longPrompt);

console.log(`Execution time: ${result.performanceMetrics?.executionTimeMs.toFixed(2)}ms`);
console.log(`Processing speed: ${result.performanceMetrics?.tokensPerSecond.toFixed(0)} tokens/sec`);
```

## Pattern Categories

The optimizer includes several categories of optimization patterns:

1. **Filler Patterns**: Removes unnecessary pleasantries, hedge words, gratuitous phrases, and filler words that don't add meaning to the prompt.

2. **Verbosity Patterns**: Simplifies verbose expressions, redundant wording, and wordiness that can be expressed more concisely.

3. **Formatting Patterns**: Optimizes whitespace, bullet points, numbered lists, and text layout while preserving structure.

4. **Instructional Patterns**: Streamlines common instruction phrases, request formats, and command structures.

5. **Technical Patterns**: Optimizes technical and domain-specific language, simplifies programming references, and condenses specialized terminology.

6. **Role Patterns**: Optimizes role descriptions and persona definitions commonly used in prompts.

7. **Meta Patterns**: Higher-level patterns that can transform the overall structure of prompts.

## Error Handling

The package includes robust error handling to ensure reliability:

1. **Input Validation**: All inputs are validated to ensure they meet the expected types and formats.

2. **Pattern Validation**: Patterns are validated to ensure they have all required properties.

3. **Graceful Degradation**: If a pattern fails to apply, the optimizer will continue with other patterns.

4. **Detailed Error Messages**: All errors include detailed messages to help diagnose issues.

5. **Type Safety**: The package is written in TypeScript with strict type checking.

## Browser Usage

TokenFlo Pattern Optimizer is fully compatible with modern browsers and can be used in web applications.

### Via CDN

```html
<script src="https://unpkg.com/tokenflo-pattern-optimizer@0.1.0/dist/browser/index.js"></script>
<script>
  const optimizer = new TokenFloOptimizer.PromptOptimizer();
  
  const result = optimizer.optimize("Your prompt text here");
  console.log(`Tokens saved: ${result.tokensSaved}`);
</script>
```

### Via npm and bundlers

```javascript
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

const optimizer = new PromptOptimizer();
const result = optimizer.optimize("Your prompt text here");
```

### React Component Example

```jsx
import React, { useState } from 'react';
import { PromptOptimizer } from 'tokenflo-pattern-optimizer';

function PromptOptimizerComponent() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const optimizer = new PromptOptimizer();

  const handleOptimize = () => {
    const optimizationResult = optimizer.optimize(input);
    setResult(optimizationResult);
  };

  return (
    <div>
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Enter your prompt here"
      />
      <button onClick={handleOptimize}>Optimize</button>
      
      {result && (
        <div>
          <h3>Results:</h3>
          <p>Original tokens: {result.originalTokenCount}</p>
          <p>Optimized tokens: {result.optimizedTokenCount}</p>
          <p>Tokens saved: {result.tokensSaved} ({result.percentSaved.toFixed(2)}%)</p>
          <h4>Optimized Text:</h4>
          <pre>{result.optimizedText}</pre>
        </div>
      )}
    </div>
  );
}
```

### Browser Considerations

When using in a browser environment, we recommend:

1. **Bundling**: Use a bundler like webpack, Rollup, or Parcel for optimal performance
2. **Web Workers**: Process large prompts in a Web Worker to avoid blocking the main thread
3. **Performance Monitoring**: Use the performance metrics to monitor optimization speed
4. **Tokenizer Differences**: Note that the browser version uses gpt-tokenizer instead of tiktoken
5. **Large Prompts**: For very large prompts, consider chunking the text to avoid UI freezes

## Performance Optimization

The package includes several performance optimizations:

1. **Token Caching**: An efficient LRU cache is used to avoid redundant tokenization.

2. **Pattern Prioritization**: Patterns are applied in order of priority to maximize token savings.

3. **Early Termination**: Patterns can include test functions to quickly determine if they apply.

4. **Memory Efficiency**: The package is designed to minimize memory usage, even with large prompts.

5. **Performance Metrics**: Optional performance metrics help identify bottlenecks.

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Areas for contribution:
- Adding new optimization patterns
- Improving tokenization accuracy
- Enhancing browser compatibility
- Adding support for new LLM models
- Improving performance for large prompts
- Adding new test cases

## License

MIT
