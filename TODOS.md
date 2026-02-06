# BookNotes PWA - Project Todo List

## 🎯 Current Sprint: CSS Naming Convention Migration

### Completed ✅

- [x] ESLint button type warnings fixed (9 buttons updated)
- [x] Empty alt text verified - no issues found
- [x] Remaining issues documented in `docs/REMAINING_ISSUES.md`
- [x] CSS naming inconsistency analyzed and documented

### In Progress 🚧

- [ ] Update TODOS.md with CSS naming migration plan
- [ ] Migrate legacy CSS classes to BEM naming convention
- [ ] Update all React components to use new BEM class names
- [ ] Verify all changes work correctly

---

## 📋 All Project Tasks

### Phase 1: Critical Bug Fixes 🐛

- [x] Fix ESLint button type warnings in settings.tsx
- [x] Fix ESLint button type warnings in books/index.tsx
- [x] Fix accessibility issues in settings.tsx modal
- [ ] Fix SVG accessibility (add title attributes where needed)

### Phase 2: CSS Naming Convention Migration 🎨

**Goal**: Migrate all legacy CSS classes to consistent BEM naming

#### Step 2.1: Analyze Current State ✅

- [x] Identify legacy naming patterns (flat classes like `.btn-primary`)
- [x] Identify BEM naming patterns (proper blocks with `__element--modifier`)
- [x] Document findings in `docs/REMAINING_ISSUES.md`
- [x] Create mapping of old → new class names

#### Step 2.2: Button Classes ✅ COMPLETED

- [x] Migrate `.btn-primary` → `.btn--primary` (CSS defined, legacy kept for backward compatibility)
- [x] Migrate `.btn-secondary` → `.btn--secondary` (CSS defined, legacy kept for backward compatibility)
- [x] Migrate `.btn-danger` → `.btn--danger` (CSS defined, legacy kept for backward compatibility)
- [x] Update settings.tsx to use new BEM button classes
- [ ] Test button styling across all pages

#### Step 2.3: Status Badge Classes ✅ COMPLETED

- [x] Badge base class already exists as `.badge`
- [x] BEM modifiers created: `.badge--status-want`, `.badge--status-reading`, `.badge--status-read`
- [x] Legacy classes kept for backward compatibility: `.status-badge`, `.status-want-to-read`, `.status-reading`, `.status-read`

#### Step 2.4: Star Rating Classes ✅ COMPLETED

- [x] Created `.star--empty` modifier alongside legacy `.star.empty`

#### Step 2.5: Modal Classes ✅ COMPLETED

- [x] Created `.modal__overlay` alongside legacy `.modal-overlay`
- [x] Created `.modal__content` alongside legacy `.modal-content`

#### Step 2.6: React Component Updates 🔄 IN PROGRESS

- [x] Update settings.tsx to use BEM button classes
- [ ] Update books/index.tsx to use BEM button classes
- [ ] Update analytics.tsx to use BEM classes
- [ ] Update BookDetail.tsx to use BEM classes
- [ ] Update BookForm.tsx to use BEM classes
- [ ] Update other components...

#### Step 2.7: Verification 🚧 IN PROGRESS

- [ ] Run full test suite
- [ ] Visual regression testing
- [ ] Accessibility audit
- [ ] ESLint check passes

### Phase 3: Future Enhancements 📋

**Priority**: Low (for future iterations)

#### Toast Notification System

- [ ] Design toast notification system
- [ ] Create ToastProvider context
- [ ] Implement useToast hook
- [ ] Design success/error/info variants
- [ ] Add to all relevant user feedback scenarios

#### Native Dialog Migration

- [ ] Audit current custom modal usage
- [ ] Replace with native `<dialog>` elements
- [ ] Maintain consistent styling API
- [ ] Update accessibility features

#### CSS Architecture Improvements

- [ ] Consider CSS Modules or CSS-in-JS solution
- [ ] Document CSS conventions in `docs/STYLEGUIDE.md`
- [ ] Set up linting for CSS class names

---

## 📁 Files to Modify

### CSS Files

- [ ] `src/index.css` - Main migration target (1900+ lines)

### Component Files (React)

- [ ] `src/routes/settings.tsx` - Button and form classes
- [ ] `src/routes/books/index.tsx` - Badge, button classes
- [ ] `src/routes/analytics.tsx` - Various UI classes
- [ ] `src/components/books/BookDetail.tsx` - Multiple UI classes
- [ ] `src/components/books/BookForm.tsx` - Form classes
- [ ] `src/components/books/BookGridCard.tsx` - Card classes
- [ ] `src/components/books/BookList.tsx` - Card, badge classes
- [ ] And all other components using legacy classes...

---

## 🏷️ CSS Naming Convention

### Adopted Standard: BEM (Block Element Modifier)

#### Blocks (Components)

```css
/* Block = standalone component */
.btn {
}
.card {
}
.badge {
}
.modal {
}
.form {
}
```

#### Elements (Parts of Blocks)

```css
/* Element = child of block, uses __ separator */
.btn__icon {
}
.card__cover {
}
.modal__overlay {
}
.form__group {
}
.card__title {
}
.card__author {
}
```

#### Modifiers (Variants)

```css
/* Modifier = variant of block/element, uses -- separator */
.btn--primary {
}
.btn--secondary {
}
.btn--danger {
}
.card--grid {
}
.badge--status-read {
}
.form__group--error {
}
```

#### Examples

```css
/* Correct BEM */
.btn {
}
.btn--primary {
}
.btn__icon {
}
.btn--primary .btn__icon {
}

/* Legacy (to be migrated) */
.btn-primary {
}
.btn-primary .btn-icon {
}
```

---

## 📊 Progress Tracking

### Sprint Progress

- **Total Tasks**: 50+
- **Completed**: 8
- **In Progress**: 4
- **Remaining**: 40+

### Code Metrics

- **CSS Lines**: 1900+ in `src/index.css`
- **React Components**: 15+ using legacy classes
- **Estimated Effort**: 2-4 hours for full migration

---

## 🧪 Testing Checklist

### Visual Testing

- [ ] Button variants (primary, secondary, danger)
- [ ] Badge variants (want-to-read, reading, read)
- [ ] Star ratings (filled and empty)
- [ ] Form inputs and labels
- [ ] Modal dialogs
- [ ] Card layouts (grid and list views)
- [ ] Mobile responsive layouts

### Accessibility Testing

- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Color contrast

### Functional Testing

- [ ] Export/Import functionality
- [ ] Book CRUD operations
- [ ] Search and filter functionality
- [ ] Analytics page
- [ ] Settings page

---

## 🚀 Quick Commands

```bash
# Run tests
npm test

# Run ESLint
npm run lint

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Notes

### CSS Migration Strategy

1. **Backup first**: Copy current `src/index.css` before changes
2. **Incremental**: Migrate one component family at a time
3. **Test frequently**: Verify after each batch of changes
4. **Use find/replace**: Leverage IDE search and replace
5. **Commit often**: Small, focused commits for easier rollback

### Component Update Strategy

1. Find all files using legacy classes
2. Update CSS definitions first
3. Then update component classNames
4. Test in browser
5. Commit changes

---

## 🎯 Definition of Done

- [ ] All ESLint errors resolved
- [ ] All visual tests passing
- [ ] All functional tests passing
- [ ] Accessibility audit passes
- [ ] No regressions in existing features
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

_Last Updated: 2026-02-06_
_Current Focus: Phase 2 - CSS Naming Convention Migration_
