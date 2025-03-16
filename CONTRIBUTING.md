# Contributing to tokenFlo Pattern Optimizer

Thank you for your interest in contributing to the tokenFlo Pattern Optimizer! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Environment details (browser, OS, package version)
6. Any additional context or screenshots

### Suggesting Features

We welcome feature suggestions! To suggest a feature:

1. Check existing issues to ensure your suggestion hasn't already been proposed
2. Create a new issue with a clear title and detailed description
3. Explain the use case and benefits of the feature

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Add or update tests as necessary
5. Ensure all tests pass
6. Update documentation if needed
7. Create a pull request with a clear description of the changes

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Project Structure

```
tokenflo-pattern-optimizer/
├── src/                  # Source code
│   ├── index.ts          # Main entry point
│   ├── patterns/         # Optimization patterns
│   ├── tokenizers/       # Tokenizer implementations
│   ├── utils/            # Utility functions
│   └── types.ts          # TypeScript type definitions
├── tests/                # Test files
├── examples/             # Example usage
└── dist/                 # Build output (generated)
```

## Adding New Patterns

To add new optimization patterns:

1. Identify the appropriate pattern category or create a new one
2. Add your pattern to the relevant file in `src/patterns/`
3. Follow the existing pattern structure
4. Add tests for your new pattern
5. Document the pattern in the relevant section

## Testing

- All new code should include appropriate tests
- Run `npm test` to ensure all tests pass before submitting a PR
- Consider adding test cases that demonstrate the functionality of your changes

## Documentation

- Update documentation for any changes to API or behavior
- Ensure examples are up-to-date with the latest features
- Use JSDoc comments for all public API methods

## Releasing

The maintainers will handle versioning and releasing new versions. We follow semantic versioning:

- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward-compatible manner
- PATCH version for backward-compatible bug fixes

Thank you for contributing! 