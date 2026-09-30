# Accessibility (a11y)

Mental health applications must be accessible to everyone, especially users experiencing cognitive load, distress, or using assistive technologies.

## Core Practices Implemented

1. **Semantic HTML**: Extensive use of `<nav>`, `<main>`, `<aside>`, `<section>`, and `<article>` tags to provide structural meaning.
2. **ARIA Landmarks and Labels**: 
   - Uses `aria-label`, `aria-labelledby`, and `aria-hidden` heavily where visual icons replace text (e.g., Sidebar icons, Action buttons).
   - Chat input uses `aria-disabled` and `aria-live="polite"` for the streaming indicator to notify screen readers when the AI is responding.
3. **Keyboard Navigation**:
   - All interactive elements are focusable.
   - We use custom focus rings via Tailwind (`focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`) to ensure a high-contrast focus state for keyboard users without disrupting mouse users.
4. **Color Contrast**: All text and background combinations in the primary UI pass WCAG AA standards. Muted colors used for crisis alerts are paired with dark, high-contrast text.
5. **Reduced Motion**: (Planned feature) UI animations like the streaming dots and modal transitions should respect `prefers-reduced-motion` media queries.

## Testing
We use `jest-axe` within our Vitest suite (`tests/a11y/a11y.test.tsx`) to run automated accessibility audits on our main pages, preventing regressions in ARIA roles and contrast ratios.
