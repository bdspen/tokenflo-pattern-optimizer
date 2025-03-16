import { PromptOptimizer } from '../src';

// Create an optimizer with default settings
const optimizer = new PromptOptimizer({
  model: 'gpt-3.5-turbo',
  aggressiveness: 'medium',
  preserveFormatting: true
});

// Example prompt with various optimization opportunities
const prompt = `
Hello there! I would like to ask for your assistance with something actually quite important.

In order to complete this task, I need you to analyze the following text. Please note that it is important to be thorough in your analysis.

The text is as follows:

"At this point in time, the company is facing some challenges due to the fact that market conditions have become more competitive. It is worth noting that our competitors have basically taken steps to reduce their prices, and we need to respond in kind. To be honest, I think that we should consider revising our pricing strategy as well."

I would really appreciate it if you would provide a comprehensive analysis of the text above. Basically, I'm looking for your thoughts on the current situation and what you believe would be the best course of action for the company in question.

Thank you very much for your help and assistance with this matter. I'm looking forward to your response!
`;

// Optimize the prompt
const result = optimizer.optimize(prompt);

// Print the results
console.log('Original prompt:');
console.log(prompt);
console.log('\n------------------------------\n');

console.log('Optimized prompt:');
console.log(result.optimizedText);
console.log('\n------------------------------\n');

console.log(`Original token count: ${result.originalTokenCount}`);
console.log(`Optimized token count: ${result.optimizedTokenCount}`);
console.log(`Tokens saved: ${result.tokensSaved} (${result.percentSaved.toFixed(2)}%)`);
console.log('\n------------------------------\n');

console.log('Patterns applied:');
result.appliedPatterns.forEach(pattern => {
  console.log(`- ${pattern.description}`);
}); 