# Home Notification Hub — Adopt My Reusable Project Workflow

You are building Home Notification Hub, a self-hosted household notification application, as described in the previously supplied implementation specification.

I have also provided a document titled **Reusable Project Workflow for AI-Assisted Software Development**.

This document defines the software development workflow I want reused across my projects.

**Treat this workflow as authoritative for project management, agent behavior, documentation, Git operations, CI, verification, and release management.**

Adapt its infrastructure-specific rules to Home Notification Hub without unnecessarily changing its core engineering discipline.

## 1. Initial setup

Before implementing application features:

1. Read the reusable project workflow in full.
2. Inspect the current repository, branch and working tree.
3. Identify which existing workflow rules apply directly.
4. Identify which rules require adaptation for a self-hosted application.
5. Create the required project documentation.
6. Establish the Git branching and verification conventions.
7. Prepare a bounded plan for the first implementation milestone.

Do not rewrite the reusable workflow unnecessarily.

Preserve its principles, terminology, and operating procedures.

## 2. Required project documentation

Create and maintain:

- `AGENTS.md` — shared instructions for coding agents.
- `CLAUDE.md` — compatibility wrapper pointing to AGENTS.md.
- `HANDOFF.md` — current state and exact next action.
- `README.md` — setup and common commands.
- `PRODUCT.md` — product purpose and user requirements.
- `DESIGN.md` — architecture and technical conventions.
- `EXECUTION_PLAN.md` — milestones and delivery progress.
- `docs/scope.md` — approved and deferred scope.
- `docs/plans/` — substantial feature implementation plans.
- `docs/ops/` — deployment and operational procedures.
- `docs/agent-workflow.md` — verification and agent workflow procedures.
- `docs/archive/` — superseded handoffs and documents.

Keep shared instructions centralized.

Do not duplicate substantial instructions across AGENTS.md and CLAUDE.md.

Keep HANDOFF.md compact, accurate and actionable.

## 3. Technology adaptation

The reusable workflow describes a Vite, Supabase and Vercel project.

Do not automatically adopt those technologies.

For Home Notification Hub, use the stack defined in its implementation specification:

- Next.js and TypeScript.
- Tailwind CSS and shadcn/ui.
- SQLite.
- Home Assistant.
- Docker Compose.
- Vitest.
- Playwright and axe.
- GitHub Actions.

Document the exact chosen versions, package manager, architectural boundaries and standard commands in AGENTS.md.

Avoid adding unnecessary technologies or cloud dependencies.

## 4. Agent execution workflow

Follow the existing bounded-task workflow.

Before substantive implementation, identify:

- Outcome.
- Scope.
- Acceptance criteria.
- Stopping point.

The active user request determines the task.

Do not automatically begin unrelated unchecked tasks in EXECUTION_PLAN.md.

For substantial changes, prepare a focused plan under docs/plans/.

Complete one bounded implementation task, verify it, update documentation and stop at the agreed boundary.

Do not autonomously begin an unrelated milestone merely because the previous task is complete.

## 5. Token efficiency

Preserve the existing token-efficiency guidelines.

Requirements:

- Read relevant documentation selectively.
- Use focused file searches.
- Avoid dumping unnecessary logs or generated files.
- Maintain concise handoffs.
- Avoid repeatedly investigating settled decisions.
- Prefer one primary coding agent.
- Use subagents only for independently bounded work.
- Run targeted tests during development.
- Run full required checks before committing.

Implement a quiet verification wrapper consistent with the reusable workflow.

The wrapper must preserve command exit codes and retain detailed failure logs when troubleshooting is necessary.

## 6. Git and branching

Maintain:

- `main` — production release history.
- `staging` — integration and release validation.
- `feat/*` — feature work.
- `fix/*` — fixes.
- `docs/*` — documentation.
- `chore/*` — maintenance.

Task branches should originate from staging.

Use the following delivery route:

Task branch → Pull request → staging → validation → release pull request → main.

Protect staging and main according to the reusable workflow.

Do not force-push protected branches.

Do not bypass required checks.

Use conventional commits.

Enable automatic deletion of merged task branches where appropriate.

Do not create or modify GitHub branch protection settings without the necessary repository permissions and authorization.

## 7. CI execution

Preserve the local/cloud CI selection mechanism.

Use the documented `CI_RUNNER` setting where practical:

- `local` — self-hosted runner.
- `cloud` — GitHub-hosted runner.

Before pushing, creating or reopening pull requests, merging, or manually triggering CI, ask me to select the CI destination, as required by my workflow.

Do not silently fall back to cloud compute if a local runner is unavailable.

For the initial project setup, build CI configuration without assuming a self-hosted runner has already been installed.

Ensure CI environments are isolated from active development and household notification services.

A CI test must never send real household notifications unless explicitly authorized as a controlled hardware test.

## 8. Deployment environments

Adapt the existing staging/production process to self-hosted deployment.

**Development**
- Runs on my MacBook.
- Uses local development configuration.
- Uses mock devices and test integrations where appropriate.

**CI**
- Uses isolated application and database instances.
- Never shares household notification credentials.
- Never sends live notifications.

**Staging**
- Runs an isolated Docker deployment on my MacBook.
- Uses controlled test data.
- Validates release candidates.
- Must not interfere with household pilot services.

**Production**
- Initially runs on my MacBook.
- Later migrates to my Raspberry Pi 4.
- Uses persistent storage.
- Connects to registered household devices.

Do not automatically equate merging into main with successful production deployment.

Clearly track code state and deployment state separately.

The first implementation milestone does not require fully provisioning every environment. Document and implement environments when they become relevant to the current milestone.

## 9. Hardware integration verification

Extend the existing evidence-based verification process.

For every notification integration, distinguish:

1. Implemented in code.
2. Passed automated tests.
3. Configured in Home Assistant.
4. Successfully dispatched a real notification.
5. Confirmed displayed or spoken on a physical device.

Never mark a hardware integration complete merely because an API returned a successful response.

Where manual verification is required, record:

- Device tested.
- Integration used.
- Test date.
- Tested application revision.
- Test message.
- Observed outcome.
- Known limitations.

Track Roku's restrictions explicitly rather than fabricating support.

## 10. Handoff requirements

At the end of each bounded task, update HANDOFF.md.

Include:

- Current task.
- Branch and base revision.
- Uncommitted changes.
- Implemented features.
- Merged changes.
- Deployment state.
- Tested hardware integrations.
- Verification commands and results.
- Unverified behavior.
- Blockers requiring owner action.
- Exact next task.

Keep the handoff approximately one or two pages.

Archive obsolete details instead of accumulating an endless session log.

## 11. Definition of workflow compliance

A task is complete only when:

- Its acceptance criteria are satisfied.
- Relevant automated tests pass.
- Required verification has been performed.
- Documentation reflects reality.
- The handoff is updated.
- Unverified hardware behavior is identified.
- The agent stops at the agreed task boundary.

Do not claim a deployment succeeded unless it was actually deployed and verified.

## 12. First task

Start by integrating the reusable workflow into this repository.

Create the foundational documentation, application architecture, execution plan and required workflow configuration.

Set up only the minimum application scaffolding needed to validate the development environment.

Then provide:

1. The proposed repository structure.
2. Workflow files created.
3. Adaptations made for local hosting.
4. Initial implementation milestones.
5. Verification results.
6. Any decisions requiring my input.

Do not immediately implement the entire application.

The first objective is to establish a reliable project foundation that Codex and Claude Code can both use throughout development.