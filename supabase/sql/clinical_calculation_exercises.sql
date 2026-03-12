-- Clinical Calculations: schema + seed (400 cases per category, mixed subtypes)
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.clinical_calculation_exercises (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  category text not null
    check (category in ('dose_medication', 'infusion_drip', 'fluid_balance', 'anthropometry')),
  difficulty text not null
    check (difficulty in ('basic', 'intermediate', 'advanced')),
  exercise_type text not null
    check (exercise_type in ('single', 'mini_case', 'quick_test')),
  statement text not null,
  patient_data jsonb not null default '[]'::jsonb,
  answer_unit text not null,
  formula text not null,
  correct_answer numeric not null,
  tolerance_kind text not null default 'absolute'
    check (tolerance_kind in ('absolute', 'percent')),
  tolerance_value numeric not null default 1,
  hints text[] not null default '{}',
  step_by_step text[] not null default '{}',
  common_errors text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clin_calc_category
  on public.clinical_calculation_exercises(category);
create index if not exists idx_clin_calc_difficulty
  on public.clinical_calculation_exercises(difficulty);
create index if not exists idx_clin_calc_active
  on public.clinical_calculation_exercises(is_active);

create or replace function public.touch_clin_calc_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_clin_calc_updated_at on public.clinical_calculation_exercises;
create trigger trg_touch_clin_calc_updated_at
before update on public.clinical_calculation_exercises
for each row
execute function public.touch_clin_calc_updated_at();

alter table public.clinical_calculation_exercises enable row level security;

drop policy if exists "clinical_calc_public_read" on public.clinical_calculation_exercises;
create policy "clinical_calc_public_read"
  on public.clinical_calculation_exercises
  for select
  to anon, authenticated
  using (is_active = true);

do $$
declare
  v_category text;
  i integer;
  subtype integer;
  v_diff text;
  v_type text;
  a numeric;
  b numeric;
  c numeric;
  d numeric;
  v_title text;
  v_statement text;
  v_formula text;
  v_answer_unit text;
  v_correct numeric;
  v_tol_kind text;
  v_tol_value numeric;
  v_patient_data jsonb;
  v_hints text[];
  v_steps text[];
  v_common text[];
  v_external_id text;
begin
  foreach v_category in array array['dose_medication', 'infusion_drip', 'fluid_balance', 'anthropometry']
  loop
    for i in 1..400
    loop
      subtype := ((i - 1) % 3) + 1;
      v_diff := case when i % 3 = 1 then 'basic' when i % 3 = 2 then 'intermediate' else 'advanced' end;
      v_type := case when i % 3 = 1 then 'single' when i % 3 = 2 then 'mini_case' else 'quick_test' end;
      v_external_id := v_category || '_' || lpad(i::text, 4, '0');

      if v_category = 'dose_medication' then
        if subtype = 1 then
          a := (30 + floor(random() * 66))::numeric; -- peso kg
          b := (5 + floor(random() * 21))::numeric;  -- mg/kg
          v_title := 'Dosis por peso (mg/kg)';
          v_statement := 'Paciente de ' || a || ' kg. Se prescribe ' || b || ' mg/kg por dosis. Calcula la dosis total en mg.';
          v_formula := 'Dosis total (mg) = mg/kg x peso (kg)';
          v_answer_unit := 'mg';
          v_correct := round((a * b)::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso', 'value', a || ' kg'),
            jsonb_build_object('label', 'Dosis prescrita', 'value', b || ' mg/kg')
          );
          v_hints := array['Multiplica dosis por kg por el peso.', 'Mantén unidades en mg.'];
          v_steps := array[
            'Identifica mg/kg y peso.',
            'Multiplica ambos valores.',
            'Reporta la dosis final en mg.'
          ];
          v_common := array['Confundir mg/kg/día con mg/kg/dosis.', 'Error de unidades.'];
        elsif subtype = 2 then
          a := (100 + floor(random() * 19) * 25)::numeric; -- dosis requerida mg
          b := (250 + floor(random() * 7) * 125)::numeric; -- mg disponibles
          c := (1 + floor(random() * 5))::numeric;         -- mL disponibles
          v_title := 'Conversión mg a mL';
          v_statement := 'Administrar ' || a || ' mg. Presentación: ' || b || ' mg en ' || c || ' mL. ¿Cuántos mL administrar?';
          v_formula := 'Volumen (mL) = (dosis requerida / dosis disponible) x volumen disponible';
          v_answer_unit := 'mL';
          v_correct := round(((a / nullif(b, 0)) * c)::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 0.1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Dosis requerida', 'value', a || ' mg'),
            jsonb_build_object('label', 'Presentación', 'value', b || ' mg / ' || c || ' mL')
          );
          v_hints := array['Usa regla de tres.', 'Verifica denominador no cero.'];
          v_steps := array[
            'Divide dosis requerida para dosis disponible.',
            'Multiplica por volumen disponible.',
            'Reporta en mL.'
          ];
          v_common := array['Invertir numerador y denominador.', 'Omitir redondeo clínico.'];
        else
          a := (10 + floor(random() * 31))::numeric; -- peso kg pediátrico
          b := (20 + floor(random() * 41))::numeric; -- mg/kg/día
          v_title := 'Dosis diaria fraccionada';
          v_statement := 'Paciente pediátrico ' || a || ' kg. Prescripción: ' || b || ' mg/kg/día cada 8 horas. Calcula mg por dosis.';
          v_formula := 'mg por dosis = (mg/kg/día x peso) / 3';
          v_answer_unit := 'mg por dosis';
          v_correct := round(((a * b) / 3)::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso', 'value', a || ' kg'),
            jsonb_build_object('label', 'Dosis diaria', 'value', b || ' mg/kg/día'),
            jsonb_build_object('label', 'Frecuencia', 'value', 'Cada 8 horas')
          );
          v_hints := array['Cada 8h implica 3 dosis en 24h.'];
          v_steps := array[
            'Calcula mg totales por día.',
            'Divide entre 3 dosis.',
            'Reporta mg por dosis.'
          ];
          v_common := array['No dividir entre 3.', 'Confundir dosis diaria con dosis única.'];
        end if;

      elsif v_category = 'infusion_drip' then
        if subtype = 1 then
          a := (250 + floor(random() * 16) * 100)::numeric; -- volumen mL
          b := (1 + floor(random() * 12))::numeric;         -- horas
          c := (case when random() < 0.5 then 20 else 60 end)::numeric; -- factor
          v_title := 'Goteo por minuto';
          v_statement := 'Infundir ' || a || ' mL en ' || b || ' horas con factor ' || c || ' gtt/mL. Calcula gtt/min.';
          v_formula := 'gtt/min = (volumen x factor) / tiempo(min)';
          v_answer_unit := 'gtt/min';
          v_correct := round(((a * c) / (b * 60))::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 1.5;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Volumen', 'value', a || ' mL'),
            jsonb_build_object('label', 'Tiempo', 'value', b || ' h'),
            jsonb_build_object('label', 'Factor', 'value', c || ' gtt/mL')
          );
          v_hints := array['Convierte horas a minutos.'];
          v_steps := array[
            'Tiempo en minutos = horas x 60.',
            'Aplica fórmula gtt/min.',
            'Redondea según práctica clínica.'
          ];
          v_common := array['No convertir horas a minutos.', 'Usar factor incorrecto.'];
        elsif subtype = 2 then
          a := (500 + floor(random() * 21) * 50)::numeric; -- volumen mL
          b := (2 + floor(random() * 11))::numeric;        -- horas
          v_title := 'Velocidad de infusión mL/h';
          v_statement := 'Administrar ' || a || ' mL en ' || b || ' horas. Calcula velocidad en mL/h.';
          v_formula := 'mL/h = volumen / tiempo(h)';
          v_answer_unit := 'mL/h';
          v_correct := round((a / nullif(b, 0))::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Volumen', 'value', a || ' mL'),
            jsonb_build_object('label', 'Tiempo', 'value', b || ' h')
          );
          v_hints := array['Divide volumen total para horas totales.'];
          v_steps := array['Divide volumen para tiempo.', 'Reporta en mL/h.'];
          v_common := array['Multiplicar en vez de dividir.'];
        else
          a := (300 + floor(random() * 25) * 50)::numeric; -- volumen
          b := (60 + floor(random() * 31) * 5)::numeric;   -- mL/h
          v_title := 'Tiempo total de infusión';
          v_statement := 'Se van a infundir ' || a || ' mL a ' || b || ' mL/h. Calcula tiempo total en horas.';
          v_formula := 'tiempo(h) = volumen / velocidad(mL/h)';
          v_answer_unit := 'horas';
          v_correct := round((a / nullif(b, 0))::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 0.2;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Volumen', 'value', a || ' mL'),
            jsonb_build_object('label', 'Velocidad', 'value', b || ' mL/h')
          );
          v_hints := array['Tiempo = volumen dividido para velocidad.'];
          v_steps := array['Aplica fórmula directa.', 'Conserva unidad en horas.'];
          v_common := array['Intercambiar numerador/denominador.'];
        end if;

      elsif v_category = 'fluid_balance' then
        if subtype = 1 then
          a := (1200 + floor(random() * 33) * 50)::numeric; -- ingresos
          b := (900 + floor(random() * 33) * 50)::numeric;  -- egresos
          v_title := 'Balance hídrico 24 horas';
          v_statement := 'Ingresos: ' || a || ' mL. Egresos: ' || b || ' mL. Calcula balance total.';
          v_formula := 'balance = ingresos - egresos';
          v_answer_unit := 'mL';
          v_correct := round((a - b)::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Ingresos', 'value', a || ' mL'),
            jsonb_build_object('label', 'Egresos', 'value', b || ' mL')
          );
          v_hints := array['El signo del resultado importa (positivo o negativo).'];
          v_steps := array['Resta egresos a ingresos.', 'Interpreta signo del balance.'];
          v_common := array['Reportar magnitud sin signo.'];
        elsif subtype = 2 then
          a := (8 + floor(random() * 33))::numeric; -- peso pediátrico
          v_title := 'Mantenimiento (Holliday-Segar)';
          v_statement := 'Paciente pediátrico de ' || a || ' kg. Calcula líquidos de mantenimiento en 24h (regla 100/50/20).';
          v_formula := '100 mL/kg primeros 10 kg + 50 mL/kg siguientes 10 kg + 20 mL/kg resto';
          v_answer_unit := 'mL/día';
          v_correct :=
            case
              when a <= 10 then round((a * 100)::numeric, 2)
              when a <= 20 then round((1000 + (a - 10) * 50)::numeric, 2)
              else round((1500 + (a - 20) * 20)::numeric, 2)
            end;
          v_tol_kind := 'absolute';
          v_tol_value := 3;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso', 'value', a || ' kg'),
            jsonb_build_object('label', 'Regla', 'value', '100/50/20')
          );
          v_hints := array['Divide el peso en tramos de 10 kg.'];
          v_steps := array['Calcula tramo 1.', 'Calcula tramo 2.', 'Calcula tramo 3 si aplica.', 'Suma totales.'];
          v_common := array['Aplicar 100 mL/kg a todo el peso.'];
        else
          a := (350 + floor(random() * 41) * 25)::numeric; -- diuresis
          b := (40 + floor(random() * 61))::numeric;       -- peso kg
          c := (6 + floor(random() * 19))::numeric;        -- horas
          v_title := 'Diuresis horaria (mL/kg/h)';
          v_statement := 'Diuresis total ' || a || ' mL en ' || c || ' horas. Peso ' || b || ' kg. Calcula mL/kg/h.';
          v_formula := 'mL/kg/h = diuresis total / (peso x horas)';
          v_answer_unit := 'mL/kg/h';
          v_correct := round((a / nullif((b * c), 0))::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 0.1;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Diuresis', 'value', a || ' mL'),
            jsonb_build_object('label', 'Peso', 'value', b || ' kg'),
            jsonb_build_object('label', 'Tiempo', 'value', c || ' h')
          );
          v_hints := array['No olvides dividir entre peso y tiempo.'];
          v_steps := array['Multiplica peso por horas.', 'Divide diuresis para ese valor.'];
          v_common := array['Dividir solo para peso o solo para tiempo.'];
        end if;

      else -- anthropometry
        if subtype = 1 then
          a := (45 + floor(random() * 71))::numeric;              -- peso
          b := round((1.45 + random() * 0.55)::numeric, 2);       -- talla m
          v_title := 'Índice de masa corporal';
          v_statement := 'Paciente con peso ' || a || ' kg y talla ' || b || ' m. Calcula IMC.';
          v_formula := 'IMC = peso / talla²';
          v_answer_unit := 'kg/m²';
          v_correct := round((a / nullif((b * b), 0))::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 0.2;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso', 'value', a || ' kg'),
            jsonb_build_object('label', 'Talla', 'value', b || ' m')
          );
          v_hints := array['Eleva talla al cuadrado antes de dividir.'];
          v_steps := array['Calcula talla².', 'Divide peso para talla².'];
          v_common := array['Usar talla en cm sin convertir a m.'];
        elsif subtype = 2 then
          a := (45 + floor(random() * 71))::numeric;              -- peso
          b := round((145 + random() * 55)::numeric, 0);          -- talla cm
          v_title := 'Superficie corporal (Mosteller)';
          v_statement := 'Paciente con peso ' || a || ' kg y talla ' || b || ' cm. Calcula superficie corporal (m²).';
          v_formula := 'SC (m²) = sqrt((peso x talla_cm) / 3600)';
          v_answer_unit := 'm²';
          v_correct := round(sqrt((a * b) / 3600)::numeric, 3);
          v_tol_kind := 'absolute';
          v_tol_value := 0.02;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso', 'value', a || ' kg'),
            jsonb_build_object('label', 'Talla', 'value', b || ' cm')
          );
          v_hints := array['Usa la fórmula de Mosteller.'];
          v_steps := array['Multiplica peso por talla(cm).', 'Divide para 3600.', 'Aplica raíz cuadrada.'];
          v_common := array['Usar talla en metros en vez de cm para Mosteller.'];
        else
          a := (45 + floor(random() * 71))::numeric;              -- peso actual
          b := (40 + floor(random() * 41))::numeric;              -- peso ideal referencia
          v_title := 'Porcentaje de peso respecto al ideal';
          v_statement := 'Peso actual: ' || a || ' kg. Peso ideal referencia: ' || b || ' kg. Calcula % del peso ideal.';
          v_formula := '% peso ideal = (peso actual / peso ideal) x 100';
          v_answer_unit := '%';
          v_correct := round(((a / nullif(b, 0)) * 100)::numeric, 2);
          v_tol_kind := 'absolute';
          v_tol_value := 0.5;
          v_patient_data := jsonb_build_array(
            jsonb_build_object('label', 'Peso actual', 'value', a || ' kg'),
            jsonb_build_object('label', 'Peso ideal', 'value', b || ' kg')
          );
          v_hints := array['Divide peso actual para peso ideal y multiplica por 100.'];
          v_steps := array['Calcula razón actual/ideal.', 'Multiplica por 100 para porcentaje.'];
          v_common := array['Invertir actual/ideal.'];
        end if;
      end if;

      insert into public.clinical_calculation_exercises (
        external_id,
        title,
        category,
        difficulty,
        exercise_type,
        statement,
        patient_data,
        answer_unit,
        formula,
        correct_answer,
        tolerance_kind,
        tolerance_value,
        hints,
        step_by_step,
        common_errors,
        is_active
      )
      values (
        v_external_id,
        v_title,
        v_category,
        v_diff,
        v_type,
        v_statement,
        v_patient_data,
        v_answer_unit,
        v_formula,
        v_correct,
        v_tol_kind,
        v_tol_value,
        v_hints,
        v_steps,
        v_common,
        true
      )
      on conflict (external_id) do update
      set
        title = excluded.title,
        category = excluded.category,
        difficulty = excluded.difficulty,
        exercise_type = excluded.exercise_type,
        statement = excluded.statement,
        patient_data = excluded.patient_data,
        answer_unit = excluded.answer_unit,
        formula = excluded.formula,
        correct_answer = excluded.correct_answer,
        tolerance_kind = excluded.tolerance_kind,
        tolerance_value = excluded.tolerance_value,
        hints = excluded.hints,
        step_by_step = excluded.step_by_step,
        common_errors = excluded.common_errors,
        is_active = excluded.is_active,
        updated_at = now();
    end loop;
  end loop;
end $$;

-- Optional check:
-- select category, count(*) from public.clinical_calculation_exercises group by category order by category;
