import { PromptOptimizer, OptimizationPattern } from '../src';

// Create a custom optimization pattern
const customPattern: OptimizationPattern = {
  id: 'custom-1',
  category: 'custom',
  description: 'Replace specific domain terminology with shorter equivalents',
  priority: 8,
  preservesFormatting: true,
  find: /\bArtificial Intelligence\b/gi,
  replace: 'AI',
  example: {
    before: 'We use Artificial Intelligence to analyze data.',
    after: 'We use AI to analyze data.'
  }
};

// Create an optimizer with custom configuration
const optimizer = new PromptOptimizer({
  model: 'gpt-4',
  aggressiveness: 'high',
  preserveFormatting: false,
  enabledCategories: ['verbosity', 'filler', 'technical'],
  customPatterns: [customPattern]
});

// Example prompt with various optimization opportunities
const prompt = `
I would like to request that you perform an analysis of the potential applications of Artificial Intelligence in the healthcare sector.

My request is that you focus on the following areas:

1. Patient diagnosis and monitoring systems that utilize Artificial Intelligence algorithms
2. The use of Artificial Intelligence in drug discovery and development processes
3. Administrative efficiency improvements through the implementation of Artificial Intelligence

For each of these areas, I would appreciate it if you could provide:
- A brief explanation of how Artificial Intelligence is currently being used
- Potential future developments in this specific application area
- Challenges and limitations that need to be overcome

In your analysis, please be sure to consider ethical implications and regulatory considerations that may impact the adoption of Artificial Intelligence technologies in healthcare settings.

Thank you very much for your time and attention to this request. I look forward to reading your detailed and comprehensive analysis.
`;

// Optimize the prompt
const resultDefault = optimizer.optimize(prompt);

// Now try different aggressiveness levels
console.log('Original prompt token count:', optimizer.countTokens(prompt));
console.log('\nDifferent aggressiveness levels:');

optimizer.setAggressiveness('low');
const resultLow = optimizer.optimize(prompt);
console.log('Low:', resultLow.optimizedTokenCount, `(${resultLow.percentSaved.toFixed(2)}% reduction)`);

optimizer.setAggressiveness('medium');
const resultMedium = optimizer.optimize(prompt);
console.log('Medium:', resultMedium.optimizedTokenCount, `(${resultMedium.percentSaved.toFixed(2)}% reduction)`);

optimizer.setAggressiveness('high');
const resultHigh = optimizer.optimize(prompt);
console.log('High:', resultHigh.optimizedTokenCount, `(${resultHigh.percentSaved.toFixed(2)}% reduction)`);

// Testing category filtering
console.log('\nOptimization with different category combinations:');

optimizer.disableCategory('all');
optimizer.enableCategory('verbosity');
const resultVerbosity = optimizer.optimize(prompt);
console.log('Verbosity only:', resultVerbosity.optimizedTokenCount, `(${resultVerbosity.percentSaved.toFixed(2)}% reduction)`);

optimizer.disableCategory('all');
optimizer.enableCategory('filler');
const resultFiller = optimizer.optimize(prompt);
console.log('Filler only:', resultFiller.optimizedTokenCount, `(${resultFiller.percentSaved.toFixed(2)}% reduction)`);

optimizer.disableCategory('all');
optimizer.enableCategory('technical');
const resultTech = optimizer.optimize(prompt);
console.log('Technical only:', resultTech.optimizedTokenCount, `(${resultTech.percentSaved.toFixed(2)}% reduction)`);

// Display the most aggressive optimization
console.log('\n\nMost optimized prompt:');
console.log(resultHigh.optimizedText);

// Show applied patterns
console.log('\nPatterns applied in the most aggressive optimization:');
resultHigh.appliedPatterns.forEach(pattern => {
  console.log(`- ${pattern.category}: ${pattern.description}`);
}); 