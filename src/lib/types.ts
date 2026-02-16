// src/lib/types.ts

export type Mode = "training" | "assessment";
export type InteractionStyle = "free" | "guided" | "hybrid";

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
  };
  patient_profile: {
    display_name: string;
    age: number;
    gender: "female" | "male" | "nonbinary" | "unspecified";
    context: string;
    is_fictional: true;
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

export type PatientTurnOutput = {
  message_text: string;
  emotion_state: EmotionState;
  emotion_intensity: number; // 0-100
  arousal?: number; // 0-100
  rapport?: number; // 0-100
  flags?: {
    new_fact_revealed_ids?: string[];
    risk_mentioned?: boolean;
    needs_clarification?: boolean;
    content_safety_triggered?: boolean;
  };
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