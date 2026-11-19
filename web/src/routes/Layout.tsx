import { Link, Outlet, useLoaderData, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { logout, type User } from "@/lib/api";

export default function Layout() {
  const user = useLoaderData<User>();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    await navigate("/login");
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-screen-2xl flex-col gap-6 px-4 py-4 sm:px-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-heading text-lg font-semibold">
          Palimpsa
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={() => void onLogout()}>
            Log out
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
