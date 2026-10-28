export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("login failed");
}

export async function getAccessToken(): Promise<string> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) throw new Error("not logged in");
  return (await res.json()).accessToken;
}
