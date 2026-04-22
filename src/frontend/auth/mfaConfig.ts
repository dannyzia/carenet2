const SETTINGS_KEY = "carenet-admin-settings";

const DEFAULTS: Record<string, unknown> = { mfaRequired: false };

function loadSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings: Record<string, unknown>) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isMfaRequired(): boolean {
  return !!loadSettings().mfaRequired;
}

export function persistAdminSettings(settings: Record<string, unknown>) {
  saveSettings(settings);
}

export function loadAdminSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
