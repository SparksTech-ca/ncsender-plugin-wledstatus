/**
 * WLED Status Light - Command Processor
 * Pure settings sanitization only. No import/require/fetch/ctx.
 *
 * All actual WLED communication happens from config.html, which has real
 * browser fetch() while the settings dialog is open. This file's only job
 * is to sanitize/default the stored settings object before the host injects
 * it into config.html as __INITIAL_CONFIG__.
 */

const ALLOWED_EFFECTS = ['fireworks', 'chase', 'theaterchase', 'colorloop', 'strobe'];
const ALLOWED_FILL_STYLES = ['gradient', 'solid'];
const STATES = ['idle', 'homing', 'run', 'hold', 'alarm', 'door', 'check', 'probing', 'tool-changing'];

const DEFAULT_COLORS = {
  idle: { r: 255, g: 255, b: 255 },
  homing: { r: 0, g: 210, b: 255 },
  run: { r: 0, g: 255, b: 0 },
  hold: { r: 255, g: 193, b: 7 },
  alarm: { r: 255, g: 0, b: 0 },
  door: { r: 253, g: 126, b: 20 },
  check: { r: 0, g: 123, b: 255 },
  probing: { r: 26, g: 188, b: 156 },
  'tool-changing': { r: 201, g: 18, b: 168 }
};

function toFiniteNumber(value, fallback) {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeColor(value, fallback) {
  if (!value || typeof value !== 'object') return fallback;
  return {
    r: Math.min(255, Math.max(0, Math.round(toFiniteNumber(value.r, fallback.r)))),
    g: Math.min(255, Math.max(0, Math.round(toFiniteNumber(value.g, fallback.g)))),
    b: Math.min(255, Math.max(0, Math.round(toFiniteNumber(value.b, fallback.b))))
  };
}

function sanitizeHostEntry(entry) {
  // Backward-compatible with configs saved before instances had names,
  // where secondaryWledHosts was just an array of plain host strings.
  if (typeof entry === 'string') {
    return { host: entry.trim(), name: '' };
  }
  if (entry && typeof entry === 'object') {
    return {
      host: typeof entry.host === 'string' ? entry.host.trim() : '',
      name: typeof entry.name === 'string' ? entry.name.trim() : ''
    };
  }
  return { host: '', name: '' };
}

function sanitizeHostList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(sanitizeHostEntry)
    .filter((entry) => entry.host.length > 0)
    .slice(0, 10);
}

function buildInitialConfig(raw) {
  const source = raw || {};
  const rawColors = source.colors || {};
  const colors = {};
  STATES.forEach((state) => {
    colors[state] = sanitizeColor(rawColors[state], DEFAULT_COLORS[state]);
  });

  return {
    wledHost: typeof source.wledHost === 'string' ? source.wledHost.trim() : '',
    primaryName: typeof source.primaryName === 'string' ? source.primaryName.trim() : '',
    secondaryWledHosts: sanitizeHostList(source.secondaryWledHosts),
    brightness: Math.min(255, Math.max(1, Math.round(toFiniteNumber(source.brightness, 255)))),
    idleOffMinutes: Math.min(1440, Math.max(0, Math.round(toFiniteNumber(source.idleOffMinutes, 0)))),
    completionEffect: ALLOWED_EFFECTS.includes(source.completionEffect) ? source.completionEffect : 'fireworks',
    completionDurationSec: Math.min(60, Math.max(1, Math.round(toFiniteNumber(source.completionDurationSec, 6)))),
    xFollowEnabled: !!source.xFollowEnabled,
    xFollowInvert: !!source.xFollowInvert,
    // Defaults to the primary host for backward compatibility with configs
    // saved before this was a separate, redirectable picker.
    followerHost: typeof source.followerHost === 'string' && source.followerHost.trim()
      ? source.followerHost.trim()
      : (typeof source.wledHost === 'string' ? source.wledHost.trim() : ''),
    ledCount: Math.min(1000, Math.max(1, Math.round(toFiniteNumber(source.ledCount, 30)))),
    followerPositionOffsetMm: toFiniteNumber(source.followerPositionOffsetMm, 0),
    followerWidth: Math.min(20, Math.max(1, Math.round(toFiniteNumber(source.followerWidth, 1)))),
    followerColor: sanitizeColor(source.followerColor, { r: 255, g: 255, b: 255 }),
    xMaxOverride: source.xMaxOverride ? toFiniteNumber(source.xMaxOverride, null) : null,
    jobProgressEnabled: !!source.jobProgressEnabled,
    jobProgressHost: typeof source.jobProgressHost === 'string' ? source.jobProgressHost.trim() : '',
    jobProgressLedCount: Math.min(1000, Math.max(1, Math.round(toFiniteNumber(source.jobProgressLedCount, 30)))),
    jobProgressInvert: !!source.jobProgressInvert,
    jobProgressFillStyle: ALLOWED_FILL_STYLES.includes(source.jobProgressFillStyle) ? source.jobProgressFillStyle : 'gradient',
    jobProgressStartColor: sanitizeColor(source.jobProgressStartColor, { r: 255, g: 0, b: 0 }),
    jobProgressEndColor: sanitizeColor(source.jobProgressEndColor, { r: 0, g: 255, b: 0 }),
    jobProgressBackgroundColor: sanitizeColor(source.jobProgressBackgroundColor, { r: 0, g: 0, b: 0 }),
    colors
  };
}

export { buildInitialConfig };
