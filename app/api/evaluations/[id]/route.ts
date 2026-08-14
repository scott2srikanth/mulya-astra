import { NextResponse } from 'next/server';
import { deleteEvaluation, getEvaluationBundle } from '@/lib/db';
export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:{id:string}}) { const value=getEvaluationBundle(params.id); return value ? NextResponse.json(value) : NextResponse.json({error:'Not found'},{status:404}); }
export async function DELETE(_:Request,{params}:{params:{id:string}}) { return deleteEvaluation(params.id) ? new NextResponse(null,{status:204}) : NextResponse.json({error:'Not found'},{status:404}); }
