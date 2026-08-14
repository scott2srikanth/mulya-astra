import { claimNextJob, recoverStaleJobs } from '../lib/db';
import { executeEvaluation } from '../lib/evaluation-runner';

const pollMs=Math.max(250,Number(process.env.EVALUATION_POLL_MS||1000));const concurrency=Math.min(10,Math.max(1,Number(process.env.EVALUATION_CONCURRENCY||1)));let stopping=false;
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
async function main(){const recovered=recoverStaleJobs();if(recovered)console.log(`[worker] recovered ${recovered} interrupted job(s)`);console.log(`[worker] watching SQLite queue every ${pollMs}ms with concurrency ${concurrency}`);const active=new Set<Promise<void>>();
  const run=(evaluationId:string,attempts:number)=>{const task=(async()=>{console.log(`[worker] evaluating ${evaluationId} (attempt ${attempts})`);try{await executeEvaluation(evaluationId);console.log(`[worker] completed ${evaluationId}`);}catch(error){console.error(`[worker] failed ${evaluationId}:`,error instanceof Error?error.message:error);}})().finally(()=>active.delete(task));active.add(task);};
  while(!stopping){while(!stopping&&active.size<concurrency){const job=claimNextJob();if(!job)break;run(job.evaluation_id,job.attempts);}if(active.size>=concurrency)await Promise.race(active);else await wait(pollMs);}await Promise.allSettled(active);
  console.log('[worker] stopped');}
main().catch(error=>{console.error('[worker] fatal error',error);process.exitCode=1;});
