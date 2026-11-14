# Servolocal — Master Tool Registry, Conflict Prevention & Safety Protocols

> **Document Version**: 3.0.0  
> **Classification**: Permanent Tooling Inventory, Safety Guardrails & Conflict Prevention  
> **Environment**: Windows 11 + Antigravity IDE  

---

## 1. Absolute Priority Hierarchy

Whenever any conflict arises between tools, skills, agents, or instructions, all operations MUST resolve disputes using this non-negotiable priority order:

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                       Master Priority Hierarchy                        │
  └────────────────────────────────────────────────────────────────────────┘
                                      │
                 1. USER DATA & SECURITY (OWASP, Zero Secrets)
                                      │
                 2. EXISTING WORKING APPLICATION (Zero Regressions)
                                      │
                 3. PROJECT-SPECIFIC AGENTS.md (Factory Standards)
                                      │
                 4. TASK REQUIREMENTS (User Acceptance Criteria)
                                      │
                 5. RELEVANT SPECIALIST TOOLS (Plugins, Skills, MCP)
```

---

## 2. Complete Tool Registry & Conflict Resolution Matrix

| Tool / Repository | Installation Status | Compatibility | Purpose | Potential Conflicts & Resolution | Last Verified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`obra/superpowers`** | Installed (Plugin) | 100% Native | TDD loops, debugging, verification | May duplicate planning with `bmad`/`spec-kit`. **Resolution**: Use Superpowers strictly for execution/TDD; use Spec-Kit for PRDs. | 2026-11-14 |
| **`eai-org/agent-toolkit`** | Installed (Plugin) | 100% Native | RPAC task breakdown, PR review | May conflict with `agent-workflows`. **Resolution**: Use agent-toolkit for artifact hardening; agent-workflows for phase lifecycle. | 2026-11-14 |
| **`jrobertogarcia/agent-workflows`** | Installed (Plugin) | 100% Native | 6-phase lifecycle & alignment | Governs end-to-end task phasing. Master workflow orchestrator. | 2026-11-14 |
| **`signalharbor27/codex-agents`** | Installed (Plugin) | 100% Native | Codebase & architecture audit | Do not use for active code generation if Superpowers is writing code. Specialist auditor only. | 2026-11-14 |
| **`pbakaus/impeccable`** | Installed (Skill) | 100% Native | Anti-slop UI polish & typography | May suggest competing styling against Tailwind tokens. **Resolution**: Adhere to Servolocal Tailwind tokens first. | 2026-11-14 |
| **`GoogleChrome/modern-web-guidance`**| Installed (Plugin) | 100% Native | Web APIs, CWV & modern CSS | Authoritative source for browser APIs, accessibility, and Core Web Vitals. | 2026-11-14 |
| **`cloudflare/security-audit-skill`**| Installed (Skill) | 100% Native | 6-stage vulnerability audit | Specialist auditor. Run only during security review phases, never alongside code writing. | 2026-11-14 |
| **`vercel-labs/agent-skills`** | Installed (Skill) | 100% Native | Next.js best practices | Governs Next.js 15 App Router and Vercel edge deployment standards. | 2026-11-14 |
| **`addyosmani/agent-skills`** | Installed (Skills) | 100% Native | Senior engineering contracts | Supplies `spec-driven-development` and `constraint-driven-development` contracts. | 2026-11-14 |
| **`mattpocock/skills`** | Installed (Skills) | 100% Native | Socratic spec & tracer tickets | Supplies `to-spec`, `to-tickets`, and `grill-me`. Used during Discovery phase only. | 2026-11-14 |
| **`Graphify-Labs/graphify`** | Installed (Skill) | 100% Native | Codebase knowledge graph | Read-only analysis tool. Never writes to source files. | 2026-11-14 |
| **`yamadashy/repomix`** | Installed (CLI/MCP) | 100% Native | Token-efficient repo packager | Security checks enabled. Automatically excludes `.env`, `node_modules`, `venv`. | 2026-11-14 |
| **`semgrep/semgrep`** | Installed (CLI) | 100% Native | SAST code scanning | Static verification tool. 0 findings enforced on backend code. | 2026-11-14 |
| **`gitleaks/gitleaks`** | Installed (Binary) | 100% Native | Secret & credential scanner | Pre-commit gate. Blocks commits containing exposed keys or passwords. | 2026-11-14 |
| **`microsoft/playwright`** | Installed (CLI) | 100% Native | E2E browser test automation | End-to-end regression validation. Run headless. | 2026-11-14 |
| **`codecrafters-io/build-your-own-x`**| Reference (CC0) | Universal | Deep systems tutorials | **Strict guardrail**: Reference only. Never substitute toy implementations for production code. | 2026-11-14 |
| **`medusajs/medusa`** | Reference | Architecture | Multi-vendor cart & checkout | Inspires order state machine. Do not migrate backend to Medusa. | 2026-11-14 |
| **`vendurehq/vendure`** | Reference | Architecture | Merchant inventory isolation | Inspires store duty and channel permissions. Do not migrate backend to Vendure. | 2026-11-14 |
| **`nextjs/saas-starter`** | Reference | Architecture | Optimistic UI & sessions | Architectural reference for cart updates. | 2026-11-14 |
| **`ixartz/SaaS-Boilerplate`** | Reference | Architecture | Modular Next.js layouts | Architectural reference for error boundaries. | 2026-11-14 |
| **`dyad-sh/dyad` & `bolt.diy`** | Reference | Sandbox | Throwaway UI prototyping | External sandboxes only. Never run inside production application context. | 2026-11-14 |
| **`bmad-code-org/BMAD-METHOD`**| Reference | Methodology | Agile AI task decomposition | Embedded in `PROJECT_REQUIREMENTS.md`. | 2026-11-14 |
| **`github/spec-kit`** | Reference | Spec Standard | PRD & RFC templates | Standardized root specification markdown files. | 2026-11-14 |
| **`gsd-build/get-shit-done`** | Reference | Methodology | Atomic task slicing | Embedded in `IMPLEMENTATION_ROADMAP.md`. | 2026-11-14 |
| **`microsoft/TokenEconomizer`**| Emulated | Cost Control | Micro-skills & tool pruning | Implemented via progressive context loading and repomix exclusions. | 2026-11-14 |

---

## 3. Automatic Tool Routing Decision Matrix

Whenever a task is received, agents MUST automatically match the task type to the primary toolchain:

```
Task Domain                  Primary Skills / Toolchains
───────────────────────────  ───────────────────────────────────────────────────────────────
Frontend & UI Polish         ➜ impeccable, modern-web-guidance, shadcn/ui primitives
React / Next.js Framework    ➜ find-skills, vercel-labs guidance, modern-web-guidance
Product Requirements & Spec  ➜ spec-driven-development, to-spec, to-tickets, BMAD, spec-kit
Socratic Architecture Stress ➜ grill-me, wayfinder, interview-me
Implementation & TDD         ➜ superpowers (test-driven-development), engineering
Systematic Debugging         ➜ systematic-debugging, root-cause, backend logs inspection
Security Audit & Hardening   ➜ security-audit (Cloudflare), semgrep (p/python), gitleaks
Browser & E2E Testing        ➜ microsoft/playwright, chrome-devtools
Codebase Understanding       ➜ repomix, graphify, gather-context, codebase-investigation
Marketplace Business Logic   ➜ Medusa/Vendure state machine references
Systems & Low-Level Learning ➜ build-your-own-x (reference tutorials; study first, use production libraries)
Pre-Commit Verification      ➜ validate-commit, verification-before-completion, gitleaks
```

---

## 4. Tool Conflict Prevention & Concurrency Guardrails

To prevent tools from damaging the codebase or corrupting each other's configuration:

1. **Single Primary Execution Agent**: For any given task slice, exactly ONE primary execution agent drives the implementation.
2. **Specialist Subtask Allocation**: Specialist tools (e.g. `security-audit`, `graphify`, `impeccable`) are invoked only for bounded subtasks and report back to the primary agent.
3. **Strict Concurrency Ban (Single Writer Rule)**: Multiple agents are NEVER permitted to modify the same files simultaneously. If parallel subagents are dispatched, each must operate on disjoint file paths or isolated branch worktrees.
4. **Conflict Resolution Protocol**: If two tools or skills provide contradictory advice:
   - Check the **Master Priority Hierarchy** in Section 1.
   - Ground the decision in official framework documentation (`source-driven-development`).
   - If ambiguity persists, **STOP AND REPORT THE CONFLICT TO THE USER** rather than guessing.
5. **No Mid-Task Tool Updates**: Never install, upgrade, or remove CLI packages or plugins during active feature implementation without prior compatibility checks.

---

## 5. Pre-Change Checkpoints & Atomic Rollback Protocol

### Pre-Change Safe Checkpoint Protocol
Before modifying any source code:
1. Run `git status` to inspect current working tree state.
2. Ensure uncommitted user changes are preserved (never overwrite user WIP work).
3. Confirm `.env` and `.env.local` files are unmolested and ignored by Git.
4. Verify that dependencies and packages in `package.json` and `requirements.txt` are intact.

### Post-Change Verification & Rollback Protocol
After modifying code:
1. Run mandatory verification suites:
   - `npm --prefix customer-web run type-check && npm --prefix customer-web run build`
   - `npm --prefix partner-web run type-check && npm --prefix partner-web run build`
   - `pytest backend/tests`
2. Run security scans: `semgrep scan --config "p/python" backend/app` and `gitleaks protect --staged`.
3. Review the exact `git diff` to ensure no unintended files or dead code slipped in.
4. **Atomic Rollback Rule**: If verification fails and cannot be fixed cleanly, roll back ONLY the changes introduced by the current task slice (`git checkout <modified_file>` or `git restore`). Never execute destructive repository resets (`git reset --hard`) that wipe uncommitted user work.

---

## 6. Token & Cost Optimization Protocol

1. **Progressive File Reading**: Never dump entire directories into context. Read only files targeted for inspection.
2. **Repomix Context Packager**: Use `npx repomix` with `repomix.config.json` to generate token-compressed, comment-stripped context.
3. **Loop Intervention**: Immediately halt any failing execution loop; diagnose root causes via logs before re-running commands.
4. **Local Tools First**: Rely strictly on local CLI tools (`pytest`, `npm`, `semgrep`, `gitleaks`) without requiring paid third-party APIs.

---

## 7. Technical Learning Reference — Build Your Own X (`codecrafters-io/build-your-own-x`)

- **Repository**: [`codecrafters-io/build-your-own-x`](https://github.com/codecrafters-io/build-your-own-x)
- **License**: CC0 1.0 Universal (Public Domain Dedication)
- **Purpose**: Permanent technical learning and architectural reference for engineering depth.

### Usage Triggers:
Consult this repository whenever a task involves:
- Building an AI model, LLM, or RAG pipeline.
- Understanding database internals, connection pooling, key-value stores (Redis), or storage engines.
- Implementing low-level backend protocols, HTTP/WebSocket servers, or streaming transports.
- Understanding React internals, virtual DOM, JSX compilation, or frontend architecture.
- Networking protocols, distributed consensus, or operating systems concepts.
- Building domain-specific parsers, AST compilers, or interpreters.

### Operational Guardrails:
1. **Search Before Implementing**: Search the repository for relevant tutorials and inspect the original source material.
2. **Concept Mastery vs. Toy Code**: Use its architectural concepts to improve understanding, correctness, and implementation quality.
3. **Never Replace Production Libraries**: Do **not** reproduce an entire tutorial or swap out production dependencies.
4. **Production Standard**: Always prefer hardened, production-ready libraries and secure architecture for real application code.
5. **Usage Transparency**: Log each consultation of this reference in [`AGENT_USAGE_LOG.md`](file:///c:/Users/Priyanshuu/Desktop/ServoLocal/AGENT_USAGE_LOG.md).
