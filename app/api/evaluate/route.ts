import { NextRequest, NextResponse } from 'next/server';
import { getEvaluation, getJob } from '@/lib/db';
export const runtime='nodejs';
export async function POST(req:NextRequest){const {evaluationId,repoUrl}=await req.json();const evaluation=getEvaluation(String(evaluationId||''));if(!evaluation||evaluation.repo_url!==repoUrl)return NextResponse.json({error:'Evaluation not found or URL mismatch'},{status:404});const job=getJob(evaluation.id);if(!job)return NextResponse.json({error:'Evaluation job not found'},{status:404});return NextResponse.json({status:job.status},{status:202});}
