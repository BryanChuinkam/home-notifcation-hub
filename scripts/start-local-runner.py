#!/usr/bin/env python3
"""Provision one ephemeral ARM64 CI runner without host mounts or socket access."""
import json
from pathlib import Path
import subprocess

REPO = "BryanChuinkam/home-notifcation-hub"
NAME = "hnh-ci-ephemeral"
IMAGE = "hnh-ci-runner:2.338.1-arm64"
ROOT = Path(__file__).resolve().parent.parent


def run(args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


# Refuse replacement of an active container. Only this project's stopped
# container can be removed; no cleanup ever targets other development services.
existing = run(["docker", "ps", "-a", "--filter", f"name=^/{NAME}$", "--format", "{{.Status}}"], capture_output=True).stdout.strip()
if existing:
    if existing.startswith("Up"):
        raise SystemExit(f"{NAME} is active; do not replace a possibly busy runner")
    evidence = ROOT / ".verification" / "runner"
    evidence.mkdir(parents=True, exist_ok=True)
    logs = run(["docker", "logs", NAME], capture_output=True)
    (evidence / "previous-container.log").write_text(logs.stdout + logs.stderr)
    run(["docker", "rm", "--volumes", NAME])

run(["docker", "build", "--platform", "linux/arm64", "--tag", IMAGE, str(ROOT / "scripts" / "ci-runner")])
# Capture the time-limited registration token; never print or persist it.
token = json.loads(run(["gh", "api", "--method", "POST", f"repos/{REPO}/actions/runners/registration-token"], capture_output=True).stdout)["token"]
run(["docker", "run", "--detach", "--name", NAME, "--platform", "linux/arm64",
     "--cpus", "2", "--memory", "3g", "--pids-limit", "512", "--shm-size", "1g",
     "--network", "bridge", "--label", "project=home-notification-hub", IMAGE])
try:
    configured = run(["docker", "exec", "--interactive", NAME, "bash", "-c",
                      'read -r token; ./config.sh --unattended --url https://github.com/' + REPO +
                      ' --token "$token" --name ' + NAME +
                      ' --labels hnh-ci --work _work --ephemeral; result=$?; unset token; '
                      'if [ "$result" -ne 0 ]; then exit "$result"; fi; touch /runner/.configured'],
                     input=token + "\n", capture_output=True)
    print(configured.stdout)
except subprocess.CalledProcessError:
    run(["docker", "stop", NAME])
    raise SystemExit("Runner configuration failed; container stopped. No token was logged.") from None
finally:
    token = None
print("Runner registered. Verify online/idle via the GitHub runners API before setting CI_RUNNER=local.")
