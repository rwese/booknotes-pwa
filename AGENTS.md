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

## Debugging and Development Workflow

### Debugging Strategies

1. **Isolate the Problem**:
   - Start with simple test cases to verify basic functionality
   - Use console.log statements strategically to trace execution flow
   - Check if the issue is CSS, JavaScript, or state management related

2. **CSS Debugging**:
   - Add temporary debug borders: `border: 2px solid red;`
   - Check computed styles in browser dev tools
   - Verify z-index hierarchy and positioning context
   - Test responsive behavior by manually resizing viewport

3. **Component Debugging**:
   - Verify component rendering with conditional logging
   - Check state management and prop passing
   - Test event handlers and callbacks
   - Use React DevTools to inspect component tree

4. **Mobile-Specific Issues**:
   - Test with actual mobile viewport sizes (375px, 414px, etc.)
   - Check touch event handling and hover states
   - Verify bottom sheet positioning and scrolling behavior
   - Test both portrait and landscape orientations

### Testing with Playwright

1. **Test Structure**:
   ```typescript
   test.describe('Feature Name', () => {
     test.beforeEach(async ({ page }) => {
       // Setup: navigation, data preparation
     })

     test('should do something on mobile', async ({ page }) => {
       await page.setViewportSize({ width: 375, height: 667 })
       // Mobile-specific test logic
     })

     test('should do something on desktop', async ({ page }) => {
       await page.setViewportSize({ width: 1024, height: 768 })
       // Desktop-specific test logic
     })
   })
   ```

2. **Common Test Patterns**:
   - Verify element visibility and positioning
   - Check computed styles and CSS properties
   - Test state changes and URL updates
   - Validate responsive behavior across breakpoints

3. **Running Tests**:
   ```bash
   # Run specific test file
   npx playwright test tests/filename.spec.ts --headed
   
   # Run all tests
   npx playwright test
   
   # Interactive UI mode
   npx playwright test --ui
   
   # Debug mode with browser
   npx playwright test --headed --debug
   ```

### Development Server Management

1. **Starting Dev Server**:
   ```bash
   # Start in background with tmux
   tmux new-session -d -s devserver 'npm run dev'
   
   # Check server status
   tmux capture-pane -p -t devserver | grep "ready"
   ```

   **IMPORTANT**: All development work must use the tmux-managed dev server. Never run `npm run dev` directly in the terminal.

2. **Stopping Dev Server**:
   ```bash
   # Kill tmux session
   tmux kill-session -t devserver
   
   # Force kill if needed
   pkill -f "npm run dev"
   ```

3. **Port Management**:
   ```bash
   # Check if port is in use
   lsof -i :5180
   
   # Kill process on specific port
   kill $(lsof -i :5180 | grep -v PID | awk '{print $2}')
   ```

### Component Rewriting Strategy

1. **Analyze Existing Components**:
   - Study working components (like FilterPanel) as reference
   - Identify patterns and best practices
   - Understand the component architecture

2. **Delete and Rewrite**:
   - Remove problematic components completely
   - Start fresh with clean implementation
   - Follow established patterns from working components

3. **Incremental Testing**:
   - Test basic rendering first
   - Verify styling and positioning
   - Test interactive functionality
   - Validate responsive behavior

4. **Integration Testing**:
   - Test component in isolation
   - Test component in context
   - Verify state management
   - Check edge cases and error handling

## Sort Menu Rewrite Case Study

### Problem
The original sort menu had mobile responsiveness issues where it wouldn't display properly as a bottom sheet on mobile devices.

### Root Cause
- Missing `position: fixed` for mobile viewport
- Incorrect CSS positioning logic
- Complex flexbox layout conflicts

### Solution
1. **Deleted problematic SortToggle component**
2. **Created SortButton** - Simple button matching FilterToggle style
3. **Created SortPanel** - Modal component with proper mobile/desktop behavior
4. **Updated CSS** - Mobile-first approach with proper positioning
5. **Integrated components** - Replaced old implementation in books route

### Key Learnings
- **Follow established patterns**: Use working components as templates
- **Mobile-first CSS**: Start with mobile styles, then override for desktop
- **Proper positioning**: Use `position: fixed` for bottom sheets, `position: absolute` for dropdowns
- **Comprehensive testing**: Test both mobile and desktop behaviors
- **Clean separation**: Separate button and panel components for better maintainability

### Testing Approach
```typescript
// Test mobile behavior (375px viewport)
test('should show as bottom sheet on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  // Verify position: fixed, bottom: 0
})

// Test desktop behavior (1024px viewport)
test('should show as dropdown on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  // Verify position: absolute, right: 0
})
```

## Emergency Rollback

If migration causes issues:
```bash
git checkout v0.10.14  # Previous stable version
git checkout -b rollback-branch
npm install
npm run build
```