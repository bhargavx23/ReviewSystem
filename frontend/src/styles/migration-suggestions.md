Color Migration — Suggested Non-Destructive Patches
=================================================

Goal: propose conservative replacements that centralize color usage while avoiding feature loss. These are suggestions only — I will not apply them until you approve.

How to read suggestions
* Each entry shows the file, the original snippet, and the suggested replacement. Replacements favor semantic token helper classes from `src/styles/colors.css` and `var(--color-...)` for inline styles.

1) `components/Navbar.jsx`
* Replace usages of `text-primary-600`, `bg-primary-100`, `from-primary-500`, `to-primary-600` only where single-shot accents appear (logo, icons).

Example original:
  `className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg flex items-center justify-center"`

Suggested (non-destructive):
  `className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg flex items-center justify-center bg-primary-token"`

Note: We keep gradient utilities (from- / to-) to preserve visuals and add `bg-primary-token` as a semantic anchor. If you prefer exact shade parity, we can replace gradients with inline CSS using `var(...)`.

2) `components/BatchGrid.jsx`
* Replace `bg-primary-600 text-white` button classes with a conservative approach: keep Tailwind utilities for hover/tint behavior; optionally add `data-color="primary"` or inline `style={{ backgroundColor: 'var(--color-primary)' }}` for programmatic access.

3) `components/BatchDetailsModal.jsx`
* Status badge classes such as `bg-green-100 text-green-800` can be left as-is. Suggested: migrate later in a focused pass.

4) `pages/StudentDashboard.jsx` & `pages/AdminDashboard.jsx`
* Many gradient and text utilities (`from-primary-50`, `text-primary-600`, `bg-primary-100`). Suggested approach:
  - Leave gradients as-is to prevent visual regressions.
  - Replace isolated `text-primary-600` or `bg-primary-100` for icons/small elements with `text-primary-token` and `bg-primary-token/10` where you want semantic mapping.

5) `components/Calendar.jsx` (already migrated)
* Inline hex colors replaced with `var(--color-...)` tokens. This was safe and preserves behavior.

6) `src/index.css`
* We already import `colors.css` and use variables for shadow glows. Leave other `@apply` rules alone for now.

Recommended next step (safe):
* I can create non-destructive PR-style patches that only add semantic helper classes alongside existing utilities (no removal), or produce exact replacements for a small set of low-risk files: `Navbar.jsx`, `BatchGrid.jsx`.

Reply with which option you prefer:
* `preview` — generate detailed patch files (diff-style) for review (no changes applied yet).
* `apply-safe` — automatically apply conservative non-destructive patches to selected files now (`Navbar.jsx`, `BatchGrid.jsx`).
