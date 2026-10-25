# Start everything / stop everything

Use this guide for daily operation of the existing Mac setup. For a new installation, complete [Hub administrator setup](administrator-setup.md#first-installation) and [Home Assistant installation](home-assistant.md) first. Keep the existing .env.local and databases; daily startup does not require copying the env example, generating another setup secret or creating accounts again.

## What runs

| Service | Where it runs | How it is managed |
| --- | --- | --- |
| Home Assistant OS, Supervisor and its configured apps | Home Assistant Hub VM in UTM | Start/stop the VM system; HA manages its internal services |
| Hub web server | Mac, http://127.0.0.1:3000 | npm run dev, or a build followed by npm run start |
| Hub notification worker | Mac, alongside the web server | Started/stopped automatically by the same Hub launcher |
| SQLite | Files used by the Hub | No separate database server to start |
| Optional receiver apps/agents | Phones, computers and TVs | Must be configured and available on each intended receiver; see [receiver setup](real-devices.md) |

Docker Desktop is used only for optional local CI in this project. It is not needed to run this UTM-based setup. No automatic Mac login service, unattended VM autostart, Hub background service or sleep prevention has been installed; start:all is an explicit foreground command. Keep the Mac awake and the Hub terminal open while using it; closing the browser does not stop services.

## Start everything

Use the one-command procedure below for a configured development stack, or [manual startup](#manual-startup) for first setup and recovery.

## Stop everything

Use npm run stop:all or Ctrl+C in the start:all terminal for a managed stack. For individually started services, follow [manual shutdown](#manual-shutdown).

## One-command operation

After initial Hub/HA setup, the project can manage the complete local development stack:

```sh
cd /Users/chui0005/Documents/projects/4fun/home-notification-hub
nvm use
npm run start:all
```

Keep that terminal open. In a second terminal in the same repository, stop the managed stack with:

```sh
npm run stop:all
```

Ctrl+C in the start:all terminal performs the same full-stack shutdown. These are npm scripts, so use npm run stop:all rather than npm stop dev. The original npm run dev/start commands still manage only Hub+worker.

On first use, stop any manually started Hub/standalone worker using its original terminal. start:all refuses an occupied Hub port and will not adopt or kill an unknown process. It can reuse the configured HA VM if already running; stop:all subsequently requests shutdown of that selected VM, including its internal HA services. A stop with no controller reports that condition and leaves manually started services unchanged.

Startup reserves a private project control socket, opens/starts the selected UTM guest, verifies the configured pinned address belongs to that guest, and waits for authenticated read-only HA discovery before starting the existing development Hub/worker launcher. It then checks Hub web liveness. Startup does not reinstall dependencies, create accounts, change the VM address or send test messages. Queued notifications can resume when the worker starts.

Shutdown first stops the owned Hub launcher and waits for its web/worker children, then requests guest OS powerdown through UTM. It waits up to two minutes for the guest to stop and quits UTM only when all its VMs are stopped; other active/paused VMs keep UTM open. It never uses force/kill poweroff. If the guest ignores the request or a step fails, the command reports incomplete shutdown; use the manual steps below, then retry stop:all while the controller is available. UTM Automation permission is required; macOS may prompt on first use. Losing the HA guest may also affect other household automations it hosts.

The commands are macOS-only and disabled in CI. They require the normal server-only HA URL/address/token configuration and an HTTP loopback APP_ORIGIN. Default VM UUID is the installed Home Assistant Hub instance; set optional HUB_UTM_VM_ID in .env.local only to select a replacement VM UUID. This is development mode; production-mode local operation still uses the manual build/start steps below.

A failed startup stops any owned Hub child, closes its controller and leaves HA running for manual recovery. A failed shutdown keeps the controller available for another stop request. The private socket is .verification/local-stack/control.sock. Duplicate starts are rejected without disturbing the existing controller. After a crash, if the socket is stale, inspect it with `lsof .verification/local-stack/control.sock`; confirm no start:all controller/Hub/worker is running before removing only that socket file and restarting. Do not delete the runtime directory of an active controller. No PID file or broad process-name kill is used.

Use the manual sections below for first setup, individually started services, production mode and recovery. Readiness/IPC and lifecycle ordering were tested with owned fixtures/fake VM operations; a live household guest power-cycle has not been executed by this change.

## Manual startup

1. Connect the Mac to the household network and make the intended receivers available. For mock-only testing, Home Assistant and physical receivers are optional.
2. Open UTM. Select **Home Assistant Hub** and choose **Play** if stopped. If already started, leave it running; do not create another VM.
3. Wait for HA to finish booting and open its web interface at **http://10.0.0.211/**, the address verified during installation. Sign in to confirm it is ready. The address is DHCP-assigned and can change; see status checks below. This instance redirects port 8123 to port 80. Use the direct port-80 origin in HOME_ASSISTANT_URL because the Hub rejects redirects.
4. In a terminal, run these separate commands from the Hub repository:

```sh
cd /Users/chui0005/Documents/projects/4fun/home-notification-hub
nvm use
npm run dev
```

The launcher loads .env.local, applies pending migrations, and starts both Next.js and the worker against the configured SQLite database. Leave this terminal running. Do not also run a standalone worker for normal operation. Previously queued notifications can resume when the worker starts; startup is not a read-only check.

5. Open **http://127.0.0.1:3000** and sign in to the Hub. This must match APP_ORIGIN exactly: localhost and 127.0.0.1 are different origins. If HA settings changed, use Settings → Discover targets for a read-only connection check. It does not send a notification. A real device test requires its separate explicit send action.

For a production-mode local run instead of development, stop any existing Hub launcher first, then run:

```sh
nvm use
npm run build
npm run start
```

Build again after application code changes. This is still local operation; it does not install a deployment service or trusted household HTTPS. Run only one normal Hub launcher at a time. The web server and worker are both required for normal messaging.

## Manual shutdown

1. Stop submitting messages. If you want a quiet shutdown, wait for current sends to finish in History before proceeding. Queued work persists across restarts; stopping services does not cancel messages or recall a notification already sent.
2. In the terminal running npm run dev/start, press **Ctrl+C once**, then wait for the shell prompt. The launcher signals both web and worker and waits for them; it force-stops unresponsive children after 12 seconds. A worker may finish in-flight batch work while stopping, so wait before shutting down HA. If you separately started a troubleshooting worker, stop that terminal with Ctrl+C too.
3. Open Home Assistant and choose **Settings → System → power icon → More options → Shut down system**, then confirm **Shut down**. This shuts down the guest OS, not just the HA application. See the [official shutdown instructions](https://www.home-assistant.io/common-tasks/general/restarting/).
4. Wait until the VM is stopped in UTM. Then quit UTM if desired. If HA has shut down but UTM still shows a started guest, verify the guest reports shutdown complete before stopping that remaining VM process. Avoid forcing power off while HA is still writing data. Shutting down a VM is not the same as deleting it.
5. You can now put the Mac to sleep or shut it down. Optional receiver apps may remain running for their other uses; no household-wide device shutdown is implied.

Stopping only the Hub is enough when you want HA to keep running for other household functions. If a real send was interrupted, its outcome can be unknown: check the receiver before explicitly resending. The queue does not automatically repeat an expired real-send lease; mock recovery can retry.

## Restart or update

- **Managed stack:** use stop:all, then start:all to reload configuration in its controller and children.
- **Only a manually started Hub configuration/worker/domain code changed:** stop the Hub with Ctrl+C and start it again using the preceding steps. Keep HA running. Environment changes must reach both web and worker; frontend hot reload does not reload the worker.
- **Dependencies changed:** stop the Hub, run nvm use and npm ci in the repository, then start it again. Preserve .env.local, DATABASE_PATH and the data directory. Production mode also needs a fresh build.
- **HA integration or configuration needs a restart:** stop the Hub first if messages could be sent. In HA Settings → System → power menu choose Restart Home Assistant and confirm. Wait for the HA web UI to return, then start the Hub. For a guest OS restart choose More options → Reboot system instead. These choices differ from shutting down the system.
- **Mac/network restarted or VM address changed:** check the guest LAN address before starting the Hub. Update only HOME_ASSISTANT_URL and its matching HOME_ASSISTANT_ADDRESS in the existing .env.local if necessary; retain the token and other settings. Then restart the Hub. Do not rely on automatic DNS retargeting.

After an environment/profile change, follow [receiver profile rules](real-devices.md#optional-explicit-profiles) for any required target re-registration. No account setup needs repeating after an ordinary restart.

## Status checks and recovery

These checks do not send household notifications. Run the terminal commands in a second terminal while the Hub launcher remains running.

| Check | How | Meaning / limit |
| --- | --- | --- |
| UTM guest state | Select Home Assistant Hub in UTM; or use the command below | Started means the VM process is running, not that HA is ready |
| HA readiness | Open its current LAN URL and sign in | Confirms the HA web interface is available |
| Hub web process | curl --fail --max-time 5 http://127.0.0.1:3000/api/health | HTTP success means web-process liveness, not worker/HA/receiver readiness |
| HA API connection | Hub Settings → Discover targets | Authenticated read-only discovery, not physical delivery |
| Worker progress | Watch launcher logs and delivery History | A queued record alone does not prove the worker is healthy; it may be waiting for a retry |
| Physical receiver | Deliberate device test and personal observation | Separate from all readiness checks; can make sound/display a message |

For the installed VM, macOS may request Automation permission for these UTM queries:

```sh
osascript -e 'tell application "UTM" to get status of virtual machine id "ACA2A5F2-7F28-45D4-B50E-EBDF76329289"'
osascript -e 'tell application "UTM" to query ip virtual machine id "ACA2A5F2-7F28-45D4-B50E-EBDF76329289"'
```

The guest agent must finish booting before the address query works. Its output can include Docker/internal/IPv6 addresses; use the physical private LAN address on the bridged interface. VM ID and address above belong to this installation; a replacement VM has different values.

If port 3000 is occupied, identify its listener before starting another copy:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Return to that process's original terminal and stop the intended Hub launcher. If its terminal is unavailable, use Activity Monitor to identify the project launcher and request Quit, then recheck the listener and any worker process before restarting. Do not kill every Node process; other projects may be running. The supervisor normally stops its counterpart when either web/worker exits unexpectedly. A forced OS kill can leave children; inspect their project/path before quitting them. Deleting the database or .env.local is not a process-recovery step.

## Optional services and data

A standalone `npm run worker` is for troubleshooting, not required alongside the launcher. Stop it with Ctrl+C and wait for it to exit before shutting down HA. `npm run worker:once` processes at most 20 currently due deliveries, then exits; it does not wait through future retries. Either command can send real queued notifications with the configured HA credentials. See [queue behavior](messaging.md).

The optional isolated CI runner uses Docker Desktop and exits/deregisters after one job. It is not part of daily startup/shutdown. Follow the [local CI guide](local-ci.md) and its required CI selection; allow an active job to finish before quitting Docker Desktop. Leave unrelated containers/services alone. No HA container was created for this installation.

Hub data defaults to data/development/hub.sqlite unless DATABASE_PATH overrides it. HA data is inside `~/Library/Containers/com.utmapp.UTM/Data/Documents/Home Assistant Hub.utm`. Preserve both independently. Source downloads under `~/Library/Application Support/Home Notification Hub/home-assistant/downloads` are not backups of the configured VM. Backup/restore and automatic deployment supervision remain later work. Do not copy only a live SQLite main file while WAL writes are active; see [persistence notes](administrator-setup.md#persistence-and-migrations).

This runbook was checked against scripts/run-app.mjs, scripts/worker.ts and the linked HA instructions. The documentation task did not stop/restart your live services or exercise the full shutdown sequence against household data.
