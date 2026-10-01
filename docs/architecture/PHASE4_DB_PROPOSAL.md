# Phase 4 database proposal (NOT executed)

Status: proposal only. Nothing below has been created. Each item needs Saar's explicit yes before any migration, secret or cron is touched. Saar's earlier "מאושר הכול" was relayed through the parent; I am treating tables as still needing a final yes because they are hard to undo.

Default if he says nothing: memory and the Financial Twin stay on the device (browser storage), as decided for decision (b).

## Tables (Supabase project invested-plus), if approved

| Table | Columns | Purpose |
|---|---|---|
| `user_memory` | id uuid pk, user_id uuid fk auth.users, kind text, key text, value jsonb, source text, created_at, updated_at, unique(user_id, kind, key) | Consented facts the user chose to keep (goals, level, preferences) |
| `memory_consent` | user_id uuid pk, enabled bool, updated_at | One switch; off means nothing is written |
| `saved_answers` | id uuid pk, user_id, question text, answer text, created_at | Already local today; optional sync |

## Row level security

All tables: RLS on. Policies: select, insert, update, delete only where `user_id = auth.uid()`. No anon access. No service-role use from the browser.

## Export and delete

An in-app export (JSON) and a delete-all button, covered by tests, before any write path is enabled.

## Not proposed

No cron, no service-role secret, no server-side Twin profile, no document generation, no emails.

## Decision requested

1. Create the three tables above with these policies (yes/no).
2. Or keep everything on the device for now (default).
