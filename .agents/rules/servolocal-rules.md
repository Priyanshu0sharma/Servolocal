---
trigger: always_on
description: Permanent Servolocal engineering rules and tool routing
---

# Servolocal Permanent Engineering Rules

## 1. Automatic Skill Discovery & Workflow Routing
Before starting or responding to any user task:
- Discover installed skills in `~/.gemini/config/plugins`, `~/.gemini/config/skills`, and `.agents/skills`.
- Refer to `TOOL_REGISTRY.md` and dynamically select the appropriate toolchain:
  - **UI / Frontend Polish**: `impeccable`, `modern-web-guidance`, `shadcn/ui`
  - **Next.js & Frameworks**: `find-skills`, Vercel guidelines
  - **Planning & Task Slicing**: `spec-driven-development`, `to-spec`, `to-tickets`, `BMAD-Method`, `GSD`
  - **Socratic Stress-Testing**: `grill-me`, `wayfinder`, `interview-me`
  - **Coding & Implementation**: `obra/superpowers` (TDD), `engineering`, `agent-toolkit`
  - **Systematic Debugging**: `systematic-debugging`, `root-cause`
  - **Security Audits & Hardening**: `cloudflare/security-audit`, `semgrep` SAST, `gitleaks`
  - **Testing & Quality Assurance**: `microsoft/playwright`, `pytest backend/tests`
  - **Codebase Understanding**: `yamadashy/repomix`, `graphify`, `gather-context`
  - **Systems & Architecture Learning**: `codecrafters-io/build-your-own-x` (read tutorials first; never replace production code with toy implementations)
- Read their actual `SKILL.md` instructions before applying them.
- Never fabricate tool or skill usage. Show concrete command execution and evidence.

## 2. Mandatory 12-Step Engineering Factory Lifecycle
Every task must automatically follow the 12-step lifecycle defined in `DEVELOPMENT_WORKFLOW.md`:
1. `UNDERSTAND` (parse intent and constraints)
2. `INSPECT` (check project architecture, models, existing code)
3. `IDENTIFY TOOLS` (query installed plugins, skills, MCP, and CLI tools)
4. `SELECT BEST TOOLS` (match task domain to toolchain)
5. `READ DOCS` (read relevant SKILL.md and documentation)
6. `STEP-BY-STEP PLAN` (propose atomic tasks with acceptance criteria)
7. `EXECUTE` (write atomic, non-destructive, clean code)
8. `RUN & TEST` (execute actual verification suites)
9. `FIX ERRORS` (isolate root causes and fix bugs at source)
10. `RETEST FLOW` (re-run complete affected workflows)
11. `REVIEW & AUDIT` (code review, security SAST, secret leak check)
12. `REPORT EVIDENCE` (report terminal proof and log in AGENT_USAGE_LOG.md)


## 3. Mandatory Verification Standards
Always run and show terminal outputs for:
- Customer Web: `npm --prefix customer-web run type-check` and `npm --prefix customer-web run build`
- Partner Web: `npm --prefix partner-web run type-check` and `npm --prefix partner-web run build`
- Backend: `pytest backend/tests`
- Security SAST (when backend/auth modified): `semgrep scan --config "p/python" backend/app --metrics=off`
- Secret Leak Audit (before commits): `C:\Users\Priyanshuu\.gemini\bin\gitleaks.exe detect --source . --no-git`
Never claim an issue is resolved without verifying the fix with terminal evidence.

## 4. UI, Architecture & Security Reference Guardrails
- **UI Design**: Use `shadcn/ui`, `magicui`, and `spectrum-ui` as design references for accessible components and clean micro-interactions. Never overload the application with unnecessary animations or bloated dependencies.
- **Marketplace Reference**: Use `medusa` and `vendure` patterns for order state machines and multi-vendor inventory isolation. Never replace or migrate Servolocal's FastAPI/Neon DB architecture without explicit approval.
- **Security Standards**: Follow `OWASP CheatSheetSeries` for input validation, JWT handling, and password security. Never print or log `.env` secrets.
- **Automated Testing**: Use `playwright` for end-to-end user journey verification and `a11y-next-app` for accessibility standards.

## 5. Permanent Usage Logging
Maintain `AGENT_USAGE_LOG.md` at the workspace root, logging:
- Task ID and description
- Repositories and skills triggered
- Instruction files accessed
- Commands executed
- Test outcomes and evidence
- Errors encountered and fixes applied
- Changed files
- Final status

## 6. Master Factory Specifications & Token Optimization
- Every task must align with `PROJECT_REQUIREMENTS.md`, `PROJECT_ARCHITECTURE.md`, `IMPLEMENTATION_ROADMAP.md`, `TESTING_STRATEGY.md`, and `SECURITY_CHECKLIST.md`.
- Use `npx repomix` with `repomix.config.json` for token-efficient codebase context serialization.
- Follow BMAD-Method and GSD principles: atomic, single-turn execution slices with explicit acceptance criteria.

