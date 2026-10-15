export const meta = {
  name: 'workflow-streams',
  description: 'One place in the regeneration form: recon inside the run reads the home entry and the primary sources, judges the edit radius, declares the files and writes the task; the executor edits the place → lenses → consolidation; between rounds the analyst edits the task and rolls back the files with findings, or escalates; the round ceiling comes from the descriptor',
  phases: [
    { title: 'Recon', detail: 'why this is a defect, local or systemic by radius, which files, the task in symbol names' },
    { title: 'Execution', detail: 'the executor edits the place per the task' },
    { title: 'Lenses' },
    { title: 'Consolidation' },
    { title: 'Analyst' },
  ],
}

// LAUNCH (descriptor fields — run.example.json next to this script; the team lead's order of work — the flow):
//   Workflow({ scriptPath: '<skillDir>/streams.js',
//              args: { root, skillDir, run: <descriptor as an object>, place: 'ID-1', slug: 'id-1', home: '<home entry of the place>' } })
// root — the absolute superproject root, skillDir — the absolute folder of this script: the script has no
// filesystem, the launcher gives both paths and the descriptor object.
// The place's home entry — the entry where the place is stated and where decisions on it are recorded — arrives as the home argument;
// the descriptor may carry a default home when one home entry serves all places.
// Recon mode — only the intake analysts of all places at once, the loop does not start:
//   Workflow({ scriptPath, args: { root, skillDir, run, places: [{ place, slug, home? }, …] } })
// Resumption after a stop — the same call with resumeFromRunId and args.ownerAnswer (the owner's answer
// verbatim), all other arguments byte-identical to before. The flag is removable: without it a cached blocked
// or ESCALATE returns the same stop. Resume points: stop A (the finishing executor call), escalation
// at intake and after a premise dispute (a repeated recon), the analyst's escalation (a repeated analyst).
// Stop B has no resume.
// Rollback is partial: the analyst rolls back only the files with findings, on an architectural finding — all
// related ones. A premise dispute raises recon anew: if it wrote a task — the place is rolled back whole
// and the rounds start over; if it escalated — a stop without rollback, resume with ownerAnswer.

const A = args || {}
const ROOT = A.root ? String(A.root).replace(/\/+$/, '') : ''
const SKILL = A.skillDir ? String(A.skillDir).replace(/\/+$/, '') : ''
if (!ROOT.startsWith('/') || !SKILL.startsWith('/')) {
  return {
    ok: false, stage: 'args',
    error: 'args.root and args.skillDir are absolute paths: the superproject root and the script folder. The launcher sets them; the script does not see the filesystem',
    got: { root: A.root, skillDir: A.skillDir },
  }
}
const RUN = A.run && typeof A.run === 'object' ? A.run : null
const REQUIRED = ['name', 'repos', 'prefix', 'sources']
const missing = REQUIRED.filter((k) => !RUN || RUN[k] === undefined || RUN[k] === null || RUN[k] === '')
if (!RUN || missing.length || !Array.isArray(RUN.repos) || !RUN.repos.length || !Array.isArray(RUN.sources) || !RUN.sources.length) {
  return {
    ok: false, stage: 'args',
    error: 'args.run is the run descriptor (an object). Required: name, repos[] (non-empty), prefix, sources[] (non-empty). Sample — run.example.json next to the script',
    missing, got: A,
  }
}

const PLACES = Array.isArray(A.places) && A.places.length ? A.places : null
const PLACE = A.place
const SLUG = A.slug
const HOME = String(A.home || RUN.home || '')
const OWNER_ANSWER = A.ownerAnswer ? String(A.ownerAnswer) : ''
if (!PLACES && (!PLACE || !SLUG || !HOME)) {
  return {
    ok: false, stage: 'args',
    error: 'Needed args: { root, skillDir, run, place, slug, home } — one run of a place (home may be set in the descriptor); or { root, skillDir, run, places: [{ place, slug, home? }, …] } — recon of several places at once',
    got: { place: PLACE, slug: SLUG, home: HOME, places: PLACES },
  }
}
if (PLACES && PLACES.some((p) => !p.place || !p.slug || !(p.home || HOME))) {
  return {
    ok: false, stage: 'args',
    error: 'Every recon place needs place, slug and home (or a default home in the descriptor or args.home)',
    got: { home: HOME, places: PLACES },
  }
}

const abs = (p) => (String(p).startsWith('/') ? String(p) : ROOT + '/' + String(p).replace(/^\/+/, ''))
const norm = (f) => (String(f).startsWith(ROOT + '/') ? String(f).slice(ROOT.length + 1) : String(f).replace(/^\/+/, ''))
const COMMON = SKILL + '/common.md'
const ROLES = SKILL + '/roles.md'
const PFX = abs(RUN.prefix)
const taskOf = (s) => PFX + s + '-task.md'
const registryOf = (s) => PFX + s + '-findings.md'
const TASK = SLUG ? taskOf(SLUG) : null
const REGISTRY = SLUG ? registryOf(SLUG) : null
const CANON = RUN.canon ? abs(RUN.canon) : null
const DESIGN = RUN.designDocs ? abs(RUN.designDocs) : null
const CHECKS = RUN.checksDir ? abs(RUN.checksDir) : SKILL.split('/').slice(0, -3).join('/') + '/deep-review/checks'
const CATALOG = CHECKS.split('/').slice(0, -1).join('/') + '/SKILL.md'
const LENSES = Array.isArray(RUN.lenses) && RUN.lenses.length ? RUN.lenses : ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'F1']
const MAX_ROUNDS = Number.isInteger(RUN.maxRounds) && RUN.maxRounds > 0 ? RUN.maxRounds : 4
const REPO_LIST = RUN.repos
const NOT_FINDINGS = Array.isArray(RUN.notFindings) ? RUN.notFindings : []
const SOURCES = RUN.sources.map((s, i) => (typeof s === 'string' ? { name: 'SOURCE ' + (i + 1), path: s } : s))
const TITLE = RUN.title || ('Run ' + RUN.name)
const CONTEXT = RUN.context ? String(RUN.context) : ''

// The run lineup is set explicitly: the role frontmatter beats the session model and effort, there is no inheritance.
const LINEUP = {
  analyst: { agentType: 'sage', model: 'opus', effort: 'xhigh' },
  rollback: { agentType: 'sage', model: 'opus', effort: 'low' },
  exec: { agentType: 'developer', model: 'opus', effort: 'xhigh' },
  lens: { agentType: 'reviewer', model: 'sonnet', effort: 'high' },
  review: { agentType: 'review-lead', model: 'opus', effort: 'xhigh' },
}
const call = (role, extra) => Object.assign({}, LINEUP[role], extra)

// The place's files are filled AFTER recon, from the analyst's answer. Paths are from the superproject
// root: '<repository>/src/index.ts'. The delta and the rollback are built from them.
let FILES_REL = []
let NEW_REL = []
let FILES = []
let REPOS = []
let KEPT = []
const repoOf = (rel) => rel.split('/')[0]
const inRepo = (rel) => rel.split('/').slice(1).join('/')
const isNew = (rel) => NEW_REL.includes(rel)
const trackedOf = (r) => FILES_REL.filter((f) => repoOf(f) === r && !isNew(f)).map(inRepo)
const newOf = (r) => NEW_REL.filter((f) => repoOf(f) === r).map(inRepo)
const gitIn = (r) => 'git -C ' + ROOT + '/' + r
const setFiles = (list, newList) => {
  FILES_REL = (list || []).map(norm).filter(Boolean)
  NEW_REL = (newList || []).map(norm).filter((f) => f && FILES_REL.includes(f))
  FILES = FILES_REL.map((f) => ROOT + '/' + f)
  REPOS = [...new Set(FILES_REL.map(repoOf))]
  KEPT = []
}
const rewrittenFiles = () => FILES_REL.filter((f) => !KEPT.includes(f))
const deltaCmds = () => REPOS.flatMap((r) => [
  ...(trackedOf(r).length ? [gitIn(r) + ' diff HEAD --numstat -- ' + trackedOf(r).join(' ')] : []),
  ...(newOf(r).length ? ['wc -l ' + newOf(r).map((f) => ROOT + '/' + r + '/' + f).join(' ') + '   — new files: git diff HEAD does not see them, a binary file is not measured in lines'] : []),
])
const rollbackCmds = () => REPOS.flatMap((r) => [
  ...(trackedOf(r).length ? [gitIn(r) + ' checkout HEAD -- ' + trackedOf(r).join(' ')] : []),
  ...(newOf(r).length ? [gitIn(r) + ' clean -f -- ' + newOf(r).join(' ')] : []),
])
const fileRollbackCmd = (rel) => gitIn(repoOf(rel)) + (isNew(rel) ? ' clean -f -- ' : ' checkout HEAD -- ') + inRepo(rel)
const partialRollback = () => [
  'ROLL BACK ONLY THE FILES WITH FINDINGS. Rule of the section «Rounds analyst»:',
  '  • A finding is particular — it is fixed inside one file: that file is rolled back.',
  '  • A finding is architectural — it changes a contract between the files of the place (a signature, a data shape,',
  '    the layout across modules): all files that produce or consume this contract are rolled back.',
  '  • A file without findings stays as is: it passed the review of this round, and the executor of the next',
  '    round does not rewrite it. Findings in all files give a full rollback.',
  '  The rollback command for every file of the place — take only the needed ones, one per file:',
  ...FILES_REL.map((f) => '    ' + fileRollbackCmd(f)),
  '  Then `git -C <repository> status --porcelain` for every repository of the place — the verbatim output',
  '  into rollback: the rolled-back files are absent from it, the kept ones are present. The rolled-back files, as paths from the',
  '  superproject root — into rollbackFiles; the basis for each — into rationale. Do not touch foreign paths:',
  '  `CLAUDE.md` and `CLAUDE_CANDIDATES.md` in the tree are the team lead\'s work on norms, they are NOT subject to rollback.',
]

const EXEC_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['addressGate', 'done', 'delta', 'method', 'normsRead', 'integrity', 'disputed', 'questions', 'blocked', 'blockingQuestions'],
  properties: {
    addressGate: { type: 'string', description: 'The FIRST action: the subject is searched BY NAME, not by line number. The search pattern, the universe boundary, the hit count (it must be one), whether it converged or not' },
    done: { type: 'string' },
    delta: { type: 'string', description: 'git diff HEAD --numstat over the tracked files and wc -l over the new ones, verbatim output' },
    method: { type: 'string', description: 'an answer to EVERY question of the task, each with its basis; the questions are listed in the task itself' },
    normsRead: { type: 'array', items: { type: 'string' } },
    integrity: { type: 'string', description: 'lines added, of them comments, why each one is necessary' },
    disputed: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    blocked: { type: 'boolean' },
    blockingQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const FINDING_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'findings', 'briefFindings', 'method', 'questions', 'blocked'],
  properties: {
    lens: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['severity', 'file', 'line', 'decisionClass', 'claim', 'reachability', 'basis'],
      properties: {
        severity: { type: 'string', enum: ['RED', 'YELLOW', 'GREEN'] },
        file: { type: 'string' }, line: { type: 'integer' },
        decisionClass: { type: 'string', description: 'the DECISION CLASS the finding is about («the way to report an error», «awaiting a promise», «the record form») — needed so that findings of different rounds are comparable: the code is written anew every round' },
        claim: { type: 'string' },
        reachability: { type: 'string', description: 'the entry point and ALL validation between the entry and the address' },
        basis: { type: 'string' } } } },
    briefFindings: { type: 'array', items: { type: 'string' }, description: 'objections against the TASK — travel as a finding, not as a question' },
    method: { type: 'string' },
    questions: { type: 'array', items: { type: 'string' } }, blocked: { type: 'boolean' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'findings', 'disputeResolution', 'unresolved', 'delta', 'integrityVerdict', 'promptFixes', 'normFixes', 'recordItems', 'questions', 'blocked', 'blockingQuestions', 'premiseDispute'],
  properties: {
    verdict: { type: 'string', enum: ['APPROVE', 'RETURN'] },
    findings: { type: 'array', items: { type: 'object', additionalProperties: true } },
    disputeResolution: { type: 'array', items: { type: 'string' } },
    unresolved: { type: 'array', items: { type: 'string' } },
    delta: { type: 'string' },
    integrityVerdict: { type: 'string', description: 'integrity SEPARATELY from correctness; RETURN is lawful on integrity alone too' },
    promptFixes: { type: 'array', items: { type: 'string' }, description: 'particulars of THIS place — as a POSITIVE PRESCRIPTION, not a prohibition' },
    normFixes: { type: 'array', items: { type: 'string' }, description: 'a decision class living OUTSIDE the place — a candidate for a norm/canon' },
    recordItems: { type: 'array', items: { type: 'string' }, description: 'correct, but out of scope — a candidate for a separate entry, with its own home entry' },
    questions: { type: 'array', items: { type: 'string' } },
    blocked: { type: 'boolean' }, blockingQuestions: { type: 'array', items: { type: 'string' } },
    premiseDispute: { type: 'string', description: 'a dispute about the PREMISE of the task, not about its precision: there is no defect in the named place OR it is an instance of a systemic mechanism. Empty if the premise is not disputed. A filled field raises the INTAKE analyst anew: if it wrote a task — the place is rolled back whole and the round counter is reset; if it escalated — the run stops without rollback. Set it only for the premise; the rounds analyst fixes precision through promptFixes' },
  },
}

const SAGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['action', 'contradiction', 'taskEdits', 'normCandidates', 'recordCandidates', 'registryWritten', 'rollbackFiles', 'rollback', 'rationale', 'ownerBrief'],
  properties: {
    action: { type: 'string', enum: ['REWRITE', 'ESCALATE'] },
    contradiction: { type: 'string', description: 'if ESCALATE — where exactly the findings of the rounds demand the opposite, with the decision class; otherwise «none»' },
    taskEdits: { type: 'array', items: { type: 'string' }, description: 'what was changed in the task file and on what basis; empty on ESCALATE' },
    normCandidates: { type: 'array', items: { type: 'string' }, description: 'candidates for a norm or the canon — YOU DO NOT EDIT THEM, they go to the owner' },
    recordCandidates: { type: 'array', items: { type: 'string' } },
    registryWritten: { type: 'boolean' },
    rollbackFiles: { type: 'array', items: { type: 'string' }, description: 'the files of the place you rolled back, as paths from the superproject root; on ESCALATE — empty' },
    rollback: { type: 'string', description: 'the verbatim git status output after the rollback; on ESCALATE — «did not roll back»' },
    rationale: { type: 'string', description: 'the basis of the decision; for the rollback — per rolled-back file: which finding is in it, and for an architectural finding — which contract binds the rolled-back files' },
    ownerBrief: { type: 'string', description: 'on ESCALATE — a statement for the owner: brief, in plain language, SELF-CONTAINED, so that neither the code, nor the run artifacts, nor the project\'s records have to be opened' },
  },
}

const INTAKE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['action', 'escalation', 'defectRestated', 'scope', 'radius', 'behaviourChange', 'filesTouched', 'newFiles', 'sourcesRead', 'designRead', 'taskWritten', 'symbolsNamed', 'normCandidates', 'questions', 'ownerBrief', 'rationale'],
  properties: {
    action: { type: 'string', enum: ['TASK_READY', 'ESCALATE'] },
    escalation: { type: 'string', enum: ['none', 'systemic', 'unmeasurable'], description: 'the reason for ESCALATE: systemic — the place is systemic by radius; unmeasurable — the radius is not measurable in this tree, a repository of the descriptor is not checked out; none on TASK_READY' },
    defectRestated: { type: 'string', description: 'what is ACTUALLY wrong here — in your own words, not a retelling of the source; why this is called a problem and what happens if it is not fixed' },
    scope: { type: 'string', enum: ['LOCAL', 'SYSTEMIC'], description: 'the edit radius: does the edit stay on a path owned only by this place (LOCAL), or does it enter code owned by someone else (SYSTEMIC)' },
    radius: { type: 'string', description: 'a MEASUREMENT of the radius, not an impression: for every subject of the edit — the grep pattern, the universe boundary, the number of consumers outside the place and what happens to them' },
    behaviourChange: { type: 'string', description: 'whether the observable behavior changes for those who call the edited code (contract, status, body shape, key, set of response branches) — yes or no, with the method. «No» exempts from reading the consumers and the responding half; «yes» pulls them into the place' },
    filesTouched: { type: 'array', items: { type: 'string' }, description: 'the COMPLETE and MINIMAL list of the files of the place as paths FROM THE superproject ROOT: "<repository>/src/index.ts". The delta and the rollback are built from it. Empty on ESCALATE' },
    newFiles: { type: 'array', items: { type: 'string' }, description: 'those of filesTouched that are NOT in HEAD (the place creates them): they are rolled back with git clean, not git checkout. Empty if the place creates no files' },
    sourcesRead: { type: 'array', items: { type: 'string' }, description: 'what was read as a primary source: files, sections of the sources and entries by address. An entry counts as read only when read whole, with all its addenda' },
    designRead: { type: 'string', description: 'what was taken from the project screen docs and what the design requires; or «not relevant» WITH A BASIS' },
    taskWritten: { type: 'boolean' },
    symbolsNamed: { type: 'array', items: { type: 'string' }, description: 'every name by which the task names the subject, and the hit count of YOUR grep for it' },
    normCandidates: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    ownerBrief: { type: 'string', description: 'on ESCALATE — a statement for the owner: brief, in plain language, SELF-CONTAINED, with a recommendation and its basis' },
    rationale: { type: 'string' },
  },
}

const headOf = (place, home) => {
  const head = [
    'CONTEXT. ' + TITLE + ', place ' + place + ' (the place\'s home entry — ' + home + '), the REGENERATION form (the common part of the form: ' + COMMON + ').',
  ]
  if (CONTEXT) head.push(CONTEXT)
  head.push(
    'Superproject root: ' + ROOT + '. ' + REPO_LIST.map((r) => '`' + r + '`').join(', ') + ' — separate git repositories inside it.',
    '',
    'Run git where you want the result — `git -C <repository>`. Do not use `cd`:',
    'it makes the result of ANY following command unreliable. Only `git -C` and absolute paths.',
    '⚠ git add / git commit / git push ARE FORBIDDEN — the owner keeps the history.',
  )
  return head
}

const HEAD = headOf(PLACE, HOME)

const sourcesText = (place, home) => {
  const out = []
  SOURCES.forEach((s, i) => {
    out.push((i + 1) + '. ' + (s.name || 'SOURCE ' + (i + 1)) + ': ' + abs(s.path) + (i === 0 ? ' — find the place ' + place + ' in it.' : ''))
    if (s.hint) String(s.hint).split('\n').forEach((h) => out.push('   ' + h))
  })
  const n = SOURCES.length
  out.push(
    (n + 1) + '. THE COMMON PART OF TASKS: ' + COMMON + ' — rules that are the same for all places of the run.',
    '   Do NOT copy them into the task: the executor reads the common part itself.',
    (n + 2) + '. THE PLACE\'S HOME ENTRY — the entry ' + home + ': read it WHOLE, with all its addenda, it is the primary source',
    '   of the task, it has not been retold to you. Then read the same way the entries the home entry links to',
    '   and is related to, and find WITH YOUR OWN search the class\'s home entry — the class the',
    '   place belongs to.',
    '   ⚠ What is read is the entries themselves, WHOLE, for all candidates found, not the titles and not the',
    '   summaries of the search output. A run has already burned on this: the orchestrator took the summary of an entry for its',
    '   content and did not create the needed home entry — a summary is a RETELLING.',
    '   ⚠ If an entry is unavailable — write the word BLOCKED in rationale and what exactly did not',
    '   open. Do not pretend the home entry has been read.',
  )
  if (DESIGN) out.push((n + 3) + '. PROJECT SCREEN DOCS: ' + DESIGN + ' — if the place has a screen (see the third question).')
  return out
}

let round = 1
let execRuns = 0
let registryExists = false
let review = null
let sage = null
const history = []

// ── INTAKE ANALYST ──────────────────────────────────────────────────────────
// Raised on receiving the place and inside the loop — only when review-lead disputed the PREMISE.
async function intake(reason, review, place, slug, home) {
  phase('Recon')
  log('Intake analyst for place ' + place + ' (home entry ' + home + '). Cause: ' + reason)

  return await agent(headOf(place, home).concat([
    '',
    'YOU ARE THE INTAKE ANALYST OF THE PLACE. You are the first to take it, and you write the task.',
    'Before acting, read the roles of the run:',
    '  ' + ROLES + ', sections «Place and edit radius», «Intake analyst» and «Rounds analyst».',
    '',
    ...(reason === 'premise' ? [
      '⚠ YOU HAVE BEEN RAISED AGAIN: review-lead disputed the PREMISE of the task already written.',
      'Its argument is below. The round is deemed not to have taken place, the round counter will be reset.',
      'REVIEW-LEAD PREMISE DISPUTE:',
      JSON.stringify(review && review.premiseDispute),
      'THE ROUND VERDICT IN FULL:',
      JSON.stringify(review),
      '',
    ] : reason === 'owner' ? [
      '⚠ YOU HAVE BEEN RAISED AGAIN: the previous recon of this place ESCALATED, the owner answered.',
      'The owner\'s answer is an owner decision: it outweighs the radius rule and the task where they',
      'diverge. If the owner allowed taking the place with the named radius — scope = LOCAL with',
      'the note «radius allowed by the owner» in rationale, you write the task, you declare the files COMPLETELY,',
      'including all the halves the owner allowed. If the answer does not close the radius — ESCALATE',
      'again, with a new ownerBrief on what exactly is missing.',
      'PREVIOUS ownerBrief:',
      JSON.stringify(review && review.prior && review.prior.ownerBrief),
      'PREVIOUS RECON IN FULL:',
      JSON.stringify(review && review.prior),
      'THE OWNER\'S ANSWER (verbatim):',
      String(review && review.ownerAnswer),
      '',
    ] : []),
    '━━━ WHAT YOU HAVE ━━━',
    ...(reason === 'intake' ? [
      'THERE IS NO DRAFT. Nobody has retold this place to you or prepared the task. Your context',
      'is larger than that of whoever once cut out this place, and assembling the FULL VISION of the place is',
      'your work. Here are the addresses; what to read of them, you decide.',
    ] : [
      'The previous recon above is your input, not a draft: re-check its conclusions against the primary sources',
      'and assemble the vision anew. Here are the addresses; what to read of them, you decide.',
    ]),
    '',
  ]).concat(sourcesText(place, home)).concat([
    '',
    'List what you read in sourcesRead: files, sections of the sources and entries by address.',
    'An entry counts as read only if it was read whole, with all its addenda.',
    '',
    '━━━ YOUR FIRST QUESTION: WHAT IS ACTUALLY WRONG HERE ━━━',
    'The sources name a symptom. A symptom and a defect are not the same thing, and confusing them is costly.',
    'A live example, for which your role was set up: a place was named «no `await` in the',
    'initialization method». The real defect was different — critical app infrastructure',
    'swallowed the startup error and let the app run broken, and in production that would have given',
    'a failure that is nearly impossible to diagnose. Adding `await` in one method does not cure',
    'that. The place was taken out of the run and became two entries.',
    '',
    'Therefore state in defectRestated IN YOUR OWN WORDS: why this is called a problem, what',
    'will break for the user or for whoever will fix this, and why the symptom from the source',
    'is a consequence, not a cause.',
    '',
    '━━━ SECOND QUESTION: LOCAL OR SYSTEMIC ━━━',
    'Form rule. What is judged is NOT the width of the class and NOT the number of files or',
    'repositories, but the EDIT RADIUS — how far the edit spreads through foreign code.',
    '',
    'The rule in full:',
    '  • You go from the subject of the edit through everyone who consumes it.',
    '  • As long as the edit stays on a path owned ONLY BY THIS PLACE — its own file, its own hook',
    '    with a single consumer, its own screen — the case is LOCAL, and this run takes it,',
    '    even if there are two halves and two repositories.',
    '  • As soon as the edit enters code owned by SOMEONE ELSE — a shared request client,',
    '    a hook of several screens, a shared contract — the scope grows exponentially: SYSTEMIC.',
    '',
    '⚠ CONSUMERS ARE READ ONLY WHEN THE BEHAVIOR CHANGES. If',
    'a function keeps its behavior for everyone who calls it — edit it and do not read the other',
    'places. Adding a log brings the place to the norm and does not change behavior: even in middleware',
    'the responding half need not be investigated. The responding half in another repository is investigated',
    'if and only if a change of the CONTRACT is foreseen — of the status, the body shape, the key, the',
    'set of response branches. Put the answer into behaviourChange together with the method.',
    '',
    '⚠ AND THE REVERSE: AN INSTANCE OF A SYSTEMIC CLASS DOES NOT BY ITSELF MAKE THE PLACE SYSTEMIC. No',
    'consumers — the radius is minimal, and one edit even in such a place is not shared code.',
    'However many places of the same class live in other files, with',
    'a zero radius the place stays local.',
    '',
    '⚠ THE NUMBER OF CONSUMERS IS A MEASUREMENT, NOT AN IMPRESSION. «The hook is used on several screens»',
    'must be the result of a grep with a named pattern and a named universe boundary.',
    'The rule of absolutes of the common part applies here too. Put the measurement into radius.',
    '',
    '⚠ CONSUMERS CAN BE SEARCHED ONLY IN A CHECKED-OUT REPOSITORY. The run tree may not carry all',
    'repositories of the descriptor. Before reading consumers in another repository, check that it is',
    'checked out: `git -C ' + ROOT + '/<repository> rev-parse HEAD`. A failure of the command means the radius',
    'is not measurable in this tree: action = "ESCALATE", escalation = "unmeasurable", ownerBrief names',
    'the repository and the contract. A zero grep over a missing directory is NOT a radius.',
    '',
    '  • scope = "LOCAL" — write the task and declare the files in filesTouched; escalation = "none".',
    '  • scope = "SYSTEMIC" — action = "ESCALATE", escalation = "systemic", you do NOT write the task,',
    '    filesTouched empty.',
    '    Fill ownerBrief: what the real defect is, where the mechanism lives, how many places it has',
    '    (by measurement), what you recommend and on what basis. BRIEFLY, IN PLAIN LANGUAGE, SELF-CONTAINED —',
    '    the owner will not have to open the code, the run artifacts or the project\'s records.',
    '',
    '━━━ YOU DECLARE THE FILES OF THE PLACE ━━━',
    'The file list is not passed to this run: you determine it and put it into filesTouched',
    'as paths FROM THE superproject ROOT — "<repository>/src/index.ts". Those of them that are not in HEAD',
    '(the place creates them), repeat in newFiles: they are rolled back differently.',
    'The delta command and the rollback command are built from your list.',
    'A file that is not in the list the executor has no right to touch, and its appearance in the delta',
    'will be a stop of the run. Therefore the list must be COMPLETE and MINIMAL at once: everything',
    'that will have to be touched, and nothing beyond.',
    '',
    '━━━ THIRD QUESTION: WHAT THE DESIGN REQUIRES ━━━',
    ...(DESIGN ? [
      'If the place has a screen, read the project docs AS THE PRIMARY SOURCE: ' + DESIGN + '.',
      'Deciding from someone else\'s retelling is not allowed. You have no design source — if the docs do not answer',
      'the question, it is a QUESTION TO THE OWNER in questions,',
    ] : [
      'The run has no project screen docs. If the place has a screen and its look does not follow from',
      'the sources, it is a QUESTION TO THE OWNER in questions,',
    ]),
    'not a reason to complete the requirement yourself. If the design does not apply to the place — say so',
    'in designRead with a basis, not by silence.',
    '',
    '━━━ IF LOCAL: YOU WRITE THE TASK ━━━',
    'The file ' + taskOf(slug) + '. It will become the ONLY task of the run: the executor,',
    'all review lenses and review-lead will receive it. What it must contain:',
    '',
    '1. THE SUBJECT IS NAMED BY SYMBOL NAME, NOT BY LINE NUMBER. A function, a hook, a component, a prop,',
    '   a constant, a dictionary key. The sources speak in numbers — translate them into names WITH YOUR OWN grep',
    '   and put every name with its hit count into symbolsNamed. There must be one hit each;',
    '   if more — name a distinguishing fragment. A rule of the common part.',
    '2. WHAT IS THERE NOW — a verbatim excerpt from HEAD, with the command that took it.',
    '3. WHAT MUST COME OUT — as a positive prescription: «do Y, because Z».',
    '   Never as a prohibition: prohibitions pile up and degrade the task into a sprawl.',
    '4. WHAT TO WATCH FOR IN THE IMPLEMENTATION — what you understood through recon and what',
    '   the executor would otherwise have to derive anew: the mechanism, neighboring call sites, library',
    '   traps, a design requirement. This is the main value of your work: understanding',
    '   not passed on as text will die with you.',
    '5. BOUNDARIES — what we do NOT do in this place and why. Here also, BY NAME, the norms that the place',
    '   makes false (their claims about the code stop being true from the very work of the place):',
    '   a lens does not file them as a finding, the edit goes as a boundary of the place in one move. The norm by',
    '   which the place IS JUDGED is not to be confused with the norm that it makes false.',
    '',
    '⚠⚠ EVERY PRESCRIPTION IS MARKED WITH ITS SOURCE. Behind it is either a verbatim quote of the owner with',
    'an address (a portion of the canon, the home entry, an addendum to it), or a direct note «the analyst\'s reading,',
    'not an owner decision, open to dispute». An unmarked reading is a forgery of the',
    'basis, even when the reading is correct: a past run took such a case apart in a separate',
    'pass. A decision made less than a day ago or still under discussion, quote BY ADDRESS',
    '(«read whole»), not by text: the text may have been refined after you took it.',
    '',
    '⚠ YOU DO NOT EDIT THE NORMS (CLAUDE.md, rule files) OR THE COMMON PART — put candidates',
    'into normCandidates, they go to the owner.',
    '',
    '⚠ A PRESCRIPTION RELIES ONLY ON THE TOOLS OF THE EXECUTOR ROLE. The executor is the role',
    '`developer`: files, Bash, Skill, `ToolSearch` and the tools from the role description; its MCP tools',
    'are exactly those listed in the role — no database among them. A step that requires',
    'a tool the role does not have is not written into the task for the executor: it',
    'is addressed to whoever has the tool (the owner, the team lead), and reaches the executor already',
    'as a fact with the name of whoever measured it — or goes into questions as a question to the owner before the start.',
    'Precedent: prescribing a step through a tool the role does not have stopped a run.',
    '',
    'Return the result strictly through StructuredOutput.',
  ]).join('\n'),
  call('analyst', { label: 'recon of place ' + place, phase: 'Recon', schema: INTAKE_SCHEMA }))
}

// ── RECON RUN ───────────────────────────────────────────────────────────────
// Only intake analysts, of all places at once. The loop is not raised: the goal is to get
// up-to-date tasks and file lists, to decide on the further form of work.
if (PLACES) {
  log('RECON: ' + PLACES.length + ' places at once, intake analysts only. Not a single line of code is written.')
  const found = await parallel(PLACES.map((p) => () => intake('intake', null, p.place, p.slug, p.home || HOME)))

  const rows = PLACES.map((p, i) => {
    const b = found[i] || {}
    return {
      place: p.place,
      slug: p.slug,
      home: p.home || HOME,
      action: b.action,
      escalation: b.escalation,
      scope: b.scope,
      files: b.filesTouched || [],
      newFiles: b.newFiles || [],
      behaviourChange: b.behaviourChange,
      defect: b.defectRestated,
      radius: b.radius,
      questions: b.questions || [],
      ownerBrief: b.ownerBrief,
      task: b.action === 'TASK_READY' ? taskOf(p.slug) : null,
    }
  })

  const touched = [...new Set(rows.flatMap((r) => r.files))]
  log('Recon finished. Files touched in total: ' + touched.length)

  return { ok: true, mode: 'recon', run: RUN.name, count: rows.length, filesUnion: touched, places: rows }
}

let brief = await intake('intake', null, PLACE, SLUG, HOME)

if (brief.action === 'ESCALATE' && OWNER_ANSWER) {
  log('The escalation at intake is lifted by the owner\'s answer — recon is raised again with the answer in the prompt.')
  brief = await intake('owner', { ownerAnswer: OWNER_ANSWER, prior: brief }, PLACE, SLUG, HOME)
}

const escalationOf = (b) => (b.escalation === 'unmeasurable' ? 'unmeasurable' : 'systemic')

if (brief.action === 'ESCALATE') {
  log('ESCALATION AT INTAKE: ' + (escalationOf(brief) === 'unmeasurable' ? 'the radius is not measurable in this tree' : 'the place is judged SYSTEMIC by radius') + ', no task was written.')
  return {
    ok: false, verdict: 'ESCALATE', reason: escalationOf(brief), stage: 'intake', run: RUN.name, place: PLACE,
    ownerBrief: brief.ownerBrief, defectRestated: brief.defectRestated,
    radius: brief.radius, behaviourChange: brief.behaviourChange,
    sourcesRead: brief.sourcesRead, questions: brief.questions, rationale: brief.rationale,
  }
}

setFiles(brief.filesTouched, brief.newFiles)
if (!FILES_REL.length) {
  log('The analyst declared the place local but named no files. The run is stopped.')
  return { ok: false, stage: 'intake', error: 'filesTouched is empty with action = TASK_READY', run: RUN.name, place: PLACE, intake: brief }
}

log('THE PLACE IS LOCAL. Files (' + FILES_REL.length + '): ' + FILES_REL.join(', ') + (NEW_REL.length ? '. New: ' + NEW_REL.join(', ') : ''))
log('Repositories: ' + REPOS.join(', ') + '. Behavior changes: ' + brief.behaviourChange)
log('The task is written. The subject is named by names: ' + (brief.symbolsNamed || []).join('; '))

while (round <= MAX_ROUNDS) {
  const rl = ' (round ' + round + ')'

  phase('Execution')
  log('Place ' + PLACE + ', round ' + round + ' of ' + MAX_ROUNDS + '. The task is read from the file.')

  let exec = await agent(HEAD.concat([
    '',
    '━━━ YOUR TASK LIES IN TWO FILES, READ BOTH WHOLE AND IN THIS ORDER ━━━',
    '  1. THE COMMON PART (one for all places of the run): ' + COMMON,
    '     the work form, the address gate, the rules for claims,',
    '     reading libraries and norms, integrity, the objection mechanism.',
    '  2. THE TASK OF THIS PLACE: ' + TASK,
    '     what is there now, what must come out, owner decisions, the boundaries of this place.',
    '',
    'Read each from the first line to the last. Together they are self-sufficient:',
    'nothing beyond these two files is passed to you.',
    ...(execRuns > 0 ? ['THE TASK WAS CORRECTED AFTER THE PREVIOUS ROUND — read it anew, not from memory.'] : []),
    ...(KEPT.length ? [
      '',
      '━━━ PART OF THE PLACE IS KEPT FROM THE LAST ROUND ━━━',
      'The rollback is partial: only the files with findings were rolled back.',
      'KEPT — they passed review, their code lies in the tree; do not rewrite them:',
      ...KEPT.map((f) => '  ' + ROOT + '/' + f),
      'ROLLED BACK — write them from scratch per the task, do not edit the former code:',
      ...rewrittenFiles().map((f) => '  ' + ROOT + '/' + f),
      'A kept file is edited only for the sake of the contract with the rewritten ones; every such edit',
      'is named in done with its reason. The checks of the task are run over the whole place.',
    ] : execRuns > 0 ? ['The place is ROLLED BACK to the commit state: write it from scratch, do not edit the former code.'] : []),
    '',
    'Return the result strictly through StructuredOutput.',
  ]).join('\n'), call('exec', { label: PLACE + ' execution' + rl, phase: 'Execution', schema: EXEC_SCHEMA }))
  execRuns++

  if (exec.blocked && OWNER_ANSWER) {
    log('Stop A is lifted by the owner\'s answer — the finishing executor call, round ' + round + '.')
    exec = await agent(HEAD.concat([
      '',
      '━━━ YOU ARE FINISHING THE PLACE AFTER STOP A ━━━',
      'The executor of this round hit a question to the owner and stopped the run WITHOUT rolling back the place:',
      'its edits lie in the tree. The owner answered. Your work is to bring the place to the end per this',
      'answer, without rewriting what was done without need.',
      '',
      'THE EXECUTOR\'S QUESTION:', JSON.stringify(exec.blockingQuestions),
      '',
      'THE OWNER\'S ANSWER (verbatim; it is an owner decision, it outweighs the task where they diverge):',
      OWNER_ANSWER,
      '',
      'THE EXECUTOR\'S REPORT BEFORE THE STOP:', JSON.stringify(exec),
      '',
      'Read, as it did, both files whole: the common part ' + COMMON + ', then the task ' + TASK + '.',
      'Do the remainder and return a FULL report per the schema for the whole place, not only for',
      'the finished part (address gate, delta — all anew with your own hand).',
      '',
      'Return the result strictly through StructuredOutput.',
    ]).join('\n'), call('exec', { label: PLACE + ' finishing after stop A' + rl, phase: 'Execution', schema: EXEC_SCHEMA }))
  }

  if (exec.blocked) {
    log('STOP A: the executor hit a question to the owner, round ' + round + '.')
    return {
      stage: 'exec', ok: false, stopPoint: 'A', round, run: RUN.name, place: PLACE,
      awaitingOwner: exec.blockingQuestions, questions: exec.questions,
      addressGate: exec.addressGate, delta: exec.delta, files: FILES_REL, newFiles: NEW_REL, kept: KEPT, registry: REGISTRY,
    }
  }

  log('Execution of round ' + round + ' finished.')

  const JUDGED = [
    '',
    '━━━ THE SUBJECT OF JUDGMENT ━━━',
    'Files of the place (' + FILES.length + '):',
    ...FILES.map((f) => '  ' + f + (isNew(norm(f)) ? '   (new)' : '') + (KEPT.includes(norm(f)) ? '   (kept from the last round)' : '')),
    'Delta — per every touched repository:',
    ...deltaCmds().map((c) => '  ' + c),
    ...(KEPT.length ? [
      'The rollback was partial: the files marked «kept» passed the review of the last round and were not',
      'rewritten. The place is judged whole; a finding against a kept file is filed with a new',
      'basis — a contract with the rewritten files or a proven miss of the past review.',
    ] : []),
    '⚠ Take the comparison base FILE-BASED, by name along these paths. If the tree holds foreign',
    'uncommitted items — norm edits by the team lead, run documents — they have nothing to do',
    'with the place, are not part of the delta and are not a finding.',
    '⚠ RECON DECLARED THE FILE LIST, and it is the boundary of the place. A file touched beyond',
    'the list is not a finding about the code but a STOP: put it into blocked with an explanation, because',
    'a file beyond the list means the radius of the place was determined wrongly.',
    '',
    '━━━ THE EXECUTOR\'S TASK ━━━',
    'Read WHOLE and from the primary source:',
    '  1. the common part, one for all places of the run: ' + COMMON,
    '  2. the task of this place: ' + TASK,
    CANON
      ? '  3. owner decisions: ' + CANON + ' — the quotes of the task are checked against it.'
      : '  3. the quotes of the task are checked against the sources that the task itself names by address.',
    CANON ? '     The file is large: search it by grep for the place number and the names of the place files, do not read it straight through.' : '',
    'The task carries the positive basis of the edit, the boundaries of the place and — in the section on what',
    'we do NOT do in this place — the EXCEPTIONS in force on this place: owner decisions,',
    'home entries opened, scope rolled back, norms that the place makes false. They are mandatory',
    'reading before filing a finding. Do not judge the work against what the task did not ask for,',
    'and do not miss what it asked for.',
    '',
    '━━━ CORRECTNESS AND INTEGRITY ARE JUDGED ━━━',
    'Code can be correct and layered at the same time. Signs of layering are a subject of judgment on a par',
    'with correctness: the share of comments in the delta; a norm retold by a comment at the place instead',
    'of living in its own file; verbatim duplication of blocks; one class written out as',
    'literals in different places. A rule of the common part («Integrity requirement»): a comment usually means',
    'that the code must be simplified, not explained.',
    '',
    '━━━ WHAT IS NOT A FINDING ━━━',
    ...NOT_FINDINGS.map((s) => '  • ' + s),
    '  • Everything that lies OUTSIDE the files of the place. Adjacent matters — into questions, not findings.',
    '  • Everything the task called an owner decision or taken out of scope. A finding',
    '    whose cure lies in the removed scope is NOT FILED — neither as a finding, nor as a norm',
    '    candidate, nor as a candidate for a separate entry, nor in the recordItems field.',
    '  • The absence from the task of a prescription that is held by a NORM: the executor reads the norms',
    '    itself, and the task deliberately does not retell them.',
    '',
    '⚠ The exceptions block does NOT REPLACE a positive basis: before filing a finding, check',
    'it against the primary source at the address named in the task. In one of the runs six lenses out of',
    'eight filed the same false finding precisely because they did not open the source.',
    '⚠ REACHABILITY IS AN ABSOLUTE: a finding about an executable path must fill reachability —',
    'the entry point and ALL validation between the entry and the address. Without it, it will be rejected.',
    '⚠ THE decisionClass FIELD IS MANDATORY: name the DECISION CLASS. The code is written anew every round,',
    'addresses are not comparable, and only the class makes findings of rounds comparable.',
    '⚠ THE briefFindings FIELD is an objection against THE TASK ITSELF. It travels AS A FINDING, not as a question.',
    '⚠ A PREMISE DISPUTE is not the same as an objection to precision. If there is no defect in the named place',
    'at all, or it is an instance of a systemic mechanism and the mechanism must be fixed — that is a dispute',
    'about the premise: review-lead puts it into premiseDispute, and the INTAKE analyst is raised.',
  ].filter((l) => l !== null && l !== undefined)

  phase('Lenses')
  const lensResults = (await parallel(LENSES.map((lens) => () =>
    agent(HEAD.concat([
      '', 'YOU ARE LENS ' + lens + '. Read your check whole:',
      '  ' + CHECKS + '/' + lens + '.md',
      'and the section «Project Context» of the catalog — the check takes knowledge about the project from the project itself:',
      '  ' + CATALOG,
      '', 'The executor\'s report:', JSON.stringify(exec),
    ]).concat(JUDGED).concat([
      '', 'Return the result strictly through StructuredOutput. lens = "' + lens + '".',
    ]).join('\n'),
    call('lens', { label: 'lens ' + lens + rl, phase: 'Lenses', schema: FINDING_SCHEMA }))
  ))).filter(Boolean)

  phase('Consolidation')
  review = await agent(HEAD.concat([
    '', 'YOU ARE THE REVIEW-LEAD of place ' + PLACE + ', round ' + round + '. The deep-review catalog is in your context.',
    '', 'The executor\'s report:', JSON.stringify(exec),
    '', 'Lens findings (' + lensResults.length + '):', JSON.stringify(lensResults),
    '', 'The findings registry of past rounds — read it from the primary source: ' + REGISTRY,
    ...(registryExists ? [] : ['   (the file may be absent, this is normal: the rounds analyst creates it after a RETURN; if it exists — it holds the rounds of past runs of the place)']),
  ]).concat(JUDGED).concat([
    '',
    '⚠ THE FORM IS REGENERATION. On RETURN the files with findings will be ROLLED BACK (on an architectural finding —',
    'all files related to it), the task corrected, the rolled-back part written anew. Therefore your output is',
    'NOT a list of fixes but THREE SEPARATE LISTS, and sorting the findings into them is your main duty:',
    '  • promptFixes — particulars of THIS place. As a POSITIVE PRESCRIPTION: not «do not do X»,',
    '    but «do Y». Prohibitions pile up and degrade the task the same way patches degraded the code.',
    '  • normFixes — a decision class living OUTSIDE the place: it belongs in a norm or in the owner decisions.',
    '  • recordItems — correct, but out of scope: its own home entry, not the task.',
    'For every finding name the file in which it is cured; mark an architectural one with the word «architectural»',
    'and name the related files — by this the rounds analyst decides what to roll back.',
    '',
    'OTHER DUTIES:',
    '1. Take the delta for every repository WITH YOUR OWN HAND (the commands above). Do not accept the numbers from the',
    '   executor\'s report.',
    '2. Settle EVERY objection of the executor and EVERY line of the lenses\' briefFindings in',
    '   disputeResolution with a basis. A valid objection is a finding AGAINST THE TASK, not against the code.',
    '3. Reject a finding whose reachability does not name the entry point and the validation.',
    '4. Check addressGate: a subject with an unconverged count must not have been touched.',
    '5. Judge INTEGRITY SEPARATELY (the integrityVerdict field). RETURN is lawful on it alone.',
    '6. Do not settle an unresolved dispute about BEHAVIOR by invention — put it into unresolved.',
    '7. Mass agreement of the lenses on one finding is not a confirmation but a reason to open the source:',
    '   agreement of many on something wrong is a symptom of a gap in the source, as is a contradiction',
    '   between rounds.',
    '',
    'blocked = true ONLY if the verdict physically needs an owner decision that is found',
    'neither in the owner decisions nor in the norms. A question for the future — into questions, it does not',
    'stop the run.',
    '', 'Return the result strictly through StructuredOutput.',
  ]).join('\n'),
  call('review', { label: 'review-lead' + rl, phase: 'Consolidation', schema: REVIEW_SCHEMA }))

  history.push({ round: round, verdict: review.verdict, findings: review.findings, promptFixes: review.promptFixes, normFixes: review.normFixes, kept: KEPT.slice() })

  if (review.blocked) {
    log('STOP B: review-lead hit an owner decision, round ' + round + '.')
    return {
      stage: 'review', ok: false, stopPoint: 'B', round, run: RUN.name, place: PLACE,
      awaitingOwner: review.blockingQuestions, questions: review.questions,
      delta: review.delta, unresolved: review.unresolved,
      files: FILES_REL, newFiles: NEW_REL, kept: KEPT, registry: REGISTRY,
    }
  }

  if (review.verdict === 'APPROVE') {
    log('APPROVE on round ' + round + '. Exit.')
    return {
      ok: true, verdict: 'APPROVE', rounds: round, run: RUN.name, place: PLACE, home: HOME, files: FILES_REL, newFiles: NEW_REL, kept: KEPT,
      delta: review.delta, integrityVerdict: review.integrityVerdict,
      findingsCount: (review.findings || []).length,
      unresolved: review.unresolved, questions: review.questions,
      normFixes: review.normFixes, recordItems: review.recordItems,
      execQuestions: exec.questions, execDisputed: exec.disputed,
      behaviourChange: brief.behaviourChange, radius: brief.radius,
      defectRestated: brief.defectRestated, sourcesRead: brief.sourcesRead,
      registry: REGISTRY, task: TASK,
    }
  }

  if (review.premiseDispute && review.premiseDispute.trim()) {
    log('PREMISE DISPUTE on round ' + round + '. The INTAKE analyst is raised, the round counter is reset.')
    let re = await intake('premise', review, PLACE, SLUG, HOME)
    if (re.action === 'ESCALATE' && OWNER_ANSWER) {
      log('The escalation of the repeated recon is lifted by the owner\'s answer — recon is raised once more with the answer in the prompt.')
      re = await intake('owner', { ownerAnswer: OWNER_ANSWER, prior: re }, PLACE, SLUG, HOME)
    }
    history[history.length - 1].premiseDispute = review.premiseDispute
    history[history.length - 1].intake = { action: re.action, scope: re.scope, defectRestated: re.defectRestated }

    if (re.action === 'ESCALATE') {
      log('ESCALATION: the premise dispute uncovered ' + (escalationOf(re) === 'unmeasurable' ? 'a radius not measurable in this tree' : 'a systemic defect') + '. The run is stopped, the place is NOT rolled back.')
      return {
        ok: false, verdict: 'ESCALATE', reason: escalationOf(re) + '-on-premise', rounds: round, run: RUN.name, place: PLACE,
        ownerBrief: re.ownerBrief, defectRestated: re.defectRestated, radius: re.radius,
        premiseDispute: review.premiseDispute, files: FILES_REL, newFiles: NEW_REL, registry: REGISTRY,
      }
    }

    // The task was rewritten on the premise, not by the round's choice — the ceiling counts anew.
    log('The task was rewritten by the intake analyst. The place is rolled back whole, the series of rounds starts anew.')
    await agent(HEAD.concat([
      '', 'YOU ROLL BACK THE PLACE WHOLE, and nothing else. The task has already been rewritten by the intake analyst.',
      'Verbatim, one command per line:',
      ...rollbackCmds().map((c) => '  ' + c),
      'Then `git -C <repository> status --porcelain` for each one, and put the verbatim output into rollback.',
      'Not a single file of the place may remain in the output. Do not touch other paths with a single',
      'command: uncommitted norm edits and run documents in the tree are NOT subject to rollback.',
      'action = "REWRITE", contradiction = «none, the premise was rewritten», taskEdits an empty array,',
      'rollbackFiles — all files of the place.',
      '', 'Return the result strictly through StructuredOutput.',
    ]).join('\n'),
    call('rollback', { label: 'rollback on premise dispute' + rl, phase: 'Analyst', schema: SAGE_SCHEMA }))

    // The rollback went by the OLD list — by what had been written. Only now does the list of the rewritten
    // task become the boundary of the place.
    setFiles(re.filesTouched, re.newFiles)
    if (!FILES_REL.length) {
      return { ok: false, stage: 'intake', error: 'After the premise dispute filesTouched is empty', run: RUN.name, place: PLACE, intake: re }
    }
    log('New boundary of the place: ' + FILES_REL.join(', '))

    round = 1
    continue
  }

  const ceiling = round === MAX_ROUNDS
  if (ceiling) log('The ceiling of ' + MAX_ROUNDS + ' rounds is exhausted. The analyst is raised in a TRUNCATED form: rollback of the files with findings and a registry entry.')

  phase('Analyst')
  sage = await agent(HEAD.concat([
    '',
    ...(ceiling ? [
      '━━━ ⚠ THIS IS AN EXIT BY THE CEILING. YOU WORK IN A TRUNCATED FORM ━━━',
      'Round ' + round + ' is the last by the ceiling, there will be no next one. You do NOT edit the task',
      'and do NOT analyze the contradiction: the decision on continuing is made by the owner, and editing',
      'the task under an unanalyzed verdict would make that decision for the owner. Do EXACTLY TWO',
      'things: (1) append to the registry for this round, (2) roll back the files with findings per the rule of the section',
      '«ROLL BACK ONLY THE FILES WITH FINDINGS» below. Return action = "REWRITE", taskEdits an empty',
      'array, contradiction — «exit by the ceiling, not analyzed».',
      '',
    ] : []),
    'YOU ARE THE ROUNDS ANALYST of the regeneration. Round ' + round + ' gave RETURN.',
    'Your role is described in ' + ROLES + ', section «Rounds analyst». Read it before acting.',
    '',
    '━━━ WHAT TO READ ━━━',
    '1. THE EXECUTOR\'S TASK WHOLE: ' + TASK + ' plus the common part ' + COMMON,
    '2. THE FINDINGS REGISTRY OF ALL ROUNDS: ' + REGISTRY,
    '3. The verdict of this round (below) and the history of rounds (below).',
    '',
    'VERDICT OF ROUND ' + round + ':', JSON.stringify(review),
    '', 'HISTORY OF ROUNDS:', JSON.stringify(history),
    '',
    ...(ceiling ? [] : [
    '━━━ YOUR FIRST QUESTION: IS THERE A CONTRADICTION ━━━',
    'The findings of regeneration rounds refer to DIFFERENT code — the rolled-back files are written anew',
    'each time, so comparing addresses is meaningless. What is compared are the DECISION CLASSES (the decisionClass field).',
    '',
    'A CONTRADICTION is when a finding of this round demands THE OPPOSITE of what a finding of an earlier',
    'round prescribed for THE SAME decision class.',
    '',
    'If there is a contradiction — action = "ESCALATE". The run stops.',
    '⚠ ESCALATION IS NOT A FAILURE. A contradiction means that neither a norm, nor the owner decisions,',
    'nor the task answer the question the code asks, and the decision is invented anew with',
    'every new code. Until the gap is closed, any round is right and any next one will',
    'overturn it. Papering over a contradiction with a task edit is the worst thing you can do:',
    'the oscillation will continue, and its cause will hide.',
    '',
    'ESCALATE ALSO if:',
    '  • the decision class of a finding is covered NEITHER by a norm NOR by the owner decisions (it cannot be decided on the spot);',
    '  • the cure goes beyond the boundaries of the place, that is, it cannot be closed by the task in principle.',
    '',
    'On ESCALATE fill ownerBrief: a statement for the owner — BRIEFLY, IN PLAIN LANGUAGE,',
    'SELF-CONTAINED. Self-contained means: the owner will NOT have to open the project files, the artifacts',
    'of the run or the project\'s records — everything needed for the decision lies in the text itself. Name: what the subject',
    'of the dispute is in simple words, what one round prescribed and what the other, why the source gives no',
    'answer, and which answer you recommend, with a basis. This is a form requirement.',
    'On ESCALATE do not roll back the place, rollbackFiles — an empty array.',
    '',
    '━━━ IF THERE IS NO CONTRADICTION: action = "REWRITE" ━━━',
    'Then do THREE things, in this order:',
    '',
    '1. ⚠ EDIT THE TASK — ONLY IT. The file ' + TASK + '.',
    '   Take the promptFixes of review-lead and write them into the task so that the executor of the next',
    '   round does NOT REPEAT the error. ⚠ ONLY AS A POSITIVE PRESCRIPTION: not «do not use X»,',
    '   but «use Y, because Z». Prohibitions pile up and degrade the task into a sprawl, exactly',
    '   as patches degraded the code — in one of the runs the exceptions block grew to fourteen',
    '   items, and review-lead said it plainly: it does not replace a positive basis.',
    '   ⚠⚠ EVERY PRESCRIPTION YOU WRITE IN IS MARKED WITH ITS SOURCE. If behind it stands',
    '   an owner decision — give the verbatim quote and the address. If it is YOUR READING — write',
    '   directly: «the analyst\'s reading, not an owner decision, open to dispute».',
    '   An unmarked reading is a forgery of the basis, even when the reading is correct: the executor',
    '   and the review will read it as the owner\'s word.',
    '   ⚠ THE COMMON PART ' + COMMON + ' IS NOT YOURS EITHER.',
    '   It is one for all places of the run and describes how the run works, not what to do in',
    '   this place; the owner and the team lead edit it. If an edit is needed there — put it into normCandidates.',
    '   ⚠ YOU DO NOT EDIT THE NORMS (CLAUDE.md, rule files). Your authority is',
    '   limited explicitly: you put norm candidates into normCandidates, they go to the owner.',
    '   The task must stay a TASK, not become a digest of norms.',
    '',
    ]),
    ...(ceiling ? [
      '1. APPEND TO THE REGISTRY ' + REGISTRY + ': the round, the findings with decision classes, the verdict, which files',
      '   you rolled back and why, norm candidates and candidates for separate entries. The registry is the owner\'s input when deciding',
      '   on continuing; without the entry the owner has nothing to decide with.',
    ] : [
      '2. APPEND TO THE REGISTRY ' + REGISTRY + ': the round, the findings with decision classes, the verdict,',
      '   WHAT EXACTLY you changed in the task and ON WHAT BASIS, which files you rolled back and why,',
      '   norm candidates and candidates for separate entries. The registry is the input of the next round\'s analyst; without the entry it goes blind.',
    ]),
    '',
    (ceiling ? '2. ' : '3. ') + partialRollback()[0],
    ...partialRollback().slice(1).map((l) => '   ' + l),
    '',
    'Return the result strictly through StructuredOutput.',
  ]).join('\n'),
  call('analyst', { label: 'rounds analyst' + rl, phase: 'Analyst', schema: SAGE_SCHEMA }))

  const escalationResumed = sage.action === 'ESCALATE' && OWNER_ANSWER && !ceiling
  if (escalationResumed) {
    log('The analyst\'s escalation is lifted by the owner\'s answer — the analyst is raised again: edits the task per the answer, appends to the registry, rolls back the files with findings.')
    const escalated = sage
    sage = await agent(HEAD.concat([
      '',
      '━━━ YOU ARE THE ROUNDS ANALYST, RAISED AGAIN AFTER THE ESCALATION OF ROUND ' + round + ' ━━━',
      'The previous analyst escalated (its ownerBrief and analysis are below). The owner answered — the answer is',
      'verbatim below, it is an owner decision: it closes the subject of the escalation and outweighs',
      'the task where they diverge. Your role is described in ' + ROLES + ', section «Rounds analyst»;',
      'act as on action = "REWRITE" — THREE things in this order:',
      '',
      '1. EDIT THE TASK ' + TASK + ' — and only it: write in the owner\'s answer as a VERBATIM quote with an address',
      '   (the date and location of the note in the place\'s home entry, if the owner made one; otherwise — «oral decision',
      '   of the owner of <date>, relayed by the team lead»), and bring in the promptFixes of review-lead from the verdict',
      '   below — as a positive prescription, each with its source (a quote of the owner or the note',
      '   «the analyst\'s reading, open to dispute»). You do not edit the common part and the norms.',
      '2. APPEND TO THE REGISTRY ' + REGISTRY + ': the owner\'s answer, what was changed in the task and on what basis,',
      '   which files you rolled back and why.',
      '3. ' + partialRollback()[0],
      ...partialRollback().slice(1).map((l) => '   ' + l),
      '',
      'If the owner\'s answer does NOT close the subject of the escalation — action = "ESCALATE" again, with a new',
      'ownerBrief on what exactly is missing; do not edit the task, do not roll back the place.',
      '',
      'THE OWNER\'S ANSWER (verbatim):', OWNER_ANSWER,
      '', 'ownerBrief OF THE PREVIOUS ANALYST:', String(escalated.ownerBrief),
      '', 'ITS ANALYSIS:', JSON.stringify({ contradiction: escalated.contradiction, rationale: escalated.rationale }),
      '', 'VERDICT OF ROUND ' + round + ':', JSON.stringify(review),
      '', 'HISTORY OF ROUNDS:', JSON.stringify(history),
      '', 'Return the result strictly through StructuredOutput.',
    ]).join('\n'),
    call('analyst', { label: 'rounds analyst after the owner\'s answer' + rl, phase: 'Analyst', schema: SAGE_SCHEMA }))
  }

  history[history.length - 1].sage = { action: sage.action, taskEdits: sage.taskEdits, contradiction: sage.contradiction, rollbackFiles: sage.rollbackFiles }
  if (sage.registryWritten) registryExists = true

  if (ceiling) {
    const rolledAtCeiling = (sage.rollbackFiles || []).map(norm).filter((f) => FILES_REL.includes(f))
    if (!rolledAtCeiling.length) {
      log('The analyst at the ceiling did not roll back a single file of the place. The run is stopped, the code of the rounds stays in the tree.')
      return {
        ok: false, stage: 'sage', error: 'exit by the ceiling without rollbackFiles from the files of the place', rounds: round, run: RUN.name, place: PLACE,
        files: FILES_REL, newFiles: NEW_REL, sage, registry: REGISTRY, task: TASK,
      }
    }
    log('Exit by the ceiling: the analyst appended to the registry and rolled back the files with findings.')
    return {
      ok: false, verdict: 'RETURN', reason: 'MAX_ROUNDS', rounds: round, run: RUN.name, place: PLACE, files: FILES_REL, newFiles: NEW_REL,
      delta: review.delta, integrityVerdict: review.integrityVerdict,
      rollback: sage.rollback, rollbackFiles: rolledAtCeiling, unresolved: review.unresolved,
      normFixes: review.normFixes, recordItems: review.recordItems,
      historyClasses: history.map((h) => ({ round: h.round, verdict: h.verdict, classes: (h.findings || []).map((f) => f.decisionClass) })),
      registry: REGISTRY, task: TASK,
    }
  }

  if (sage.action === 'ESCALATE') {
    log('ESCALATION: the analyst stopped the run on round ' + round + '.')
    return {
      ok: false, verdict: 'ESCALATE', reason: 'contradiction', rounds: round, run: RUN.name, place: PLACE, files: FILES_REL, newFiles: NEW_REL, kept: KEPT,
      ownerBrief: sage.ownerBrief, contradiction: sage.contradiction, rollback: sage.rollback,
      normCandidates: sage.normCandidates, recordCandidates: sage.recordCandidates,
      registry: REGISTRY, task: TASK,
    }
  }

  const rolledBack = (sage.rollbackFiles || []).map(norm).filter((f) => FILES_REL.includes(f))
  if (!rolledBack.length) {
    log('The analyst returned REWRITE but named no rolled-back file of the place. The run is stopped.')
    return {
      ok: false, stage: 'sage', error: 'REWRITE without rollbackFiles from the files of the place', rounds: round, run: RUN.name, place: PLACE,
      files: FILES_REL, newFiles: NEW_REL, sage, registry: REGISTRY, task: TASK,
    }
  }
  KEPT = FILES_REL.filter((f) => !rolledBack.includes(f))
  log('Rolled back (' + rolledBack.length + '): ' + rolledBack.join(', ') + '. Kept: ' + (KEPT.length ? KEPT.join(', ') : 'nothing'))

  // The analyst's escalation on round 1, lifted by the owner's answer, does not spend a round: the task
  // is corrected, the files with findings are rolled back, round 1 runs anew.
  if (escalationResumed && round === 1) {
    log('The escalation of the round 1 analyst is lifted by the owner\'s answer: the task is corrected, the files with findings are rolled back. Round 1 runs ANEW.')
    continue
  }

  log('Round ' + round + ': RETURN. The task is corrected, the files with findings are rolled back, round ' + (round + 1) + ' follows.')
  round++
}

return {
  ok: false, verdict: 'RETURN', reason: 'loop-exhausted', rounds: MAX_ROUNDS, run: RUN.name, place: PLACE, files: FILES_REL, newFiles: NEW_REL,
  delta: review && review.delta, rollback: sage && sage.rollback, registry: REGISTRY, task: TASK,
}
