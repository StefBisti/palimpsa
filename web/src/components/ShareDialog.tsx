import { Share2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type Member } from "@/lib/api";

const ROLES = [
  { value: "editor", label: "Can edit" },
  { value: "viewer", label: "Can view" },
];

export default function ShareDialog({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("editor");

  async function load() {
    setMembers(await api<Member[]>(`/notes/${noteId}/members`));
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) load().catch((err: Error) => toast.error(err.message));
  }

  async function onShare(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/notes/${noteId}/members`, { method: "PUT", body: { email, role } });
      setEmail("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function onRemove(member: Member) {
    try {
      await api(`/notes/${noteId}/members/${member.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 /> Share
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this note</DialogTitle>
          <DialogDescription>People you add can open it from their notes list.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onShare(e)} className="flex gap-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select items={ROLES} value={role} onValueChange={(value) => setRole(value as Member["role"])}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">Add</Button>
        </form>

        <ul className="flex flex-col gap-1">
          {members.length === 0 && <li className="text-sm text-muted-foreground">Not shared with anyone yet.</li>}
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{m.email}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                {m.role === "editor" ? "Can edit" : "Can view"}
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${m.email}`} onClick={() => void onRemove(m)}>
                  <X />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
