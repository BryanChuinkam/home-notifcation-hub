# Project: Home Notification Hub

## Your role

Act as a senior full-stack engineer, software architect, DevOps engineer, and home automation integration specialist.

Your task is to **design, implement, test, and document a working, production-quality local household notification application**.

Do not stop at a plan or a proof-of-concept document. Build the application incrementally, run the available tests, and deliver a usable MVP.

Prioritize simplicity, reliability, security, maintainability, and efficient use of development resources. Follow enterprise-lite engineering practices appropriate for a single-household application.

Use existing, well-maintained open-source integrations wherever possible instead of reinventing notification delivery mechanisms.

## 1. Product overview

**Application name:** Home Notification Hub

Build a self-hosted web application that allows a household administrator to send notifications to selected devices connected to the home network.

The administrator should be able to access a private web dashboard from a MacBook or smartphone, select one or multiple devices, compose a message, and send it.

Depending on the device, notifications should appear as:

- Native operating-system notifications on computers and smartphones.
- On-screen overlays on supported smart TVs.
- Spoken announcements through Google Home/Nest speakers.
- Browser notifications on supported Chrome installations.

The application must support individual devices, multiple selected devices, and predefined groups.

**Primary example:** A parent opens the dashboard on their phone, selects the living room Google TV, a Windows computer, and a Google Home speaker, enters "Dinner is ready, please come downstairs," and presses Send.

The Google TV displays the message, the Windows computer receives a notification, and the Google Home reads the message aloud.

The application must not pretend that successful API dispatch proves the notification was displayed or heard.

## 2. Development and deployment strategy

### Phase A: Development on MacBook

The entire application should initially be developed, hosted, and tested on my MacBook.

Requirements:

- macOS development compatibility.
- Apple Silicon and Intel Mac compatibility where practical.
- Local development with hot reload.
- Docker Compose support.
- Accessible from other authorized devices on the same home Wi-Fi.
- No required paid cloud services.
- No required public internet exposure or router port forwarding.
- Clearly distinguish development configuration from household pilot configuration.

The MacBook will serve as the temporary server. The application may be unavailable when the MacBook sleeps or shuts down.

### Phase B: Household pilot

Once the MVP is ready, I want to run it on the MacBook for an extended period and test actual notifications around my home.

During this stage:

- Validate device compatibility.
- Test delivery reliability.
- Test notifications during media playback.
- Test multiple-device broadcasts.
- Test phone-based dashboard access.
- Identify platform limitations.
- Refine the UI based on real usage.

### Phase C: Raspberry Pi migration

Eventually, I may migrate everything to my existing Raspberry Pi 4 with:

- 4 GB RAM.
- 32 GB microSD card.
- Raspberry Pi OS Lite 64-bit.
- Docker Compose.

Design the application so migration does not require significant code changes.

Use platform-compatible dependencies and ARM64 Docker images.

Keep configuration and persistent data portable.

Document database backup, restore, device reconnection, and migration procedures.

## 3. Target device support

Implement an extensible notification adapter architecture.

### 3.1 iPhone and iPad

Preferred integration: Home Assistant Companion App.

Requirements:

- Native push notifications.
- Device-specific targeting.
- Background notifications where supported.
- Configurable notification title and message.
- Optional actionable acknowledgment support in a later phase.

Document the required companion app installation, device registration, permissions, and any cloud push dependencies.

### 3.2 Android phones and tablets

Preferred integration: Home Assistant Companion App.

Requirements:

- Native notifications.
- Individual device targeting.
- Background delivery when permitted.
- Optional acknowledgment actions in a later phase.

Document battery optimization and background restrictions that may affect delivery.

### 3.3 Windows computers

Investigate and use HASS.Agent or another actively maintained, compatible Windows notification agent.

Requirements:

- Windows 10/11 support where available.
- Native Windows toast notifications.
- Individual targeting.
- Notifications while other normal applications are running.

Do not promise that notifications always overlay exclusive fullscreen games.

### 3.4 macOS computers

Preferred integration: Home Assistant Companion App for macOS, or a suitable alternative if required.

Requirements:

- Native macOS notifications.
- Device targeting.
- Notifications outside the browser.
- Appropriate macOS notification permissions.

### 3.5 Google Chrome on computers

Support browser-based notifications through a PWA/Web Push adapter.

Consider ntfy as an optional existing integration.

Requirements:

- Explicit browser permission.
- Subscription registration.
- Device/browser-specific targeting.
- HTTPS-secured web push functionality.
- Accurate handling of unsupported and offline states.

Browser push must not be assumed to work when every browser process is terminated.

Avoid implementing custom push infrastructure if an established solution meets the requirement.

### 3.6 Chromecast with Google TV

This is an important target device.

Investigate the current compatibility of Notifications for Android TV and Home Assistant integrations.

Requirements:

- Display on-screen notifications.
- Target the Chromecast with Google TV individually.
- Display overlays over supported running applications.
- Configure duration and appearance if the receiver supports them.
- Document required application installation and overlay permissions.

Test actual delivery before marking this integration operational.

### 3.7 Roku Smart TV

My home has a Roku Smart TV.

Roku has significant third-party notification limitations.

Requirements:

- Investigate current Roku OS capabilities and supported APIs.
- Determine whether Home Assistant integration can reliably discover and control the Roku.
- Do not claim arbitrary system-wide notification overlay support without verification.
- Explore feasible alternatives, such as launching an application, displaying a dedicated message screen, or routing an audible announcement through Google Home.
- Clearly distinguish feasible capabilities from unsupported ones.

Do not spend excessive MVP development time attempting to bypass Roku OS restrictions.

If arbitrary native overlays are unsupported, clearly mark that capability as unavailable and provide an optional fallback.

### 3.8 Google Home and Google Nest

This is another important target.

Investigate Home Assistant's current Google Assistant SDK, Google Cast, and text-to-speech capabilities.

Requirements:

- Send text that Google Home reads aloud.
- Target supported individual speakers or rooms.
- Support multiple speakers where possible.
- Support household-wide announcements where available.
- Provide configurable speech volume if supported.
- Offer an option to use spoken announcements independently from text notifications.

Distinguish between:

1. Google Assistant Broadcast.
2. Google Cast with text-to-speech.

Identify trade-offs involving playback interruption, targeting accuracy, authentication, cloud dependencies, and media restoration.

Do not assume all Google Home models support identical behavior.

## 4. Technology stack

Preferred stack:

**Frontend**
- Next.js with App Router.
- TypeScript, strict mode.
- Tailwind CSS.
- shadcn/ui.
- Responsive, mobile-first layout.

**Backend**
- Next.js Route Handlers.
- TypeScript.
- Zod request validation.
- Modular notification service.
- Background processing where necessary.

**Database**
- SQLite.
- Drizzle ORM or Prisma, whichever is simpler and ARM64-compatible.
- Database migrations.
- Persistent storage independent of disposable containers.

**Authentication**
- Auth.js or another appropriate self-hosted credentials solution.
- Username/password login.
- Secure, HTTP-only session cookies.
- Argon2id password hashing.
- Login rate limiting.
- Server-side authorization for all protected operations.

**Notifications**
- Home Assistant integration API.
- Device-specific notification adapters.
- Optional ntfy integration for browser/desktop notifications.
- Small persistent delivery queue when necessary.

**Infrastructure**
- Docker Compose.
- Configurable environment variables.
- Persistent mounted volumes.
- Health checks.
- Automatic container restart.
- Caddy or equivalent HTTPS reverse proxy for the household pilot.

**Testing**
- Vitest for unit/integration tests.
- Playwright for browser E2E tests.
- Mocked integration tests.
- Hardware testing checklist.

Avoid Supabase, Vercel, hosted databases, Kubernetes, Redis, and paid services unless there is a compelling, documented reason.

Do not create unnecessary microservices.

## 5. System architecture

Use this general structure:

MacBook/Phone Browser

↓

Next.js Web Dashboard

↓

Authenticated Notification API

↓

Notification Dispatcher

↓

Device-Specific Adapters

↓

Home Assistant / ntfy / Supported Device APIs

↓

Registered Household Devices

The notification dispatcher must not depend directly on UI components.

Use a typed adapter interface with clearly defined capabilities and methods.

Suggested adapter interface:

```typescript
type NotificationCapability =
  | "text"
  | "speech"
  | "overlay"
  | "acknowledgment";

type DeliveryStatus =
  | "queued"
  | "processing"
  | "dispatched"
  | "accepted"
  | "failed"
  | "acknowledged";

interface NotificationAdapter {
  id: string;

  capabilities: NotificationCapability[];

  validateConfiguration(): Promise<boolean>;

  send(
    device: RegisteredDevice,
    message: NotificationMessage
  ): Promise<DeliveryResult>;
}
```

Improve this contract as necessary during implementation.

Maintain a clear distinction between dispatch success, receiver acceptance, actual display, and user acknowledgment.

## 6. Functional requirements

### FR-01: Authentication

Create a secure login page.

The application should require authentication before users can access:

- Dashboard.
- Device registry.
- Message composer.
- Message history.
- Administrative settings.
- Notification APIs.

For the MVP, support a single administrator account.

Create an initial administrator setup process that does not require hardcoded credentials or committing secrets.

### FR-02: Dashboard

Create a clean, modern, mobile-friendly dashboard.

The dashboard must show:

- Available registered devices.
- Device categories.
- Device names.
- Supported notification capabilities.
- Last successful communication or test status, when known.
- Message composer.
- Recent messages.
- Quick access to saved groups.

Do not falsely label a device as online merely because it is registered.

### FR-03: Device registry

Each device should have:

- Unique internal ID.
- Friendly name.
- Device type.
- Physical location or room.
- Integration type.
- Integration-specific identifier.
- Supported capabilities.
- Configuration state.
- Last successful test.
- Enabled/disabled state.

Users must be able to add, edit, disable, and remove devices.

Support a guided device registration process.

Do not rely on MAC addresses or local IP addresses as authentication or authorization.

Where feasible, discover devices through Home Assistant.

### FR-04: Message composer

Users must be able to:

- Enter a message.
- Enter an optional title.
- Select individual recipients.
- Select multiple recipients.
- Select a predefined group.
- Choose notification priority.
- Preview the message before sending.
- Send the message.

The UI must disable sending when the selected recipients cannot support the requested delivery mode.

If a recipient has partial support, show a clear warning and allow the user to choose supported delivery methods.

### FR-05: Device groups

Support predefined groups such as:

- Everyone.
- Living Room.
- Upstairs.
- Kids' Devices.
- Computers.
- Speakers.

Allow users to create, edit, and delete custom groups.

A device can belong to multiple groups.

Deduplicate recipients before dispatching.

### FR-06: Message templates

Create reusable templates.

Examples:

- Dinner is ready.
- Time for bed.
- Please come downstairs.
- Please turn down the volume.
- Time to leave.
- Family meeting.

Allow users to create, edit, and delete templates.

### FR-07: Delivery tracking

Maintain a separate delivery record for every target device.

Track:

- Message ID.
- Target device.
- Delivery adapter.
- Created time.
- Attempt time.
- Delivery state.
- Error information.
- Retry count.
- Acknowledgment when supported.

Track dispatch success separately from confirmed user acknowledgment.

### FR-08: Message history

Create a history page displaying:

- Message.
- Sender.
- Recipients.
- Creation time.
- Delivery outcome.
- Failure reason where applicable.

Allow users to resend previous messages.

### FR-09: Test notification

Each registered device must have a test notification action.

A successful test should require actual receiver verification when feasible, not simply a successful API call.

Provide manual confirmation when automatic verification is unavailable.

### FR-10: Phone access

The dashboard must work comfortably on mobile phones.

Requirements:

- Responsive layout.
- Touch-friendly targets.
- No horizontal scrolling.
- Quick device selection.
- Fast message composition.
- Optional installable PWA.

Support access over the home Wi-Fi through a configured local URL.

### FR-11: Network availability

The system must run without requiring public internet exposure.

Local dashboard access must be restricted to authenticated users.

Document which notification adapters need internet access and which can operate locally.

Prevent the notification service from making arbitrary requests to untrusted LAN hosts through user-controlled target URLs.

## 7. UI/UX requirements

Design the interface to feel like a polished consumer application, not a generic Home Assistant administrative panel.

Use a minimal visual style with:

- Clear typography.
- Generous spacing.
- Distinct device icons.
- Simple navigation.
- Accessible color contrast.
- Mobile-first layout.
- Keyboard accessibility.
- WCAG 2.2 AA where practical.

Suggested navigation:

1. Dashboard.
2. Devices.
3. Groups.
4. History.
5. Settings.

The primary action is sending a message, so the message composer must be prominent.

For mobile, prioritize selecting recipients and sending a message within a few taps.

Include useful empty states, loading states, validation errors, and actionable troubleshooting messages.

Do not use decorative device-status indicators that imply live status without reliable evidence.

## 8. Security requirements

This application will operate on a private household network, but local network access must not automatically be trusted.

Implement:

- Secure password hashing.
- Authenticated APIs.
- Role-appropriate authorization.
- Input validation.
- Session expiration.
- CSRF protections.
- Authentication rate limiting.
- Safe error messages.
- Secure secret management.
- Bounded message sizes.
- Audit-friendly message logging.
- Device adapter allowlisting.
- Strict network request validation.

Do not expose Home Assistant access tokens to browser JavaScript.

Protect against SSRF through arbitrary user-supplied device addresses or webhook destinations.

Do not commit passwords, tokens, signing keys, or private certificates.

For the household pilot, configure trusted HTTPS before enabling credentials-based access from other devices.

Document certificate management and mobile trust requirements.

## 9. macOS and Docker networking considerations

Investigate networking limitations before implementing the device integrations.

Docker Desktop on macOS uses virtualization, which may interfere with mDNS and multicast discovery used by Chromecast and other smart-home devices.

Therefore:

1. Confirm Home Assistant Container compatibility with macOS Docker.
2. Test Google Cast discovery early.
3. Test communication using known device IP addresses where supported.
4. Document failures related to Docker Desktop networking.
5. Avoid spending excessive time debugging multicast networking if the platform imposes limitations.

If required, propose a tested fallback using a bridged Linux virtual machine or another temporary Home Assistant host.

Keep the Next.js development workflow on the MacBook regardless.

The Raspberry Pi migration must remain straightforward.

## 10. Persistence and migration

Keep persistent application data separate from application code.

Data to preserve:

- SQLite database.
- Device registry.
- Device groups.
- Message history.
- Templates.
- Home Assistant configuration.
- Integration identifiers.
- Secrets and credentials.

Use environment-based configuration for hostnames and service endpoints.

Provide migration documentation for moving from MacBook to Raspberry Pi.

Support `linux/arm64` deployment.

Use compatible multi-architecture Docker images.

Document a backup and restore process.

For Raspberry Pi deployment, use reasonable log retention and database write patterns to reduce microSD wear.

## 11. Testing requirements

Automated tests must cover:

- Authentication.
- Authorization.
- Device registration.
- Group membership.
- Recipient deduplication.
- Request validation.
- Message dispatch.
- Adapter selection.
- Unsupported capability handling.
- Delivery status transitions.
- Retry behavior.
- Message history.
- Database persistence.

Create mocked implementations of notification adapters so automated tests do not require physical hardware.

Create Playwright E2E tests for:

1. Initial administrator setup.
2. Login.
3. Adding a mock device.
4. Sending a test message.
5. Selecting multiple recipients.
6. Viewing delivery results.
7. Viewing message history.
8. Using the interface at mobile viewport sizes.

Add a manual hardware integration test checklist for Google Home, Chromecast with Google TV, iPhone, Android, Windows, Mac, Chrome, and Roku.

Do not report hardware integrations as successfully tested unless they were actually exercised.

## 12. Deliverables

Produce:

1. Working Next.js application.
2. Responsive, authenticated dashboard.
3. Device management interface.
4. Notification dispatcher.
5. Initial Home Assistant adapter.
6. Device capability model.
7. Device groups and message templates.
8. Message history.
9. SQLite schema and migrations.
10. Docker Compose configuration.
11. Environment variable example.
12. Automated tests.
13. Development setup instructions.
14. MacBook household-pilot deployment guide.
15. Raspberry Pi migration guide.
16. Device integration setup and troubleshooting guide.

The README must include clear commands for installation, development, testing, building and running the application.

## 13. Implementation sequence

Implement the project incrementally.

### Milestone 1: Foundation

- Inspect the existing repository.
- Establish the application architecture.
- Scaffold Next.js if necessary.
- Configure TypeScript, Tailwind and shadcn/ui.
- Configure database and migrations.
- Implement authentication.
- Create the basic dashboard shell.
- Add mock devices and test data.
- Write automated tests.

**Exit criteria:** The application runs locally, supports authenticated access, and displays mock devices.

### Milestone 2: Messaging MVP

- Implement the device registry.
- Implement typed adapters.
- Create the notification dispatcher.
- Add per-device delivery records.
- Implement the message composer.
- Support multi-device selection.
- Create a mock adapter.
- Add message history.
- Implement retry handling.
- Run automated tests.

**Exit criteria:** Users can send messages to mock devices, with accurate delivery states.

### Milestone 3: Home Assistant integration

- Add Home Assistant configuration.
- Implement server-side API access.
- Discover supported entities.
- Register notification targets.
- Implement test notification flows.
- Handle connection failures.
- Add relevant documentation.

**Exit criteria:** Application can communicate with a configured Home Assistant instance.

### Milestone 4: Real device integration

Prioritize:

1. Google Home announcements.
2. Chromecast with Google TV overlays.
3. iPhone/Android notifications.
4. Windows notifications.
5. Mac notifications.
6. Chrome browser notifications.
7. Roku alternatives.

Implement available adapters in this order, but only enable those supported by current platform capabilities and verified configuration.

If physical device access or user authorization is required, leave the application operational with mock adapters and provide exact setup steps.

**Exit criteria:** Supported devices can receive real notifications after configuration and hardware validation.

### Milestone 5: Household-ready UI

- Improve mobile experience.
- Add groups.
- Add templates.
- Add detailed delivery status.
- Add device test actions.
- Add helpful configuration states.
- Improve accessibility.

**Exit criteria:** The dashboard is useful on MacBook and phone.

### Milestone 6: Deployment and portability

- Finalize Docker Compose.
- Configure HTTPS.
- Add health checks.
- Document startup and shutdown.
- Ensure persistent data survives rebuilds.
- Add ARM64 support.
- Document Raspberry Pi deployment.
- Run final automated tests.

**Exit criteria:** The MacBook can host the application for household use, with a documented path to Raspberry Pi deployment.

## 14. Agent execution rules

You are authorized to implement the application within the current repository.

Before writing code:

1. Inspect the repository and existing conventions.
2. Check the current official documentation for major integrations.
3. Identify any relevant existing components or infrastructure.
4. Prepare a concise implementation outline.
5. Identify integration risks and unsupported capabilities.

Then begin implementation.

Do not stop after producing the outline.

Work in manageable increments, preferably with tests before or alongside each feature.

After each milestone:

- Run relevant tests.
- Run linting and type checking.
- Fix errors.
- Document verified functionality.
- Identify unresolved dependencies.
- Continue to the next logical milestone.

Use tools and subagents when available and genuinely beneficial, but avoid unnecessary orchestration overhead.

Do not overwrite unrelated user changes or modify unrelated files.

Do not introduce new paid services without explicit approval.

Do not expose services publicly, change router settings, or handle live credentials without the necessary user authorization.

Never fabricate successful integration tests, device discovery or delivery results.

If a hardware integration cannot be completed without physical access, provide the working implementation and exact manual validation instructions.

## 15. Definition of done

The MVP is complete when:

- The application starts successfully on the MacBook.
- The administrator can securely log in.
- The dashboard works on Mac and mobile browsers.
- Devices can be registered and grouped.
- Messages can target individual or multiple devices.
- The dispatcher correctly chooses supported adapters.
- Notifications can be sent through configured Home Assistant integrations.
- Delivery attempts are accurately tracked.
- Unsupported devices do not silently appear successful.
- Automated tests pass.
- The application can be containerized.
- Setup and deployment instructions are documented.
- Raspberry Pi 4 migration is supported by the application architecture.

Do not treat real hardware testing as complete until validated on the physical devices.

## Final instruction

Start by inspecting the repository and documenting the proposed architecture.

Then **implement Milestones 1 and 2 immediately**, including the working UI, database, authentication, device registry, mock adapters, message dispatcher and automated tests.

Continue into subsequent milestones where practical without compromising implementation quality.

At the end, provide:

- Summary of implemented features.
- Files created or changed.
- Commands to run the application.
- Tests executed and results.
- Supported and pending integrations.
- Required manual hardware configuration.
- Known limitations.
- Recommended next steps.

**The objective is a working household messaging application, not merely an architecture proposal.**