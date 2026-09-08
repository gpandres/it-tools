# Contributing to it-tools

Thank you for your interest in contributing to it-tools! Improvements, bug fixes, ideas, and issue reports help make the project more useful for everyone.

## Ways to contribute

You can contribute in several ways:

- Fix bugs or improve existing features.
- Propose new ideas through an issue.
- Improve documentation, examples, or interface text.
- Add or improve tests.
- Review other contributors' pull requests.
- Share the project and explain how you use it.
- Support project maintenance financially when an official support channel is available.

You do not need to contribute code or money to use Toolbox or submit contributions. Financial support helps fund maintenance, infrastructure, and long-term development.

## Before you start

1. Check whether a related issue or pull request already exists.
2. For significant changes, open an issue first to discuss the proposed approach.
3. Do not include credentials, personal data, secrets, or generated files.
4. Respect the project's license and the licenses of its dependencies.

## Development environment

You need Node.js and npm installed. Then run:

```bash
npm install
npm run dev
```

The project will start at `http://localhost:3501`.

## Recommended workflow

1. Create a descriptive branch from the main branch:

   ```bash
   git checkout -b fix/description-of-change
   ```

2. Keep changes small and focused on a single goal.
3. Add or update the relevant tests.
4. Run the checks before submitting your changes:

   ```bash
   npm run typecheck
   npm test
   npm run lint:ratchet
   npm run build
   ```

   You can also run all checks with:

   ```bash
   npm run check
   ```

5. Open a pull request explaining what changed, why it was needed, and how you verified it.

## Issues and pull requests

### Reporting a bug

Whenever possible, include:

- A clear description of the problem.
- Steps to reproduce it.
- The expected and actual behavior.
- Your operating system, browser, and Toolbox version.
- Screenshots or error messages, with sensitive information removed.

### Proposing a feature

Explain the problem it would solve, who would benefit from it, and a possible solution. Proposals that keep the project simple, accessible, and maintainable will be prioritized.

### Pull requests

A pull request should:

- Have a clear and descriptive title.
- Keep a reasonable scope.
- Include tests for behavior changes when appropriate.
- Avoid unnecessary dependencies.
- Follow the existing style and conventions.
- Pass the automated checks.

Maintainers may request changes, split a large pull request, or reject a proposal if it does not fit the project's goals. This is not a personal judgment; it helps protect the quality and sustainability of the codebase.

## Style and quality

Prioritize readable, accessible, and maintainable code. Avoid unrelated refactoring. If a technical decision is not obvious, explain it in the pull request.

## License and contributions

Toolbox is distributed under the **GNU Affero General Public License v3.0 (AGPLv3)**, unless a specific file states otherwise. By submitting a contribution, you agree that it may be distributed under the same license, unless explicitly agreed otherwise in writing.

The AGPLv3 allows Toolbox to be used commercially as long as its conditions are respected, including the source-code distribution obligations that apply when modified versions are offered to users over a network. The license does not require anyone to contribute code or make payments.

The project may also offer a separate commercial license for organizations that need different terms. This does not change the rights granted by the AGPLv3 or make financial contributions mandatory.

## Code of conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) when participating in the project.

Thank you for helping improve this project!
