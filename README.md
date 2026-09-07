# WLED Status Light

**Version 1.0.10**

An ncSender plugin that mirrors your CNC machine's status to a
[WLED](https://kno.wled.ge/)-based RGB LED controller, using WLED's local
HTTP JSON API — no custom hardware or firmware required.

## Features

- **Status colors** — mirrors machine state (idle, homing, run, hold, alarm,
  door, check, probing, tool-changing) to fully configurable colors
- **X-axis follower** — a moving cursor segment tracking the spindle's X
  position along an LED strip mounted on the rail
  - Direction invert, for strips mounted so machine travel runs opposite to
    LED index order
  - Start/end offsets, for strips physically longer than actual machine
    travel (excludes the unreachable ends from the mapped range)
  - Adjustable cursor width, centered on the computed position
  - X max travel auto-read from firmware setting `$130`, or manual override
- **Job-completion effects** — plays a WLED built-in effect (Fireworks,
  Chase, Theater Chase, Colorloop, or Strobe) for a configurable duration
  when a job finishes, then returns to the idle color
- **Idle auto-off** — turns all configured WLED instances off after a
  configurable number of idle minutes (0 = never); resumes automatically on
  the next state change
- **Multiple WLED instances** — a primary unit (which gets the X-axis
  follower) plus any number of additional units that mirror the same status
  colors

## Known limitation: background operation

This plugin's settings dialog has full network access and works completely
on its own while open — live status colors, the follower, and manual testing
all work great there. ncSender's plugin sandbox currently has no outbound
network access in the background, so **the light only updates while the
dialog is open**.

For always-on operation with the dialog closed, pair this plugin with the
standalone **WLED Status Bridge** — a small companion script that connects
directly to ncSender's own WebSocket/REST API and drives WLED continuously,
reading the exact same settings you configure here. See its own README for
setup, including running it as a background service on Windows, macOS, or
Linux.

## Installing

1. Zip this folder:
   ```
   zip -r com.sparkstech.wledstatus.zip com.sparkstech.wledstatus/
   ```
2. In ncSender: **Settings → Plugins → Install Plugin** → upload the zip
3. Open **Tools → WLED Status Light** to configure settings

## Settings reference

| Section | Setting | Description |
|---|---|---|
| Connection | WLED hostname or IP | Primary instance — mDNS hostname (e.g. `wled-cnc.local`) or static IP |
| Connection | Brightness | 1–255 |
| Connection | Turn off after idle | Minutes of continuous idle before auto-off (0 = never) |
| Additional WLED Instances | Add/Remove hosts | Extra units mirroring status colors, no follower |
| Job Completion | Effect | Fireworks / Chase / Theater Chase / Colorloop / Strobe |
| Job Completion | Duration | Seconds before returning to idle color |
| X-Axis Follower | Enable | Turns the moving cursor on/off |
| X-Axis Follower | Invert direction | Flips cursor direction to match spindle travel |
| X-Axis Follower | LED count | Total addressable LEDs on the primary strip |
| X-Axis Follower | Cursor width | LEDs wide, centered on computed position |
| X-Axis Follower | Cursor color | Color of the moving cursor |
| X-Axis Follower | Start/end offset | LEDs to exclude from each end of the mapped range |
| X-Axis Follower | X max travel override | Manual value (mm); blank = auto-read `$130` |
| State Colors | Per-state color pickers | idle, homing, run, hold, alarm, door, check, probing, tool-changing |

## Versioning

This project follows a lightweight versioning convention:
- **Patch** (`1.0.x`) — bug fixes and small tweaks
- **Minor** (`1.x.0`) — larger feature additions

## Architecture notes

- `manifest.json` declares `commands` (a sandboxed settings sanitizer with no
  network access) and `configUi` (the settings dialog, which has real
  browser `fetch()` while open) — no `entry`/`index.js`, since that
  mechanism appears unused on the v2/pro-v2 platform generation.
- `commands.js` exports `buildInitialConfig(raw)` only — pure input→output,
  no imports or fetch, matching the sandboxed contract.
- `config.html` is a self-contained settings UI and live status mirror. It
  listens for `server-state-updated` WebSocket messages relayed via
  `postMessage`, merges partial updates (some messages only carry position,
  not status) into a running snapshot, and calls WLED directly.
- Settings persist via the documented `GET`/`PUT /api/plugins/{id}/settings`
  REST endpoint — the same one the companion bridge script reads from.

## License

GPL-3.0
