# Color Migration Report

Purpose: list places using Tailwind color utility classes or hard-coded color values so we can safely migrate to semantic tokens without visual regressions.

Summary (high-level)
- Files with the most color usage: `pages/AdminDashboard.jsx`, `pages/StudentDashboard.jsx`, `components/Navbar.jsx`, `components/Calendar.jsx`, `components/BatchGrid.jsx`, `components/BatchDetailsModal.jsx`, `components/Skeleton.jsx`, `src/index.css`.
- Remaining hard-coded hex values: `src/utils/exporters.js` (exported HTML CSS) — keep as-is or replace with tokens when generating export HTML.

Suggested migration strategy
1. Non-invasive: prefer semantic helper classes (`bg-primary-token`, `text-primary-token`, etc.) in components for quick replacements.
2. Use Tailwind utility aliases (e.g., `bg-primary-600`) where dynamic shading is used; keep these until fully migrated.
3. Replace inline style color values (e.g., `style={{ color: ... }}`) with `getComputedStyle`-friendly tokens: `style={{ color: 'var(--color-success)' }}`.
4. For gradients (`from-... to-... via-...`), map `from-primary-500` → `from-[color:var(--color-primary-600)]` only when necessary; otherwise keep gradient utilities but normalize token usage where possible.

Concrete findings (examples)
- `frontend/src/components/Calendar.jsx` — event colors: now use CSS vars (`var(--color-...)`) (migrated).
- `frontend/src/index.css` — many component classes use `bg-primary-600`, `bg-accent-500`, etc.; these are safe but recommended to move to semantic helper classes for consistency.
- `frontend/src/pages/AdminDashboard.jsx` — large use of gradient utilities: `from-primary-600 to-primary-700`, `from-accent-500 to-accent-600`, and single-shot utilities like `text-primary-600` and `bg-primary-100`.
- `frontend/src/pages/StudentDashboard.jsx` — similar gradient and text utilities across hero and stats areas.
- `frontend/src/components/Navbar.jsx` — gradient logos and `bg-primary`/`text-primary` utilities used in interactive items.

Quick migration examples
- Replace: `className="text-primary-600 bg-primary-100"`
  With: `className="text-primary-token bg-primary-token/10"` or use inline styles: `style={{ color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-100)' }}`

- Replace inline JS hex: `style={{ color: '#10b981' }}`
  With: `style={{ color: 'var(--color-success)' }}`

Next actions (recommended)
- I can generate a detailed per-file patch list showing suggested replacements (non-destructive) so you can review before I apply changes. (Recommended.)
- Or I can apply safe replacements for small, low-risk components first: `Navbar.jsx`, `BatchGrid.jsx`, `BatchDetailsModal.jsx`, `Calendar.jsx` (Calendar mostly done).

If you want the detailed per-file list, I will prepare it next.
