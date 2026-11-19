import { HocuspocusProvider } from "@hocuspocus/provider";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLoaderData, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import * as Y from "yjs";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api, collabToken, type Note, type User } from "@/lib/api";

type Status = "connecting" | "connected" | "disconnected";

export default function NotePage() {
  const note = useLoaderData<Note>();
  const user = useRouteLoaderData<User>("root")!;
  const [title, setTitle] = useState(note.title);
  const [savedTitle, setSavedTitle] = useState(note.title);
  const [collab, setCollab] = useState<{ provider: HocuspocusProvider; doc: Y.Doc } | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [synced, setSynced] = useState(false);
  // optimistic: trust the role from the api right away, collab confirms it once connected
  const [readOnly, setReadOnly] = useState(note.role === "viewer");

  // one websocket per open note; the document name is the note id
  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/collab`,
      name: note.id,
      document: doc,
      token: collabToken,
      onStatus: ({ status }) => setStatus(status as Status),
      onSynced: () => setSynced(true),
      onAuthenticated: ({ scope }) => setReadOnly(scope === "readonly"),
      onAuthenticationFailed: () => toast.error("You don't have access to this note anymore."),
    });
    // the provider is an external system, so it's created here and handed to render via state
    // oxlint-disable-next-line react/set-state-in-effect
    setCollab({ provider, doc });
    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [note.id]);

  async function saveTitle() {
    if (title === savedTitle) return;
    try {
      await api(`/notes/${note.id}`, { method: "PATCH", body: { title } });
      setSavedTitle(title);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/" aria-label="Back to notes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void saveTitle()}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          readOnly={note.role === "viewer"}
          maxLength={200}
          aria-label="Title"
          className="font-heading border-none text-xl font-semibold shadow-none"
        />
        {note.role === "owner" && <ShareDialog noteId={note.id} />}
      </div>

      {(readOnly || (synced && status !== "connected")) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {synced && status !== "connected" && <Badge variant="destructive">offline, reconnecting</Badge>}
          {readOnly && <span>view only</span>}
        </div>
      )}

      {/* fades in once the saved content has arrived, instead of flashing from empty to full */}
      <div className={`transition-opacity duration-150 ${synced ? "opacity-100" : "opacity-0"}`}>
        {collab && <Editor provider={collab.provider} doc={collab.doc} user={user} readOnly={readOnly} />}
      </div>
    </main>
  );
}
