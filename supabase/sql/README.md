# Supabase SQL Seeds

## Clinical calculations (400 per category)

Run this script in Supabase SQL Editor:

- `supabase/sql/clinical_calculation_exercises.sql`

It will:

1. Create table `public.clinical_calculation_exercises` (if not exists)
2. Enable read policy for `anon`/`authenticated` users (`is_active = true`)
3. Seed/update mixed exercises:
   - `dose_medication`: 400
   - `infusion_drip`: 400
   - `fluid_balance`: 400
   - `anthropometry`: 400

Total expected: `1600` rows.

Validation query:

```sql
select category, count(*)
from public.clinical_calculation_exercises
group by category
order by category;
```

## Clinical laboratory (~200 casos)

Run this script in Supabase SQL Editor:

- `supabase/sql/clinical_laboratory_cases.sql`

It will:

1. Create table `public.clinical_laboratory_cases` (if not exists)
2. Enable read policy for `anon`/`authenticated` users (`is_active = true`)
3. Seed/update ~200 laboratory cases for practice across contexts:
   - infection
   - renal
   - anemia
   - urinary
   - hepatobiliary
   - metabolic

Validation query:

```sql
select context, count(*)
from public.clinical_laboratory_cases
group by context
order by context;
```
