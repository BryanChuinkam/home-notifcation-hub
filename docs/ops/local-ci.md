# Isolated local CI runner

Owner selected Local and authorized provisioning on 2026-10-25. This repository uses one ephemeral Linux ARM64 GitHub Actions runner inside Docker Desktop on the Mac. Docker desktop must be running; the application itself remains a normal macOS development process.

From the repository root:

```sh
python3 scripts/start-local-runner.py
gh api repos/BryanChuinkam/home-notifcation-hub/actions/runners --jq '.runners[] | {name,status,busy}'
```

The script builds `hnh-ci-runner:2.338.1-arm64` from Node 22.23.2 Debian Bookworm and the official runner archive with a pinned SHA-256. It obtains a short-lived registration token through authenticated gh and passes it over stdin; the token is never printed, written to source, or embedded in the image/container environment. The gh account must administer the repository.

Container `hnh-ci-ephemeral` has label `hnh-ci`, no host directory mounts, no Docker socket, no published ports, a private disposable workspace, and no household credentials. It uses Docker's bridge network, not the development services' custom networks. Internet access is needed for GitHub/package/browser downloads. This is container isolation, not a separate physical host or a LAN firewall. Limits: two CPUs, 3 GiB RAM, 512 processes, 1 GiB shared memory. Passwordless sudo exists only inside the container for Playwright system packages.

GitHub assigns one job, then deregisters the ephemeral runner; the container exits. No service or automatic restart is installed. Provision a fresh runner before each subsequent Local CI operation. The script refuses to replace an active runner. Before replacing this project's stopped container it retains container stdout/stderr under ignored `.verification/runner/`, then removes only that container and its anonymous volumes. It never resets development services or databases. Failed workflow artifacts are uploaded by the CI workflow; retain additional evidence before manual cleanup if needed.

Verify online/idle before `gh variable set CI_RUNNER --body local`, then read it back. The variable is repository-wide, so coordinate with other operations. Runner setup alone is not permission to push, merge or rerun CI: obtain the destination selection required by AGENTS.md each time. No silent cloud fallback.

The remote is public. Fork PRs are routed to GitHub-hosted infrastructure by the workflow; do not run untrusted workflows on the local runner or approve altered routing without owner review. The runner container has no long-lived GitHub PAT. GitHub's [runner reference](https://docs.github.com/en/actions/reference/runners/self-hosted-runners) and [registration instructions](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners) describe supported architectures and ephemeral registration.
