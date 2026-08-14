import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSnapshot, type RepositorySnapshot } from '../lib/github-analysis';

function snapshot(files: Array<[string,string]>):RepositorySnapshot{return {metadata:{name:'fixture',description:'test',stargazers_count:0,forks_count:0,language:'TypeScript',default_branch:'main',topics:[]},commitSha:'abc123',treeCount:files.length,truncated:false,files:files.map(([path,content])=>({path,content,size:Buffer.byteLength(content),lines:content.split('\n').length,language:path.endsWith('.tsx')?'TypeScript React':path.endsWith('.ts')?'TypeScript':'Markdown'}))};}

test('produces deterministic evidence and scores',()=>{
  const input=snapshot([
    ['src/view.tsx',`export function View({html}:{html:string}) { console.log('render'); return <div dangerouslySetInnerHTML={{__html:html}} /> }`],
    ['README.md','# Fixture\n\nSetup and test instructions.'],
  ]);
  const first=analyzeSnapshot(input),second=analyzeSnapshot(input);
  assert.deepEqual(first,second);
  assert.ok(first.findings.some(f=>f.rule_id==='security.dangerous-html'&&f.file_path==='src/view.tsx'&&f.start_line===1));
  assert.ok(first.findings.some(f=>f.rule_id==='testing.no-tests'));
  assert.equal(first.scores.reduce((sum,item)=>sum+item.max_score,0),100);
});

test('does not award engineering points when no executable source is present',()=>{const result=analyzeSnapshot(snapshot([['README.md','# Goal\nA short description.']]));assert.equal(result.metrics.codeFiles,0);assert.equal(result.scores.reduce((sum,item)=>sum+item.score,0),5);assert.equal(result.scores.find(item=>item.category==='implementation')?.score,0);assert.equal(result.scores.find(item=>item.category==='security')?.score,0);});

test('recognizes conventional tests and avoids the no-tests finding',()=>{
  const result=analyzeSnapshot(snapshot([
    ['src/add.ts','export const add=(a:number,b:number)=>a+b;'],
    ['src/add.test.ts',`import {add} from './add'; test('adds',()=>{if(add(1,2)!==3)throw new Error('bad')});`],
    ['README.md','# Tested fixture'],
    ['.github/workflows/ci.yml','name: ci'],
  ]));
  assert.equal(result.metrics.testFiles,1);
  assert.ok(!result.findings.some(f=>f.rule_id==='testing.no-tests'));
  assert.ok(!result.findings.some(f=>f.rule_id==='testing.no-ci'));
});

test('grades frontend accessibility, typing, hooks, and tests',()=>{
  const result=analyzeSnapshot(snapshot([
    ['src/Card.tsx',`import {useEffect} from 'react'; export function Card({html}:{html:string}) { useEffect(()=>console.log(html)); return <div onClick={()=>{}}><img src="/card.png" /></div> }`],
    ['src/Card.test.tsx',`import {Card} from './Card'; test('card',()=>Boolean(Card));`],
    ['README.md','# Frontend fixture'],
  ]));
  assert.equal(result.frontend.applicable,true);
  assert.equal(result.frontend.metrics.components,1);
  assert.equal(result.frontend.metrics.typescriptCoverage,100);
  assert.equal(result.frontend.metrics.accessibilityIssues,2);
  assert.ok((result.frontend.score||100)<90);
  assert.ok(result.findings.some(f=>f.rule_id==='frontend.image-alt'));
  assert.ok(result.findings.some(f=>f.rule_id==='frontend.nonsemantic-control'));
  assert.ok(result.findings.some(f=>f.rule_id==='frontend.effect-dependencies'));
});

test('marks repositories without JSX as not applicable for frontend grading',()=>{
  const result=analyzeSnapshot(snapshot([['src/service.ts','export const value:number=1;'],['README.md','# Service']]));
  assert.equal(result.frontend.applicable,false);
  assert.equal(result.frontend.score,null);
  assert.equal(result.frontend.grade,'Not Applicable');
});

test('detects a static HTML and JavaScript frontend under a backend directory',()=>{
  const result=analyzeSnapshot(snapshot([
    ['backend/static/index.html','<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body><main><input><button>Ask</button></main><script src="app.js"></script></body></html>'],
    ['backend/static/app.js','async function ask(){ document.querySelector("main"); }'],
    ['README.md','# Static frontend'],
  ]));
  assert.equal(result.frontend.applicable,true);
  assert.equal(result.frontend.metrics.componentFiles,2);
  assert.equal(result.uiUx.applicable,true);
  assert.ok(result.uiUx.metrics.semanticLandmarks>=1);
  assert.ok(result.uiUx.metrics.responsiveSignals>=1);
  assert.ok(result.findings.some(f=>f.rule_id==='uiux.html-form-label'));
});

test('grades backend contracts, persistence, reliability, and testing',()=>{
  const result=analyzeSnapshot(snapshot([
    ['package.json',JSON.stringify({dependencies:{'better-sqlite3':'1.0.0'}})],
    ['app/api/items/route.ts',`export async function POST(req:Request) { const body=await req.json(); const response=await fetch('https://example.com/items'); return Response.json({body,response}); }`],
    ['lib/db.ts',`export function find(id:string) { return db.prepare(\`SELECT * FROM items WHERE id = \${id}\`).all(); }`],
    ['README.md','# Backend fixture'],
  ]));
  assert.equal(result.backend.applicable,true);
  assert.equal(result.backend.metrics.endpointFiles,1);
  assert.ok((result.backend.score||100)<85);
  assert.ok(result.findings.some(f=>f.rule_id==='backend.input-validation'));
  assert.ok(result.findings.some(f=>f.rule_id==='backend.fetch-status'));
  assert.ok(result.findings.some(f=>f.rule_id==='backend.sql-interpolation'));
});

test('marks a frontend-only repository as not applicable for backend grading',()=>{
  const result=analyzeSnapshot(snapshot([['src/App.tsx','export function App(){return <main>Hello</main>}'],['README.md','# Frontend only']]));
  assert.equal(result.backend.applicable,false);
  assert.equal(result.backend.score,null);
});

test('grades UI/UX semantics, accessibility, responsiveness, and feedback',()=>{
  const result=analyzeSnapshot(snapshot([
    ['src/Form.tsx',`export function Form(){return <div className="md:grid"><button><svg /></button><input autoFocus /><span onClick={()=>{}}>Save</span>{false ? <p>loading</p> : null}</div>}`],
    ['README.md','# UI fixture'],
  ]));
  assert.equal(result.uiUx.applicable,true);
  assert.ok((result.uiUx.score||100)<85);
  assert.equal(result.uiUx.metrics.responsiveSignals,1);
  assert.ok(result.findings.some(f=>f.rule_id==='uiux.button-name'));
  assert.ok(result.findings.some(f=>f.rule_id==='uiux.form-label'));
  assert.ok(result.findings.some(f=>f.rule_id==='uiux.autofocus'));
  assert.ok(result.findings.some(f=>f.rule_id==='uiux.landmarks'));
});

test('marks non-UI repositories as not applicable for UI/UX grading',()=>{
  const result=analyzeSnapshot(snapshot([['server/index.ts','export const port=3000;'],['README.md','# Server']]));
  assert.equal(result.uiUx.applicable,false);
  assert.equal(result.uiUx.score,null);
});

test('grades AI integration output contracts, controls, safety, and tests',()=>{
  const result=analyzeSnapshot(snapshot([
    ['package.json',JSON.stringify({dependencies:{openai:'1.0.0'}})],
    ['server/ai.ts',`export async function answer(input:string) { const result = await openai.chat.completions.create({ model: 'gpt-test', messages: [{role:'user',content:\`Question: \${input}\`}] }); console.log('response', result); return result.choices[0].message.content; }`],
    ['README.md','# AI fixture'],
  ]));
  assert.equal(result.aiMl.applicable,true);
  assert.equal(result.aiMl.metrics.providers,1);
  assert.equal(result.aiMl.metrics.modelCalls,1);
  assert.ok((result.aiMl.score||100)<75);
  assert.ok(result.findings.some(f=>f.rule_id==='aiml.output-validation'));
  assert.ok(result.findings.some(f=>f.rule_id==='aiml.reliability-controls'));
  assert.ok(result.findings.some(f=>f.rule_id==='aiml.prompt-injection'));
  assert.ok(result.findings.some(f=>f.rule_id==='aiml.model-config'));
  assert.ok(result.findings.some(f=>f.rule_id==='aiml.sensitive-logging'));
});

test('does not grade repositories that only mention AI in documentation',()=>{
  const result=analyzeSnapshot(snapshot([['src/index.ts','export const value=1;'],['README.md','# AI-powered marketing copy']]));
  assert.equal(result.aiMl.applicable,false);
  assert.equal(result.aiMl.score,null);
});

test('grades authentication, secrets, injection, configuration, and security tests',()=>{
  const result=analyzeSnapshot(snapshot([
    ['app/api/admin/route.ts',`const apiKey = 'sk_live_1234567890abcdef'; export async function POST(req:Request){ const body=await req.json(); const token='session-'+Math.random(); eval(body.code); return new Response(token,{headers:{'Access-Control-Allow-Origin':'*'}}); }`],
    ['README.md','# Security fixture'],
  ]));
  assert.equal(result.security.applicable,true);
  assert.equal(result.security.metrics.endpointFiles,1);
  assert.equal(result.security.metrics.protectedEndpoints,0);
  assert.ok((result.security.score||100)<60);
  assert.ok(result.findings.some(f=>f.rule_id==='securityreview.endpoint-auth'));
  assert.ok(result.findings.some(f=>f.rule_id==='securityreview.hardcoded-secret'));
  assert.ok(result.findings.some(f=>f.rule_id==='securityreview.dynamic-execution'));
  assert.ok(result.findings.some(f=>f.rule_id==='securityreview.cors-wildcard'));
  assert.ok(result.findings.some(f=>f.rule_id==='securityreview.insecure-random'));
});

test('marks documentation-only repositories as not applicable for security grading',()=>{
  const result=analyzeSnapshot(snapshot([['README.md','# Documentation only']]));
  assert.equal(result.security.applicable,false);
  assert.equal(result.security.score,null);
});

test('grades product workflows, feedback states, operations, and delivery readiness',()=>{
  const result=analyzeSnapshot(snapshot([
    ['package.json',JSON.stringify({scripts:{start:'next start'}})],
    ['app/page.tsx',`export function Page(){return <main>{true ? <p>Loading</p> : <p>No results</p>}</main>}`],
    ['app/api/health/route.ts',`export function GET(){ logger.info('health'); return Response.json({status:'ok'}) }`],
    ['.github/workflows/ci.yml','name: ci'],
    ['README.md','# Product\nInstall, usage, features, configuration, environment, test, and deploy instructions.'],
    ['tests/user-flow.test.ts','test("user journey",()=>true)'],
  ]));
  assert.equal(result.product.applicable,true);
  assert.ok((result.product.score||0)>=75);
  assert.ok(result.product.metrics.feedbackStates>=2);
  assert.ok(result.product.metrics.operabilitySignals>=1);
  assert.equal(result.product.metrics.deliverySignals,1);
  assert.equal(result.product.metrics.productTests,1);
});

test('identifies product maturity gaps in an application shell',()=>{
  const result=analyzeSnapshot(snapshot([
    ['app/page.tsx','export function Page(){return <div>Hello</div>}'],
    ['README.md','# App'],
  ]));
  assert.ok((result.product.score||100)<60);
  assert.ok(result.findings.some(f=>f.rule_id==='product.feedback-states'));
  assert.ok(result.findings.some(f=>f.rule_id==='product.operability'));
  assert.ok(result.findings.some(f=>f.rule_id==='product.delivery'));
});

test('does not assign a product grade to a reusable library',()=>{
  const result=analyzeSnapshot(snapshot([
    ['package.json',JSON.stringify({main:'dist/index.js',exports:'./dist/index.js'})],
    ['src/index.ts','export const add=(a:number,b:number)=>a+b;'],
    ['README.md','# Library'],
  ]));
  assert.equal(result.product.applicable,false);
  assert.equal(result.product.score,null);
});
