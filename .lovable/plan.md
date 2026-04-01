

# Migration: Auto-enqueue trigger for scans

## What it does
Creates a trigger that automatically inserts a `scan_queue` row whenever a new scan is created, plus backfills any orphaned pending scans.

## Changes
- **1 new migration file** with the exact SQL provided:
  - `auto_enqueue_scan()` function (SECURITY DEFINER)
  - `trg_auto_enqueue` trigger on `scans` AFTER INSERT
  - Retroactive backfill INSERT for pending scans missing queue entries

No other files changed.

