# Contributing

Thanks for contributing to `mcp-searchable`.

The canonical contribution policy is maintained in the repository root `CONTRIBUTING.md`.

## Quick checklist

1. Add or update tests for behavior changes.
2. Run quality checks locally.
3. Update docs when tool behavior, inputs, or environment variables change.

## Local quality commands

```bash
npm test
npm run lint:check
npm run format:check
npm run typecheck
```

## Documentation workflow

Use MkDocs for project docs:

```bash
uv run mkdocs build --strict
```

Do not deploy docs without explicit maintainer approval.
