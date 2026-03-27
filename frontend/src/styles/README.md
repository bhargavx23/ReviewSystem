Style guide: Color tokens and usage
=================================

This file documents the semantic color tokens added to the project and how to use them.

Tokens (CSS variables)
- `--color-primary`, `--color-primary-600`, `--color-primary-700` — primary brand color (violet)
- `--color-accent`, `--color-accent-600` — accent / success (teal)
- `--color-secondary`, `--color-secondary-600` — secondary / cyan
- `--color-base-100`, `--color-base-200`, `--color-base-300`, `--color-base-content` — surface and text tokens
- `--color-info`, `--color-success`, `--color-warning`, `--color-error` — semantic support colors

Where the variables live
- The variables are defined in `src/styles/colors.css` and are imported globally from `src/index.css`.

How to use
- Prefer semantic helper classes where practical: `bg-primary-token`, `text-primary-token`, `bg-accent-token`, `text-accent-token`, `bg-base-token`, `text-base-token`.
- For Tailwind utilities, keep using `bg-primary-600`, `bg-accent-500`, etc., which are backed by the Tailwind/daisyUI theme. Migrate components to semantic tokens gradually.
- Use variables directly in component CSS when you need dynamic shading or inline styles: `background-color: var(--color-primary-600)`.

Accessibility and contrast
- Tokens were chosen to balance visual vibrancy and contrast. When creating new UI surfaces, validate contrast using your browser devtools or an a11y checker.

Next steps (recommended)
- Replace hard-coded hex strings in isolated components with semantic tokens.
- Audit contrast for critical flows (login, booking flow, error/success states).
- Optionally add a small React helper to expose theme tokens for inline styles.
