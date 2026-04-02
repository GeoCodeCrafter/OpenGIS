# Contributing to OpenGIS

Thank you for considering contributing to OpenGIS! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/opengis.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feat/my-feature`
5. Start the dev server: `npm run dev`

## Development

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (web mode) |
| `npm run electron:dev` | Start with Electron |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint check |

### Project Structure

- `src/types/` — TypeScript interfaces (no runtime code)
- `src/services/` — Business logic (framework-agnostic)
- `src/stores/` — Zustand state stores
- `src/components/` — React components
- `src/screens/` — Route-level pages
- `electron/` — Electron main/preload
- `tests/` — Test files

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Named exports (no default exports for components)
- Services as singleton instances
- Tailwind CSS for styling (no CSS modules)

## Pull Requests

1. Ensure your code passes `npm test` and `npm run lint`
2. Write tests for new services/utilities
3. Keep PRs focused — one feature or fix per PR
4. Update docs if you change public APIs
5. Use conventional commit messages:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `refactor:` code restructuring
   - `test:` adding tests
   - `chore:` maintenance

## Reporting Issues

Use the GitHub issue templates:
- **Bug Report**: Include steps to reproduce, expected vs actual behavior
- **Feature Request**: Describe the use case and proposed solution

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Be respectful and constructive.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
