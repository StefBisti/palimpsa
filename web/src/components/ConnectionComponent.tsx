import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { COLLAB_URL } from "@/lib/collab";
import EditorComponent from "./EditorComponent";
import { getAccessToken } from "@/lib/auth";

const noteId = new URLSearchParams(location.search).get("note");

type Status = "connecting" | "read-write" | "readonly" | "denied";

export default function ConnectionComponent() {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    if (!noteId) return;
    const p = new HocuspocusProvider({
      url: COLLAB_URL,
      name: noteId,
      token: getAccessToken,
      onAuthenticated: ({ scope }) => setStatus(scope),
      onAuthenticationFailed: () => setStatus("denied"),
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(p);
    return () => {
      p.destroy();
      setProvider(null);
    };
  }, []);

  if (!noteId) {
    return <p className="m-8">Add ?note=&lt;note id&gt; to the URL</p>;
  }
  if (status === "denied") {
    return <p className="m-8">No access to this note</p>;
  }
  if (!provider) {
    return <p className="m-8">Connecting...</p>;
  }
  return (
    <>
      <p className="mx-8 mt-8 text-sm text-muted-foreground">{status}</p>
      <EditorComponent provider={provider} />
    </>
  );
}
