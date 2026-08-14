import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import type { AnalysisFinding, AssignmentSpec, CategoryScore, Evaluation, EvaluationAgent, EvaluationLog, ManualAiReview } from '@/types/database';

const dataDir = process.env.SQLITE_DATA_DIR || path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const databasePath = process.env.NEXT_PHASE === 'phase-production-build' ? ':memory:' : path.join(dataDir, 'mulya-astra.sqlite');
const db = new Database(databasePath, { timeout: 5000 });
if (databasePath !== ':memory:') db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY, student_name TEXT NOT NULL, student_id TEXT NOT NULL,
    assignment_title TEXT NOT NULL, repo_url TEXT NOT NULL, repo_name TEXT,
    repo_description TEXT, status TEXT NOT NULL DEFAULT 'pending', progress INTEGER NOT NULL DEFAULT 0,
    current_step TEXT, final_score INTEGER, grade TEXT, hiring_recommendation TEXT,
    confidence_level TEXT, seniority_level TEXT, summary TEXT, improvement_roadmap TEXT,
    coding_score INTEGER, architecture_score INTEGER, ui_ux_score INTEGER,
    problem_solving_score INTEGER, ai_engineering_score INTEGER, performance_score INTEGER,
    code_quality_score INTEGER, documentation_score INTEGER, languages_detected TEXT NOT NULL DEFAULT '[]',
    frameworks_detected TEXT NOT NULL DEFAULT '[]', ai_tools_detected TEXT NOT NULL DEFAULT '[]',
    repo_stats TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS evaluation_agents (
    id TEXT PRIMARY KEY, evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL, agent_name TEXT NOT NULL, score INTEGER, findings TEXT,
    strengths TEXT NOT NULL DEFAULT '[]', weaknesses TEXT NOT NULL DEFAULT '[]', suggestions TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS evaluation_logs (
    id TEXT PRIMARY KEY, evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    log_type TEXT NOT NULL, message TEXT NOT NULL, step TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id TEXT PRIMARY KEY, evaluation_id TEXT NOT NULL UNIQUE REFERENCES evaluations(id) ON DELETE CASCADE,
    status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, commit_sha TEXT, error TEXT,
    started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS analysis_findings (
    id TEXT PRIMARY KEY, evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    category TEXT NOT NULL, severity TEXT NOT NULL, title TEXT NOT NULL, explanation TEXT NOT NULL,
    file_path TEXT, start_line INTEGER, evidence TEXT NOT NULL, recommendation TEXT,
    rule_id TEXT NOT NULL, confidence INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS category_scores (
    evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE, category TEXT NOT NULL,
    score INTEGER NOT NULL, max_score INTEGER NOT NULL, confidence INTEGER NOT NULL, rationale TEXT NOT NULL,
    PRIMARY KEY (evaluation_id, category)
  );
  CREATE TABLE IF NOT EXISTS manual_ai_reviews (
    evaluation_id TEXT PRIMARY KEY REFERENCES evaluations(id) ON DELETE CASCADE,
    request_json TEXT NOT NULL, response_json TEXT, submitted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_evaluations_created ON evaluations(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_agents_evaluation ON evaluation_agents(evaluation_id);
  CREATE INDEX IF NOT EXISTS idx_logs_evaluation ON evaluation_logs(evaluation_id, created_at);
`);
const evaluationColumns=db.prepare('PRAGMA table_info(evaluations)').all() as Array<{name:string}>;
if(!evaluationColumns.some(column=>column.name==='assignment_spec'))db.exec('ALTER TABLE evaluations ADD COLUMN assignment_spec TEXT');
if(!evaluationColumns.some(column=>column.name==='assignment_results'))db.exec('ALTER TABLE evaluations ADD COLUMN assignment_results TEXT');
db.prepare(`INSERT OR IGNORE INTO evaluation_jobs (id,evaluation_id,status,created_at,updated_at)
  SELECT lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||substr(lower(hex(randomblob(2))),2)||'-a'||substr(lower(hex(randomblob(2))),2)||'-'||lower(hex(randomblob(6))),id,'queued',created_at,updated_at
  FROM evaluations WHERE status='pending'`).run();

const jsonFields = new Set(['languages_detected', 'frameworks_detected', 'ai_tools_detected', 'repo_stats', 'strengths', 'weaknesses', 'suggestions', 'assignment_spec', 'assignment_results']);
function decode<T>(row: Record<string, unknown> | undefined): T | null {
  if (!row) return null;
  jsonFields.forEach(key => { if (typeof row[key] === 'string') row[key] = JSON.parse(row[key] as string); });
  return row as T;
}
function encode(value: unknown, key: string) { return jsonFields.has(key) ? JSON.stringify(value) : value; }

export function createEvaluation(input: Pick<Evaluation, 'repo_url' | 'repo_name' | 'student_name' | 'student_id' | 'assignment_title'> & {assignment_spec?:AssignmentSpec|null}) {
  const now = new Date().toISOString();
  const row = { id: randomUUID(), ...input, status: 'pending', progress: 0, created_at: now, updated_at: now };
  db.prepare(`INSERT INTO evaluations (id,repo_url,repo_name,student_name,student_id,assignment_title,status,progress,assignment_spec,created_at,updated_at)
    VALUES (@id,@repo_url,@repo_name,@student_name,@student_id,@assignment_title,@status,@progress,@assignment_spec,@created_at,@updated_at)`).run({...row,assignment_spec:input.assignment_spec?JSON.stringify(input.assignment_spec):null});
  db.prepare('INSERT INTO evaluation_jobs (id,evaluation_id,status,created_at,updated_at) VALUES (?,?,?,?,?)').run(randomUUID(),row.id,'queued',now,now);
  return getEvaluation(row.id)!;
}
export function listEvaluations() { return db.prepare('SELECT * FROM evaluations ORDER BY created_at DESC').all().map(r => decode<Evaluation>(r as Record<string, unknown>)!); }
export function getEvaluation(id: string) { return decode<Evaluation>(db.prepare('SELECT * FROM evaluations WHERE id=?').get(id) as Record<string, unknown>); }
export function deleteEvaluation(id: string) { return db.prepare('DELETE FROM evaluations WHERE id=?').run(id).changes > 0; }
export function updateEvaluation(id: string, values: Record<string, unknown>) {
  const entries = Object.entries({ ...values, updated_at: new Date().toISOString() });
  if (!entries.length) return;
  db.prepare(`UPDATE evaluations SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`).run(...entries.map(([k,v]) => encode(v,k)), id);
}
export function addLog(evaluationId: string, log_type: EvaluationLog['log_type'], message: string, step = '') {
  db.prepare('INSERT INTO evaluation_logs VALUES (?,?,?,?,?,?)').run(randomUUID(), evaluationId, log_type, message, step, new Date().toISOString());
}
export function listLogs(id: string) { return db.prepare('SELECT * FROM evaluation_logs WHERE evaluation_id=? ORDER BY created_at').all(id).map(r => decode<EvaluationLog>(r as Record<string, unknown>)!); }
export function insertAgents(rows: Array<Omit<EvaluationAgent, 'id' | 'created_at' | 'score' | 'findings'>>) {
  const stmt = db.prepare(`INSERT INTO evaluation_agents (id,evaluation_id,agent_type,agent_name,status,strengths,weaknesses,suggestions,created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
  return rows.map(row => { const id=randomUUID(); stmt.run(id,row.evaluation_id,row.agent_type,row.agent_name,row.status,JSON.stringify(row.strengths),JSON.stringify(row.weaknesses),JSON.stringify(row.suggestions),new Date().toISOString()); return getAgent(id)!; });
}
export function getAgent(id: string) { return decode<EvaluationAgent>(db.prepare('SELECT * FROM evaluation_agents WHERE id=?').get(id) as Record<string, unknown>); }
export function updateAgent(id: string, values: Record<string, unknown>) { const e=Object.entries(values); db.prepare(`UPDATE evaluation_agents SET ${e.map(([k])=>`${k}=?`).join(',')} WHERE id=?`).run(...e.map(([k,v])=>encode(v,k)),id); }
export function listAgents(id: string) { return db.prepare('SELECT * FROM evaluation_agents WHERE evaluation_id=? ORDER BY created_at').all(id).map(r => decode<EvaluationAgent>(r as Record<string, unknown>)!); }
export function getEvaluationBundle(id: string) { const evaluation=getEvaluation(id); return evaluation ? { evaluation, agents:listAgents(id), logs:listLogs(id), findings:listFindings(id), categoryScores:listCategoryScores(id), aiReview:getAiReview(id) } : null; }

export function startJob(evaluationId:string) { const now=new Date().toISOString(); return db.prepare("UPDATE evaluation_jobs SET status='running',attempts=attempts+1,started_at=?,updated_at=?,error=NULL WHERE evaluation_id=? AND status IN ('queued','failed')").run(now,now,evaluationId).changes>0; }
export interface EvaluationJob { id:string; evaluation_id:string; status:'queued'|'running'|'completed'|'failed'; attempts:number; commit_sha:string|null; error:string|null; started_at:string|null; completed_at:string|null; created_at:string; updated_at:string }
export function getJob(evaluationId:string){return db.prepare('SELECT * FROM evaluation_jobs WHERE evaluation_id=?').get(evaluationId) as EvaluationJob|undefined;}
export function getQueuePosition(evaluationId:string){const job=getJob(evaluationId);if(!job||job.status!=='queued')return null;const row=db.prepare("SELECT COUNT(*) AS position FROM evaluation_jobs WHERE status='queued' AND (created_at < ? OR (created_at = ? AND id <= ?))").get(job.created_at,job.created_at,job.id) as {position:number};return row.position;}
export function claimNextJob(){return db.transaction(()=>{const job=db.prepare("SELECT * FROM evaluation_jobs WHERE status='queued' ORDER BY created_at LIMIT 1").get() as EvaluationJob|undefined;if(!job)return null;const now=new Date().toISOString();const claimed=db.prepare("UPDATE evaluation_jobs SET status='running',attempts=attempts+1,started_at=?,updated_at=?,error=NULL WHERE id=? AND status='queued'").run(now,now,job.id);return claimed.changes?({...job,status:'running' as const,attempts:job.attempts+1,started_at:now,updated_at:now}):null;})();}
export function recoverStaleJobs(maxAgeMs=10*60_000){const cutoff=new Date(Date.now()-maxAgeMs).toISOString();return db.prepare("UPDATE evaluation_jobs SET status='queued',error='Recovered after worker interruption',updated_at=? WHERE status='running' AND updated_at<?").run(new Date().toISOString(),cutoff).changes;}
export function finishJob(evaluationId:string, commitSha:string) { const now=new Date().toISOString(); db.prepare("UPDATE evaluation_jobs SET status='completed',commit_sha=?,completed_at=?,updated_at=? WHERE evaluation_id=?").run(commitSha,now,now,evaluationId); }
export function failJob(evaluationId:string,error:string) { const job=getJob(evaluationId);const retry=Boolean(job&&job.attempts<3);db.prepare('UPDATE evaluation_jobs SET status=?,error=?,updated_at=? WHERE evaluation_id=?').run(retry?'queued':'failed',error.slice(0,1000),new Date().toISOString(),evaluationId);return retry; }
export function clearAgents(evaluationId:string){db.prepare('DELETE FROM evaluation_agents WHERE evaluation_id=?').run(evaluationId);}
export function replaceFindings(evaluationId:string, findings:Array<Omit<AnalysisFinding,'id'|'evaluation_id'|'created_at'>>) { const remove=db.prepare('DELETE FROM analysis_findings WHERE evaluation_id=?'); const add=db.prepare('INSERT INTO analysis_findings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'); db.transaction(()=>{remove.run(evaluationId);for(const f of findings)add.run(randomUUID(),evaluationId,f.category,f.severity,f.title,f.explanation,f.file_path,f.start_line,f.evidence,f.recommendation,f.rule_id,f.confidence,new Date().toISOString());})(); }
export function replaceCategoryScores(evaluationId:string,scores:CategoryScore[]) { const remove=db.prepare('DELETE FROM category_scores WHERE evaluation_id=?');const add=db.prepare('INSERT INTO category_scores VALUES (?,?,?,?,?,?)');db.transaction(()=>{remove.run(evaluationId);for(const s of scores)add.run(evaluationId,s.category,s.score,s.max_score,s.confidence,s.rationale);})(); }
export function listFindings(id:string){return db.prepare('SELECT * FROM analysis_findings WHERE evaluation_id=? ORDER BY CASE severity WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 ELSE 4 END, file_path').all(id) as AnalysisFinding[];}
export function listCategoryScores(id:string){return db.prepare('SELECT category,score,max_score,confidence,rationale FROM category_scores WHERE evaluation_id=? ORDER BY rowid').all(id) as CategoryScore[];}
export function saveAiRequest(evaluationId:string,request:unknown){const now=new Date().toISOString();db.prepare(`INSERT INTO manual_ai_reviews (evaluation_id,request_json,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(evaluation_id) DO UPDATE SET request_json=excluded.request_json,updated_at=excluded.updated_at`).run(evaluationId,JSON.stringify(request),now,now);}
export function saveAiResponse(evaluationId:string,response:ManualAiReview){const now=new Date().toISOString();db.prepare('UPDATE manual_ai_reviews SET response_json=?,submitted_at=?,updated_at=? WHERE evaluation_id=?').run(JSON.stringify(response),now,now,evaluationId);}
export function getAiReview(evaluationId:string){const row=db.prepare('SELECT request_json,response_json,submitted_at FROM manual_ai_reviews WHERE evaluation_id=?').get(evaluationId) as {request_json:string;response_json:string|null;submitted_at:string|null}|undefined;return row?{request:JSON.parse(row.request_json),response:row.response_json?JSON.parse(row.response_json) as ManualAiReview:null,submitted_at:row.submitted_at}:null;}
