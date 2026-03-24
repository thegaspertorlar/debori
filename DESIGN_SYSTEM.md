Debori Design System
====================

This repository contains the Debori visual system primitives used by both public and admin UIs. The goal is a small, practical, and consistent set of tokens and primitives that allow building pages without redesigning primitives later.

Files
- src/design-system.css — Core tokens and components (colors, type scale, spacing, radii, shadows, breakpoints, and primitives: buttons, forms, cards, badges, containers)
- src/style.css — Imports the design system and contains app-level overrides

Tokens (high level)
- Colors: brand (restrained green), neutrals, semantic (success, info, warning, danger)
- Typography: scale from xs (12px) to 4xl (36px), with established line-heights
- Spacing: 4px base scale: 4,8,12,16,20,24,32,40,48
- Radii: sm (6px), md (10px), lg (16px), pill
- Shadows: subtle, card, elevated
- Content widths: narrow (720px), default (980px), wide (1200px)
- Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px

Components & Utilities
- Buttons: .btn with variants .btn--primary, .btn--secondary, .btn--ghost, .btn--outline, .btn--destructive; size modifiers .btn--sm/.btn--lg
- Form primitives: .form-field, .form-label, .input, .select, .textarea, error (.error-text) and helper (.helper-text) styles
- Cards: .card (with compact modifier) and .card-header
- Badges: .badge and semantic variants
- Container: .container responsive to breakpoints, .page root utility

Design notes
- Base styling is intentionally simple and functional: clean SaaS look, polished but restrained
- Brand green is used conservatively for primary actions and success states
- Public-facing pages may use slightly warmer backgrounds (see .page--public)
- Focus states use an accessible visual ring; native controls are preserved for accessibility where possible

Usage
- Import src/style.css in your app entry (already imported in src/main.ts)
- Use .container to center content. Use .page for page padding.
- Use .btn--primary for main CTAs and .btn--secondary for secondary actions
- Use .form-field, .form-label and .input/.textarea for consistent forms

If you need additional components (modals, toasts, complex grids), extend from these primitives to keep consistency.
