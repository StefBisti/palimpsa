import type { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { EditorContent, useEditor, useEditorState, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading1, Heading2, Italic, List, ListChecks, ListOrdered, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import type * as Y from "yjs";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api";

const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#9333ea", "#0891b2"];

// same user, same color, on every device
function colorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

type Props = { provider: HocuspocusProvider; doc: Y.Doc; user: User; readOnly: boolean };

export default function Editor({ provider, doc, user, readOnly }: Props) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ undoRedo: false }), // Yjs has its own undo history
        TaskList,
        TaskItem.configure({ nested: true }),
        Collaboration.configure({ document: doc }),
        CollaborationCaret.configure({ provider, user: { name: user.email, color: colorFor(user.id) } }),
      ],
      editable: false,
      editorProps: { attributes: { class: "prose prose-neutral max-w-none min-h-80 focus:outline-none" } },
    },
    [provider, doc],
  );

  useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="rounded-lg border p-4" />
    </div>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      task: editor.isActive("taskList"),
    }),
  });

  const buttons: [LucideIcon, string, boolean, () => boolean][] = [
    [Heading1, "Heading 1", active.h1, () => editor.chain().focus().toggleHeading({ level: 1 }).run()],
    [Heading2, "Heading 2", active.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    [Bold, "Bold", active.bold, () => editor.chain().focus().toggleBold().run()],
    [Italic, "Italic", active.italic, () => editor.chain().focus().toggleItalic().run()],
    [List, "Bullet list", active.bullet, () => editor.chain().focus().toggleBulletList().run()],
    [ListOrdered, "Numbered list", active.ordered, () => editor.chain().focus().toggleOrderedList().run()],
    [ListChecks, "Checklist", active.task, () => editor.chain().focus().toggleTaskList().run()],
  ];

  return (
    <div className="flex gap-1">
      {buttons.map(([Icon, label, isActive, run]) => (
        <Button key={label} variant={isActive ? "secondary" : "ghost"} size="icon" aria-label={label} onClick={run}>
          <Icon />
        </Button>
      ))}
    </div>
  );
}
