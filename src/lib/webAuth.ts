export type WebRole = 'user' | 'risk_manager' | 'admin';

export type WebUser = {
  username: string;
  password: string;
  role: WebRole;
  displayName?: string;
};

function normalizeRole(v: unknown): WebRole {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'admin') return 'admin';
  if (s === 'risk_manager' || s === 'risk-manager' || s === 'manager') return 'risk_manager';
  return 'user';
}

export function loadWebUsersFromEnv(): WebUser[] {
  const raw = process.env.WEB_USERS_JSON;
  if (!raw) return [];
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.users) ? parsed.users : [];
  const out: WebUser[] = [];
  for (const u of arr) {
    const username = String(u?.username || '').trim();
    const password = String(u?.password || '').trim();
    if (!username || !password) continue;
    out.push({
      username,
      password,
      role: normalizeRole(u?.role),
      displayName: String(u?.displayName || '').trim() || undefined,
    });
  }
  return out;
}

export function verifyBasicAuth(authHeader: string | null | undefined): {
  ok: boolean;
  user?: WebUser;
} {
  const header = String(authHeader || '');
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return { ok: false };

  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return { ok: false };
  }

  const sepIdx = decoded.indexOf(':');
  const gotUser = sepIdx >= 0 ? decoded.slice(0, sepIdx) : '';
  const gotPass = sepIdx >= 0 ? decoded.slice(sepIdx + 1) : '';
  if (!gotUser || !gotPass) return { ok: false };

  // Backward compat: single user/pass
  const singleUser = process.env.BASIC_AUTH_USER || '';
  const singlePass = process.env.BASIC_AUTH_PASS || '';
  if (singleUser && singlePass && gotUser === singleUser && gotPass === singlePass) {
    return { ok: true, user: { username: gotUser, password: gotPass, role: 'admin' } };
  }

  const users = loadWebUsersFromEnv();
  const match = users.find((u) => u.username === gotUser && u.password === gotPass);
  if (!match) return { ok: false };
  return { ok: true, user: match };
}

