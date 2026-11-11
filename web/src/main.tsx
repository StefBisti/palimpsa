import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { api, currentUser, type Note } from "@/lib/api";
import AuthPage from "@/routes/AuthPage";
import ErrorPage from "@/routes/ErrorPage";
import Layout from "@/routes/Layout";
import NotesPage from "@/routes/NotesPage";

async function requireUser() {
  const user = await currentUser();
  if (!user) throw redirect("/login");
  return user;
}

async function guestOnly() {
  if (await currentUser()) throw redirect("/");
  return null;
}

const router = createBrowserRouter([
  { path: "/login", element: <AuthPage mode="login" />, loader: guestOnly },
  { path: "/register", element: <AuthPage mode="register" />, loader: guestOnly },
  {
    id: "root",
    path: "/",
    element: <Layout />,
    loader: requireUser,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <NotesPage />, loader: () => api<Note[]>("/notes") },
      {
        path: "notes/:id",
        loader: ({ params }) => api<Note>(`/notes/${params.id}`),
        // the editor (Tiptap + Yjs) is most of the bundle, so it only loads when a note is opened
        lazy: async () => ({ Component: (await import("@/routes/NotePage")).default }),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
);
