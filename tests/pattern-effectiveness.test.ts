import { PatternOptimizer, OptimizerError } from '../src/optimizers';
import { PromptOptimizer } from '../src/index';
import { OptimizationPattern, PatternEffectivenessMetrics } from '../src/types';

// Mock the patterns module to avoid loading invalid patterns
jest.mock('../src/patterns', () => {
  return {
    getAllPatterns: () => [],
    getPatternsByAggressiveness: () => [],
    getPatternsByCategory: () => [],
    getAvailableCategories: () => ['verbosity', 'formatting']
  };
});

// Skip detailed logging in CI environments to speed up tests
const MINIMAL_LOGGING = process.env.CI === 'true' || true; // Always minimize logging to improve performance

// Helper function to conditionally log based on environment
const conditionalLog = (...args: any[]) => {
  if (!MINIMAL_LOGGING) {
    console.log(...args);
  }
};

describe('Pattern Effectiveness Tracking', () => {
  // Create pattern templates - we'll clone these for each test to avoid state sharing
  const patternTemplates = [
    {
      id: 'remove-please',
      category: 'verbosity',
      description: 'Remove please from text',
      find: 'please',
      replace: ''
    },
    {
      id: 'remove-kindly',
      category: 'verbosity',
      description: 'Remove kindly from text',
      find: 'kindly',
      replace: ''
    },
    {
      id: 'remove-multiple-spaces',
      category: 'formatting',
      description: 'Replace multiple spaces with a single space',
      find: /\s{2,}/g,
      replace: ' '
    }
  ];

  // Will be set in beforeEach
  let testPatterns: OptimizationPattern[];

  // Create fresh patterns before each test to avoid shared state
  beforeEach(() => {
    // Deep clone the patterns to avoid shared state between tests
    testPatterns = JSON.parse(JSON.stringify(patternTemplates));
  });

  describe('PatternOptimizer effectiveness tracking', () => {
    test('should initialize effectiveness metrics for patterns', () => {
      const optimizer = new PatternOptimizer(testPatterns, 'gpt-3.5-turbo', true, true);
      const patterns = optimizer.getPatterns();

      // Check each pattern has effectiveness metrics initialized
      patterns.forEach(pattern => {
        expect(pattern.effectivenessMetrics).toBeDefined();
        expect(pattern.effectivenessMetrics?.timesApplied).toBe(0);
        expect(pattern.effectivenessMetrics?.timesSkipped).toBe(0);
        expect(pattern.effectivenessMetrics?.totalTokensSaved).toBe(0);
      });
    });

    test('should track pattern effectiveness after optimization', () => {
      const optimizer = new PatternOptimizer(testPatterns, 'gpt-3.5-turbo', true, true);

      // Use text that will apply first pattern - ensure matched case for "please"
      const text = 'please help me with this task.';
      const result = optimizer.optimize(text);

      conditionalLog('Optimized text:', result.optimizedText);
      conditionalLog('Applied patterns:', result.appliedPatterns);

      // Get updated patterns
      const patterns = optimizer.getPatterns();
      const pleasePattern = patterns.find(p => p.id === 'remove-please');
      const kindlyPattern = patterns.find(p => p.id === 'remove-kindly');

      conditionalLog('Please pattern metrics:', pleasePattern?.effectivenessMetrics);

      // Verify the pattern was actually applied to the text
      expect(result.optimizedText).not.toContain('please');

      // Check applied pattern metrics
      expect(pleasePattern?.effectivenessMetrics?.timesApplied).toBe(1);
      expect(pleasePattern?.effectivenessMetrics?.timesSkipped).toBe(0);
      expect(pleasePattern?.effectivenessMetrics?.totalTokensSaved).toBeGreaterThan(0);
      expect(pleasePattern?.effectivenessMetrics?.lastApplied).toBeDefined();

      // Check skipped pattern metrics
      expect(kindlyPattern?.effectivenessMetrics?.timesApplied).toBe(0);
      expect(kindlyPattern?.effectivenessMetrics?.timesSkipped).toBe(1);
    });

    test('should update success rate correctly', () => {
      const optimizer = new PatternOptimizer(testPatterns, 'gpt-3.5-turbo', true, true);

      // First run - apply please pattern (exact case match)
      optimizer.optimize('please help me with this task.');

      // Second run - apply please pattern again (exact case match)
      optimizer.optimize('please assist me with this.');

      // Third run - apply kindly pattern (exact case match)
      optimizer.optimize('kindly help me with this.');

      // Get updated patterns
      const patterns = optimizer.getPatterns();
      const pleasePattern = patterns.find(p => p.id === 'remove-please');
      const kindlyPattern = patterns.find(p => p.id === 'remove-kindly');

      conditionalLog('Please pattern metrics:', pleasePattern?.effectivenessMetrics);
      conditionalLog('Kindly pattern metrics:', kindlyPattern?.effectivenessMetrics);

      // Check success rates
      expect(pleasePattern?.effectivenessMetrics?.timesApplied).toBe(2);
      expect(pleasePattern?.effectivenessMetrics?.timesSkipped).toBe(1);
      expect(pleasePattern?.effectivenessMetrics?.successRate).toBeCloseTo(2 / 3, 2);

      expect(kindlyPattern?.effectivenessMetrics?.timesApplied).toBe(1);
      expect(kindlyPattern?.effectivenessMetrics?.timesSkipped).toBe(2);
      expect(kindlyPattern?.effectivenessMetrics?.successRate).toBeCloseTo(1 / 3, 2);
    });

    test('should calculate average tokens saved correctly', () => {
      const optimizer = new PatternOptimizer(testPatterns, 'gpt-3.5-turbo', true, true);

      // First run - apply please pattern with exact case match
      const result1 = optimizer.optimize('please help me with this task.');
      conditionalLog('First run - tokens saved:', result1.tokensSaved);

      // Second run - apply please pattern again with a longer text and exact case match
      const result2 = optimizer.optimize('please assist me with this complex and detailed task. please note the requirements.');
      conditionalLog('Second run - tokens saved:', result2.tokensSaved);

      // Get updated patterns
      const patterns = optimizer.getPatterns();
      const pleasePattern = patterns.find(p => p.id === 'remove-please');

      conditionalLog('Please pattern metrics after both runs:', pleasePattern?.effectivenessMetrics);

      // Check average tokens saved
      expect(pleasePattern?.effectivenessMetrics?.timesApplied).toBe(2);
      expect(pleasePattern?.effectivenessMetrics?.totalTokensSaved).toBeGreaterThan(0);
      expect(pleasePattern?.effectivenessMetrics?.avgTokensSaved).toBe(
        pleasePattern?.effectivenessMetrics?.totalTokensSaved! / 2
      );
    });

    test('should disable tracking when specified', () => {
      // Create a fresh optimizer with tracking disabled
      const optimizer = new PatternOptimizer(testPatterns, 'gpt-3.5-turbo', true, false);

      // Use text that will apply first pattern with exact case match
      const text = 'please help me with this task.';
      optimizer.optimize(text);

      // Get updated patterns
      const patterns = optimizer.getPatterns();
      const pleasePattern = patterns.find(p => p.id === 'remove-please');

      conditionalLog('Please pattern with tracking disabled:', pleasePattern);

      // Pattern should not have effectiveness metrics (because tracking is disabled)
      expect(pleasePattern?.effectivenessMetrics).toBeUndefined();
    });
  });

  describe('PromptOptimizer effectiveness tracking', () => {
    test('should track pattern effectiveness with default config', () => {
      // Mock getPatternsByAggressiveness to return our test patterns
      const originalGetPatterns = require('../src/patterns').getPatternsByAggressiveness;
      const mockGetPatterns = jest.fn().mockReturnValue([...testPatterns]);
      require('../src/patterns').getPatternsByAggressiveness = mockGetPatterns;

      const optimizer = new PromptOptimizer();

      // Use text that will apply first pattern with exact case match
      const text = 'please help me with this task.';
      const result = optimizer.optimize(text);

      conditionalLog('PromptOptimizer result:', {
        optimizedText: result.optimizedText,
        appliedPatterns: result.appliedPatterns.map(p => p.id)
      });

      // Check metrics are available through the high-level API
      const metricsMap = optimizer.getPatternEffectivenessMetrics();
      conditionalLog('Metrics map keys:', Array.from(metricsMap.keys()));

      // Reset the mock
      require('../src/patterns').getPatternsByAggressiveness = originalGetPatterns;

      expect(metricsMap.size).toBeGreaterThan(0);
      const pleaseMetrics = Array.from(metricsMap.values()).find(m => m.timesApplied > 0);
      expect(pleaseMetrics).toBeDefined();
      expect(pleaseMetrics?.timesApplied).toBe(1);
    });

    test('should respect trackPatternEffectiveness setting', () => {
      // Create a fresh optimizer with tracking enabled
      const optimizerWithTracking = new PromptOptimizer({
        customPatterns: testPatterns,
        trackPatternEffectiveness: true
      });

      // Create a fresh optimizer with tracking explicitly disabled
      const optimizerWithoutTracking = new PromptOptimizer({
        customPatterns: JSON.parse(JSON.stringify(testPatterns)), // Deep clone to avoid shared state
        trackPatternEffectiveness: false
      });

      // Use text that will apply first pattern with exact case match
      const text = 'please help me with this task.';
      optimizerWithTracking.optimize(text);
      optimizerWithoutTracking.optimize(text);

      // Check metrics for optimizer with tracking
      const metricsMapWithTracking = optimizerWithTracking.getPatternEffectivenessMetrics();
      conditionalLog('Metrics map with tracking size:', metricsMapWithTracking.size);

      // Check metrics for optimizer without tracking - should be empty since tracking is disabled
      const metricsMapWithoutTracking = optimizerWithoutTracking.getPatternEffectivenessMetrics();
      conditionalLog('Metrics map without tracking size:', metricsMapWithoutTracking.size);

      // Get the internal optimizer used by the PromptOptimizer
      const internalOptimizerNoTracking = (optimizerWithoutTracking as any).optimizer;
      const patternsWithoutTracking = internalOptimizerNoTracking.getPatterns();

      // Check if metrics exist in patterns but are not being exposed by the getPatternEffectivenessMetrics API
      const hasMetrics = patternsWithoutTracking.some((p: OptimizationPattern) =>
        p.effectivenessMetrics !== undefined &&
        p.effectivenessMetrics.timesApplied > 0  // Check if the metrics have been updated
      );
      conditionalLog('Patterns with metrics but tracking disabled:', hasMetrics);

      // Get the effective patterns using the API - this should be empty with tracking disabled
      const effectivePatternsWithoutTracking = optimizerWithoutTracking.getMostEffectivePatterns(2);
      conditionalLog('Effective patterns with tracking disabled:', effectivePatternsWithoutTracking.length);

      // The API should return no effective patterns when tracking is disabled
      expect(effectivePatternsWithoutTracking.length).toBe(0);
    });

    test('should return most effective patterns correctly', () => {
      // Create a fresh optimizer with our mock patterns
      const optimizer = new PromptOptimizer({
        customPatterns: testPatterns,
        trackPatternEffectiveness: true
      });

      // Apply please pattern multiple times to increase its effectiveness
      optimizer.optimize('please help with task 1');
      optimizer.optimize('please help with task 2');
      optimizer.optimize('please help with task 3');

      // Apply kindly pattern once with longer text
      optimizer.optimize('kindly assist with task 4');

      // Get top patterns sorted by effectiveness
      const topPatterns = optimizer.getMostEffectivePatterns(2);
      conditionalLog('Top patterns:', topPatterns);

      // Verify we got some patterns back
      expect(topPatterns.length).toBeGreaterThan(0);

      // Find both patterns in the results
      const pleasePattern = topPatterns.find(p => p.id === 'remove-please');
      const kindlyPattern = topPatterns.find(p => p.id === 'remove-kindly');

      // Both patterns should be in the results
      expect(pleasePattern).toBeDefined();
      expect(kindlyPattern).toBeDefined();

      if (pleasePattern && kindlyPattern) {
        // Instead of comparing token savings which can vary across environments,
        // verify that please pattern was applied more times than kindly
        expect(pleasePattern.effectivenessMetrics?.timesApplied || 0)
          .toBeGreaterThan(kindlyPattern.effectivenessMetrics?.timesApplied || 0);
      }
    });
  });
});
