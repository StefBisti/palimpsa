// Talks to the api service. The access token lives only in memory; the refresh
// token is an httpOnly cookie the browser sends to /api/auth automatically.

export type User = { id: string; email: string };
export type Role = "owner" | "editor" | "viewer";
export type Note = { id: string; title: string; updated_at: string; role: Role };
export type Member = { id: string; email: string; role: Exclude<Role, "owner"> };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;
let user: User | null = null;

async function refresh(): Promise<boolean> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  accessToken = res.ok ? ((await res.json()) as { accessToken: string }).accessToken : null;
  return accessToken !== null;
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const send = () =>
    fetch(`/api${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body === undefined ? null : JSON.stringify(options.body),
    });

  let res = await send();
  // access token expired: get a new one once and retry (not for login/register themselves)
  if (res.status === 401 && !path.startsWith("/auth/") && (await refresh())) {
    res = await send();
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new ApiError(res.status, data.message ?? data.error ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// the logged-in user, restoring the session from the refresh cookie on first call
export async function currentUser(): Promise<User | null> {
  if (user) return user;
  try {
    if (await refresh()) user = await api<User>("/auth/me");
  } catch {
    accessToken = null; // session can't be restored, so treat it as logged out
  }
  return user;
}

export async function login(email: string, password: string) {
  ({ accessToken } = await api<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  }));
  user = await api<User>("/auth/me");
}

export async function register(email: string, password: string) {
  await api("/auth/register", { method: "POST", body: { email, password } });
  await login(email, password);
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
  accessToken = null;
  user = null;
}

// collab calls this on every (re)connect, so it always gets a fresh token
export async function collabToken(): Promise<string> {
  await refresh();
  return accessToken ?? "";
}
