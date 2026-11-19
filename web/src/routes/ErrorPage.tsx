import { Link, useParams, useRouteError } from "react-router";
import { ApiError } from "@/lib/api";

export default function ErrorPage() {
  const error = useRouteError();
  const { id } = useParams();
  const message =
    id && error instanceof ApiError && error.status === 404
      ? "This note doesn't exist, or you don't have access to it."
      : "Something went wrong.";

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-4">
      <p>{message}</p>
      <Link to="/" className="text-sm underline">
        Back to your notes
      </Link>
    </main>
  );
}
