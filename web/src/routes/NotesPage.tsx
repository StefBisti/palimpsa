import { Trash2 } from "lucide-react";
import { Link, useLoaderData, useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Note } from "@/lib/api";

export default function NotesPage() {
  const notes = useLoaderData<Note[]>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  async function onCreate() {
    const note = await api<Note>("/notes", { method: "POST", body: { title: "Untitled" } });
    await navigate(`/notes/${note.id}`);
  }

  async function onDelete(note: Note) {
    if (!confirm(`Delete "${note.title}" for everyone?`)) return;
    try {
      await api(`/notes/${note.id}`, { method: "DELETE" });
      await revalidator.revalidate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Notes</h1>
        <Button onClick={() => void onCreate()}>New note</Button>
      </div>

      {notes.length === 0 && <p className="text-muted-foreground">No notes yet.</p>}

      {notes.map((note) => (
        <Card key={note.id} size="sm">
          <CardHeader>
            <CardTitle>
              <Link to={`/notes/${note.id}`} className="hover:underline">
                {note.title || "Untitled"}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary">{note.role}</Badge>
              edited {new Date(note.updated_at).toLocaleString()}
            </CardDescription>
            {note.role === "owner" && (
              <CardAction>
                <Button variant="ghost" size="icon" aria-label="Delete note" onClick={() => void onDelete(note)}>
                  <Trash2 />
                </Button>
              </CardAction>
            )}
          </CardHeader>
        </Card>
      ))}
    </main>
  );
}
