import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { COLLAB_URL } from "@/lib/collab";
import EditorComponent from "./EditorComponent";

export default function ConnectionComponent() {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  useEffect(() => {
    const id = "32c107dc-519f-443b-b0be-746594727bfb";
    const p = new HocuspocusProvider({ url: COLLAB_URL, name: id });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(p);
    return () => {
      p.destroy();
      setProvider(null);
    };
  }, []);

  if (!provider) return <p>Connecting...</p>;
  return <EditorComponent provider={provider} />;
}
