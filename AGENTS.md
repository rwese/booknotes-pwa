# Agent Guidelines and Best Practices

This document contains important guidelines for AI agents working on this codebase.

## Git Operations

### Commit Messages
- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Keep descriptions concise but meaningful

### Tagging
- **Tags require messages!** Always use annotated tags with `-a` flag
- Format: `git tag -a vX.Y.Z -m "Description of changes"`
- Example: `git tag -a v1.0.0 -m "Major release: Migration from TanStack Router to React Router"`

### Pushing
- Push commits first: `git push origin main`
- Then push tags: `git push origin vX.Y.Z`

## Routing System (React Router)

### Basepath Handling
- All navigation must use `navigateWithBasepath()` utility
- Basepath is `/booknotes-pwa` for GitHub Pages deployment
- Never hardcode full paths - use the navigation utilities

### Navigation Pattern
```typescript
import { navigateWithBasepath } from '../utils/navigation';

const navigate = useNavigate();
// Use this pattern for all navigation:
navigateWithBasepath(navigate, '/books');
navigateWithBasepath(navigate, `/books/${bookId}`);
navigateWithBasepath(navigate, '/books/new', { replace: true });
```

### Route Configuration
- Routes defined in `src/router.tsx`
- All routes must be prefixed with `BASE_PATH`
- Use nested routes for logical grouping

## Component Structure

### Imports
- Group imports by type (React, hooks, components, utilities)
- Use absolute imports from `src/`
- Remove unused imports

### Navigation
- Always use `useNavigate()` from 'react-router-dom'
- Never use direct URL manipulation
- Handle navigation errors gracefully

## Testing

### Playwright
- Use `npx playwright test --ui` for interactive testing
- Test all major user flows
- Verify basepath handling in all routes

### Build Testing
- Always run `npm run build` before committing
- Fix all TypeScript errors
- Address all warnings

## Migration Notes

### TanStack Router → React Router
- **Navigation**: `navigate({ to: '/path' })` → `navigateWithBasepath(navigate, '/path')`
- **Params**: `useParams({ from: '/route' })` → `useParams()`
- **Search**: `useSearch()` → `useSearchParams()`
- **Links**: `<a href="/path">` → Use navigation functions or `<Link>` components

### Common Pitfalls
- **Basepath**: Always remember the `/booknotes-pwa` prefix
- **Navigation options**: Use object syntax for options: `{ replace: true }`
- **TypeScript**: Ensure proper typing for navigation functions

## Best Practices

1. **Small Commits**: Break large changes into logical commits
2. **Descriptive Messages**: Explain what and why, not just what
3. **Test Locally**: Always test before pushing
4. **Document Changes**: Update relevant documentation
5. **Clean Up**: Remove unused code and dependencies

## Emergency Rollback

If migration causes issues:
```bash
git checkout v0.10.14  # Previous stable version
git checkout -b rollback-branch
npm install
npm run build
```