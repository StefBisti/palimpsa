import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { COLLAB_URL } from "@/lib/collab";
import EditorComponent from "./EditorComponent";

export default function ConnectionComponent() {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  useEffect(() => {
    const p = new HocuspocusProvider({ url: COLLAB_URL, name: "demo" });
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
