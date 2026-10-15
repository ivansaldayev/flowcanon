export const meta = {
  name: 'workflow-own-intake',
  description: 'One place in the regeneration form without recon inside: the task and the file list of the place are ready before launch; the executor edits the place → lenses → consolidation; between rounds the analyst edits the task and rolls back the files with findings, or escalates; a premise dispute rolls back the place and returns the dispute to the launcher',
  phases: [
    { title: 'Execution', detail: 'the executor edits the place per the task' },
    { title: 'Lenses' },
    { title: 'Consolidation' },
    { title: 'Analyst' },
  ],
}

// LAUNCH (descriptor fields — run.example.json next to this script, the sources field is not needed here; the team lead's order of work — the flow):
//   Workflow({ scriptPath: '<skillDir>/own-intake.js',
//              args: { root, skillDir, run: <descriptor as an object>, place: 'ID-1', slug: 'id-1', home: '<home entry of the place>',
//                      files: ['<repository>/src/a.ts', …], newFiles: ['<repository>/…'], kept: ['<repository>/…'] } })
// root — the absolute superproject root, skillDir — the absolute folder of this script: the script has no
// filesystem, the launcher gives both paths and the descriptor object.
// The place's task lies in <prefix><slug>-task.md before launch. files — the full and minimal list of the files
// of the place as paths from the superproject root; newFiles — those of them that are not in HEAD: they are rolled back
// by `git clean`, not by `git checkout`; kept — the files of the place kept from the previous run at a new
// launch: their code lies in the tree, the executor does not rewrite them.
// The place's home entry — the entry where the place is stated and where decisions on it are recorded — arrives as the home argument.
// Resumption after a stop — the same call with resumeFromRunId and args.ownerAnswer (the owner's answer
// verbatim), all other arguments byte-identical to before. The flag is removable: without it a cached blocked
// or ESCALATE returns the same stop. Resume points: stop A (the finishing executor call), escalation
// of the analyst (a repeated analyst). Stop B has no resume. A premise dispute has no resume:
// the launcher rewrites the task, the run is launched anew.
// Rollback is partial: the analyst rolls back only the files with findings, on an architectural finding — all
// related ones; a premise dispute rolls back the place whole.

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
const REQUIRED = ['name', 'repos', 'prefix']
const missing = REQUIRED.filter((k) => !RUN || RUN[k] === undefined || RUN[k] === null || RUN[k] === '')
if (!RUN || missing.length || !Array.isArray(RUN.repos) || !RUN.repos.length) {
  return {
    ok: false, stage: 'args',
    error: 'args.run is the run descriptor (an object). Required: name, repos[] (non-empty), prefix. Sample — run.example.json next to the script',
    missing, got: A,
  }
}

const PLACE = A.place
const SLUG = A.slug
const HOME = String(A.home || RUN.home || '')
const OWNER_ANSWER = A.ownerAnswer ? String(A.ownerAnswer) : ''
const FILES_ARG = Array.isArray(A.files) ? A.files : []
const NEW_FILES_ARG = Array.isArray(A.newFiles) ? A.newFiles : []
const KEPT_ARG = Array.isArray(A.kept) ? A.kept : []
if (!PLACE || !SLUG || !HOME || !FILES_ARG.length) {
  return {
    ok: false, stage: 'args',
    error: 'Needed args: { root, skillDir, run, place, slug, home, files: [paths from the root], newFiles?: [a subset of files], kept?: [a subset of files] }',
    got: { place: PLACE, slug: SLUG, home: HOME, files: FILES_ARG, newFiles: NEW_FILES_ARG, kept: KEPT_ARG },
  }
}

const abs = (p) => (String(p).startsWith('/') ? String(p) : ROOT + '/' + String(p).replace(/^\/+/, ''))
const norm = (f) => (String(f).startsWith(ROOT + '/') ? String(f).slice(ROOT.length + 1) : String(f).replace(/^\/+/, ''))
const COMMON = SKILL + '/common.md'
const ROLES = SKILL + '/roles.md'
const PFX = abs(RUN.prefix)
const TASK = PFX + SLUG + '-task.md'
const REGISTRY = PFX + SLUG + '-findings.md'
const CANON = RUN.canon ? abs(RUN.canon) : null
const CHECKS = RUN.checksDir ? abs(RUN.checksDir) : SKILL.split('/').slice(0, -3).join('/') + '/deep-review/checks'
const CATALOG = CHECKS.split('/').slice(0, -1).join('/') + '/SKILL.md'
const LENSES = Array.isArray(RUN.lenses) && RUN.lenses.length ? RUN.lenses : ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'F1']
const MAX_ROUNDS = Number.isInteger(RUN.maxRounds) && RUN.maxRounds > 0 ? RUN.maxRounds : 4
const REPO_LIST = RUN.repos
const NOT_FINDINGS = Array.isArray(RUN.notFindings) ? RUN.notFindings : []
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

const FILES_REL = FILES_ARG.map(norm).filter(Boolean)
const NEW_REL = NEW_FILES_ARG.map(norm).filter(Boolean)
const strayNew = NEW_REL.filter((f) => !FILES_REL.includes(f))
const strayKept = KEPT_ARG.map(norm).filter((f) => f && !FILES_REL.includes(f))
if (strayNew.length || strayKept.length) {
  return { ok: false, stage: 'args', error: 'newFiles and kept must be part of files', strayNew, strayKept }
}
const FILES = FILES_REL.map((f) => ROOT + '/' + f)
const repoOf = (rel) => rel.split('/')[0]
const inRepo = (rel) => rel.split('/').slice(1).join('/')
const REPOS = [...new Set(FILES_REL.map(repoOf))]
const isNew = (rel) => NEW_REL.includes(rel)
const trackedOf = (r) => FILES_REL.filter((f) => repoOf(f) === r && !isNew(f)).map(inRepo)
const newOf = (r) => NEW_REL.filter((f) => repoOf(f) === r).map(inRepo)
const gitIn = (r) => 'git -C ' + ROOT + '/' + r
const deltaCmds = () => REPOS.flatMap((r) => [
  ...(trackedOf(r).length ? [gitIn(r) + ' diff HEAD --numstat -- ' + trackedOf(r).join(' ')] : []),
  ...(newOf(r).length ? ['wc -l ' + newOf(r).map((f) => ROOT + '/' + r + '/' + f).join(' ') + '   — new files: git diff HEAD does not see them, a binary file is not measured in lines'] : []),
])
const rollbackCmds = () => REPOS.flatMap((r) => [
  ...(trackedOf(r).length ? [gitIn(r) + ' checkout HEAD -- ' + trackedOf(r).join(' ')] : []),
  ...(newOf(r).length ? [gitIn(r) + ' clean -f -- ' + newOf(r).join(' ')] : []),
])
const fileRollbackCmd = (rel) => gitIn(repoOf(rel)) + (isNew(rel) ? ' clean -f -- ' : ' checkout HEAD -- ') + inRepo(rel)

let KEPT = KEPT_ARG.map(norm).filter(Boolean)
const rewrittenFiles = () => FILES_REL.filter((f) => !KEPT.includes(f))
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
    premiseDispute: { type: 'string', description: 'a dispute about the PREMISE of the task, not about its precision: there is no defect in the named place OR it is an instance of a systemic mechanism. Empty if the premise is not disputed. A filled field STOPS the run: the place is rolled back, the dispute goes to the launcher, the task is rewritten with the owner — set it only for the premise; the rounds analyst fixes precision through promptFixes' },
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

const HEAD = (() => {
  const head = [
    'CONTEXT. ' + TITLE + ', place ' + PLACE + ' (the place\'s home entry — ' + HOME + '), the REGENERATION form (the common part of the form: ' + COMMON + ').',
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
})()

let round = 1
let execRuns = 0
let registryExists = false
let review = null
let sage = null
const history = []

log('Place ' + PLACE + ' (home ' + HOME + '). Task: ' + TASK)
log('Files (' + FILES_REL.length + '): ' + FILES_REL.join(', ') + (NEW_REL.length ? '. New: ' + NEW_REL.join(', ') : ''))
if (KEPT.length) log('Kept from the previous run (' + KEPT.length + '): ' + KEPT.join(', ') + '. Rewritten anew: ' + rewrittenFiles().join(', '))

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
    '⚠ THE TASK OF THE PLACE DECLARED THE FILE LIST, and it is the boundary of the place. A file touched beyond',
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
    'about the premise: review-lead puts it into premiseDispute, the run stops, the place',
    'is rolled back, the dispute goes to the launcher.',
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
      registry: REGISTRY, task: TASK,
    }
  }

  if (review.premiseDispute && review.premiseDispute.trim()) {
    log('PREMISE DISPUTE on round ' + round + '. The place is rolled back whole, the dispute goes to the launcher.')
    const undo = await agent(HEAD.concat([
      '', 'YOU ROLL BACK THE PLACE WHOLE, and nothing else. Review-lead disputed the PREMISE of the task; the task',
      'will be rewritten by the launcher together with the owner, the run will be launched anew.',
      'Verbatim, one command per line:',
      ...rollbackCmds().map((c) => '  ' + c),
      'Then `git -C <repository> status --porcelain` for each one, and put the verbatim output into rollback.',
      'Not a single file of the place may remain in the output. Do not touch other paths with a single',
      'command: uncommitted norm edits and run documents in the tree are NOT subject to rollback.',
      'action = "REWRITE", contradiction = «none, the premise was disputed», taskEdits an empty array,',
      'rollbackFiles — all files of the place.',
      '', 'Return the result strictly through StructuredOutput.',
    ]).join('\n'),
    call('rollback', { label: 'rollback on premise dispute' + rl, phase: 'Analyst', schema: SAGE_SCHEMA }))
    return {
      ok: false, verdict: 'PREMISE', rounds: round, run: RUN.name, place: PLACE, home: HOME, files: FILES_REL, newFiles: NEW_REL,
      premiseDispute: review.premiseDispute, review, rollback: undo && undo.rollback,
      registry: REGISTRY, task: TASK,
    }
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
    'There is no recon inside this run: the launcher wrote the task from an investigation with the owner.',
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
      kept: FILES_REL.filter((f) => !rolledAtCeiling.includes(f)),
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
