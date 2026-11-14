# Servolocal — Master Tool Registry & Skill Routing Index

> **Document Version**: 2.0.0  
> **Classification**: Permanent Tooling Inventory & Automatic Selection Matrix  
> **Environment**: Windows 11 + Antigravity IDE  

---

## 1. Complete Repository Classification & Status Matrix

| Category | Repository | Classification | Installation Method / Path | Operational Role in Servolocal |
| :--- | :--- | :--- | :--- | :--- |
| **Engineering** | [`obra/superpowers`](https://github.com/obra/superpowers) | **Free & Compatible (Installed)** | Plugin in `~/.gemini/config/plugins/superpowers` | TDD loops, systematic debugging, plan writing, verification |
| **Engineering** | [`eai-org/agent-toolkit`](https://github.com/eai-org/agent-toolkit) | **Free & Compatible (Installed)** | Plugin in `~/.gemini/config/plugins/agent-toolkit` | RPAC task breakdown, PR reviews, artifact hardening |
| **Engineering** | [`jrobertogarcia/agent-workflows`](https://github.com/jrobertogarcia/agent-workflows) | **Free & Compatible (Installed)** | Plugin in `~/.gemini/config/plugins/agent-workflows` | 6-phase engineering lifecycle, alignment checking |
| **Engineering** | [`signalharbor27/codex-agents`](https://github.com/signalharbor27/codex-agents) | **Free & Compatible (Installed)** | Plugin in `~/.gemini/config/plugins/codex-agents` | Architecture investigation, test design, codebase auditing |
| **Engineering** | [`mattpocock/skills`](https://github.com/mattpocock/skills) | **Free & Compatible (Installed)** | Skills CLI (`to-spec`, `to-tickets`, `wayfinder`, `wizard`) | Socratic specification writing, tracer-bullet tasking |
| **Engineering** | [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) | **Free & Compatible (Installed)** | Skills CLI (`spec-driven`, `perf-opt`, `constraint-dev`, `code-review`) | Senior engineering standards, quality contracts |
| **Engineering** | [`anthropics/skills`](https://github.com/anthropics/skills) | **Free & Compatible (Installed)** | Skills CLI / Reference | Document manipulation (docx, xlsx), frontend design |
| **Engineering** | [`bmad-code-org/BMAD-METHOD`](https://github.com/bmad-code-org/BMAD-METHOD) | **Reference Methodology** | Integrated in `PROJECT_REQUIREMENTS.md` | Specification-first architecture and agile task breakdown |
| **Engineering** | [`github/spec-kit`](https://github.com/github/spec-kit) | **Reference Framework** | Integrated in root specification files | Standardized PRD and RFC contracts |
| **Engineering** | [`gsd-build/get-shit-done`](https://github.com/gsd-build/get-shit-done) | **Reference Methodology** | Integrated in `IMPLEMENTATION_ROADMAP.md` | Single-turn atomic execution slices |
| **UI & Frontend** | [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | **Free & Compatible (Installed)** | Skills CLI (`impeccable`) in `~/.agents/skills` | Anti-slop frontend design, UX polish, typography, motion |
| **UI & Frontend** | [`GoogleChrome/modern-web-guidance`](https://github.com/GoogleChrome/modern-web-guidance) | **Free & Compatible (Installed)** | Antigravity Plugin in `~/.gemini/config/plugins/` | Modern CSS, Core Web Vitals, native browser APIs |
| **UI & Frontend** | [`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) | **Free & Compatible (Installed)** | Skills CLI (`find-skills`) | Dynamic skill discovery and Vercel Next.js best practices |
| **UI & Frontend** | [`shadcn-ui/ui`](https://github.com/shadcn-ui/ui) | **Reference System** | Component primitives in `customer-web/src/components` | Accessible unstyled Radix / Tailwind primitives |
| **UI & Frontend** | [`magicuidesign/magicui`](https://github.com/magicuidesign/magicui) | **Reference System** | Micro-interactions in `customer-web` | Subtle drawer entrances and checkout badges |
| **UI & Frontend** | [`arihantcodes/spectrum-ui`](https://github.com/arihantcodes/spectrum-ui) | **Reference System** | Card and badge designs | Status pills (`CONFIRMED`, `PACKING`, `DELIVERED`) |
| **Security** | [`semgrep/semgrep`](https://github.com/semgrep/semgrep) | **Free & Compatible (Installed)** | Python CLI (`v1.185.0`) | Automated SAST security scanning for FastAPI and React |
| **Security** | [`semgrep/semgrep-rules`](https://github.com/semgrep/semgrep-rules) | **Free & Compatible (Configured)** | Configured (`p/python`, `p/owasp-top-ten`) | Automated OWASP rule enforcement |
| **Security** | [`gitleaks/gitleaks`](https://github.com/gitleaks/gitleaks) | **Free & Compatible (Installed)** | Standalone binary in `C:\Users\Priyanshuu\.gemini\bin` | Secret & credential leak prevention before git commits |
| **Security** | [`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) | **Free & Compatible (Installed)** | Skills CLI (`security-audit`) in `~/.agents/skills` | 6-stage vulnerability audit, SSRF, IAM, and auth inspection |
| **Security** | [`OWASP/CheatSheetSeries`](https://github.com/OWASP/CheatSheetSeries) | **Reference Framework** | Embedded in `SECURITY_CHECKLIST.md` | Session security, JWT validation, and password hashing |
| **Security** | [`github/codeql-action`](https://github.com/github/codeql-action) | **Reference Template** | CI/CD GitHub Action reference | Semantic vulnerability tracking |
| **Testing & Analysis** | [`microsoft/playwright`](https://github.com/microsoft/playwright) | **Free & Compatible (Installed)** | `npx playwright` (`v1.65.1`) | Automated cross-browser end-to-end user journeys |
| **Testing & Analysis** | [`yamadashy/repomix`](https://github.com/yamadashy/repomix) | **Free & Compatible (Installed)** | `npx repomix` (`v1.19.0`) + `repomix.config.json` | Token-optimized repository packaging with secret filters |
| **Testing & Analysis** | [`Graphify-Labs/graphify`](https://github.com/Graphify-Labs/graphify) | **Free & Compatible (Installed)** | Skills CLI (`graphify`) in `~/.agents/skills` | AST codebase knowledge graph and dependency queries |
| **Testing & Analysis** | [`Aider-AI/aider`](https://github.com/Aider-AI/aider) | **Pattern Reference** | Git commit discipline & tree-sitter repo maps | Automated atomic git commits and targeted edits |
| **Testing & Analysis** | [`All-Hands-AI/OpenHands`](https://github.com/All-Hands-AI/OpenHands) | **Reference Architecture** | Architecture guide | Autonomous agent execution sandbox patterns |
| **Testing & Analysis** | [`All-Hands-AI/software-agent-sdk`](https://github.com/All-Hands-AI/software-agent-sdk) | **Reference Architecture** | Python SDK reference | Agent tool sandboxing and multi-turn loops |
| **Full-Stack Commerce**| [`medusajs/medusa`](https://github.com/medusajs/medusa) | **Reference Architecture** | Architectural reference (do not replace stack) | Multi-vendor cart quoting, line-item adjustments |
| **Full-Stack Commerce**| [`vendurehq/vendure`](https://github.com/vendurehq/vendure) | **Reference Architecture** | Architectural reference (do not replace stack) | Merchant inventory isolation, store open/closed duty |
| **Full-Stack Commerce**| [`nextjs/saas-starter`](https://github.com/nextjs/saas-starter) | **Reference Architecture** | Architectural reference | Optimistic UI updates and session token propagation |
| **Full-Stack Commerce**| [`ixartz/SaaS-Boilerplate`](https://github.com/ixartz/SaaS-Boilerplate) | **Reference Architecture** | Architectural reference | Next.js App Router layout and error boundaries |
| **Full-Stack Commerce**| [`dyad-sh/dyad`](https://github.com/dyad-sh/dyad) | **External Sandbox Reference** | External prototyping tool | Rapid isolated UI concept validation |
| **Full-Stack Commerce**| [`stackblitz-labs/bolt.diy`](https://github.com/stackblitz-labs/bolt.diy) | **External Sandbox Reference** | External prototyping sandbox | In-browser prototype validation |

---

## 2. Automatic Tool Routing Decision Matrix

Whenever a task is received, agents MUST automatically match the task type to the primary toolchain:

```
Task Domain                  Primary Skills / Toolchains
───────────────────────────  ───────────────────────────────────────────────────────────────
Frontend & UI Design         ➜ impeccable, modern-web-guidance, shadcn/ui primitives
React / Next.js Framework    ➜ find-skills, vercel-labs guidance, modern-web-guidance
Product Requirements & Spec  ➜ spec-driven-development, to-spec, to-tickets, BMAD, spec-kit
Socratic Architecture Stress ➜ grill-me, wayfinder, interview-me
Implementation & TDD         ➜ superpowers (test-driven-development), engineering
Systematic Debugging         ➜ systematic-debugging, root-cause, backend logs inspection
Security Audit & Hardening   ➜ security-audit (Cloudflare), semgrep (p/python), gitleaks
Browser & E2E Testing        ➜ microsoft/playwright, chrome-devtools
Codebase Understanding       ➜ repomix, graphify, gather-context, codebase-investigation
Marketplace Business Logic   ➜ Medusa/Vendure state machine references
Pre-Commit Verification      ➜ validate-commit, verification-before-completion, gitleaks
```

---

## 3. Local Model Context Protocol (MCP) Configuration

Local MCP servers configured in [`.agents/mcp_config.json`](file:///c:/Users/Priyanshuu/Desktop/ServoLocal/.agents/mcp_config.json):
- **`repomix`**: Provides on-demand, token-budgeted codebase compression via `npx repomix --mcp`.

---

## 4. Token & Cost Optimization Protocol

1. **Progressive File Reading**: Never dump entire directories into context. Read only files targeted for inspection.
2. **Repomix Context Packager**: Use `npx repomix` with `repomix.config.json` to generate token-compressed, comment-stripped context.
3. **Loop Intervention**: Immediately halt any failing execution loop; diagnose root causes via logs before re-running commands.
4. **Local Tools First**: Rely strictly on local CLI tools (`pytest`, `npm`, `semgrep`, `gitleaks`) without requiring paid third-party APIs.
