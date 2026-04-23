# Backend Scripts

One-off migration / seed / fix scripts. These are **not** part of the runtime
app — they're ad-hoc tools run manually when needed.

## Running a script

From the backend container:

```bash
docker compose exec backend python scripts/<script_name>.py
```

Or locally (with venv activated and `DJANGO_SETTINGS_MODULE` set):

```bash
cd backend && python scripts/<script_name>.py
```

## Files

| File | Purpose |
|---|---|
| `seed_universities.py` | Populate the `universities` table with initial data |
| `seed_mall.py` | Populate the Mall section (categories, sample products) |
| `script_fix02.py` / `script_fix03.py` | Phase 02 / 03 data-fix scripts |
| `script_phase04.py` / `script_phase05.py` | Phase 04 / 05 rollout scripts |
| `script_soft_delete_cascade.py` | Backfill soft-delete cascade for existing rows |
| `script_xss_sanitization.py` | One-time sanitization sweep over user-generated content |
| `test_file_validation.py` | Ad-hoc file-validation smoke test (not part of pytest suite) |

If a script has been run and is no longer needed, delete it. Do not keep
indefinite dead scripts around.
