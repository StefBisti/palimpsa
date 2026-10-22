import type { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";

type Props = { provider: HocuspocusProvider };

export default function EditorComponent({ provider }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: provider.document }),
    ],
  });

  return (
    <EditorContent
      editor={editor}
      className="m-8 rounded-md border p-4 prose dark:prose-invert [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none"
    />
  );
}
