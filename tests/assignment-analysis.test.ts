import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAssignment } from '../lib/assignment-analysis';
import type { AssignmentSpec } from '../types/database';

const snapshot={metadata:{name:'student',description:null,stargazers_count:0,forks_count:0,language:'Python',default_branch:'main',topics:[]},commitSha:'a'.repeat(40),treeCount:3,truncated:false,files:[{path:'backend/app.py',content:'from sklearn.linear_model import LogisticRegression\n@app.post("/predict")\ndef train_model():\n return LogisticRegression()',size:120,language:'Python',lines:4},{path:'backend/static/index.html',content:'<button>Predict</button><div class="error">Error message</div>',size:60,language:'HTML',lines:1}]};
const spec:AssignmentSpec={brief:'Build a clear prediction UI.',required_paths:['backend/static'],required_functions:['train_model'],ui_requirements:['error message'],model_requirements:['LogisticRegression'],endpoints:[{method:'POST',path:'/predict',description:'returns prediction'}],forbidden_patterns:['RandomForestClassifier'],assignment_weight:70};

test('verifies explicit instructor rules and leaves the brief for AI',()=>{const result=evaluateAssignment(snapshot,spec,80);assert.equal(result.compliance_score,100);assert.equal(result.final_weighted_score,94);assert.equal(result.checks.filter(c=>c.status==='passed').length,6);assert.equal(result.checks.some(c=>c.status==='needs_ai'),true);});
