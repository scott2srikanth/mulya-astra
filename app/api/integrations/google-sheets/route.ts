import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createEvaluation, getEvaluationBundle, getJob, getQueuePosition } from '@/lib/db';
import type { AssignmentSpec } from '@/types/database';

export const runtime='nodejs';export const dynamic='force-dynamic';
function authorized(req:NextRequest){const expected=process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;if(!expected)return false;const supplied=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';const a=Buffer.from(expected),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
function github(value:string){try{const url=new URL(value),parts=url.pathname.split('/').filter(Boolean);return url.protocol==='https:'&&url.hostname==='github.com'&&parts.length===2?{url,owner:parts[0],repo:parts[1].replace(/\.git$/,'')}:null;}catch{return null;}}

export async function POST(req:NextRequest){
  if(!authorized(req))return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json(),repository=github(String(body.repoUrl||''));if(!repository)return NextResponse.json({error:'Use a canonical public GitHub repository URL'},{status:400});
  const assignmentSpec=body.assignmentSpec&&typeof body.assignmentSpec==='object'?body.assignmentSpec as AssignmentSpec:null;
  const evaluation=createEvaluation({repo_url:repository.url.toString(),repo_name:`${repository.owner}/${repository.repo}`,student_name:String(body.studentName||'Unknown Student').slice(0,120),student_id:String(body.rollNumber||'N/A').slice(0,120),assignment_title:String(body.projectTitle||'Google Sheets Submission').slice(0,200),assignment_spec:assignmentSpec});
  return NextResponse.json({evaluationId:evaluation.id,status:'Queued',queuePosition:getQueuePosition(evaluation.id),statusUrl:`/api/integrations/google-sheets?evaluationId=${evaluation.id}`},{status:202});
}

export async function GET(req:NextRequest){
  if(!authorized(req))return NextResponse.json({error:'Unauthorized'},{status:401});const id=req.nextUrl.searchParams.get('evaluationId')||'',bundle=getEvaluationBundle(id);if(!bundle)return NextResponse.json({error:'Evaluation not found'},{status:404});
  const {evaluation,categoryScores,findings,agents}=bundle,job=getJob(id);const pipelineStatus=evaluation.status==='completed'?'Completed':evaluation.status==='failed'||job?.status==='failed'?'Failed':job?.status==='queued'?'Queued':'In Progress';return NextResponse.json({evaluation:{id:evaluation.id,status:evaluation.status,pipelineStatus,queuePosition:getQueuePosition(id),progress:evaluation.progress,studentName:evaluation.student_name,rollNumber:evaluation.student_id,projectTitle:evaluation.assignment_title,repository:evaluation.repo_url,score:evaluation.final_score,grade:evaluation.grade,summary:evaluation.summary,roadmap:evaluation.improvement_roadmap,confidence:evaluation.confidence_level,completedAt:evaluation.updated_at,assignment:evaluation.assignment_results},categoryScores,findings:findings.slice(0,40),specialistReviews:agents.map(a=>({name:a.agent_name,score:a.score,summary:a.findings,strengths:a.strengths,weaknesses:a.weaknesses,suggestions:a.suggestions}))});
}
