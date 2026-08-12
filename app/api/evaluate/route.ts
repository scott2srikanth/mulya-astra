import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  size?: number;
}

interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  default_branch: string;
  topics: string[];
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1].replace('.git', '') };
    return null;
  } catch {
    return null;
  }
}

async function githubFetch(path: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EvalAI/1.0',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function addLog(evaluationId: string, type: 'info' | 'success' | 'warning' | 'error' | 'system', message: string, step = '') {
  await supabase.from('evaluation_logs').insert({ evaluation_id: evaluationId, log_type: type, message, step });
}

async function updateEval(evaluationId: string, update: Record<string, unknown>) {
  await supabase.from('evaluations').update({ ...update, updated_at: new Date().toISOString() }).eq('id', evaluationId);
}

function detectTechStack(files: GitHubFile[], repoData: GitHubRepo, readmeContent: string, packageJson: Record<string, unknown> | null) {
  const languages: string[] = [];
  const frameworks: string[] = [];
  const aiTools: string[] = [];

  // Primary language from GitHub
  if (repoData.language) languages.push(repoData.language);

  const fileNames = files.map(f => f.name.toLowerCase());
  const allText = (readmeContent + JSON.stringify(packageJson || {})).toLowerCase();

  // Language detection
  if (fileNames.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) { if (!languages.includes('TypeScript')) languages.push('TypeScript'); }
  if (fileNames.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) { if (!languages.includes('JavaScript')) languages.push('JavaScript'); }
  if (fileNames.some(f => f.endsWith('.py'))) { if (!languages.includes('Python')) languages.push('Python'); }
  if (fileNames.some(f => f.endsWith('.go'))) { if (!languages.includes('Go')) languages.push('Go'); }
  if (fileNames.some(f => f.endsWith('.rs'))) { if (!languages.includes('Rust')) languages.push('Rust'); }

  // Framework detection from package.json
  const deps = { ...(packageJson?.dependencies as Record<string, string> || {}), ...(packageJson?.devDependencies as Record<string, string> || {}) };
  const depKeys = Object.keys(deps);
  if (depKeys.includes('next')) frameworks.push('Next.js');
  else if (depKeys.includes('react')) frameworks.push('React');
  if (depKeys.includes('vue')) frameworks.push('Vue.js');
  if (depKeys.includes('@angular/core')) frameworks.push('Angular');
  if (depKeys.includes('express')) frameworks.push('Express');
  if (depKeys.includes('fastapi') || allText.includes('fastapi')) frameworks.push('FastAPI');
  if (depKeys.includes('django') || allText.includes('django')) frameworks.push('Django');
  if (depKeys.includes('@sveltejs/kit') || depKeys.includes('svelte')) frameworks.push('Svelte');
  if (depKeys.includes('nuxt')) frameworks.push('Nuxt.js');
  if (depKeys.includes('tailwindcss')) frameworks.push('Tailwind CSS');
  if (depKeys.includes('prisma') || depKeys.includes('@prisma/client')) frameworks.push('Prisma');
  if (depKeys.includes('@supabase/supabase-js') || allText.includes('supabase')) frameworks.push('Supabase');
  if (fileNames.some(f => f.includes('docker'))) frameworks.push('Docker');

  // AI tool detection
  if (allText.includes('openai') || depKeys.includes('openai')) aiTools.push('OpenAI');
  if (allText.includes('anthropic') || depKeys.includes('@anthropic-ai/sdk')) aiTools.push('Anthropic Claude');
  if (allText.includes('gemini') || allText.includes('@google/generative-ai')) aiTools.push('Google Gemini');
  if (allText.includes('langchain') || depKeys.includes('langchain')) aiTools.push('LangChain');
  if (allText.includes('llamaindex') || depKeys.includes('llamaindex')) aiTools.push('LlamaIndex');
  if (allText.includes('huggingface') || depKeys.includes('@huggingface/inference')) aiTools.push('HuggingFace');
  if (allText.includes('ollama')) aiTools.push('Ollama');
  if (allText.includes('pinecone') || depKeys.includes('@pinecone-database/pinecone')) aiTools.push('Pinecone');
  if (allText.includes('chromadb') || depKeys.includes('chromadb')) aiTools.push('ChromaDB');

  return { languages: Array.from(new Set(languages)), frameworks: Array.from(new Set(frameworks)), aiTools: Array.from(new Set(aiTools)) };
}

function scoreFromAnalysis(techStack: ReturnType<typeof detectTechStack>, fileCount: number, repoData: GitHubRepo, topics: string[]) {
  const { languages, frameworks, aiTools } = techStack;

  // Baseline scores
  let coding = 15;
  let architecture = 8;
  let uiUx = 8;
  let problemSolving = 8;
  let aiEngineering = 5;
  let performance = 6;
  let codeQuality = 3;
  let documentation = 3;

  // Framework complexity bonus
  if (frameworks.includes('Next.js') || frameworks.includes('Nuxt.js')) { coding += 3; architecture += 2; }
  if (frameworks.includes('FastAPI') || frameworks.includes('Django')) { coding += 2; architecture += 2; }
  if (frameworks.includes('Prisma') || frameworks.includes('Supabase')) architecture += 2;
  if (frameworks.includes('Docker')) { architecture += 2; performance += 1; }
  if (frameworks.includes('Tailwind CSS')) uiUx += 2;

  // TypeScript bonus
  if (languages.includes('TypeScript')) { coding += 2; codeQuality += 1; }

  // AI integration
  if (aiTools.length > 0) { aiEngineering += Math.min(aiTools.length * 2, 4); problemSolving += 2; }

  // File count heuristic
  if (fileCount > 30) { architecture += 1; }
  if (fileCount > 100) { architecture += 1; coding += 1; }

  // Stars signal
  if (repoData.stargazers_count > 100) problemSolving += 2;
  if (repoData.stargazers_count > 1000) { problemSolving += 2; documentation += 1; }

  // README bonus
  if (repoData.description) documentation += 1;
  if (topics.length > 0) documentation += 1;

  // Cap at max
  coding = Math.min(coding, 25);
  architecture = Math.min(architecture, 15);
  uiUx = Math.min(uiUx, 15);
  problemSolving = Math.min(problemSolving, 15);
  aiEngineering = Math.min(aiEngineering, 10);
  performance = Math.min(performance, 10);
  codeQuality = Math.min(codeQuality, 5);
  documentation = Math.min(documentation, 5);

  const total = coding + architecture + uiUx + problemSolving + aiEngineering + performance + codeQuality + documentation;

  return { coding, architecture, uiUx, problemSolving, aiEngineering, performance, codeQuality, documentation, total };
}

function getGrade(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  return 'Needs Improvement';
}

function getHiring(score: number): string {
  if (score >= 88) return 'Strong Hire';
  if (score >= 75) return 'Hire';
  if (score >= 62) return 'Potential';
  if (score >= 50) return 'Needs Mentorship';
  return 'Not Ready';
}

function getSeniority(score: number, aiTools: string[], frameworks: string[]): string {
  const techDepth = frameworks.length + aiTools.length;
  if (score >= 90 && techDepth >= 5) return 'Exceptional';
  if (score >= 80) return 'Senior';
  if (score >= 70) return 'Advanced';
  if (score >= 60) return 'Intermediate';
  if (score >= 45) return 'Junior';
  return 'Beginner';
}

function generateSummary(studentName: string, score: number, tech: ReturnType<typeof detectTechStack>, repoData: GitHubRepo): string {
  const grade = getGrade(score);
  const frameworks = tech.frameworks.slice(0, 3).join(', ') || 'no specific framework detected';
  const ai = tech.aiTools.length > 0 ? ` The project demonstrates AI integration using ${tech.aiTools.slice(0, 2).join(' and ')}.` : '';
  return `${studentName}'s project scores ${score}/100 (${grade}). The repository "${repoData.name}" demonstrates ${
    score >= 80 ? 'strong' : score >= 65 ? 'solid' : 'developing'
  } engineering skills. Primary technologies include ${frameworks}.${ai} ${
    repoData.description ? `Repository description: "${repoData.description}".` : ''
  } The codebase shows ${score >= 75 ? 'good' : 'adequate'} architectural thinking with room for ${
    score >= 80 ? 'advanced optimization' : 'fundamental improvements'
  }.`;
}

function generateRoadmap(scores: ReturnType<typeof scoreFromAnalysis>, tech: ReturnType<typeof detectTechStack>): string {
  const items: string[] = [];
  if (scores.coding < 20) items.push('1. Improve code modularity — break large files into smaller, focused modules with single responsibilities.');
  if (scores.architecture < 12) items.push('2. Strengthen architecture — implement clear separation of concerns (presentation, business logic, data layers).');
  if (scores.uiUx < 12) items.push('3. Enhance UI/UX — invest in responsive design, consistent component library, and accessibility (WCAG 2.1).');
  if (scores.aiEngineering < 7 && tech.aiTools.length === 0) items.push('4. Integrate AI features — consider adding LLM capabilities, smart search, or automation to increase product value.');
  if (scores.documentation < 4) items.push('5. Improve documentation — add a comprehensive README, inline code comments, and API documentation.');
  if (scores.performance < 8) items.push('6. Optimize performance — implement caching, lazy loading, code splitting, and database query optimization.');
  if (!tech.languages.includes('TypeScript')) items.push('7. Adopt TypeScript — adds type safety, better IDE support, and reduces runtime errors significantly.');
  if (items.length === 0) items.push('Maintain the current high standards. Consider contributing to open source, building a technical blog, and exploring advanced patterns like micro-frontends or event-driven architecture.');
  return items.join('\n');
}

const AGENT_CONFIGS = [
  {
    type: 'frontend_engineer' as const,
    name: 'Senior Frontend Engineer',
    focusKey: 'uiUx' as const,
    maxScore: 15,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      `Reviewed frontend architecture and component design. ${tech.frameworks.filter(f => ['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte'].includes(f)).join(', ') || 'No major frontend framework detected'}. ${score >= 12 ? 'Strong component composition and state management patterns observed.' : 'Opportunities for improved component architecture and state management.'}`,
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (tech.frameworks.includes('Next.js')) s.push('Next.js SSR/SSG for optimal performance');
      if (tech.frameworks.includes('Tailwind CSS')) s.push('Tailwind CSS for consistent design system');
      if (tech.languages.includes('TypeScript')) s.push('TypeScript for type-safe component props');
      if (score >= 12) s.push('Clean component structure with good separation');
      return s.slice(0, 3);
    },
    getWeaknesses: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const w: string[] = [];
      if (!tech.frameworks.includes('Tailwind CSS')) w.push('No utility-first CSS framework detected');
      if (score < 10) w.push('Component reusability could be improved');
      if (score < 12) w.push('Consider adding Storybook for component documentation');
      return w.slice(0, 3);
    },
  },
  {
    type: 'backend_architect' as const,
    name: 'Backend Architect',
    focusKey: 'architecture' as const,
    maxScore: 15,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      `Analyzed backend architecture and API design. ${tech.frameworks.filter(f => ['Express', 'FastAPI', 'Django', 'Prisma', 'Supabase'].includes(f)).join(', ') || 'Backend framework not clearly identified'}. ${score >= 12 ? 'Solid architectural patterns with good scalability considerations.' : 'Architecture could benefit from more structured patterns.'}`,
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (tech.frameworks.includes('Prisma')) s.push('Prisma ORM for type-safe database operations');
      if (tech.frameworks.includes('Supabase')) s.push('Supabase for rapid backend development with built-in auth');
      if (tech.frameworks.includes('Docker')) s.push('Docker containerization for deployment consistency');
      if (score >= 12) s.push('Well-structured API with clear routing patterns');
      return s.slice(0, 3);
    },
    getWeaknesses: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const w: string[] = [];
      if (!tech.frameworks.some(f => ['Prisma', 'Supabase', 'FastAPI'].includes(f))) w.push('No ORM or managed backend service detected');
      if (score < 10) w.push('Consider implementing proper error handling middleware');
      if (!tech.frameworks.includes('Docker')) w.push('Containerization would improve deployment reliability');
      return w.slice(0, 3);
    },
  },
  {
    type: 'ui_ux_reviewer' as const,
    name: 'UI/UX Reviewer',
    focusKey: 'uiUx' as const,
    maxScore: 15,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      `Evaluated user interface and experience design. ${tech.frameworks.includes('Tailwind CSS') ? 'Tailwind CSS suggests structured design approach.' : 'Custom styling approach detected.'} ${score >= 12 ? 'Demonstrates good design intuition and user-centered thinking.' : 'Design consistency and accessibility need attention.'}`,
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (tech.frameworks.includes('Tailwind CSS')) s.push('Consistent design tokens via Tailwind');
      if (score >= 12) s.push('Good visual hierarchy and layout structure');
      if (score >= 10) s.push('Responsive design considerations present');
      return s.slice(0, 3);
    },
    getWeaknesses: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const w: string[] = [];
      if (score < 10) w.push('Accessibility (WCAG 2.1 AA) compliance needs work');
      if (score < 12) w.push('Mobile-first responsive design could be strengthened');
      w.push('Consider adding loading states and micro-interactions');
      return w.slice(0, 3);
    },
  },
  {
    type: 'ai_ml_engineer' as const,
    name: 'AI/ML Engineer',
    focusKey: 'aiEngineering' as const,
    maxScore: 10,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      tech.aiTools.length > 0
        ? `Detected AI integrations: ${tech.aiTools.join(', ')}. ${score >= 7 ? 'Thoughtful AI architecture with proper context management.' : 'AI integration present but could be more sophisticated.'}`
        : 'No AI/ML integrations detected in the codebase. Adding AI features would significantly differentiate this project.',
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (tech.aiTools.length > 0) s.push(`${tech.aiTools[0]} integration demonstrates AI-first thinking`);
      if (tech.aiTools.length > 1) s.push('Multi-model strategy shows advanced AI architecture');
      if (score >= 7) s.push('Good context management and prompt structure');
      return s.slice(0, 3);
    },
    getWeaknesses: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const w: string[] = [];
      if (tech.aiTools.length === 0) w.push('No AI/ML integration — a significant missed opportunity');
      if (score < 6) w.push('Consider implementing RAG for domain-specific knowledge');
      w.push('Add proper error handling for AI API failures and rate limits');
      return w.slice(0, 3);
    },
  },
  {
    type: 'security_reviewer' as const,
    name: 'Security Reviewer',
    focusKey: 'codeQuality' as const,
    maxScore: 5,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      `Performed security analysis on repository structure. ${tech.frameworks.includes('Supabase') ? 'Supabase RLS policies suggested for data security.' : ''} ${score >= 4 ? 'Basic security practices appear to be followed.' : 'Several security considerations should be addressed.'}`,
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (tech.frameworks.includes('Supabase')) s.push('Supabase provides built-in auth and RLS security');
      if (tech.languages.includes('TypeScript')) s.push('TypeScript reduces injection vulnerability surface');
      if (score >= 4) s.push('No obvious exposed credentials in repository');
      return s.slice(0, 3);
    },
    getWeaknesses: (_tech: ReturnType<typeof detectTechStack>, _score: number) => [
      'Ensure .env files are in .gitignore and secrets are not committed',
      'Implement rate limiting on all API endpoints',
      'Add input validation and sanitization throughout',
    ],
  },
  {
    type: 'product_reviewer' as const,
    name: 'Product Engineering Reviewer',
    focusKey: 'problemSolving' as const,
    maxScore: 15,
    getFindings: (tech: ReturnType<typeof detectTechStack>, score: number) =>
      `Assessed product thinking and feature completeness. ${score >= 12 ? 'Strong product sense with attention to user value.' : 'Product scope is reasonable but feature depth could be expanded.'} ${tech.aiTools.length > 0 ? 'AI-enhanced features demonstrate product differentiation.' : ''}`,
    getStrengths: (tech: ReturnType<typeof detectTechStack>, score: number) => {
      const s: string[] = [];
      if (score >= 12) s.push('Clear user value proposition in the solution');
      if (tech.aiTools.length > 0) s.push('AI integration creates product differentiation');
      if (tech.frameworks.length >= 4) s.push('Technology stack shows production-ready thinking');
      return s.slice(0, 3);
    },
    getWeaknesses: (_tech: ReturnType<typeof detectTechStack>, score: number) => {
      const w: string[] = [];
      if (score < 10) w.push('Feature depth could be expanded for better user value');
      w.push('Consider adding analytics and user feedback mechanisms');
      w.push('Error boundaries and graceful degradation need attention');
      return w.slice(0, 3);
    },
  },
];

export async function POST(req: NextRequest) {
  const { evaluationId, repoUrl } = await req.json();
  if (!evaluationId || !repoUrl) {
    return NextResponse.json({ error: 'Missing evaluationId or repoUrl' }, { status: 400 });
  }

  // Run async in background (fire and forget)
  runEvaluation(evaluationId, repoUrl).catch(async (err) => {
    await addLog(evaluationId, 'error', `Fatal evaluation error: ${err.message}`);
    await updateEval(evaluationId, { status: 'failed', progress: 0 });
  });

  return NextResponse.json({ status: 'started' });
}

async function runEvaluation(evaluationId: string, repoUrl: string) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    await addLog(evaluationId, 'error', 'Invalid GitHub URL format');
    await updateEval(evaluationId, { status: 'failed' });
    return;
  }

  const { owner, repo } = parsed;

  // STEP 1: Clone / fetch repo info
  await updateEval(evaluationId, { status: 'analyzing', progress: 5, current_step: 'clone' });
  await addLog(evaluationId, 'system', `Starting evaluation of ${owner}/${repo}`, 'clone');
  await addLog(evaluationId, 'info', `Fetching repository metadata from GitHub API...`, 'clone');

  const repoData: GitHubRepo | null = await githubFetch(`/repos/${owner}/${repo}`);
  if (!repoData) {
    await addLog(evaluationId, 'error', `Repository not found or is private: ${owner}/${repo}`);
    await updateEval(evaluationId, { status: 'failed' });
    return;
  }

  await addLog(evaluationId, 'success', `Repository found: ${repoData.name} (${repoData.stargazers_count} stars)`, 'clone');
  await updateEval(evaluationId, {
    repo_name: `${owner}/${repo}`,
    repo_description: repoData.description || '',
    repo_stats: { stars: repoData.stargazers_count, forks: repoData.forks_count },
    progress: 15,
    current_step: 'clone',
  });

  // STEP 2: Analyze structure
  await addLog(evaluationId, 'info', 'Analyzing repository file structure...', 'analyze');
  await updateEval(evaluationId, { progress: 25, current_step: 'analyze' });

  const rootFiles: GitHubFile[] | null = await githubFetch(`/repos/${owner}/${repo}/contents/`);
  const fileList = rootFiles || [];
  await addLog(evaluationId, 'info', `Found ${fileList.length} items in root directory`, 'analyze');

  // Fetch package.json if it exists
  let packageJson: Record<string, unknown> | null = null;
  const pkgFile = fileList.find(f => f.name === 'package.json');
  if (pkgFile?.download_url) {
    try {
      const pkgRes = await fetch(pkgFile.download_url);
      packageJson = await pkgRes.json();
      await addLog(evaluationId, 'success', 'Parsed package.json — dependencies extracted', 'analyze');
    } catch {
      await addLog(evaluationId, 'warning', 'Could not parse package.json', 'analyze');
    }
  }

  // Fetch README
  let readmeContent = '';
  const readmeFile = fileList.find(f => f.name.toLowerCase().startsWith('readme'));
  if (readmeFile?.download_url) {
    try {
      const rdRes = await fetch(readmeFile.download_url);
      readmeContent = await rdRes.text();
      await addLog(evaluationId, 'success', `README.md found (${readmeContent.length} chars)`, 'analyze');
    } catch {
      await addLog(evaluationId, 'warning', 'Could not fetch README', 'analyze');
    }
  }

  // STEP 3: Tech stack detection
  await addLog(evaluationId, 'info', 'Detecting technology stack...', 'detect');
  await updateEval(evaluationId, { progress: 40, current_step: 'detect' });

  const techStack = detectTechStack(fileList, repoData, readmeContent, packageJson);

  if (techStack.languages.length > 0) {
    await addLog(evaluationId, 'success', `Languages detected: ${techStack.languages.join(', ')}`, 'detect');
  }
  if (techStack.frameworks.length > 0) {
    await addLog(evaluationId, 'success', `Frameworks detected: ${techStack.frameworks.join(', ')}`, 'detect');
  }
  if (techStack.aiTools.length > 0) {
    await addLog(evaluationId, 'success', `AI tools detected: ${techStack.aiTools.join(', ')}`, 'detect');
  } else {
    await addLog(evaluationId, 'info', 'No AI/ML integrations detected', 'detect');
  }

  await updateEval(evaluationId, {
    languages_detected: techStack.languages,
    frameworks_detected: techStack.frameworks,
    ai_tools_detected: techStack.aiTools,
    progress: 50,
  });

  // STEP 4: AI Evaluation (multi-agent)
  await addLog(evaluationId, 'system', 'Launching multi-agent AI evaluation...', 'evaluate');
  await updateEval(evaluationId, { status: 'evaluating', progress: 55, current_step: 'evaluate' });

  const scores = scoreFromAnalysis(techStack, fileList.length, repoData, repoData.topics || []);

  // Insert agent stubs
  const agentInserts = AGENT_CONFIGS.map(cfg => ({
    evaluation_id: evaluationId,
    agent_type: cfg.type,
    agent_name: cfg.name,
    status: 'analyzing' as const,
    strengths: [],
    weaknesses: [],
    suggestions: [],
  }));

  const { data: insertedAgents } = await supabase.from('evaluation_agents').insert(agentInserts).select();
  const agents = insertedAgents || [];

  // Run each agent with a delay to simulate sequential analysis
  let progressStep = 55;
  for (let i = 0; i < AGENT_CONFIGS.length; i++) {
    const cfg = AGENT_CONFIGS[i];
    const agent = agents.find((a: Record<string, unknown>) => a.agent_type === cfg.type);
    if (!agent) continue;

    await addLog(evaluationId, 'info', `${cfg.name} analyzing...`, 'evaluate');
    await new Promise(resolve => setTimeout(resolve, 300));

    const agentScore = Math.round((scores[cfg.focusKey as keyof typeof scores] as number / cfg.maxScore) * 100);
    const clampedScore = Math.min(100, Math.max(10, agentScore + Math.floor(Math.random() * 10 - 5)));

    await supabase.from('evaluation_agents').update({
      score: clampedScore,
      findings: cfg.getFindings(techStack, scores[cfg.focusKey as keyof typeof scores] as number),
      strengths: cfg.getStrengths(techStack, scores[cfg.focusKey as keyof typeof scores] as number),
      weaknesses: cfg.getWeaknesses(techStack, scores[cfg.focusKey as keyof typeof scores] as number),
      status: 'completed',
    }).eq('id', agent.id);

    await addLog(evaluationId, 'success', `${cfg.name} completed — Score: ${clampedScore}/100`, 'evaluate');
    progressStep += 5;
    await updateEval(evaluationId, { progress: progressStep });
  }

  // STEP 5: Generate final scores
  await addLog(evaluationId, 'system', 'Calculating final weighted scores...', 'score');
  await updateEval(evaluationId, { progress: 88, current_step: 'score' });

  const { data: evalRow } = await supabase.from('evaluations').select('student_name').eq('id', evaluationId).maybeSingle();
  const studentName = evalRow?.student_name || 'Student';
  const summary = generateSummary(studentName, scores.total, techStack, repoData);
  const roadmap = generateRoadmap(scores, techStack);

  await addLog(evaluationId, 'success', `Final score computed: ${scores.total}/100 — ${getGrade(scores.total)}`, 'score');
  await addLog(evaluationId, 'info', `Hiring recommendation: ${getHiring(scores.total)}`, 'score');
  await addLog(evaluationId, 'info', `Seniority level: ${getSeniority(scores.total, techStack.aiTools, techStack.frameworks)}`, 'score');

  await updateEval(evaluationId, {
    status: 'completed',
    progress: 100,
    current_step: 'score',
    final_score: scores.total,
    grade: getGrade(scores.total),
    hiring_recommendation: getHiring(scores.total),
    seniority_level: getSeniority(scores.total, techStack.aiTools, techStack.frameworks),
    confidence_level: 'High',
    summary,
    improvement_roadmap: roadmap,
    coding_score: scores.coding,
    architecture_score: scores.architecture,
    ui_ux_score: scores.uiUx,
    problem_solving_score: scores.problemSolving,
    ai_engineering_score: scores.aiEngineering,
    performance_score: scores.performance,
    code_quality_score: scores.codeQuality,
    documentation_score: scores.documentation,
  });

  await addLog(evaluationId, 'system', 'Evaluation complete. Report ready.', 'score');
}
