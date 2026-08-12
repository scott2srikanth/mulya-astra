export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      evaluations: {
        Row: Evaluation;
        Insert: EvaluationInsert;
        Update: EvaluationUpdate;
      };
      evaluation_agents: {
        Row: EvaluationAgent;
        Insert: EvaluationAgentInsert;
        Update: EvaluationAgentUpdate;
      };
      evaluation_logs: {
        Row: EvaluationLog;
        Insert: EvaluationLogInsert;
        Update: Partial<EvaluationLogInsert>;
      };
    };
  };
}

export interface Evaluation {
  id: string;
  student_name: string;
  student_id: string;
  assignment_title: string;
  repo_url: string;
  repo_name: string | null;
  repo_description: string | null;
  status: EvaluationStatus;
  progress: number;
  current_step: string | null;
  final_score: number | null;
  grade: string | null;
  hiring_recommendation: HiringRecommendation | null;
  confidence_level: string | null;
  seniority_level: SeniorityLevel | null;
  summary: string | null;
  improvement_roadmap: string | null;
  coding_score: number | null;
  architecture_score: number | null;
  ui_ux_score: number | null;
  problem_solving_score: number | null;
  ai_engineering_score: number | null;
  performance_score: number | null;
  code_quality_score: number | null;
  documentation_score: number | null;
  languages_detected: string[];
  frameworks_detected: string[];
  ai_tools_detected: string[];
  repo_stats: RepoStats;
  created_at: string;
  updated_at: string;
}

export type EvaluationInsert = Omit<Evaluation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type EvaluationUpdate = Partial<EvaluationInsert>;

export type EvaluationStatus = 'pending' | 'analyzing' | 'running' | 'evaluating' | 'completed' | 'failed';

export type HiringRecommendation = 'Strong Hire' | 'Hire' | 'Potential' | 'Needs Mentorship' | 'Not Ready';

export type SeniorityLevel = 'Beginner' | 'Junior' | 'Intermediate' | 'Advanced' | 'Senior' | 'Exceptional';

export interface RepoStats {
  stars?: number;
  forks?: number;
  commits?: number;
  contributors?: number;
  lines_of_code?: number;
  file_count?: number;
  last_commit?: string;
}

export interface EvaluationAgent {
  id: string;
  evaluation_id: string;
  agent_type: AgentType;
  agent_name: string;
  score: number | null;
  findings: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  status: AgentStatus;
  created_at: string;
}

export type EvaluationAgentInsert = Omit<EvaluationAgent, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type EvaluationAgentUpdate = Partial<EvaluationAgentInsert>;

export type AgentType =
  | 'frontend_engineer'
  | 'backend_architect'
  | 'ui_ux_reviewer'
  | 'ai_ml_engineer'
  | 'security_reviewer'
  | 'product_reviewer';

export type AgentStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface EvaluationLog {
  id: string;
  evaluation_id: string;
  log_type: LogType;
  message: string;
  step: string | null;
  created_at: string;
}

export type EvaluationLogInsert = Omit<EvaluationLog, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type LogType = 'info' | 'success' | 'warning' | 'error' | 'system';
