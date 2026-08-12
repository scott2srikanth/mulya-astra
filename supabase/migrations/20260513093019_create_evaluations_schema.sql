/*
  # AI GitHub Evaluator - Core Schema

  ## Tables Created

  1. **evaluations** - Main evaluation records
     - Student info, repo URL, status, timestamps
     - Final scores and grades
     - Hiring recommendation

  2. **evaluation_agents** - Per-agent analysis results
     - Agent type, findings, score, strengths/weaknesses

  3. **evaluation_metrics** - Detailed score breakdown
     - Category scores (coding, architecture, ui_ux, etc.)

  4. **tech_stack_detected** - Tech stack detection results

  5. **evaluation_logs** - Terminal/execution logs captured

  ## Security
  - RLS enabled on all tables
  - Public read/write for demo (evaluations are not user-specific)
  - In production, restrict to authenticated evaluators
*/

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT '',
  student_id text NOT NULL DEFAULT '',
  assignment_title text NOT NULL DEFAULT '',
  repo_url text NOT NULL,
  repo_name text DEFAULT '',
  repo_description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  -- status: pending | analyzing | running | evaluating | completed | failed
  progress integer NOT NULL DEFAULT 0,
  current_step text DEFAULT '',

  -- Final results
  final_score integer,
  grade text,
  hiring_recommendation text,
  confidence_level text,
  seniority_level text,
  summary text,
  improvement_roadmap text,

  -- Score breakdown
  coding_score integer,
  architecture_score integer,
  ui_ux_score integer,
  problem_solving_score integer,
  ai_engineering_score integer,
  performance_score integer,
  code_quality_score integer,
  documentation_score integer,

  -- Metadata
  languages_detected jsonb DEFAULT '[]'::jsonb,
  frameworks_detected jsonb DEFAULT '[]'::jsonb,
  ai_tools_detected jsonb DEFAULT '[]'::jsonb,
  repo_stats jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read evaluations"
  ON evaluations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert evaluations"
  ON evaluations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update evaluations"
  ON evaluations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Agent results table
CREATE TABLE IF NOT EXISTS evaluation_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  -- agent_type: frontend_engineer | backend_architect | ui_ux_reviewer | ai_ml_engineer | security_reviewer | product_reviewer
  agent_name text NOT NULL DEFAULT '',
  score integer,
  findings text DEFAULT '',
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  -- status: pending | analyzing | completed | failed
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluation_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read agents"
  ON evaluation_agents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert agents"
  ON evaluation_agents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update agents"
  ON evaluation_agents FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Evaluation logs
CREATE TABLE IF NOT EXISTS evaluation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  log_type text NOT NULL DEFAULT 'info',
  -- log_type: info | success | warning | error | system
  message text NOT NULL,
  step text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read logs"
  ON evaluation_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert logs"
  ON evaluation_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_agents_evaluation_id ON evaluation_agents(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_evaluation_id ON evaluation_logs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_created_at ON evaluation_logs(created_at);
