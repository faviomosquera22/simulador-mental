// src/lib/types.ts

export type Mode = "training" | "assessment";
export type InteractionStyle = "free" | "guided" | "hybrid";
export type CaseCategory =
  | "anxiety"
  | "depression"
  | "panic"
  | "ptsd"
  | "ocd"
  | "bipolar"
  | "delirium"
  | "substances"
  | "eating"
  | "selfharm"
  | "sexual_dysfunction"
  | "gender_dysphoria"
  | "sexual_risk"
  | "its_impact"
  | "sexual_trauma_history"
  | "paraphilic_behavior"
  | "asd_pediatric"
  | "adhd_pediatric"
  | "odd_pediatric"
  | "separation_anxiety_pediatric"
  | "social_anxiety_adolescent"
  | "depression_adolescent"
  | "suicide_risk_adolescent"
  | "eating_adolescent"
  | "conduct_disorder_pediatric"
  | "selective_mutism_pediatric"
  | "learning_disorder_pediatric"
  | "sleep_disorder_pediatric";

export type AgeGroup = "adult" | "adolescent" | "child" | "mixed";
export type SpeakerRole = "patient" | "caregiver" | "both";
export type InterviewMode = "free" | "scale" | "test" | "quiz";

export type EmotionState =
  | "neutral"
  | "calm"
  | "anxious"
  | "sad"
  | "irritable"
  | "confused"
  | "fearful"
  | "hopeful";

export type CaseObject = {
  case_id: string;
  version: "1.0";
  meta: {
    title: string;
    category: string;
    difficulty: 1 | 2 | 3;
    target_minutes: 10 | 20 | 30;
    tags: string[];
    age_group?: AgeGroup;
    case_category?: CaseCategory;
    pediatric_mode?: boolean;
    companion_available?: boolean;
    companion_role?: "madre" | "padre" | "tutor" | "cuidador" | "otro";
  };
  patient_profile: {
    display_name: string;
    age: number;
    gender: "female" | "male" | "nonbinary" | "unspecified";
    context: string;
    is_fictional: true;
    developmental_notes?: string;
    school_context?: string;
  };
  companion_profile?: {
    display_name: string;
    relation: "madre" | "padre" | "tutor" | "cuidador" | "otro";
    cooperativeness: "low" | "medium" | "high";
    reliability: "low" | "medium" | "high";
    narrative_style: "brief" | "detailed" | "minimizing" | "anxious";
  };
  learning_objectives: string[];
  areas: Record<
    string,
    { must_cover: boolean | "conditional"; key_points: string[] }
  >;
  facts_bank: Array<{
    fact_id: string;
    area: string;
    statement: string;
    sensitivity: "low" | "medium" | "high";
    reveal_stage: "inicio" | "sintomas" | "antecedentes" | "funcionamiento" | "riesgo" | "cierre";
  }>;
  reveal_plan: {
    stages: Array<"inicio" | "sintomas" | "antecedentes" | "funcionamiento" | "riesgo" | "cierre">;
    rules: {
      max_new_facts_per_turn: number;
      allow_spontaneous_disclosure: boolean;
      spontaneous_disclosure_rate: number;
    };
  };
  conversation_style: {
    baseline_tone: "reserved" | "neutral" | "talkative";
    verbosity: "low" | "medium" | "high";
    cooperativeness: "low" | "medium" | "high";
  };
  truth_reveal: {
    assessment_reveal_policy: "manual_only";
    truth_summary: string;
  };
};

export type AssessmentResponseType = "likert_0_3" | "likert_0_4" | "yes_no" | "multiple_choice";

export type AssessmentOption = {
  id: string;
  label: string;
  value: number;
};

export type ScaleItem = {
  id: string;
  prompt: string;
  options: AssessmentOption[];
};

export type ScaleDefinition = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  population: string;
  suggested_age_range: string;
  response_type: AssessmentResponseType;
  educational_only: boolean;
  placeholder?: boolean;
  items: ScaleItem[];
  interpretation: Array<{
    min: number;
    max: number;
    label: string;
    meaning: string;
  }>;
};

export type ScaleAnswer = {
  item_id: string;
  option_id: string;
  value: number;
  label: string;
  speaker?: SpeakerRole;
};

export type ScaleResult = {
  scale_id: string;
  total_score: number;
  max_score: number;
  severity_label: string;
  interpretation: string;
  completed_items: number;
  completed_at: string;
  risk_alert?: boolean;
  educational_note: string;
};

export type ScaleSession = {
  session_id: string;
  scale_id: string;
  status: "idle" | "in_progress" | "completed" | "cancelled";
  current_index: number;
  answers: ScaleAnswer[];
  started_at: string;
  completed_at?: string;
  result?: ScaleResult;
  use_for_feedback?: boolean;
  saved_to_notes?: boolean;
};

export type TestItem = {
  id: string;
  prompt: string;
  options: AssessmentOption[];
  domain?: string;
};

export type TestDefinition = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  kind: "screening" | "orientative_assessment";
  applies_to: "adult" | "adolescent" | "both";
  response_type: AssessmentResponseType;
  educational_only: boolean;
  items: TestItem[];
  interpretation: Array<{
    min: number;
    max: number;
    label: string;
    meaning: string;
  }>;
  limitations: string[];
};

export type TestAnswer = {
  item_id: string;
  option_id: string;
  value: number;
  label: string;
  speaker?: SpeakerRole;
};

export type TestResult = {
  test_id: string;
  total_score: number;
  max_score: number;
  classification: string;
  interpretation: string;
  observations: string[];
  limitations: string[];
  completed_items: number;
  completed_at: string;
  educational_note: string;
};

export type TestSession = {
  session_id: string;
  test_id: string;
  status: "idle" | "in_progress" | "completed" | "cancelled";
  current_index: number;
  answers: TestAnswer[];
  started_at: string;
  completed_at?: string;
  result?: TestResult;
};

export type BatteryStep = {
  id: string;
  mode: "scale" | "test";
  instrument_id: string;
  label: string;
  rationale?: string;
};

export type BatteryDefinition = {
  id: string;
  name: string;
  description: string;
  target_population: string;
  suggested_age_range: string;
  educational_only: boolean;
  steps: BatteryStep[];
  educational_note: string;
};

export type BatteryStepResult = {
  step_id: string;
  mode: "scale" | "test";
  instrument_id: string;
  instrument_name: string;
  total_score: number;
  max_score: number;
  classification: string;
  interpretation: string;
  risk_alert?: boolean;
  completed_at: string;
};

export type BatterySession = {
  session_id: string;
  battery_id: string;
  status: "idle" | "in_progress" | "completed" | "cancelled";
  current_step_index: number;
  step_results: BatteryStepResult[];
  started_at: string;
  completed_at?: string;
  auto_run: boolean;
};

export type QuizQuestion = {
  id: string;
  category: string;
  subcategory: string;
  prompt: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string }>;
  correct_option: "A" | "B" | "C" | "D";
  rationale: string;
  difficulty: "basic" | "intermediate" | "advanced";
};

export type QuizResult = {
  mode:
    | "practice"
    | "quiz_5"
    | "simulacro_10"
    | "simulacro_20"
    | "simulacro_30"
    | "simulacro_40"
    | "simulacro_50_mixto"
    | "simulacro_maximo";
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  finished_at: string;
  review: Array<{
    question_id: string;
    selected: "A" | "B" | "C" | "D" | null;
    correct: "A" | "B" | "C" | "D";
  }>;
};

export type CacesOptionId = "A" | "B" | "C" | "D";
export type CacesDifficulty = "basica" | "intermedia" | "alta";
export type CacesQuestionType = "directa" | "caso_clinico";
export type CacesCognitiveLevel =
  | "conocimiento"
  | "comprension"
  | "aplicacion"
  | "analisis";
export type CacesComplexityLevel = "bajo" | "medio" | "alto";
export type CacesPracticeMode =
  | "practica_individual"
  | "quiz_5"
  | "simulacro_10"
  | "simulacro_20"
  | "simulacro_30"
  | "simulacro_40"
  | "simulacro_50_mixto"
  | "simulacro_maximo";
export type CacesFeedbackMode = "inmediata" | "final";

export type CacesQuestionOption = {
  id: CacesOptionId;
  text: string;
  rationale: string;
};

export type CacesQuestion = {
  id: string;
  component: string;
  subcomponent: string;
  topic: string;
  category: string;
  type: CacesQuestionType;
  question: string;
  options: [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];
  correctAnswer: CacesOptionId;
  explanation: string;
  difficulty: CacesDifficulty;
  tags: string[];
  manualProfile?: {
    framework: "EHEP_2024";
    cognitiveLevel: CacesCognitiveLevel;
    complexityLevel: CacesComplexityLevel;
    reviewed: boolean;
  };
  references?: string[];
};

export type CacesAttemptConfig = {
  component?: string;
  subcomponent?: string;
  topic?: string;
  category?: string;
  difficulty?: CacesDifficulty;
  type?: CacesQuestionType;
  mode: CacesPracticeMode;
  number_of_questions: number;
  minutes_per_question: 1 | 2;
  estimated_time_minutes: number;
  feedback_mode: CacesFeedbackMode;
  timer_enabled: boolean;
  mix_categories: boolean;
  save_result: boolean;
};

export type CacesAttemptAnswer = {
  question_id: string;
  selected: CacesOptionId | null;
  skipped: boolean;
  marked_for_review: boolean;
};

export type CacesAttemptResult = {
  attempt_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  skipped_answers: number;
  accuracy: number;
  total_score: number;
  elapsed_seconds: number;
  finished_at: string;
  by_category: Array<{
    category: string;
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  }>;
  weak_topics: string[];
  review: Array<{
    question_id: string;
    category: string;
    topic: string;
    selected: CacesOptionId | null;
    correct: CacesOptionId;
    is_correct: boolean;
    skipped: boolean;
  }>;
};

export type CacesHistoryEntry = {
  id: string;
  created_at: string;
  config: CacesAttemptConfig;
  result: CacesAttemptResult;
};

export type CaseSeed = {
  id: string;
  title: string;
  category: CaseCategory;
  age_group: AgeGroup;
  age: number;
  sex_gender: "female" | "male" | "nonbinary" | "unspecified";
  chief_complaint: string;
  probable_primary_diagnosis: string;
  differential_diagnoses: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  family_social_context: string;
  personality_behavior_traits: string[];
  guiding_symptoms: string[];
  antecedents: string[];
  red_flags: string[];
  response_style: string;
  teaching_objectives: string[];
  companion_available?: boolean;
  companion_role?: "madre" | "padre" | "tutor" | "cuidador" | "otro";
};

export type InstrumentAnswerPayload = {
  item_id?: string;
  option_id?: string;
  option_index?: number;
  option_label?: string;
  option_value?: number;
  confidence?: number;
  rationale?: string;
};

export type ActiveInstrumentContext = {
  mode: "scale" | "test";
  instrument_id: string;
  instrument_name: string;
  item_index: number;
  total_items: number;
  item_id: string;
  item_prompt: string;
  response_type: AssessmentResponseType;
  options: AssessmentOption[];
};

export type PatientTurnOutput = {
  message_text: string;
  emotion_state: EmotionState;
  emotion_intensity: number; // 0-100
  arousal?: number; // 0-100
  rapport?: number; // 0-100
  flags?:
    | string[]
    | {
        new_fact_revealed_ids?: string[];
        risk_mentioned?: boolean;
        needs_clarification?: boolean;
        content_safety_triggered?: boolean;
      };
  speaker_role?: Exclude<SpeakerRole, "both">;
  interaction_mode?: InterviewMode;
  instrument_answer?: InstrumentAnswerPayload;
};

export type EvaluatorOutput = {
  coverage_by_area: Record<
    string,
    { covered: boolean | "not_applicable"; score: number | null; notes: string[] }
  >;
  question_quality: {
    open_questions_ratio: number;
    empathy_markers: number;
    sequencing_score: number;
    notes: string[];
  };
  missed_critical_questions: string[];
  risk_handling: {
    triggered: boolean;
    score: number | null;
    educational_notes: string[];
  };
  strengths: string[];
  improvements: string[];
  recommendations_actionable: string[];
  final_summary: string;
  reveal_case_truth?: {
    available: boolean;
    revealed: boolean;
    truth_summary: string;
  };
};
