import { login } from "@/lib/auth";
import { useState } from "react";
import { Button } from "./ui/button";

type Props = { onLogin: () => void };

export default function LoginComponent({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      await login(email, password);
      onLogin();
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="m-8 flex max-w-sm flex-col gap-3"
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-md border px-3 py-2"
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Log in</Button>
    </form>
  );
}
