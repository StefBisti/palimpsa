import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/api";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    setPending(true);
    setError("");
    try {
      await (mode === "login" ? login(email, password) : register(email, password));
      await navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  const isLogin = mode === "login";
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isLogin ? "Log in to Palimpsa" : "Create an account"}</CardTitle>
          <CardDescription>Shared notes, edited live.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => void onSubmit(e)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={8}
                maxLength={64}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {isLogin ? "Log in" : "Sign up"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "No account? " : "Already have one? "}
              <Link to={isLogin ? "/register" : "/login"} className="underline">
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
