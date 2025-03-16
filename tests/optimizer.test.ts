import { PromptOptimizer, OptimizerConfig } from '../src';

describe('PromptOptimizer', () => {
  let optimizer: PromptOptimizer;
  const defaultConfig: Partial<OptimizerConfig> = {
    model: 'gpt-3.5-turbo',
    aggressiveness: 'medium',
    preserveFormatting: true
  };

  beforeEach(() => {
    optimizer = new PromptOptimizer(defaultConfig);
  });

  describe('initialization', () => {
    test('should create with default config', () => {
      const defaultOptimizer = new PromptOptimizer();
      const config = defaultOptimizer.getConfig();
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.aggressiveness).toBe('medium');
      expect(config.preserveFormatting).toBe(true);
      expect(config.enabledCategories).toContain('all');
    });

    test('should override config with provided values', () => {
      const customConfig: Partial<OptimizerConfig> = {
        model: 'gpt-4',
        aggressiveness: 'high',
        preserveFormatting: false,
        enabledCategories: ['verbosity']
      };
      const customOptimizer = new PromptOptimizer(customConfig);
      const config = customOptimizer.getConfig();
      expect(config.model).toBe('gpt-4');
      expect(config.aggressiveness).toBe('high');
      expect(config.preserveFormatting).toBe(false);
      expect(config.enabledCategories).toEqual(['verbosity']);
    });
  });

  describe('optimizations', () => {
    test('should reduce tokens in verbose text', () => {
      const input = 'I would like to ask about the weather. In order to plan my day, I need to know if it will rain.';
      const result = optimizer.optimize(input);

      // The optimized text should have fewer tokens
      expect(result.optimizedTokenCount).toBeLessThan(result.originalTokenCount);
      expect(result.tokensSaved).toBeGreaterThan(0);
      expect(result.appliedPatterns.length).toBeGreaterThan(0);
    });

    test('should not change text with no optimization opportunities', () => {
      const input = 'Check the weather forecast.';
      const result = optimizer.optimize(input);

      // The text content should remain the same after trimming
      expect(result.optimizedText.trim()).toBe(input.trim());
      
      // Token count might be slightly different due to whitespace, but should be close to 0
      expect(Math.abs(result.tokensSaved)).toBeLessThanOrEqual(1);
      
      // There might be some patterns applied for whitespace/formatting, but they shouldn't change the content
      if (result.appliedPatterns.length > 0) {
        console.log('Applied patterns:', result.appliedPatterns);
      }
    });

    test('should handle empty input', () => {
      const input = '';
      const result = optimizer.optimize(input);

      expect(result.originalText).toBe('');
      expect(result.optimizedText).toBe('');
      expect(result.originalTokenCount).toBe(0);
      expect(result.optimizedTokenCount).toBe(0);
      expect(result.tokensSaved).toBe(0);
      expect(result.percentSaved).toBe(0);
    });

    test('should apply custom patterns', () => {
      // Add a custom pattern
      optimizer.addPattern({
        id: 'custom-test',
        category: 'custom',
        description: 'Replace "weather forecast" with "forecast"',
        priority: 5,
        preservesFormatting: true,
        find: /\bweather forecast\b/gi,
        replace: 'forecast'
      });

      const input = 'Check the weather forecast.';
      const result = optimizer.optimize(input);

      expect(result.optimizedText.trim()).toBe('Check the forecast.');
      
      // Verify that our custom pattern was applied (there might be other patterns applied too)
      const customPatternApplied = result.appliedPatterns.some(pattern => pattern.id === 'custom-test');
      expect(customPatternApplied).toBe(true);
    });
  });

  describe('configuration methods', () => {
    test('should change aggressiveness level', () => {
      // Start with low aggressiveness
      optimizer.setAggressiveness('low');
      let config = optimizer.getConfig();
      expect(config.aggressiveness).toBe('low');

      // Change to high
      optimizer.setAggressiveness('high');
      config = optimizer.getConfig();
      expect(config.aggressiveness).toBe('high');
    });

    test('should enable and disable categories', () => {
      // Disable all categories
      optimizer.disableCategory('all');
      let config = optimizer.getConfig();
      expect(config.enabledCategories).toEqual([]);

      // Enable a specific category
      optimizer.enableCategory('verbosity');
      config = optimizer.getConfig();
      expect(config.enabledCategories).toEqual(['verbosity']);

      // Enable another category
      optimizer.enableCategory('filler');
      config = optimizer.getConfig();
      expect(config.enabledCategories).toContain('verbosity');
      expect(config.enabledCategories).toContain('filler');

      // Disable a specific category
      optimizer.disableCategory('verbosity');
      config = optimizer.getConfig();
      expect(config.enabledCategories).not.toContain('verbosity');
      expect(config.enabledCategories).toContain('filler');
    });

    test('should set model', () => {
      optimizer.setModel('gpt-4');
      const config = optimizer.getConfig();
      expect(config.model).toBe('gpt-4');
    });

    test('should set preserveFormatting', () => {
      optimizer.setPreserveFormatting(false);
      const config = optimizer.getConfig();
      expect(config.preserveFormatting).toBe(false);
    });
  });

  describe('tokenization', () => {
    test('should count tokens correctly', () => {
      const input = 'This is a test sentence.';
      const count = optimizer.countTokens(input);

      // Simple sanity check that we get a positive number
      expect(count).toBeGreaterThan(0);
    });

    test('should cache token counts', () => {
      const input = 'This is a test sentence.';

      // First call should calculate
      const count1 = optimizer.countTokens(input);

      // Second call should use cache and return same value
      const count2 = optimizer.countTokens(input);

      expect(count1).toBe(count2);
    });
  });
});
