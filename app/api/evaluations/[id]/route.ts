import { NextResponse } from 'next/server';
import { deleteEvaluation, getEvaluationBundle } from '@/lib/db';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) { const {id}=await params,value=getEvaluationBundle(id); return value ? NextResponse.json(value) : NextResponse.json({error:'Not found'},{status:404}); }
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}) { const {id}=await params;return deleteEvaluation(id) ? new NextResponse(null,{status:204}) : NextResponse.json({error:'Not found'},{status:404}); }
