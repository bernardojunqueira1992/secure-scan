

# Remove Pricing Plans from Landing Page

## Summary
Remove the pricing section from the landing page and clean up unused imports since the project will be offered as a free remixable template on Lovable.

## What Changes

### 1. `src/pages/Index.tsx`
- **Delete** the entire Pricing section (lines 110–147) — the `<section>` block with plans grid
- **Remove unused imports**: `Check` from lucide-react (only used in pricing cards)
- Keep the `BarChart3` import (used in features section)

### 2. Database tables (`plans`, `subscriptions`, `check_scan_quota`)
- **No changes for now** — removing DB tables/functions requires careful handling of the `check_scan_quota` function used in the `scans` INSERT RLS policy. Removing it would break scan creation. These can be cleaned up in a future step if desired.

## What Does NOT Change
- Features section, Hero, Footer, Nav — all stay
- Database tables remain (no breaking changes to RLS or scan flow)
- No other pages reference pricing

