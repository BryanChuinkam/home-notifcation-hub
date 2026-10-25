# One-command local stack lifecycle

Owner authorized start:all/stop:all plus documentation consolidation, commit, push and PR to staging using a fresh isolated Local runner. Branch feat/stack-lifecycle from staging fc9b93b; carries the approved daily-guide edits. Preserve generated next-env.d.ts edit and household env/databases.

Outcome: one foreground development controller starts the configured HA UTM guest, waits for pinned authenticated read-only API readiness, then supervises the existing Hub+worker launcher. A second-terminal stop:all or Ctrl+C stops the owned launcher, requests graceful guest OS shutdown, waits for stopped state and quits UTM only when every VM is stopped. Never force-poweroff guests, kill unrelated Node processes, modify networking or send test notifications. Existing manually started services require one-time manual transition; refuse to adopt/kill an occupied Hub port. Private local control socket prevents PID reuse/unrelated process signalling. macOS-only live entrypoint disabled in CI; CI uses injected fake lifecycle operations and owned IPC fixtures.

Acceptance: bounded startup/shutdown, explicit failure recovery, no quit while other VMs run, duplicate-start protection, concurrent stop/start cancellation, state cleanup and process ownership tests; full lint/types/unit/build and desktop/mobile existing E2E in a disposable copy. Document graceful-shutdown timeout/manual fallback and stale-socket recovery. Do not exercise shutdown against the owner's running HA, or claim household power-cycle validation. Stop after feature PR/local CI verification; no merge, main promotion or next milestone.

## Result

Implemented macOS-only controller, private Unix control socket and UTM AppleScript using explicit guest powerdown requests. start:all/stop:all manage only their own launcher and selected VM. Consolidated daily/manual operations and first-install docs. No household process or configuration was changed during implementation.

Disposable-copy npm run check passed lint/types, 154 tests and production build; desktop/mobile E2E passed. Lifecycle tests cover 18 scenarios with fake VM operations, owned IPC and a real CI-guard subprocess. UTM AppleScript compiles on this installed Mac without executing. Docs links/fragments, referenced npm scripts, shell-block syntax and whitespace verified. No live VM shutdown/reboot claim. Original generated next-env.d.ts edit excluded. Feature PR provides exact-head isolated Local CI result; stop before merge.
