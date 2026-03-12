-- Clinical Laboratory Cases: schema + seed (~200 casos)
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.clinical_laboratory_cases (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  context text not null
    check (context in ('infection', 'renal', 'anemia', 'metabolic', 'urinary', 'hepatobiliary', 'chest_pain', 'general')),
  difficulty text not null
    check (difficulty in ('basic', 'intermediate', 'advanced')),
  patient jsonb not null default '{}'::jsonb,
  panels jsonb not null default '[]'::jsonb,
  main_finding text not null,
  interpretation_expected text not null,
  suggested_action text not null,
  educational_explanation text not null,
  expected_altered_ids text[] not null default '{}',
  suspicion_keywords text[] not null default '{}',
  action_keywords text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clin_lab_context
  on public.clinical_laboratory_cases(context);
create index if not exists idx_clin_lab_difficulty
  on public.clinical_laboratory_cases(difficulty);
create index if not exists idx_clin_lab_active
  on public.clinical_laboratory_cases(is_active);

create or replace function public.touch_clin_lab_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_clin_lab_updated_at on public.clinical_laboratory_cases;
create trigger trg_touch_clin_lab_updated_at
before update on public.clinical_laboratory_cases
for each row
execute function public.touch_clin_lab_updated_at();

alter table public.clinical_laboratory_cases enable row level security;

drop policy if exists "clinical_lab_public_read" on public.clinical_laboratory_cases;
create policy "clinical_lab_public_read"
  on public.clinical_laboratory_cases
  for select
  to anon, authenticated
  using (is_active = true);

do $$
declare
  i integer;
  v_kind integer;
  v_external_id text;
  v_context text;
  v_difficulty text;
  v_name text;
  v_patient jsonb;
  v_panels jsonb;
  v_main_finding text;
  v_interpretation text;
  v_action text;
  v_education text;
  v_expected text[];
  v_suspicion text[];
  v_action_keywords text[];
  v_age integer;
  v_sex text;
  v_chief text;
  n1 numeric;
  n2 numeric;
  n3 numeric;
  n4 numeric;
  n5 numeric;
  n6 numeric;
  n7 numeric;
  n8 numeric;
  n9 numeric;
begin
  for i in 1..200 loop
    v_kind := ((i - 1) % 6) + 1;
    v_external_id := 'labcase_' || lpad(i::text, 4, '0');
    v_difficulty := case when i % 3 = 1 then 'basic' when i % 3 = 2 then 'intermediate' else 'advanced' end;
    v_age := 18 + floor(random() * 65)::integer;
    v_sex := case when random() < 0.5 then 'female' else 'male' end;
    v_name := 'Caso de laboratorio #' || lpad(i::text, 4, '0');

    if v_kind = 1 then
      -- Infeccioso/sepsis
      v_context := 'infection';
      v_chief := 'Fiebre, escalofríos y taquicardia';
      n1 := round((15000 + random() * 9000)::numeric, 0); -- WBC
      n2 := round((78 + random() * 15)::numeric, 0);       -- neut
      n3 := round((8 + random() * 12)::numeric, 0);        -- lymph
      n4 := round((10.5 + random() * 3)::numeric, 1);      -- hb
      n5 := round((31 + random() * 8)::numeric, 1);        -- hct
      n6 := round((130000 + random() * 120000)::numeric, 0); -- plt
      n7 := round((110 + random() * 80)::numeric, 0);      -- glucose
      n8 := round((45 + random() * 45)::numeric, 0);       -- urea
      n9 := round((1.1 + random() * 1.6)::numeric, 2);     -- creat

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'cbc_' || i,
          'name', 'Hemograma',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'hb_' || i, 'name', 'Hemoglobina', 'category', 'hemograma', 'value', n4, 'unit', 'g/dL', 'referenceRange', '12 - 17', 'status', 'low', 'interpretationHint', 'Descenso asociado a inflamación.'),
            jsonb_build_object('id', 'ht_' || i, 'name', 'Hematocrito', 'category', 'hemograma', 'value', n5, 'unit', '%', 'referenceRange', '36 - 52', 'status', 'low', 'interpretationHint', 'Disminuido respecto al rango.'),
            jsonb_build_object('id', 'wbc_' || i, 'name', 'Leucocitos', 'category', 'hemograma', 'value', n1, 'unit', '/mm³', 'referenceRange', '4,000 - 11,000', 'status', 'high', 'interpretationHint', 'Leucocitosis marcada.'),
            jsonb_build_object('id', 'neut_' || i, 'name', 'Neutrófilos', 'category', 'hemograma', 'value', n2, 'unit', '%', 'referenceRange', '40 - 70', 'status', 'high', 'interpretationHint', 'Neutrofilia importante.'),
            jsonb_build_object('id', 'lym_' || i, 'name', 'Linfocitos', 'category', 'hemograma', 'value', n3, 'unit', '%', 'referenceRange', '20 - 45', 'status', 'low', 'interpretationHint', 'Linfopenia relativa.'),
            jsonb_build_object('id', 'plt_' || i, 'name', 'Plaquetas', 'category', 'hemograma', 'value', n6, 'unit', '/mm³', 'referenceRange', '150,000 - 450,000', 'status', 'low', 'interpretationHint', 'Plaquetas en descenso.')
          )
        ),
        jsonb_build_object(
          'id', 'chem_' || i,
          'name', 'Química básica',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'glu_' || i, 'name', 'Glucosa', 'category', 'quimica_basica', 'value', n7, 'unit', 'mg/dL', 'referenceRange', '70 - 110', 'status', 'high', 'interpretationHint', 'Hiperglucemia de estrés.'),
            jsonb_build_object('id', 'urea_' || i, 'name', 'Urea', 'category', 'quimica_basica', 'value', n8, 'unit', 'mg/dL', 'referenceRange', '15 - 45', 'status', 'high', 'interpretationHint', 'Azotemia asociada a hipoperfusión.'),
            jsonb_build_object('id', 'creat_' || i, 'name', 'Creatinina', 'category', 'quimica_basica', 'value', n9, 'unit', 'mg/dL', 'referenceRange', '0.6 - 1.2', 'status', 'high', 'interpretationHint', 'Deterioro renal inicial.')
          )
        ),
        jsonb_build_object(
          'id', 'inflam_' || i,
          'name', 'Perfil inflamatorio',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'crp_' || i, 'name', 'PCR', 'category', 'inflamatorio', 'value', round((8 + random() * 18)::numeric, 1), 'unit', 'mg/dL', 'referenceRange', '< 0.5', 'status', 'high', 'interpretationHint', 'Inflamación sistémica elevada.')
          )
        )
      );

      v_expected := array['hb_' || i, 'ht_' || i, 'wbc_' || i, 'neut_' || i, 'lym_' || i, 'plt_' || i, 'glu_' || i, 'urea_' || i, 'creat_' || i, 'crp_' || i];
      v_main_finding := 'Leucocitosis con neutrofilia y PCR elevada.';
      v_interpretation := 'Perfil compatible con infección sistémica de alta prioridad.';
      v_action := 'Activar protocolo de sepsis y monitorización hemodinámica.';
      v_education := 'La combinación de leucocitosis, neutrofilia y PCR alta orienta a infección bacteriana significativa.';
      v_suspicion := array['sepsis', 'infección', 'inflamación', 'bacteriana'];
      v_action_keywords := array['protocolo', 'sepsis', 'monitorización', 'cultivos', 'urgente'];

    elsif v_kind = 2 then
      -- Renal/hiperpotasemia
      v_context := 'renal';
      v_chief := 'Debilidad, oliguria y malestar general';
      n1 := round((55 + random() * 55)::numeric, 0);      -- urea
      n2 := round((1.6 + random() * 2.4)::numeric, 2);    -- creat
      n3 := round((126 + random() * 10)::numeric, 0);     -- na
      n4 := round((5.8 + random() * 1.6)::numeric, 1);    -- k
      n5 := round((95 + random() * 10)::numeric, 0);      -- cl

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'chem_' || i,
          'name', 'Química básica',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'urea_' || i, 'name', 'Urea', 'category', 'quimica_basica', 'value', n1, 'unit', 'mg/dL', 'referenceRange', '15 - 45', 'status', 'high', 'interpretationHint', 'Retención nitrogenada.'),
            jsonb_build_object('id', 'creat_' || i, 'name', 'Creatinina', 'category', 'quimica_basica', 'value', n2, 'unit', 'mg/dL', 'referenceRange', '0.6 - 1.2', 'status', 'high', 'interpretationHint', 'Compromiso renal.'),
            jsonb_build_object('id', 'glu_' || i, 'name', 'Glucosa', 'category', 'quimica_basica', 'value', round((82 + random() * 25)::numeric, 0), 'unit', 'mg/dL', 'referenceRange', '70 - 110', 'status', 'normal', 'interpretationHint', 'Dentro de referencia.')
          )
        ),
        jsonb_build_object(
          'id', 'electro_' || i,
          'name', 'Electrolitos',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'na_' || i, 'name', 'Sodio', 'category', 'electrolitos', 'value', n3, 'unit', 'mEq/L', 'referenceRange', '135 - 145', 'status', 'low', 'interpretationHint', 'Hiponatremia leve.'),
            jsonb_build_object('id', 'k_' || i, 'name', 'Potasio', 'category', 'electrolitos', 'value', n4, 'unit', 'mEq/L', 'referenceRange', '3.5 - 5.1', 'status', 'high', 'interpretationHint', 'Hiperpotasemia de riesgo.'),
            jsonb_build_object('id', 'cl_' || i, 'name', 'Cloro', 'category', 'electrolitos', 'value', n5, 'unit', 'mEq/L', 'referenceRange', '98 - 107', 'status', 'normal', 'interpretationHint', 'Sin alteración significativa.')
          )
        )
      );

      v_expected := array['urea_' || i, 'creat_' || i, 'na_' || i, 'k_' || i];
      v_main_finding := 'Hiperpotasemia con deterioro de función renal.';
      v_interpretation := 'Alto riesgo clínico por potencial compromiso eléctrico cardíaco.';
      v_action := 'Solicitar ECG y manejo urgente de hiperpotasemia.';
      v_education := 'Potasio elevado + creatinina alta exige acción rápida y monitor continuo.';
      v_suspicion := array['hiperpotasemia', 'renal', 'electrolítica', 'arritmia'];
      v_action_keywords := array['ecg', 'monitor', 'calcio', 'insulina', 'urgente'];

    elsif v_kind = 3 then
      -- Anemia
      v_context := 'anemia';
      v_chief := 'Fatiga, mareo y palidez';
      n1 := round((6.9 + random() * 4.1)::numeric, 1);    -- hb
      n2 := round((22 + random() * 11)::numeric, 1);      -- hct
      n3 := round((4500 + random() * 5000)::numeric, 0);  -- wbc
      n4 := round((35 + random() * 30)::numeric, 0);      -- neut
      n5 := round((20 + random() * 25)::numeric, 0);      -- lymph
      n6 := round((180000 + random() * 220000)::numeric, 0); -- plt

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'cbc_' || i,
          'name', 'Hemograma',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'hb_' || i, 'name', 'Hemoglobina', 'category', 'hemograma', 'value', n1, 'unit', 'g/dL', 'referenceRange', '12 - 16', 'status', 'low', 'interpretationHint', 'Anemia significativa.'),
            jsonb_build_object('id', 'ht_' || i, 'name', 'Hematocrito', 'category', 'hemograma', 'value', n2, 'unit', '%', 'referenceRange', '36 - 46', 'status', 'low', 'interpretationHint', 'Consistente con anemia.'),
            jsonb_build_object('id', 'wbc_' || i, 'name', 'Leucocitos', 'category', 'hemograma', 'value', n3, 'unit', '/mm³', 'referenceRange', '4,000 - 11,000', 'status', 'normal', 'interpretationHint', 'Sin leucocitosis.'),
            jsonb_build_object('id', 'neut_' || i, 'name', 'Neutrófilos', 'category', 'hemograma', 'value', n4, 'unit', '%', 'referenceRange', '40 - 70', 'status', 'normal', 'interpretationHint', 'Dentro de rango/limítrofe.'),
            jsonb_build_object('id', 'lym_' || i, 'name', 'Linfocitos', 'category', 'hemograma', 'value', n5, 'unit', '%', 'referenceRange', '20 - 45', 'status', 'normal', 'interpretationHint', 'Dentro de rango.'),
            jsonb_build_object('id', 'plt_' || i, 'name', 'Plaquetas', 'category', 'hemograma', 'value', n6, 'unit', '/mm³', 'referenceRange', '150,000 - 450,000', 'status', 'normal', 'interpretationHint', 'Sin trombocitopenia.')
          )
        )
      );

      v_expected := array['hb_' || i, 'ht_' || i];
      v_main_finding := 'Anemia con descenso de hemoglobina y hematocrito.';
      v_interpretation := 'Perfil orienta a anemia clínica que requiere estudio etiológico.';
      v_action := 'Priorizar evaluación de causa y plan de corrección.';
      v_education := 'Hemoglobina y hematocrito bajos con leucocitos normales orientan a causa no infecciosa.';
      v_suspicion := array['anemia', 'ferropenia', 'pérdida', 'fatiga'];
      v_action_keywords := array['etiología', 'hierro', 'transfusión', 'seguimiento'];

    elsif v_kind = 4 then
      -- Urinario
      v_context := 'urinary';
      v_chief := 'Disuria, polaquiuria y dolor lumbar';

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'orina_' || i,
          'name', 'Examen de orina',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'den_' || i, 'name', 'Densidad', 'category', 'orina', 'value', round((1.024 + random() * 0.010)::numeric, 3), 'unit', '', 'referenceRange', '1.005 - 1.025', 'status', 'high', 'interpretationHint', 'Orina concentrada.'),
            jsonb_build_object('id', 'ph_' || i, 'name', 'pH', 'category', 'orina', 'value', round((7.2 + random() * 1.2)::numeric, 1), 'unit', '', 'referenceRange', '5.0 - 7.0', 'status', 'high', 'interpretationHint', 'pH alcalino sugerente de infección.'),
            jsonb_build_object('id', 'leu_' || i, 'name', 'Leucocitos', 'category', 'orina', 'value', '+++', 'unit', '', 'referenceRange', 'Negativo', 'status', 'high', 'interpretationHint', 'Piuria marcada.'),
            jsonb_build_object('id', 'nit_' || i, 'name', 'Nitritos', 'category', 'orina', 'value', 'Positivo', 'unit', '', 'referenceRange', 'Negativo', 'status', 'high', 'interpretationHint', 'Bacteriuria probable.'),
            jsonb_build_object('id', 'prot_' || i, 'name', 'Proteínas', 'category', 'orina', 'value', '+', 'unit', '', 'referenceRange', 'Negativo', 'status', 'high', 'interpretationHint', 'Proteinuria leve.'),
            jsonb_build_object('id', 'glu_' || i, 'name', 'Glucosa', 'category', 'orina', 'value', 'Negativo', 'unit', '', 'referenceRange', 'Negativo', 'status', 'normal', 'interpretationHint', 'Sin glucosuria.'),
            jsonb_build_object('id', 'ket_' || i, 'name', 'Cetonas', 'category', 'orina', 'value', 'Negativo', 'unit', '', 'referenceRange', 'Negativo', 'status', 'normal', 'interpretationHint', 'Sin cetonuria.')
          )
        )
      );

      v_expected := array['den_' || i, 'ph_' || i, 'leu_' || i, 'nit_' || i, 'prot_' || i];
      v_main_finding := 'Examen de orina compatible con infección urinaria.';
      v_interpretation := 'Piuria y nitritos positivos con alta sospecha de etiología bacteriana.';
      v_action := 'Solicitar urocultivo y ajustar antibiótico según protocolo.';
      v_education := 'Leucocitos y nitritos positivos orientan de forma fuerte a infección urinaria.';
      v_suspicion := array['infección urinaria', 'bacteriuria', 'pielonefritis', 'urinaria'];
      v_action_keywords := array['urocultivo', 'antibiótico', 'hidratación', 'seguimiento'];

    elsif v_kind = 5 then
      -- Hepatobiliar
      v_context := 'hepatobiliary';
      v_chief := 'Dolor en hipocondrio derecho y coluria';
      n1 := round((120 + random() * 260)::numeric, 0); -- AST
      n2 := round((140 + random() * 320)::numeric, 0); -- ALT
      n3 := round((1.4 + random() * 3.1)::numeric, 2); -- bili
      n4 := round((0.8 + random() * 3.4)::numeric, 1); -- PCR

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'hep_' || i,
          'name', 'Perfil hepático',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'ast_' || i, 'name', 'AST / TGO', 'category', 'hepatico', 'value', n1, 'unit', 'U/L', 'referenceRange', '< 40', 'status', 'high', 'interpretationHint', 'Transaminasa elevada.'),
            jsonb_build_object('id', 'alt_' || i, 'name', 'ALT / TGP', 'category', 'hepatico', 'value', n2, 'unit', 'U/L', 'referenceRange', '< 41', 'status', 'high', 'interpretationHint', 'Lesión hepatocelular activa.'),
            jsonb_build_object('id', 'bil_' || i, 'name', 'Bilirrubina total', 'category', 'hepatico', 'value', n3, 'unit', 'mg/dL', 'referenceRange', '0.2 - 1.2', 'status', 'high', 'interpretationHint', 'Hiperbilirrubinemia.')
          )
        ),
        jsonb_build_object(
          'id', 'inflam_' || i,
          'name', 'Perfil inflamatorio',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'crp_' || i, 'name', 'PCR', 'category', 'inflamatorio', 'value', n4, 'unit', 'mg/dL', 'referenceRange', '< 0.5', 'status', 'high', 'interpretationHint', 'Inflamación asociada.')
          )
        )
      );

      v_expected := array['ast_' || i, 'alt_' || i, 'bil_' || i, 'crp_' || i];
      v_main_finding := 'Elevación de transaminasas y bilirrubina.';
      v_interpretation := 'Patrón hepatocelular que requiere ampliar estudio etiológico.';
      v_action := 'Ampliar perfil hepático y monitorizar evolución.';
      v_education := 'AST/ALT elevadas con bilirrubina alta orientan a daño hepatocelular activo.';
      v_suspicion := array['hepatocelular', 'hepático', 'colestasis', 'hepatitis'];
      v_action_keywords := array['perfil hepático', 'ecografía', 'control', 'vigilancia'];

    else
      -- Metabólico
      v_context := 'metabolic';
      v_chief := 'Poliuria, polidipsia y deshidratación';
      n1 := round((280 + random() * 320)::numeric, 0); -- glucosa
      n2 := round((35 + random() * 35)::numeric, 0);   -- urea
      n3 := round((1.2 + random() * 1.8)::numeric, 2); -- creat
      n4 := round((126 + random() * 10)::numeric, 0);  -- na
      n5 := round((5.2 + random() * 1.0)::numeric, 1); -- k
      n6 := round((93 + random() * 8)::numeric, 0);    -- cl

      v_panels := jsonb_build_array(
        jsonb_build_object(
          'id', 'chem_' || i,
          'name', 'Química básica',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'glu_' || i, 'name', 'Glucosa', 'category', 'quimica_basica', 'value', n1, 'unit', 'mg/dL', 'referenceRange', '70 - 110', 'status', 'high', 'interpretationHint', 'Hiperglucemia severa.'),
            jsonb_build_object('id', 'urea_' || i, 'name', 'Urea', 'category', 'quimica_basica', 'value', n2, 'unit', 'mg/dL', 'referenceRange', '15 - 45', 'status', 'high', 'interpretationHint', 'Azotemia por deshidratación.'),
            jsonb_build_object('id', 'creat_' || i, 'name', 'Creatinina', 'category', 'quimica_basica', 'value', n3, 'unit', 'mg/dL', 'referenceRange', '0.6 - 1.2', 'status', 'high', 'interpretationHint', 'Compromiso renal funcional.')
          )
        ),
        jsonb_build_object(
          'id', 'electro_' || i,
          'name', 'Electrolitos',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'na_' || i, 'name', 'Sodio', 'category', 'electrolitos', 'value', n4, 'unit', 'mEq/L', 'referenceRange', '135 - 145', 'status', 'low', 'interpretationHint', 'Hiponatremia relativa.'),
            jsonb_build_object('id', 'k_' || i, 'name', 'Potasio', 'category', 'electrolitos', 'value', n5, 'unit', 'mEq/L', 'referenceRange', '3.5 - 5.1', 'status', 'high', 'interpretationHint', 'Potasio alto limítrofe.'),
            jsonb_build_object('id', 'cl_' || i, 'name', 'Cloro', 'category', 'electrolitos', 'value', n6, 'unit', 'mEq/L', 'referenceRange', '98 - 107', 'status', 'low', 'interpretationHint', 'Hipocloremia leve.')
          )
        ),
        jsonb_build_object(
          'id', 'orina_' || i,
          'name', 'Orina',
          'parameters', jsonb_build_array(
            jsonb_build_object('id', 'glur_' || i, 'name', 'Glucosa en orina', 'category', 'orina', 'value', '+++', 'unit', '', 'referenceRange', 'Negativo', 'status', 'high', 'interpretationHint', 'Glucosuria marcada.'),
            jsonb_build_object('id', 'ket_' || i, 'name', 'Cetonas', 'category', 'orina', 'value', case when random() < 0.5 then '+' else '++' end, 'unit', '', 'referenceRange', 'Negativo', 'status', 'high', 'interpretationHint', 'Cetonuria presente.'),
            jsonb_build_object('id', 'nit_' || i, 'name', 'Nitritos', 'category', 'orina', 'value', 'Negativo', 'unit', '', 'referenceRange', 'Negativo', 'status', 'normal', 'interpretationHint', 'No sugiere foco urinario.')
          )
        )
      );

      v_expected := array['glu_' || i, 'urea_' || i, 'creat_' || i, 'na_' || i, 'k_' || i, 'cl_' || i, 'glur_' || i, 'ket_' || i];
      v_main_finding := 'Hiperglucemia con alteraciones electrolíticas y datos de deshidratación.';
      v_interpretation := 'Descompensación metabólica aguda con necesidad de manejo prioritario.';
      v_action := 'Iniciar protocolo de hiperglucemia aguda y monitorizar electrolitos.';
      v_education := 'La hiperglucemia severa suele acompañarse de alteraciones de volumen y electrolitos.';
      v_suspicion := array['hiperglucemia', 'metabólica', 'cetoacidosis', 'hiperosmolar'];
      v_action_keywords := array['insulina', 'hidratación', 'electrolitos', 'monitorización'];
    end if;

    v_patient := jsonb_build_object(
      'name', 'Paciente LAB ' || lpad(i::text, 4, '0'),
      'age', v_age,
      'sex', v_sex,
      'chiefComplaint', v_chief
    );

    insert into public.clinical_laboratory_cases (
      external_id,
      name,
      context,
      difficulty,
      patient,
      panels,
      main_finding,
      interpretation_expected,
      suggested_action,
      educational_explanation,
      expected_altered_ids,
      suspicion_keywords,
      action_keywords,
      is_active
    )
    values (
      v_external_id,
      v_name,
      v_context,
      v_difficulty,
      v_patient,
      v_panels,
      v_main_finding,
      v_interpretation,
      v_action,
      v_education,
      v_expected,
      v_suspicion,
      v_action_keywords,
      true
    )
    on conflict (external_id) do update
    set
      name = excluded.name,
      context = excluded.context,
      difficulty = excluded.difficulty,
      patient = excluded.patient,
      panels = excluded.panels,
      main_finding = excluded.main_finding,
      interpretation_expected = excluded.interpretation_expected,
      suggested_action = excluded.suggested_action,
      educational_explanation = excluded.educational_explanation,
      expected_altered_ids = excluded.expected_altered_ids,
      suspicion_keywords = excluded.suspicion_keywords,
      action_keywords = excluded.action_keywords,
      is_active = excluded.is_active,
      updated_at = now();
  end loop;
end $$;

-- Optional validation:
-- select context, count(*) from public.clinical_laboratory_cases group by context order by context;
