export function sessionId() {
  try {
    const stored = sessionStorage.getItem('pcl-session');
    if (stored && /^[0-9a-f-]{36}$/.test(stored)) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem('pcl-session', id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
