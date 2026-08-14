import { NextRequest, NextResponse } from 'next/server';
import { createEvaluation, listEvaluations } from '@/lib/db';
import type { AssignmentSpec } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() { return NextResponse.json(listEvaluations()); }
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (typeof body.repoUrl !== 'string' || body.repoUrl.length > 500) return NextResponse.json({ error:'Invalid repository URL' }, { status:400 });
  let url: URL;
  try { url = new URL(body.repoUrl); } catch { return NextResponse.json({ error:'Invalid repository URL' }, { status:400 }); }
  const parts=url.pathname.split('/').filter(Boolean);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || parts.length !== 2) return NextResponse.json({ error:'Use a canonical public GitHub repository URL' }, { status:400 });
  const lines=(value:unknown)=>String(value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean).slice(0,100);
  const endpointLines=lines(body.endpoints);const assignment:AssignmentSpec={brief:String(body.assignmentBrief||'').slice(0,10000),required_paths:lines(body.requiredPaths),required_functions:lines(body.requiredFunctions),ui_requirements:lines(body.uiRequirements),model_requirements:lines(body.modelRequirements),endpoints:endpointLines.map(line=>{const match=/^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)(?:\s+-\s+(.+))?$/i.exec(line);return match?{method:match[1].toUpperCase(),path:match[2],description:match[3]||''}:null;}).filter((v):v is {method:string;path:string;description:string}=>Boolean(v)),forbidden_patterns:lines(body.forbiddenPatterns),assignment_weight:Math.min(100,Math.max(0,Number(body.assignmentWeight)||70))};
  const hasAssignment=assignment.brief.length>0||assignment.required_paths.length>0||assignment.required_functions.length>0||assignment.ui_requirements.length>0||assignment.model_requirements.length>0||assignment.endpoints.length>0||assignment.forbidden_patterns.length>0;
  const evaluation=createEvaluation({ repo_url:url.toString(), repo_name:`${parts[0]}/${parts[1].replace(/\.git$/,'')}`, student_name:String(body.studentName||'Unknown Student').slice(0,120), student_id:String(body.studentId||'N/A').slice(0,120), assignment_title:String(body.assignmentTitle||'General Evaluation').slice(0,200),assignment_spec:hasAssignment?assignment:null });
  return NextResponse.json(evaluation, { status:201 });
}
